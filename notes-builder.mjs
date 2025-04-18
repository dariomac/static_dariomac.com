import { readVault } from 'obsidian-vault-parser';
import fs from 'fs';
import fsx from 'fs-extra';
import path from 'path';
import urlSlug from 'url-slug';
import cmdArgs from 'command-line-args';
import webp from 'webp-converter';

// this will grant 755 permission to webp executables
webp.grant_permission();

const settings = [
  { name: 'paths', multiple: true, defaultOption: true }
];

const mainOptions = cmdArgs(settings, { stopAtFirstUnknown: true });

const inputPath = ensureSlashTermination(mainOptions.paths[0]);
const outputPath = `${ensureSlashTermination(mainOptions.paths[1])}notes/`;
const assetsPath = `./${outputPath}assets/`;

(async () => {
  fsx.removeSync(outputPath);
  await fsx.ensureDir(outputPath);
  await fsx.ensureDir(assetsPath);

  const vault = await readVault(inputPath, {
    isPublished: (file) => {
      let getIt = false;
      
      getIt = file.frontMatter != null && file.frontMatter.tags;
      
      if (getIt && Array.isArray(file.frontMatter.tags)) {
        getIt = file.frontMatter.tags.includes('dm.com');
      } else {
        getIt = false;
      }
      
      getIt &= !file.path.includes('/Templates/');
      
      return getIt;
    }
  });
  
  await Promise.all(
    Object.keys(vault.files).map(async (noteKey) => {
      const note = vault.files[noteKey];
      note.casedName = path.basename(note.path).replace(/\.md$/,'');

      const createdAt = new Date(note.createdAt).toISOString().replace(/T.*/,'')
      
      const dmdFrontmatter = {    
        date: createdAt,
        updated_date: new Date(note.updatedAt).toISOString().replace(/T.*/,''),
        layout: 'document',
        title: note.frontMatter.json.title || note.casedName,
        jsonld: {},
        canonical: '',
        custom_header: '',
        ...note.frontMatter.json
      };
      
      dmdFrontmatter.card = {
        color: '#99b399',
        columnid: 'progress_2',
        datebox: '',
        extlink: null,
        laneid: 'Essay',
        leftbox: '',
        position: dmdFrontmatter.date.replace(/-/g, ''),
        tags: null,
        ...dmdFrontmatter.card,
        linkto: "[link_to]",
        title: "[title]",
        subtaskdetails: [],
      }

      if (dmdFrontmatter.card.laneid === 'Essay' && 
        ['requested_1', 'progress_2'].includes(dmdFrontmatter.card.columnid)
      ){
        dmdFrontmatter.params = {
          "noIndex": true,
        };
      }
      
      let dmdNote = JSON.stringify(dmdFrontmatter, null, 4);
      dmdNote += '\n\n---\n\n';
      
      dmdNote += '[summary:string]\n';
      dmdNote += `${note.frontMatter.json.card.content}\n\n`;
      
      dmdNote += '[pub_date:string]\n';
      dmdNote += `${dmdFrontmatter.date}\n\n`;
      
      dmdNote += '[short_description:string]\n\n';
      
      dmdNote += '[body:md]\n';
      let modifiedContent = await processImages(note.content);
      modifiedContent = await processLinks(modifiedContent, vault.files);
      modifiedContent = modifiedContent.replace(/---/g, '<hr/>\n');
      dmdNote += `${modifiedContent.trim()}\n\n`;
      
      dmdNote += '[acknowledgments:md]\n\n';
      
      dmdNote += '[further_reading:md]\n\n';
      
      dmdNote += '[significant_revisions:md]\n';
      dmdNote += `_${new Date(`${createdAt} GMT-0300`).toLocaleString('en-US', {
        month: 'short', // numeric, 2-digit, long, short, narrow
        day: 'numeric', // numeric, 2-digit
        year: 'numeric', // numeric, 2-digit
      })}_: Original publication on dariomac.com\n`;

      fs.writeFileSync(path.resolve(`${outputPath}${urlSlug(note.name)}.dmd`), dmdNote, 'utf8');
    })
  );    
})().catch(e => {
  console.log(e);
});

const processImages = async (content) => {
  let processedContent = content;
  const regex = /!\[\[([a-zA-Z0-9\s\.-]+\|?[a-zA-Z0-9\s]*)\]\]/g;
  let m;
  
  while ((m = regex.exec(content)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }
    
    // The result can be accessed through the `m`-variable.
    const originalString = m[0];
    const originalImageNameWithExtension = m[1].split('|')[0];
    const newImageName = urlSlug(originalImageNameWithExtension.replace(/\.[^/.]+$/, ''));
    const extension = originalImageNameWithExtension.replace(/^.*\./, '');

    if (fs.existsSync(`${inputPath}Organization/Attachments/${originalImageNameWithExtension}`)) {
      const newImageNameWithExtension = `${newImageName}.${extension}`;
  
      fs.copyFileSync(`${inputPath}Organization/Attachments/${originalImageNameWithExtension}`, `${assetsPath}${newImageNameWithExtension}`);
      
      await webp.cwebp(
        `${assetsPath}${newImageNameWithExtension}`,
        `${assetsPath}${newImageName}.webp`,
        '-q 80',
        logging='-v');
        
      processedContent = processedContent.replace(originalString, `![${newImageNameWithExtension}](/assets/${newImageNameWithExtension}#center)`);
    }
  }
  return processedContent;
};

const processLinks = async (content, files) => {
  let processedContent = content;
  const regex = /\[\[([a-zA-ZÀ-ú0-9\s\.-]+\|?[a-zA-ZÀ-ú0-9\s]*)\]\]/g;
  let m;
  
  while ((m = regex.exec(content)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }
    
    // The result can be accessed through the `m`-variable.
    const originalString = m[0];
    const dobleSquareBracketContent = m[1];
    
    const [pageName, pipedText] = dobleSquareBracketContent.split('|');

    const linkedNote = files[pageName.toLowerCase()];
    if (linkedNote) {
      const lang = linkedNote.frontMatter.json.lang;
      const langFolder = lang ? `/${lang}` : '';
      processedContent = processedContent.replace(originalString, `[${pipedText || pageName}](${langFolder}/${urlSlug(pageName)})`);
    } else {
      processedContent = processedContent.replace(originalString, pipedText || pageName);
    }
  }
  return processedContent;
};

function ensureSlashTermination (somePath) {
  return (somePath.lastIndexOf('/') === somePath.length - 1) ? somePath : `${somePath}/`;
}

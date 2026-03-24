import { execSync } from 'child_process';
import yaml from 'js-yaml';
import fs from 'fs';
import fsx from 'fs-extra';
import path from 'path';
import urlSlugPkg from 'url-slug';
const urlSlug = urlSlugPkg.convert;
import cmdArgs from 'command-line-args';
import { initConverter, convertToWebp } from './image-converter.mjs';

// this will grant 755 permission to webp executables (or init converter)
initConverter();

const settings = [
  { name: 'paths', multiple: true, defaultOption: true }
];

const mainOptions = cmdArgs(settings, { stopAtFirstUnknown: true });

const inputPath = ensureSlashTermination(mainOptions.paths[0]);
const outputPath = `${ensureSlashTermination(mainOptions.paths[1])}notes/`;
const assetsPath = `./${outputPath}assets/`;

// Execute an obsidian CLI command that returns JSON output.
function obsidianJSON (command) {
  return JSON.parse(execSync(`obsidian ${command} format=json`, { encoding: 'utf8' }));
}

// Read a vault file's raw content via the Obsidian CLI.
function obsidianRead (relativePath) {
  return execSync(`obsidian read path="${relativePath}"`, { encoding: 'utf8' });
}

// Parse a raw .md file into { frontMatter: { tags, json }, content }.
// Replicates the shape that obsidian-vault-parser used to return:
//   frontMatter.tags  — the YAML `tags:` array
//   frontMatter.json  — the YAML `json:` block value (card, lang, title, etc.)
//   content           — body text after the closing ---
//
// Uses js-yaml so that YAML-native constructs (| block scalars, unquoted plain
// scalars containing |, unquoted keys) all parse correctly. Trailing commas,
// which Obsidian sometimes writes in flow mappings, are stripped before parsing.
function parseNote (rawContent, filename = '') {
  const fmMatch = rawContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!fmMatch) return { frontMatter: { tags: [], json: {} }, content: rawContent };

  const fmRaw = fmMatch[1];
  const content = rawContent.slice(fmMatch[0].length);

  // Strip trailing commas from YAML flow mappings/sequences before parsing.
  const cleaned = fmRaw.replace(/,(\s*[}\]])/g, '$1');

  let tags = [];
  let jsonValue = {};

  try {
    const parsed = yaml.load(cleaned);
    if (parsed && typeof parsed === 'object') {
      tags = Array.isArray(parsed.tags) ? parsed.tags : (parsed.tags ? [parsed.tags] : []);
      jsonValue = (parsed.json && typeof parsed.json === 'object') ? parsed.json : {};
    }
  } catch (e) {
    console.error(`Failed to parse frontmatter in "${filename}" — ${e.message}`);
  }

  return { frontMatter: { tags, json: jsonValue }, content };
}

(async () => {
  // I'll will keep all previously generated notes because of SEO.
  // If I want to delete something, I'll have to do it manually and add a redirection or just hide it.
  // fsx.removeSync(outputPath);

  await fsx.ensureDir(outputPath);
  await fsx.ensureDir(assetsPath);

  // Find all notes tagged with dm.com via CLI, then exclude Templates.
  const searchResults = obsidianJSON('search query="tag:dm.com"');
  const publishedPaths = searchResults.filter(p => !p.includes('/Templates/'));

  // Eagerly build a lookup map of all vault .md files for wiki-link resolution.
  // The `obsidian files` command returns plain text (one path per line).
  // The first entry may have a leading '+' marker — strip it.
  // Keys are lowercase note names without extension, matching the original shape.
  const allFilesRaw = execSync('obsidian files', { encoding: 'utf8' });
  const filesMap = {};
  for (const line of allFilesRaw.split('\n')) {
    const relativePath = line.trim().replace(/^\+/, '');
    if (!relativePath.endsWith('.md')) continue;
    const name = path.basename(relativePath, '.md');
    try {
      const raw = fs.readFileSync(path.join(inputPath, relativePath), 'utf8');
      const { frontMatter } = parseNote(raw, relativePath);
      filesMap[name.toLowerCase()] = { path: relativePath, frontMatter };
    } catch {
      // Skip files that cannot be read or parsed
    }
  }

  const RED = '\x1b[31m';
  const GREEN = '\x1b[32m';
  const RESET = '\x1b[0m';

  const results = await Promise.all(
    publishedPaths.map(async (relativePath) => {
      const casedName = path.basename(relativePath, '.md');
      try {
        const raw = obsidianRead(relativePath);
        const { frontMatter, content } = parseNote(raw, relativePath);

        // Use filesystem timestamps. birthtime may be 0 on some Linux filesystems;
        // fall back to mtime in that case.
        const stat = fs.statSync(path.join(inputPath, relativePath));
        const createdAt = (stat.birthtimeMs > 0 ? stat.birthtime : stat.mtime)
          .toISOString().replace(/T.*/, '');
        const updatedAt = stat.mtime.toISOString().replace(/T.*/, '');

        const dmdFrontmatter = {
          date: createdAt,
          updated_date: updatedAt,
          layout: 'document',
          title: frontMatter.json.title || casedName,
          jsonld: {},
          canonical: '',
          custom_header: '',
          ...frontMatter.json
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
          linkto: '[link_to]',
          title: '[title]',
          subtaskdetails: []
        };

        if (dmdFrontmatter.card.laneid === 'Essay' &&
          ['requested_1', 'progress_2'].includes(dmdFrontmatter.card.columnid)
        ) {
          dmdFrontmatter.params = {
            noIndex: true
          };
        }

        let dmdNote = JSON.stringify(dmdFrontmatter, null, 4);
        dmdNote += '\n\n---\n\n';

        dmdNote += '[summary:string]\n';
        dmdNote += `${frontMatter.json.card?.content ?? ''}\n\n`;

        dmdNote += '[pub_date:string]\n';
        dmdNote += `${dmdFrontmatter.date}\n\n`;

        dmdNote += '[short_description:string]\n\n';

        dmdNote += '[body:md]\n';
        let modifiedContent = content.replace(/\{\{!--[\s\S]*?\}\}/g, '');
        modifiedContent = await processEmbeds(modifiedContent, filesMap);
        modifiedContent = await processImages(modifiedContent);
        modifiedContent = await processLinks(modifiedContent, filesMap);
        // Unwrap linked images [![](img)](link) → ![](img), then add #center to all images without a fragment
        modifiedContent = modifiedContent.replace(/\[!\[([^\]]*)\]\(([^)]+)\)\]\([^)]+\)/g, '![$1]($2)');
        modifiedContent = modifiedContent.replace(/!\[([^\]]*)\]\(([^)#]+)\)/g, '![$1]($2#center)');
        modifiedContent = modifiedContent.replace(/---/g, '<hr/>\n');
        dmdNote += `${modifiedContent.trim()}\n\n`;

        dmdNote += '[acknowledgments:md]\n\n';

        dmdNote += '[further_reading:md]\n\n';

        dmdNote += '[significant_revisions:md]\n';
        dmdNote += `_${new Date(`${createdAt} GMT-0300`).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })}_: Original publication on dariomac.com\n`;

        fs.writeFileSync(path.resolve(`${outputPath}${urlSlug(casedName)}.dmd`), dmdNote, 'utf8');
        return { name: casedName, ok: true };
      } catch (e) {
        return { name: casedName, ok: false, error: String(e) };
      }
    })
  );

  // Print ordered summary after all notes are processed.
  for (const r of results) {
    if (r.ok) {
      console.log(`${GREEN}  ✓${RESET} ${r.name}`);
    } else {
      console.error(`${RED}  ✗ ${r.name}: ${r.error}${RESET}`);
    }
  }
})().catch(e => {
  console.log(e);
});

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'avif']);

const processEmbeds = async (content, files, depth = 0) => {
  if (depth >= 3) return content;

  let processedContent = content;
  const regex = /!\[\[([^\]]+)\]\]/g;
  let m;

  while ((m = regex.exec(content)) !== null) {
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }

    const originalString = m[0];
    const noteName = m[1].split('|')[0].trim();
    const ext = noteName.includes('.') ? noteName.split('.').pop().toLowerCase() : '';

    if (IMAGE_EXTENSIONS.has(ext)) continue; // handled by processImages

    const linkedNote = files[noteName.toLowerCase()];
    if (!linkedNote) continue;

    try {
      const raw = obsidianRead(linkedNote.path);
      const { content: embeddedContent } = parseNote(raw, linkedNote.path);
      const resolved = await processEmbeds(embeddedContent.trim(), files, depth + 1);
      processedContent = processedContent.replace(originalString, resolved);
    } catch {
      processedContent = processedContent.replace(originalString, '');
    }
  }

  return processedContent;
};

const processImages = async (content) => {
  let processedContent = content;
  const regex = /!\[\[([^\]]+)\]\]/g;
  let m;

  while ((m = regex.exec(content)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }

    const originalString = m[0];
    const originalImageNameWithExtension = m[1].split('|')[0];
    const newImageName = urlSlug(originalImageNameWithExtension.replace(/\.[^/.]+$/, ''));
    const extension = originalImageNameWithExtension.replace(/^.*\./, '');

    if (fs.existsSync(`${inputPath}Organization/Attachments/${originalImageNameWithExtension}`)) {
      const newImageNameWithExtension = `${newImageName}.${extension}`;

      fs.copyFileSync(`${inputPath}Organization/Attachments/${originalImageNameWithExtension}`, `${assetsPath}${newImageNameWithExtension}`);

      await convertToWebp(
        `${assetsPath}${newImageNameWithExtension}`,
        `${assetsPath}${newImageName}.webp`,
        80,
        true);

      processedContent = processedContent.replace(originalString, `![](/assets/${newImageNameWithExtension}#center)`);
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

    const originalString = m[0];
    const dobleSquareBracketContent = m[1];

    const [pageName, pipedText] = dobleSquareBracketContent.split('|');

    const linkedNote = files[pageName.toLowerCase()];
    const isPublished = linkedNote?.frontMatter.tags.includes('dm.com');
    if (linkedNote && isPublished) {
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

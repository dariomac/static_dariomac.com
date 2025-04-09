import fsx from 'fs-extra';
import path from 'path';
import * as utils from './utils.mjs';

let paths = {};
let backlinks = [];

export async function buildBacklinks(mainOptions, paths) {
  paths = paths;

  await processFiles(paths.inputPath);
  
  return backlinks;
}

async function processFiles (inputPath) {
  await fsx.ensureDir(inputPath);
  let inputItems = await fsx.readdir(path.resolve(inputPath));
  
  for (let i = 0; i < inputItems.length; i++) {
    let item = inputItems[i];
    
    let fullItemPath = `${inputPath}${item}`;
    let inputStat = await fsx.stat(fullItemPath);
    if (inputStat.isDirectory()) {
      if (item !== 'assets') {
        await processFiles(`${fullItemPath}/`);
      }
    }
    else {
      // is a file
      if (path.extname(item) === '.dmd') {
        let dmdObj = await utils.generateDmdObject(fullItemPath);

        dmdObj.meta.links.forEach((lnk, i) => {
          let isDmLink = false;
          isDmLink |= lnk.startsWith('/') && !lnk.startsWith('/assets');
          isDmLink |= lnk.indexOf('dariomac.com') > -1;

          if (isDmLink) {
            lnk = path.basename(lnk);

            const title = dmdObj.frontmatter.title === dmdObj.frontmatter.card.title ? 
              dmdObj.frontmatter.title : 
              `${dmdObj.frontmatter.title} - ${dmdObj.frontmatter.card.title}`;

            (backlinks[lnk] = backlinks[lnk] || []).push({
              "backlink": `/${dmdObj.meta.slug}`,
              "title": title
            });
          }
        });
      }
    }
  }
}

import fsx from 'fs-extra';
import path from 'path';
import * as utils from './utils.mjs';

let currentPaths = {}; // Renamed to avoid conflict
let backlinks = {}; // Initialize as object for associative array usage

// Accept mainOptions and newPaths
export async function buildBacklinks(mainOptions, newPaths) {
  currentPaths = newPaths; // Store it
  backlinks = {}; // Reset backlinks for each run

  if (mainOptions.file) {
    // If a single file is specified, process only that file
    const singleFilePath = path.resolve(currentPaths.inputPath, mainOptions.file);
    await processSingleDmdFile(singleFilePath);
  } else {
    // Otherwise, process all files in the input directory as before
    await processDirectory(currentPaths.inputPath);
  }
  
  return backlinks;
}

// Renamed original processFiles to processDirectory
async function processDirectory (inputPath) {
  await fsx.ensureDir(inputPath);
  let inputItems = await fsx.readdir(path.resolve(inputPath));
  
  for (let i = 0; i < inputItems.length; i++) {
    let item = inputItems[i];
    let fullItemPath = path.join(inputPath, item); // Use path.join
    let inputStat = await fsx.stat(fullItemPath);

    if (inputStat.isDirectory()) {
      // Exclude 'assets' directory from recursive processing for backlinks
      if (item !== 'assets') { 
        await processDirectory(fullItemPath); // Recursive call
      }
    } else {
      if (path.extname(item) === '.dmd') {
        await processSingleDmdFile(fullItemPath); // Process the individual file
      }
    }
  }
}

// New function to process a single DMD file
async function processSingleDmdFile(filePath) {
  try {
    if (!await fsx.pathExists(filePath)) {
      console.warn(`[33mFile not found in 2zettelkasten: ${filePath}[0m`);
      return;
    }
    // Ensure it's a .dmd file, even if called directly
    if (path.extname(filePath) !== '.dmd') {
        // console.warn(`[33mSkipping non-DMD file in 2zettelkasten: ${filePath}[0m`);
        return;
    }
    let dmdObj = await utils.generateDmdObject(filePath);
    if (dmdObj && dmdObj.meta && dmdObj.meta.links) {
      dmdObj.meta.links.forEach((lnk) => { // Removed unused index i
        let isDmLink = false;
        // Ensure lnk is a string before calling startsWith or indexOf
        if (typeof lnk === 'string') {
            isDmLink |= lnk.startsWith('/') && !lnk.startsWith('/assets');
            isDmLink |= lnk.indexOf('dariomac.com') > -1;
        } else {
            // console.warn(`[33mEncountered non-string link in ${filePath}: ${JSON.stringify(lnk)}[0m`);
            return; // Skip this link
        }

        if (isDmLink) {
          const baseLnk = path.basename(lnk); 

          const title = dmdObj.frontmatter.title === dmdObj.frontmatter.card.title ? 
            dmdObj.frontmatter.title : 
            `${dmdObj.frontmatter.title} - ${dmdObj.frontmatter.card.title}`;

          (backlinks[baseLnk] = backlinks[baseLnk] || []).push({
            "backlink": `/${dmdObj.meta.slug}`,
            "title": title
          });
        }
      });
    }
  } catch (error) {
    console.error(`[31mError processing file in 2zettelkasten ${filePath}: ${error.message}[0m`);
    // Optionally, re-throw the error if you want to stop the build process
    // throw error; 
  }
}

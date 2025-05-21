import _ from 'lodash';
import ssiParser from 'tiny-ssi';
import { handlebars as hb } from '@jaredwray/fumanchu';
import path from 'path';
import fs from 'fs';
import fsx from 'fs-extra';
import * as utils from './utils.mjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const registerHBPartials = () => {
  const dir = path.resolve(__dirname, '../common');

  const walkSync = (dir, filelist = []) => {
    fs.readdirSync(dir).forEach(file => {

      filelist = fs.statSync(path.join(dir, file)).isDirectory()
        ? walkSync(path.join(dir, file), filelist)
        : filelist.concat(path.join(dir, file));

    });
    return filelist;
  }

  const filelist = walkSync(dir);
  if (filelist.length > 0) {
    filelist.forEach(function (filename) {
      const matches = /^([^.]+).hbs$/.exec(path.basename(filename));
      if (!matches) {
        return;
      }
      const name = matches[1];
      const template = fs.readFileSync(filename, 'utf8');
      hb.registerPartial(name, template);
    });
  }
};

let _paths = {};
let _mainOptions = null;
let _backlinks = {};
const _compiledLayouts = {};
const _collectionPages = [];
const _collectionJson = [];

export const initialize = async (mainOptions, paths, backlinks) => {
  _mainOptions = mainOptions;    
  _paths = paths;
  _backlinks = backlinks;
  
  if (_mainOptions['clear-all']) {
    fsx.removeSync(_paths.outputPath);
    fs.mkdirSync(_paths.outputPath);
  }

  registerHBPartials();
};

export const run = async () => {
  await copyWebsiteAssets().catch((err) => {
    console.error('\x1b[31m', err, '\x1b[0m');
  });
  
  console.info(`\x1b[32mWebsite assets where copied to ${_paths.assetsPath}\x1b[0m`);
  
  if (_mainOptions.file) {
    // If a single file is specified, process only that file
    const singleFilePath = path.resolve(_paths.inputPath, _mainOptions.file);
    
    // Check if the file exists before trying to render it
    if (await fsx.pathExists(singleFilePath)) {
      if (path.extname(singleFilePath) === '.dmd') {
        await renderDMDToHtml(singleFilePath).catch((err) => {
          console.error(`\x1b[31mError rendering ${singleFilePath}:\x1b[0m`, err.message, '\x1b[0m');
        });
      } else {
        console.warn(`\x1b[33mSpecified file is not a .dmd file: ${singleFilePath}\x1b[0m`);
      }
    } else {
      console.warn(`\x1b[33mSpecified file not found: ${singleFilePath}\x1b[0m`);
    }
    // IMPORTANT: Do NOT call convertCollectionFiles when processing a single file.
  } else {
    // Original behavior: process all files and then collections
    await convertFiles(_paths.inputPath);
    convertCollectionFiles();
  }
};

async function copyWebsiteAssets () {
  console.log(`Copying website assets from ${_paths.assetsPath}`);
  if (_.has(_mainOptions, 'clear-all')) {
    await fsx.remove(_paths.assetsPath);
    await fsx.mkdir(_paths.assetsPath);
  }
  
  await fsx.ensureDir(_paths.assetsPath);
  await fsx.copy('./assets/', _paths.assetsPath, {'overwrite': true, 'errorOnExist': false});
}

// https://www.npmjs.com/package/recursive-copy

async function convertFiles (inputPath) {
  await fsx.ensureDir(inputPath);
  let inputItems = await fsx.readdir(path.resolve(inputPath));
  
  for (let i = 0; i < inputItems.length; i++) {
    let item = inputItems[i];
    
    let fullItemPath = `${inputPath}${item}`;
    let inputStat = await fsx.stat(fullItemPath);
    if (inputStat.isDirectory()) {
      if (item === 'assets') {
        try {
          await fsx.copy(fullItemPath, _paths.assetsPath, {'overwrite': false, 'errorOnExist': true});
        }
        catch (err) {
          console.error(`\x1b[31m${err.message}\x1b[0m`);
        }
      }
      else {
        await convertFiles(`${fullItemPath}/`);
      }
    }
    else {
      // is a file
      if (path.extname(item) === '.dmd') {
        await renderDMDToHtml(fullItemPath).catch((err) => {
          console.error(`\x1b[31m${fullItemPath}:`, err.message, '\x1b[0m');
        });
      }
    }
  }
}

async function renderDMDToHtml (dmdFilePath) {
  let dmdObj = await utils.generateDmdObject(dmdFilePath);
  if (dmdObj.frontmatter.disable) return;
  
  if (dmdObj.frontmatter && dmdObj.frontmatter.date && dmdObj.frontmatter.date.length > 0) {
    if (dmdObj.frontmatter.mode === 'collection') {
      _collectionPages.push(dmdObj);
    }
    else {
      dmdObj.backlinks = _backlinks[dmdObj.meta.slug];
      fillObjLayoutAndSave(dmdObj);
      (_collectionJson[dmdObj.frontmatter.card.laneid] = _collectionJson[dmdObj.frontmatter.card.laneid] || []).push(dmdObj);
    }
  } else {
    console.warn(`\x1b[33m${dmdFilePath} is missing the Frontmatter section!\x1b[0m`);
  }
}

function fillObjLayoutAndSave (dmdObj) {
  var layoutHTML = _compiledLayouts[dmdObj.frontmatter.layout];
  
  if (!layoutHTML) {
    let layoutFilename = `${dmdObj.frontmatter.layout}.hbs`;
    
    layoutHTML = fs.readFileSync(`${_paths.layoutPath}${layoutFilename}`, 'utf8');
    // first pull in all includes in html
    layoutHTML = ssiParser(`${_paths.layoutPath}/dummy`, layoutHTML); // needs file path not just dir, hence dummy
    layoutHTML = utils.hbCompile(layoutHTML);
    
    _compiledLayouts[dmdObj.frontmatter.layout] = layoutHTML;
  }
  
  // and then parse through for "mustache-y" syntax...using handlebars
  let finalHTML = layoutHTML(dmdObj);
  // now, re-compile using the finalHtml as template due mustaches inside dmd sections
  finalHTML = hb.compile(finalHTML)(dmdObj.content);
  // finalHTML = finalHTML.replace(/\r?\n|\r/g, '').replace(/>\s*</g, '><');
  
  let outputFilePath;
  if (dmdObj.frontmatter.lang) {
    const langDir = `${_paths.outputPath}${dmdObj.frontmatter.lang}`;
    if (!fs.existsSync(langDir)){
      fs.mkdirSync(langDir);
    }
    outputFilePath = `${langDir}/${dmdObj.meta.outputFilename}`;
  }
  else {
    outputFilePath = `${_paths.outputPath}${dmdObj.meta.outputFilename}`;
  }
  // Check if the path already exists and warn
  fs.stat(outputFilePath, function (err, stats) {
    if (err && err.code === 'ENOENT') { // It's ok, the file does not exists
      fs.writeFileSync(outputFilePath, finalHTML, 'utf8');
      console.info(`\x1b[32mconverted: ${dmdObj.meta.filePath} -> ${outputFilePath}\x1b[0m`);
    }
    else {
      console.warn(`\x1b[33mWARNING: file ${_paths.outputPath}${dmdObj.meta.outputFilename} already exists.\x1b[0m`);
    }
  });
}

function convertCollectionFiles () {
  for (var i = 0; i < _collectionPages.length; i++) {
    var cPage = _collectionPages[i];
    
    cPage.content = [];
    _.each(_.keys(_collectionJson), function (laneid) {
      // sort each lane by card position in DESC order
      _collectionJson[laneid].sort((a, b) => {
        
        if (a.frontmatter.card.position === b.frontmatter.card.position) {
          return 0;
        }
        // nulls sort after anything else
        else if (a.frontmatter.card.position === null) {
          return 1;
        }
        else if (b.frontmatter.card.position === null) {
          return -1;
        }
        else {
          const aPos = parseInt(a.frontmatter.card.position);
          const bPos = parseInt(b.frontmatter.card.position);
          
          return bPos - aPos;
        }
      });
      
      cPage.content = cPage.content.concat(_.values(_collectionJson[laneid]));
    });
    cPage.laneContent = _collectionJson;
    cPage.siblings = _collectionPages;
    
    fillObjLayoutAndSave(cPage);
  }
}

export const paths = _paths;
export const mainOptions = _mainOptions;
export const compiledLayouts = _compiledLayouts;
export const collectionPages = _collectionPages;
export const collectionJson = _collectionJson;
export const backlinks = _backlinks;

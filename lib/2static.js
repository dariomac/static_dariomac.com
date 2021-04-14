const _ = require('lodash');
const ssiParser = require('tiny-ssi');
const hb = require('handlebars');
const path = require('path');
const fs = require('fs');
const fsx = require('fs-extra');
const utils = require('./utils');

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

exports = module.exports = {};

exports.paths = {};
exports.mainOptions = null;
exports.compiledLayouts = {};
exports.collectionPages = [];
exports.collectionJson = [];
exports.backlinks = [];

exports.initialize = async (mainOptions, paths, backlinks) => {
  exports.mainOptions = mainOptions;    
  exports.paths = paths;
  exports.backlinks = backlinks;
  
  if (exports.mainOptions['clear-all']) {
    fsx.removeSync(exports.paths.outputPath);
    fs.mkdirSync(exports.paths.outputPath);
  }

  registerHBPartials();
};

exports.run = async () => {
  await copyWebsiteAssets().catch((err) => {
    console.error('\x1b[31m', err, '\x1b[0m');
  });
  
  console.info(`\x1b[32mWebsite assets where copied to ${exports.paths.assetsPath}`);
  
  await convertFiles(exports.paths.inputPath);
  convertCollectionFiles();
};

async function copyWebsiteAssets () {
  if (_.has(exports.mainOptions, 'clear-all')) {
    await fsx.remove(exports.paths.assetsPath);
    await fsx.mkdir(exports.paths.assetsPath);
  }
  
  await fsx.ensureDir(exports.paths.assetsPath);
  await fsx.copy('./assets/', exports.paths.assetsPath, {'overwrite': true, 'errorOnExist': false});
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
          await fsx.copy(fullItemPath, exports.paths.assetsPath, {'overwrite': false, 'errorOnExist': true});
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
      exports.collectionPages.push(dmdObj);
    }
    else {
      dmdObj.backlinks = exports.backlinks[dmdObj.meta.slug];
      fillObjLayoutAndSave(dmdObj);
      (exports.collectionJson[dmdObj.frontmatter.card.laneid] = exports.collectionJson[dmdObj.frontmatter.card.laneid] || []).push(dmdObj);
    }
  } else {
    console.warn(`\x1b[33m${dmdFilePath} is missing the Frontmatter section!\x1b[0m`);
  }
}

function fillObjLayoutAndSave (dmdObj) {
  var layoutHTML = exports.compiledLayouts[dmdObj.frontmatter.layout];
  
  if (!layoutHTML) {
    let layoutFilename = `${dmdObj.frontmatter.layout}.hbs`;
    
    layoutHTML = fs.readFileSync(`${exports.paths.layoutPath}${layoutFilename}`, 'utf8');
    // first pull in all includes in html
    layoutHTML = ssiParser(`${exports.paths.layoutPath}/dummy`, layoutHTML); // needs file path not just dir, hence dummy
    layoutHTML = utils.hbCompile(layoutHTML);
    
    exports.compiledLayouts[dmdObj.frontmatter.layout] = layoutHTML;
  }
  
  // and then parse through for "mustache-y" syntax...using handlebars
  let finalHTML = layoutHTML(dmdObj);
  // now, re-compile using the finalHtml as template due mustaches inside dmd sections
  finalHTML = hb.compile(finalHTML)(dmdObj.content);
  // finalHTML = finalHTML.replace(/\r?\n|\r/g, '').replace(/>\s*</g, '><');
  
  let outputFilePath;
  if (dmdObj.frontmatter.lang) {
    const langDir = `${exports.paths.outputPath}${dmdObj.frontmatter.lang}`;
    if (!fs.existsSync(langDir)){
      fs.mkdirSync(langDir);
    }
    outputFilePath = `${langDir}/${dmdObj.meta.outputFilename}`;
  }
  else {
    outputFilePath = `${exports.paths.outputPath}${dmdObj.meta.outputFilename}`;
  }
  // Check if the path already exists and warn
  fs.stat(outputFilePath, function (err, stats) {
    if (err && err.code === 'ENOENT') { // It's ok, the file does not exists
      fs.writeFileSync(outputFilePath, finalHTML, 'utf8');
      console.info(`\x1b[32mconverted: ${dmdObj.meta.filePath} -> ${outputFilePath}\x1b[0m`);
    }
    else {
      console.warn(`\x1b[33mWARNING: file ${exports.paths.outputPath}${dmdObj.meta.outputFilename} already exists.\x1b[0m`);
    }
  });
}

function convertCollectionFiles () {
  for (var i = 0; i < exports.collectionPages.length; i++) {
    var cPage = exports.collectionPages[i];
    
    cPage.content = [];
    _.each(_.keys(exports.collectionJson), function (laneid) {
      // sort each lane by card position in DESC order
      exports.collectionJson[laneid].sort((a, b) => {
        
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
      
      cPage.content = cPage.content.concat(_.values(exports.collectionJson[laneid]));
    });
    cPage.laneContent = exports.collectionJson;
    cPage.siblings = exports.collectionPages;
    
    fillObjLayoutAndSave(cPage);
  }
}

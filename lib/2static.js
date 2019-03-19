const _ = require('lodash');
const commonmark = require('commonmark');
const moment = require('moment');
const ssiParser = require('tiny-ssi');
const hb = require('handlebars');
const helpers = require('handlebars-helpers')();
const path = require('path');
const {promisify} = require('util');
const fs = require('fs');
const fsx = require('fs-extra');
const cmdArgs = require('command-line-args');

const settings = [
  { name: 'paths', multiple: true, defaultOption: true },
  { name: 'clear-all', alias: 'c', type: Boolean },
  { name: 'verbose', alias: 'v', type: Boolean }];

const hbHelpers = {
  'compare': helpers.compare,
  'or': helpers.or,
  'and': helpers.and,
  'json': (obj) => {
    return JSON.stringify(obj);
  },
  'ifEq': (v1, v2, options) => {
    if (v1 === v2) {
      return options.fn(this);
    }
    return options.inverse(this);
  },
  'ifNotEq': (v1, v2, options) => {
    return hb.helpers.ifEq(v1, v2, {
      'fn': options.inverse,
      'inverse': options.fn
    });
  },
  'ifIsOrWasInProgress': (columnId, options) => {
    if (columnId === 'progress_2' || columnId === 'done_3' || columnId === 'archive_6') {
      return options.fn(this);
    }
    return options.inverse(this);
  },
  'ifOrWasDone': (columnId, options) => {
    if (columnId === 'done_3' || columnId === 'archive_6') {
      return options.fn(this);
    }
    return options.inverse(this);
  },
  'ifDone': (columnId, options) => {
    if (columnId === 'done_3') {
      return options.fn(this);
    }
    return options.inverse(this);
  },
  'getTasksByStatus': (tasks, status) => {
    return _.filter(tasks, function (t) {
      return t.frontmatter.json.columnid === status;
    });
  },
  'getCurrentYear': () => {
    return (new Date()).getFullYear();
  },
  'getPlannedTasks': (tasks) => {
    return hbHelpers.getTasksByStatus(tasks, 'requested_1');
  },
  'getInProgressTasks': (tasks) => {
    return hbHelpers.getTasksByStatus(tasks, 'progress_2');
  },
  'getDoneTasks': (tasks) => {
    return hbHelpers.getTasksByStatus(tasks, 'done_3');
  },
  'getTextColor': (backgroundColor) => {
    backgroundColor = backgroundColor.replace('#','');

    var red = parseInt(backgroundColor.substr(0,1),16),
      green = parseInt(backgroundColor.substr(2,1),16),
      blue = parseInt(backgroundColor.substr(4,1), 16);

    if((red*0.299 + green*0.587 + blue*0.114) > 9)
      return '#000000';
    else
      return '#ffffff';
  }
};

exports = module.exports = {};

exports.paths = {};
exports.mainOptions = null;
exports.compiledLayouts = {};
exports.collectionPages = [];
exports.collectionJson = [];

exports.initialize = async () => {
  exports.mainOptions = cmdArgs(settings, { stopAtFirstUnknown: true });

  if (!exports.mainOptions.paths || exports.mainOptions.paths.length !== 3) {
    throw new Error('Invalid number of parameters: you should provide input, output and layout paths as first 3 parameters.');
  }

  exports.paths = {
    'inputPath': `./${ensureSlashTermination(exports.mainOptions.paths[0])}`,
    'outputPath': `./${ensureSlashTermination(exports.mainOptions.paths[1])}`,
    'layoutPath': `./${ensureSlashTermination(exports.mainOptions.paths[2])}`,
    'assetsPath': `./${ensureSlashTermination(exports.mainOptions.paths[1])}assets/`
  };

  _.each(hbHelpers, (hlpr, hlprName) => {
    hb.registerHelper(hlprName, hlpr);
  });

  if (exports.mainOptions['clear-all']) {
    fsx.removeSync(exports.paths.outputPath);
    fs.mkdirSync(exports.paths.outputPath);
  }
};

exports.run = async () => {
  await copyWebsiteAssets().catch((err) => {
    console.error('\x1b[31m', err, '\x1b[0m');
  });

  console.info(`\x1b[32mWebsite assets where copied to ${exports.paths.assetsPath}`);

  await convertFiles(exports.paths.inputPath);
  convertCollectionFiles();
};

function ensureSlashTermination (somePath) {
  return (somePath.lastIndexOf('/') === somePath.length - 1) ? somePath : `${somePath}/`;
}

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
  let dmdObj = await generateDmdObject(dmdFilePath);
  if (dmdObj.frontmatter && dmdObj.frontmatter.date && dmdObj.frontmatter.date.length > 0) {
    if (dmdObj.frontmatter.mode === 'collection') {
      exports.collectionPages.push(dmdObj);
    }
    else {
      fillObjLayoutAndSave(dmdObj);
      (exports.collectionJson[dmdObj.frontmatter.json.laneid] = exports.collectionJson[dmdObj.frontmatter.json.laneid] || []).push(dmdObj);
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
    layoutHTML = hb.compile(layoutHTML);

    exports.compiledLayouts[dmdObj.frontmatter.layout] = layoutHTML;
  }

  // and then parse through for "mustache-y" syntax...using handlebars
  let finalHTML = layoutHTML(dmdObj);
  // now, re-compile using the finalHtml as template due mustaches inside dmd sections
  finalHTML = hb.compile(finalHTML)(dmdObj.content);
  // finalHTML = finalHTML.replace(/\r?\n|\r/g, '').replace(/>\s*</g, '><');
  // Check if the path already exists and warn
  let outputFilename = dmdObj.frontmatter.outputFilename || `${dmdObj.meta.slug}.html`;
  let outputFilePath = `${exports.paths.outputPath}${outputFilename}`;
  fs.stat(outputFilePath, function (err, stats) {
    if (err && err.code === 'ENOENT') { // It's ok, the file does not exists
      fs.writeFileSync(outputFilePath, finalHTML, 'utf8');
      console.info(`\x1b[32mconverted: ${dmdObj.meta.filePath} -> ${outputFilePath}\x1b[0m`);
    }
    else {
      console.warn(`\x1b[33mWARNING: file ${exports.paths.outputPath}${dmdObj.meta.slug}.html already exists.\x1b[0m`);
    }
  });
}

function convertCollectionFiles () {
  for (var i = 0; i < exports.collectionPages.length; i++) {
    var cPage = exports.collectionPages[i];

    cPage.content = [];
    _.each(_.keys(exports.collectionJson), function (laneid) {
      cPage.content = cPage.content.concat(_.values(exports.collectionJson[laneid]));
    });
    cPage.laneContent = exports.collectionJson;
    fillObjLayoutAndSave(cPage);
  }
}

/* ============
   = Process DMD file content and return an object with frontmatter property and content property
   ================= */
async function generateDmdObject (dmdFilePath) {
  const readFileAsync = promisify(fs.readFile);
  let fileContent = await readFileAsync(dmdFilePath, 'utf8');

  // strip out json front-matter
  let [fmPart, contentPart] = fileContent.split(/^---$/m);

  if (!fmPart || !contentPart) {
    throw new Error(`Invalid DMD format. It must have frontmatter and content divided by ---`);
  }

  fmPart = fmPart.trim();
  contentPart = contentPart.trim(); // Trim to remove initial \n's and later add \n to make EOF explicit

  if (fmPart.length === 0) {
    throw new Error(`Empty frontmatter`);
  }

  let jsonFM = {};
  let jsonContent = {};

  try {
    jsonFM = JSON.parse(fmPart);
    jsonFM.layout = jsonFM.layout || 'layout'; // default to page layout

    contentPart = contentPart + '\n'; // Make EOF explicit

    let sections = contentPart.split(/(?=^\[[a-z:_]+\][ ]*\n)/gm);
    for (let i = 0; i < sections.length; i++) {
      let currSection = sections[i];
      if (currSection.trim() === '') {
        continue;
      }

      let lastSquareBracketPos = currSection.indexOf(']');
      let sectionNameAndType = currSection.slice(1, lastSquareBracketPos);
      let sectionContent = currSection.substr(lastSquareBracketPos + 1).trim();

      let [name, type] = sectionNameAndType.split(':');

      let keyVal = null;
      switch (type) {
        case 'md':
          let parser = new commonmark.Parser();
          let renderer = new commonmark.HtmlRenderer();
          keyVal = renderer.render(parser.parse(sectionContent));
          break;

        case 'json':
          let jsonEntry = JSON.parse(sectionContent);
          if (name === 'related_images' && jsonEntry.constructor === Object) {
            var htmlTemp = fs.readFileSync('common/_entry-gallery.html', 'utf8');
            let htmlTemplate = hb.compile(htmlTemp);

            _.forOwn(jsonEntry, function (value, key) {
              jsonContent[key] = htmlTemplate({
                'content': {
                  'related_images': value
                }
              });
            });
          }
          else {
            keyVal = jsonEntry;
          }

          break;
        /* eslint-disable no-fallthrough */
        case 'string':

        default:
          keyVal = sectionContent;
        /* eslint-enable */
      }
      if (keyVal) {
        jsonContent[name] = keyVal;
      }
    }
    /* if(jsonFM['fields_with_mustaches']){
      jsonFM['fields_with_mustaches'].forEach(function(v, i){
        jsonFM[v] = hb.compile(jsonFM[v])(jsonFM);
      });
    } */
  } catch (e) {
    console.error('\x1b[31mErr parsing file: ', e, '\x1b[0m');
  }

  return {
    frontmatter: jsonFM,
    content: jsonContent,
    meta: {
      filePath: dmdFilePath,
      slug: path.basename(dmdFilePath, path.extname(dmdFilePath)),
      fdate: jsonFM.date ? moment(jsonFM.date).format('MMMM Do YYYY') : moment().format('MMMM Do YYYY')
    }
  };
}

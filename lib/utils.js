const _ = require('lodash');
const moment = require('moment');
const fs = require('fs');
const {promisify} = require('util');
const commonmark = require('commonmark');
const friendlyUrl = require('friendly-url');
const path = require('path');
const hb = require('handlebars');
const helpers = require('handlebars-helpers')();

const hbHelpers = {
  'compare': helpers.compare,
  'forEach': helpers.forEach,
  'or': helpers.or,
  'and': helpers.and,
  'split': helpers.split,
  'default': helpers.default,
  'contains': helpers.contains,
  'capitalize': helpers.capitalize,
  'omit': _.omit,
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
      return t.frontmatter.card.columnid === status;
    });
  },
  'getCurrentYear': () => {
    return (new Date()).getFullYear();
  },
  'getTasksFromLane': (tasks, laneName) => {
    return tasks[laneName];
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
  },
  'getFileName': (filePath) => {
    return path.basename(filePath, path.extname(filePath));
  },
  'getFileIcon': (file) => {
    const fileParts = file.split('.');
    if (fileParts.length > 0) {
      return fileParts[fileParts.length - 1];
    }
    
    return 'file';
  },
  'resumeGrep': (items, filterTag, jobTag) => {
    return _.filter(items, (item) => {
      if (!item.frontmatter.resume) {
        return false;
      }
      
      const filterTagArr = filterTag.split(',');
      const jobTagArr = (jobTag && typeof jobTag === 'string') ? jobTag.split(',') : '';
      
      return _.reduce(filterTagArr, (res, tag) => {
        return res && (item.frontmatter.resume.tags.indexOf(tag) !== -1);
      }, true) || _.reduce(jobTagArr, (res, tag) => {
        return res && (item.frontmatter.resume.tags.indexOf(tag) !== -1);
      }, (jobTag && typeof jobTag === 'string'));
      
      // return item.frontmatter.resume.tags.indexOf(filterTag) !== -1;
    });
  },
  'highlighter': (text) => {
    if (!text) {
      return text;
    }
    
    const highlightWords = [
      'net',
      'architect', 'asp.net', 'angular',
      'blog posts',
      'c#', 'cibse', 'clei', 'cms', 'coo', 'conferences as speaker',
      'decision making',
      'embedded visual basic 3.0', 'extremme programing', 'es6',
      'devops', 'drupal',
      'facebook instant articles',
      'google amp', 'google news',
      'html',
      'javascript', 'java', 'jsps', 'jsp', 'jquery', 'json',
      'kanban',
      'hp-jornada 720', 'hp ipaq-2210', 'highcharts js', 'handlebars',
      'linux',
      'master in engineering', 'master', 'mvc', 'mysql', 'msn',
      'nginx', 'nodejs', 'node.js',
      'oracle',
      'pm2', 'pm', 'postgresql',
      'quality assurance', 'quality',
      'ruby on rails', 'ruby', 'react', 'redis',
      'scrum master', 'scrum', 'scientific research', 'sdlc', 'social networks', 'sql server', 'sql', 'svg', 'software engineering professor', 'swebok',
      'tfs',
      'uml',
      'visual basic 6.0',
      'windows',
      'xp',
      'yaml'
    ];
    
    const highlightRegExp = new RegExp(`\\b${highlightWords.join('\\b|\\b')}\\b`, 'gi');
    
    return text.replace(highlightRegExp, (match) => {
      return `<strong>${match}</strong>`;
    });
  },
  'concat': (...params) => {
    // Ignore the object appended by handlebars.
    if (typeof params[params.length - 1] === 'object') {
      params.pop();
    }
    
    return params.join('');
  },
  'isFeatured': (featuredTags, resumeType) => {
    if (!featuredTags) {
      return false;
    }
    
    featuredTagsArr = featuredTags.split(',');
    
    return (_.indexOf(featuredTagsArr, resumeType) !== -1);
  },
  'buildResumePlace': (cardTitle, contentPlace) => {
    if (cardTitle.trim() == contentPlace.trim()) {
      return contentPlace;
    }
    
    return `${cardTitle} - ${contentPlace}`;
  },
  'printableLink': function(url, text, options) {
    var utms = [];
    
    Object.keys(options.hash).forEach(key => {
      var escapedKey = hb.escapeExpression(key);
      var escapedValue = hb.escapeExpression(options.hash[key]);
      utms.push(`${escapedKey}=${escapedValue}`);
    })
    var escapedText = hb.escapeExpression(text);
    
    var url = hb.escapeExpression(url);
    var result = `
    <a href="${url}" class="no-printable">${escapedText}</a>
    <a href="${url}?${utms.join('&')}" class="printable" title="${escapedText}">${escapedText}</a>
    `;
    
    return new hb.SafeString(result);
  },
  'hasJsonLd': function(jsonLd, options) {
    return (jsonLd && Object.keys(jsonLd).length > 0)
  },
  'fullTitle': function(partialTitle) {
    return `${partialTitle} | Darío Macchi`;
  }
};

_.each(hbHelpers, (hlpr, hlprName) => {
  hb.registerHelper(hlprName, hlpr);
});

let links = undefined;

exports.hbCompile = (html) => {
  return hb.compile(html);
}

/* ============
= Process DMD file content and return an object with frontmatter property and content property
================= */
exports.generateDmdObject = async (dmdFilePath) => {
  links = [];
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
          let renderer = htmlrenderer;
          keyVal = renderer.render(parser.parse(sectionContent));
          break;
        
        case 'json':
          let jsonEntry = JSON.parse(sectionContent);
          // It will enter here in the case of related_images being an object instead
          // of an array (i.e. supervisor---senior-developer---it-consultant)
          if (name === 'related_images' && jsonEntry.constructor === Object) {
            var htmlTemp = fs.readFileSync('common/_entry-gallery.hbs', 'utf8');
            let htmlTemplate = exports.hbCompile(htmlTemp);
            
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
  
  const outputFileName = jsonFM.outputFilename || `${path.basename(dmdFilePath, path.extname(dmdFilePath))}.html`;
  const slug = path.basename(outputFileName, path.extname(outputFileName));
  
  if (jsonFM.card && jsonFM.card.title === '[title]') {
    jsonFM.card.title = jsonFM.title;  
  }
  
  if (jsonFM.card && jsonFM.card.content === '[title]') {
    jsonFM.card.content = jsonFM.title;  
  }

  if (jsonFM.card && jsonFM.card.linkto === '[link_to]') {
    if (jsonFM.lang) {
      jsonFM.card.linkto = `/${jsonFM.lang}/${slug}`;
    }
    else {
      jsonFM.card.linkto = `/${slug}`;
    }
  }

  return {
    frontmatter: jsonFM,
    content: jsonContent,
    meta: {
      filePath: dmdFilePath,
      slug: slug,
      fdate: jsonFM.date ? moment(jsonFM.date).format('MMMM Do YYYY') : moment().format('MMMM Do YYYY'),
      outputFilename: outputFileName,
      links: _.keys(links)
    }
  };
}

// HtmlRenderer implementation
const htmlrenderer = new commonmark.HtmlRenderer();

htmlrenderer.heading = function (node, entering) {
  var tagname = "h" + node.level,
      attrs = this.attrs(node);
  if (entering) {
    const hash = friendlyUrl(node.firstChild.literal);
    this.tag(tagname, attrs);
    this.tag("a", [
      ["name", hash],
      ["class", "anchor"]
    ]);
    this.cr();
    this.tag("a", [
      ["name", hash],
      ["href",`#${hash}`],
      ["class", "no_external_ico"]
    ]);
  } else {
    this.tag("/a");
    this.tag("/" + tagname);
    this.cr();
  }
}
htmlrenderer.link = function (node, entering) {
  links[node.destination] = true;
  
  // Same impl as https://github.com/commonmark/commonmark.js/blob/568add848652cc08dc488ee1bebada6f89510df9/lib/render/html.js#L61
  var attrs = this.attrs(node);
  if (entering) {
      if (!(this.options.safe && potentiallyUnsafe(node.destination))) {
          attrs.push(["href", this.esc(node.destination)]);
      }
      if (node.title) {
          attrs.push(["title", this.esc(node.title)]);
      }
      this.tag("a", attrs);
  } else {
      this.tag("/a");
  }
}
htmlrenderer.image = function (node, entering) {
  if (entering) {
    if (this.disableTags === 0) {
      if (this.options.safe && potentiallyUnsafe(node.destination)) {
        this.lit('<img src="" alt="');
      } else {
        const ext = path.extname(node.destination);
        const iName = path.basename(node.destination, ext);
        const iPath = `${path.dirname(node.destination)}/${iName}`;

        if (ext.startsWith('.gif') || ext === '') {
          this.lit(
            `<img src="${iPath}${ext}" alt="`
          );
        }
        else {
          this.lit(
            `<picture>
              <source srcset="${iPath}.webp" type="image/webp">
  
              <img src="${iPath}${ext}" alt="`
          );
        }
      }
    }
    this.disableTags += 1;
  } else {
    this.disableTags -= 1;
    if (this.disableTags === 0) {
      if (node.title) {
        this.lit('" title="' + this.esc(node.title));
      }
      this.lit('"></picture>');
    }
  }
};

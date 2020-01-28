const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

let publicDir = path.join(__dirname, '/www');
let rootDir = path.join(__dirname, '/root')
const url = require('url');

let app = express();

let logger = require('dm-logger').initialize(app, {
  getLogLevelFromQuerystring: (process.env.NODE_ENV !== 'production'),
  assetsPathRegex: /^\/assets\/.*/ig
});

// http://stackoverflow.com/a/16895480/126519
app.use(function (req, res, next) {
  let reqPath = decodeURIComponent(req.path);
  let reqQueryStr = getQueryString(req.url);

  if (reqPath.indexOf('.') === -1) {
    var file = `${publicDir}${reqPath}.html`;
    fs.stat(file, function (err, stat) {
      if (err == null) {
        if (reqQueryStr) {
          req.url = `${url.parse(req.url).pathname}.html?${reqQueryStr}`;
        }
        else {
          req.url += '.html';
        }
      }
      next();
    });
  }
  else {
    next();
  }
});

app.use(express.static(publicDir));
app.use('/', express.static(rootDir));

app.get('/me', function (req, res) {
  res.redirect(301, '/about-me');
});

app.get('/static/*', function (req, res) {
  res.redirect(301, `/assets/build/static/${req.params[0]}`);
});

app.post('/pullit', async function (req, res) {
  console.log('Git-auto-pull was called... running!');

  exec('git pull && yarn install', (err, stdout, stderr) => {
    if (err) {
      // node couldn't execute the command
      console.log(`\x1b[31m${err}\x1b[0m`);
      return res.sendStatus(405);
    }
    if (stdout.length > 0) {
      console.log(`\x1b[32m${stdout}\x1b[0m`);
      return res.sendStatus(200);
    }
    else {
      console.log(`\x1b[31m${stderr}\x1b[0m`);
      return res.sendStatus(500);
    }
  });
});

app.get('/status', function (req, res) {
  require('child_process').exec('git rev-parse HEAD', function (err, stdout) {
    if (err) {
      return res.json({
        'err': err
      }).status(500);
    }

    let lastCommit = stdout.replace(/\r?\n|\r/, '');

    console.log(`Last commit: ${lastCommit}`);

    return res.json({
      'last_commit': lastCommit
    });
  });
});

const port = process.env['PORT'] || 3000;

app.listen(port, function () {
  console.log(`\r\nDariomac.com server listening on: ${port}`);
});

function getQueryString (urlWithQS) {
  let qs = null;

  const indexOfQS = urlWithQS.indexOf('?');
  if (indexOfQS > 0) {
    qs = urlWithQS.substring(indexOfQS+1);
  }

  return qs;
};

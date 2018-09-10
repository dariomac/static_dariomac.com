const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

var publicdir = path.join(__dirname, '/www');

var app = express();

// http://stackoverflow.com/a/16895480/126519
app.use(function (req, res, next) {
  let reqPath = decodeURIComponent(req.path);

  if (reqPath.indexOf('.') === -1) {
    var file = publicdir + reqPath + '.html';
    fs.exists(file, function (exists) {
      if (exists) {
        req.url += '.html';
      }
      next();
    });
  }
  else {
    next();
  }
});
app.use(express.static(publicdir));

app.post('/pullit', async function (req, res) {
  console.log('Git-auto-pull was called... running!');

  exec('git pull && yarn install', (err, stdout, stderr) => {
    if (err) {
      // node couldn't execute the command
      return;
    }
    if (stdout.length > 0) {
      console.log(`\x1b[32m${stdout}\x1b[0m`);
    }
    else {
      console.log(`\x1b[31m${stderr}\x1b[0m`);
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

app.listen(3000, function () {
  console.log('\r\nDariomac.com server listening on: 3000');
});

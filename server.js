const express = require('express');
const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;
const async = require('async');

var publicdir = path.join(__dirname, '/www');

var app = express();

// http://stackoverflow.com/a/16895480/126519
app.use(function (req, res, next) {
  if (req.path.indexOf('.') === -1) {
    var file = publicdir + req.path + '.html';
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

app.put('/pullit', function (req, res) {
  console.log('An event has been detected on the listened port: starting execution...');

  updateProject((e, result) => {
    let response = '';
    if (e) {
      console.error(`exec error: ${e}`);
      response += `exec error: ${e}`;
    }
    if (result) {
      console.log(result);
      response += `\n ${result}`;
    }
    res.end(response);
  });
});

app.listen(3000, function () {
  console.log('\r\nDariomac.com server listening on: 3000');
});

const absolutePath = __dirname;

const cmds = ['git pull'].concat(process.argv.filter((arg, index) => { return index > 2; }));

const execCmds = cmds.map((cmd) => {
  return function (callback) {
    exec(`cd ${absolutePath} && ${cmd}`, {maxBuffer: 1024 * 600}, (err, stdout, stderr) => {
      if (err) return callback(err);
      callback(null, `--- ${cmd} ---:\n stdout: ${stdout} \n stderr: ${stderr}\n`);
    });
  };
});

const updateProject = function (callback) {
  async.series(execCmds, function (err, results) {
    if (err) return callback(err);
    return callback(null, results.join(''));
  });
};

console.log('Git-auto-pull is running');

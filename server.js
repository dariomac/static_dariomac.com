var express = require('express'),
    fs = require('fs');

var publicdir = __dirname + '/www';

var app = express();

//http://stackoverflow.com/a/16895480/126519
app.use(function(req, res, next) {
  if (req.path.indexOf('.') === -1) {
    var file = publicdir + req.path + '.html';
    fs.exists(file, function(exists) {
      if (exists)
        req.url += '.html';
      next();
    });
  }
  else
    next();
});
app.use(express.static(publicdir));

app.listen(3000, function () {
    console.log('\r\nDariomac.com server listening on: 3000');
});

import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import url from 'url';
import pino from 'express-pino-logger';
import { getLink } from './lib/link-db.mjs';
import { generateRedirectPage } from './lib/redirect-template.mjs';
import { fetchOGTags } from './lib/og-fetcher.mjs';

const __dirname = import.meta.dirname;

const publicDir = path.join(__dirname, '/www');
const rootDir = path.join(__dirname, '/root');

const logger = pino({
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      user: req.raw.user,
    }),
  },
});

let app = express();

// https://stackoverflow.com/a/16895480/126519
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

app.use(logger);
app.use(express.static(publicDir));
app.use('/', express.static(rootDir));

app.get('/me', function (req, res) {
  res.redirect(301, '/about-me');
});

const destinations = {
  '/eci2020-course-proposal': '/es/eci2020-course-proposal',
  '/niveles-de-abstracci%C3%B3n': '/es/niveles-de-abstracci%C3%B3n',
  '/para-ser-agil-tenes-que-ser-velozsino-pa-que-sos-agil': '/es/para-ser-agil-tenes-que-ser-velozsino-pa-que-sos-agil',
  '/svg-to-raphael': '/',
  '/austin-software-software-engineer': '/howdy-software-engineer',
  '/austin-software-developer-advocate': '/howdy-developer-advocate',
  '/krooping-procesamiento-de-im%C3%A1genes-satelitales-para-generaci%C3%B3n-de-%C3%ADndices-agron%C3%B3micos': '/krooping-procesamiento-de-imagenes-satelitales-para-generacion-de-indices-agronomicos',
  '/software-estimates-no-longer-engineering-problem': '/software-estimates-no-longer-engineering-problem-mis-uy',
}

const origins = Object.keys(destinations);
for (let i=0; i < origins.length; i++) {
  const origin = origins[i];

  app.get(origin, function (req, res) {
    res.redirect(301, destinations[origin]);
  });
}

app.get('/static/*static-files', function (req, res) {
  res.redirect(301, `/assets/build/static/${req.params[0]}`);
});

// Database-backed URL redirector with Open Graph mirroring
app.get('/go/:slug', async function (req, res) {
  const { slug } = req.params;

  try {
    // Look up link in database
    const link = getLink(slug);

    if (!link) {
      console.log(`Link not found: /go/${slug}`);
      return res.status(404).send('Link not found');
    }

    if (link.isExpired) {
      console.log(`Expired link accessed: /go/${slug} (expired: ${new Date(link.expiresAt).toISOString()})`);
      return res.status(410).send('This link has expired');
    }

    // Log the redirect for server-side tracking
    console.log(`Redirecting /go/${slug} -> ${link.url} (created: ${new Date(link.createdAt).toISOString()})`);

    // Fetch Open Graph tags from destination URL
    // This is cached and has a timeout, so it won't block for long
    const ogTags = await fetchOGTags(link.url);

    // Serve HTML page with analytics tracking and OG tags
    // This allows:
    // 1. Social networks to see the correct preview when crawling
    // 2. Google Analytics and PostHog to fire before redirect
    const html = generateRedirectPage(link.url, slug, ogTags);
    res.type('html').send(html);
  } catch (error) {
    console.error(`Failed to process link: ${error.message}`);
    res.status(500).send('Unable to process redirect link');
  }
});

const fetchAndReset = () => {
  exec('git fetch origin && git reset --hard origin/master && npm install', (err, stdout, stderr) => {
    if (err) {
      // node couldn't execute the command
      console.log(`\x1b[31m${err}\x1b[0m`);
    }
    if (stdout.length > 0) {
      console.log(`\x1b[32m${stdout}\x1b[0m`);
    }
    else {
      console.log(`\x1b[31m${stderr}\x1b[0m`);
    }
  });
}

app.options('/pullit', async function (req, res) {
  console.log('Git-auto-pull was called... running!');

  fetchAndReset();

  return res.sendStatus(204);
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

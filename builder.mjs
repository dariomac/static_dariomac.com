import * as toS from './lib/2static.mjs';
import * as toZ from './lib/2zettelkasten.mjs';
import cmdArgs from 'command-line-args';

const settings = [
  { name: 'paths', multiple: true, defaultOption: true },
  { name: 'clear-all', alias: 'c', type: Boolean },
  { name: 'verbose', alias: 'v', type: Boolean }];

const mainOptions = cmdArgs(settings, { stopAtFirstUnknown: true });
    
if (!mainOptions.paths || mainOptions.paths.length !== 3) {
  throw new Error('Invalid number of parameters: you should provide input, output and layout paths as first 3 parameters.');
}

const paths = {
  'inputPath': `./${ensureSlashTermination(mainOptions.paths[0])}`,
  'outputPath': `./${ensureSlashTermination(mainOptions.paths[1])}`,
  'layoutPath': `./${ensureSlashTermination(mainOptions.paths[2])}`,
  'assetsPath': `./${ensureSlashTermination(mainOptions.paths[1])}assets/`
};

function ensureSlashTermination (somePath) {
  return (somePath.lastIndexOf('/') === somePath.length - 1) ? somePath : `${somePath}/`;
}

(async function () {
  const backlinks = await toZ.buildBacklinks(mainOptions, paths);
  console.log(backlinks);
  toS.initialize(mainOptions, paths, backlinks);
  toS.run();

})();

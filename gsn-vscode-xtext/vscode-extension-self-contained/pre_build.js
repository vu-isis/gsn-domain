/* eslint-disable no-restricted-syntax */
const fs = require('fs-extra');
const path = require('path');

// Temporary fix:
// Remove all types from the graph-editors dependencies. These are listed as extraneous from the command
// "npm list --production --parseable --depth=99999 --loglevel=error" ran somewhere down in the gradle node plugin
// and the gradle-vscodeExtension task fails.

const typesDir = path.join(__dirname, 'node_modules/@types');
fs.readdirSync(typesDir).filter((file) => {
    if (file.startsWith('d3') || file === 'geojson') {
        return true;
    }
    return false;
  })
  .map((dirName) => path.join(typesDir, dirName))
  .forEach((dir) => {
    console.log('Deleting unused node_module', dir);
    fs.removeSync(dir);
});

// Copy over the source files for the GSN-graph
const SRC_DIR = path.join(__dirname, '../graph-editor/src/components/graph');
const OUT_DIR = path.join(__dirname, 'src/components/graph');

console.log('Copying GSN-Graph Files:');
console.log(SRC_DIR, '-->');
console.log('-->', OUT_DIR);

const gitIgnorePath = path.join(OUT_DIR, '.gitignore');
const gitIgnoreContent = fs.readFileSync(gitIgnorePath, 'utf8')
fs.emptyDirSync(OUT_DIR);
fs.copySync(SRC_DIR, OUT_DIR);
fs.outputFileSync(gitIgnorePath, gitIgnoreContent);

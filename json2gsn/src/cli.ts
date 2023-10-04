#!/usr/bin/env node
import { program } from 'commander';
import { json2gsn } from './json2gsn';
import * as fs from 'fs';
import * as path from 'path';
import * as process from 'process';

program
    .description('convert json representation to .gsn file(s)')
    .argument('<modelJson>', 'input json file for convertion (abs or relative path from cwd)')
    .option('-m, --model-folder <string>', 'name of folder where .gsn files will be put', 'gsnModel')
    .option('-o, --output-dir <string>', 'directory where the model folder will be created [default: cwd]')
    .option('-s, --single-file', 'if true all namespaces will be in a single output file, main.gsn')
    .option('-v, --verbose', 'if true will print hints and lots of information about model errors')
    .option('-i, --indentation <number>', 'indentation to use', (val: string) => parseInt(val, 10), 4)
    .addHelpText('after', `

Example calls:
  $ json2gsn model.json
  $ json2gsn -o /home/joe/GIT/assurance-models -m gauss test/models/gauss/model.json
  $ json2gsn -i 2 -s -v model.json
`);
program.parse();

const options = program.opts();
const args = program.args;
// console.log(JSON.stringify(args, null, 2));
// console.log(JSON.stringify(options, null, 2));

const outputDir = path.resolve(options.outputDir || process.cwd());
if (!fs.existsSync(outputDir)) {
    console.error('ERROR: The output directory does not exist!', outputDir);
    process.exit(1);
}
console.log('Input:', path.resolve(args[0]));
console.log('Output:', outputDir);

const modelJson = JSON.parse(fs.readFileSync(args[0], 'utf8'));

const { errors, contents } = json2gsn(modelJson, ' '.repeat(options.indentation));

if (errors) {
    errors.forEach((error) => {
        console.log(`\nMODEL-ERROR: node index [${error.index}] id = ${error.nodeId}\n${error.message}`);
        if (options.verbose) {
            console.log(error.nodeDetails);
        }
        console.log('Hint:', error.hint);
    });

    console.error('\nERROR: Model contains errors, see above');
    process.exit(1);
}

const modelDir = path.join(outputDir, options.modelFolder);
if (fs.existsSync(modelDir)) {
    console.error('ERROR: The model directory already exists!', modelDir);
    process.exit(1);
}

fs.mkdirSync(modelDir);

let pieces: string[] = [];
for (const [namespace, content] of contents as Map<string, string>) {
    if (options.singleFile) {
        pieces.push(content);
    } else {
        fs.writeFileSync(path.join(modelDir, `${namespace}.gsn`), content);
    }
}

if (options.singleFile) {
    fs.writeFileSync(path.join(modelDir, `main.gsn`), pieces.join('\n'));
    console.log('Wrote out main.gsn into', modelDir);
} else {
    console.log('Wrote out', contents?.size, 'file(s) into', modelDir);
}
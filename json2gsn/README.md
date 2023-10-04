# JSON2GSN

Utility to generate .gsn-files from model-json input. See `test/models` for example of format.

## Usage

### As CLI
Clone the repository and from this root run. (Alternatively `npm install json2gsn` and there is not need for step 1 and 2.)
1. `npm install`
2. `npm run compile`
3. `node dist/cli.js -h`

### As a Library (`npm install json2gsn`):

[javascript]
```javascript
const fs = require('fs');
const { json2gsn } = require('json2gsn');

const modelJson = JSON.parse(fs.readFileSync('./model.json', 'utf8'));
const { errors, contents } = json2gsn(modelJson);

if (errors) {
    // handle array of errors
    process.exit(1);
}

for (const [namespace, content] of contents) {
    console.log(namespace, content);
}
```

[typescript]
```typescript
import * as fs from 'fs';
import { json2gsn } from 'json2gsn';

const modelJson = JSON.parse(fs.readFileSync('./model.json', 'utf8'));
const { errors, contents } = json2gsn(modelJson);

if (errors) {
    // handle array of errors
    process.exit(1);
}

for (const [namespace, content] of contents as Map<string, string>) {
    console.log(namespace, content);
}
```

### Via VS-Code extension
Make sure you have installed the `GSN Assurance`-extension and then from your extension call the command `gsn.model-json-to-gsn`.

```javascript
const modelJson = JSON.parse(fs.readFileSync('./model.json', 'utf8'));
const {errors, contents} = vscode.commands.executeCommand('gsn.model-json-to-gsn', modelJson);

// See snippets above of how to handle the errors and contexts.

```


(You can add GSN Assurance as a dependency in your package.json.)

### Publish a Release

1. Update to a new version (`x.x.x`) in `package.json`
2. `git commit -am "json2gsn release x.x.x"`
3. `git push origin master`
4. `npm run compile`
5. `npm publish ./`
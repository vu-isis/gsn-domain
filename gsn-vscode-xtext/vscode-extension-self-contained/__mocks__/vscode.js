/* eslint-disable no-restricted-syntax */
const path = require('path');
const fs = require('fs').promises;

const vscode = {
    FileType: {
        File: 1
    },
    Uri: {
        joinPath: (uri, subPath) => path.join(uri, subPath),
        file: p => p,
    },
    workspace: {
        fs: {
            readDirectory: async (p) => {
                const entries = await fs.readdir(p);
                const res = [];
                for (const fname of entries) {
                    const info = [fname];
                    // eslint-disable-next-line no-await-in-loop
                    if ((await fs.lstat(path.join(p, fname))).isFile()) {
                        info.push(1);
                    } else {
                        info.push(0);
                    }

                    res.push(info);
                }

                return res;
            },
            readFile: (p) => fs.readFile(p),
            writeFile: (p, content) => fs.writeFile(p, content),
        }
    }
}

module.exports = vscode;
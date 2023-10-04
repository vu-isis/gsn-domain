import * as crypto from 'crypto';
import { Uri, workspace, FileType, FileSystemError } from 'vscode';
import CONSTANTS from './CONSTANTS';
import { Tarjan } from 'tarjan-scc';

/**
 * Computes the SHA1 hash of a given string.
 *
 * @param {string} str - The input string for which the hash will be computed.
 * @returns {string} - The SHA1 hash of the input string.
 */
export function getSHA1Hash(str: string): string {
    return crypto.createHash('sha1').update(str, 'utf-8').digest('hex');
}

/**
 * Computes a hash for the entire model based on individual file hashes.
 * This function takes an object where the keys are file names and the values are
 * their corresponding hashes. It sorts the file names, then concatenates the file names
 * and their hashes. Finally, it computes the SHA1 hash for the concatenated string,
 * which serves as the model hash.
 *
 * @param {object} fileNameToHash - An object with file names as keys and their corresponding hashes as values.
 * @returns {string} The computed SHA1 hash for the entire model.
 */
export function computeModelHash(fileNameToHash: object) : string {
    const namesHashes = [];
    Object.keys(fileNameToHash).sort().forEach((fileName) => {
        namesHashes.push(`${fileName}#${fileNameToHash[fileName]}`);
    });

    return getSHA1Hash(namesHashes.join(','));
}

/**
 * Computes a hash for the entire model based on individual file hashes.
 * This function takes a Map of file names to their content, calculates the
 * SHA1 hash for each file, and concatenates the file names and their hashes.
 * It then computes the SHA1 hash for the concatenated string, which serves as
 * the model hash.
 *
 * @param {Map<string, string>} modelFiles - A Map of file names to their content.
 * @returns {string} The computed SHA1 hash for the entire model.
 */
export function getModelHash(modelFiles: Map<string, string>) : string {
    const fileNameToHash = {};
    modelFiles.forEach((fileContent, fileName) => {
        fileNameToHash[fileName] = getSHA1Hash(fileContent);
    })

    return computeModelHash(fileNameToHash);
}

/**
 * Reads all the files in the model directory and computes the model hash.
 * This function first reads all the files in the given model directory using
 * the readModelFiles function. Then, it computes the model hash using the
 * getModelHash function.
 *
 * @param {Uri} modelDirUri - The Uri of the model directory.
 * @returns {Promise<string>} A Promise that resolves to the computed SHA1 hash for the entire model.
 */
export async function readInModelHash(modelDirUri: Uri) : Promise<string> {
    const modelFiles = await readModelFiles(modelDirUri);
    return getModelHash(modelFiles);
}

/**
 * Reads all model files with the extension '.gsn' from a specified directory and returns their contents in a Map.
 *
 * @param {Uri} modelDirUri - The directory URI containing the model files.
 * @returns {Promise<Map<string, string>>} - A Promise that resolves to a Map containing the filenames and their content as key-value pairs.
 */
export async function readModelFiles(modelDirUri: Uri): Promise<Map<string, string>> {
    const promises = [];
    const fileNames = [];
    const entries = await workspace.fs.readDirectory(modelDirUri);

    for (const [fileName, type] of entries) {
        if (type === FileType.File && fileName.endsWith(CONSTANTS.FILE_EXTENSION)) {
            fileNames.push(fileName);
            promises.push(workspace.fs.readFile(Uri.joinPath(modelDirUri, fileName)));
        }
    }

    const fileContents = await Promise.all(promises);

    const res = new Map<string, string>();
    for (let i = 0; i < fileNames.length; i += 1) {
        res.set(fileNames[i], Buffer.from(fileContents[i]).toString('utf8'));
    }

    return res;
}

/**
 * Writes new files to a specified directory.
 *
 * @param {Uri} modelDirUri - The directory URI where the new files will be written.
 * @param {Map<string, string>} newFiles - A Map containing the filenames and their content as key-value pairs.
 * @returns {Promise<void>} - A Promise that resolves when all files have been written.
 */
export async function writeModelFiles(modelDirUri: Uri, newFiles: Map<string, string>): Promise<void> {
    const promises = [];

    newFiles.forEach((content, fileName) => {
        promises.push(workspace.fs.writeFile(Uri.joinPath(modelDirUri, fileName), Buffer.from(content, 'utf8')));
    });

    await Promise.all(promises);
}

export async function readInViews(modelDirUri: Uri) {
    return await _readInJson(modelDirUri, CONSTANTS.VIEWS_FILENAME);
}

export async function writeOutViews(modelDirUri: Uri, views: Array<object>) {
    return await _writeOutJson(modelDirUri, CONSTANTS.VIEWS_FILENAME, views);
}

export async function readInLabels(modelDirUri: Uri) {
    return await _readInJson(modelDirUri, CONSTANTS.LABELS_FILENAME);
}

export async function writeOutLabels(modelDirUri: Uri, labels: Array<object>) {
    return await _writeOutJson(modelDirUri, CONSTANTS.LABELS_FILENAME, labels);
}

async function _readInJson(modelDirUri: Uri, fname: string) {
    const dirUri = Uri.joinPath(modelDirUri, CONSTANTS.STATE_DIRECTORY);
    const jsonUri = Uri.joinPath(dirUri, fname);
    try {
        const readData = await workspace.fs.readFile(jsonUri);
        return Buffer.from(readData).toString('utf8');
    } catch (err) {
        if (err.code === 'FileNotFound') {
            return '[]';
        }
        throw err;
    }
}

async function _writeOutJson(modelDirUri: Uri, fname: string, jsonArray: Array<object>) {
    const dirUri = Uri.joinPath(modelDirUri, CONSTANTS.STATE_DIRECTORY);
    try {
        const dir = await workspace.fs.stat(dirUri);
        if (dir.type !== FileType.Directory) {
            throw new Error(`The provided URI is not a directory: ${dirUri}`);
        }
    } catch (error) {
        if ((error as FileSystemError).code === 'FileNotFound') {
            await workspace.fs.createDirectory(dirUri);
        } else {
            console.error('An error occurred:', error);
        }
    }

    const uri = Uri.joinPath(dirUri, fname);
    const jsonStr = JSON.stringify(jsonArray, null, 2);
    await workspace.fs.writeFile(uri, Buffer.from(jsonStr, 'utf8'));
}

export function getChangeMessage(changeArray: any) {
    if (changeArray.length === 1) {
        return `${changeArray[0].cmd} ${changeArray[0].nodeId.split('/').pop()}`;
    } else {
        return `${changeArray[0].cmd} + [${changeArray.length - 1}] change(s)`;
    }
}

// Consider reusing json2gsn for more checks here.
export function checkModelForLoops(gsnModel: any[]): boolean {
    const t = new Tarjan();

    for (const node of gsnModel) {
        let relations = [];
        if (node.solvedBy) {
            relations = node.solvedBy;
        }

        if (node.inContextOf) {
            relations = [...relations, ...node.inContextOf];
        }

        t.addVertex(node.id);
        for (const childId of relations) {
            t.addVertex(childId);
            t.connectVertices(node.id, childId);
        }
    }

    return t.hasLoops();
}
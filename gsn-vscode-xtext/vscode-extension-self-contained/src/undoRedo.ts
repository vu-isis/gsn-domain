import { Uri } from 'vscode';
import { diff_match_patch, patch_obj } from 'diff-match-patch';
import { computeModelHash, getSHA1Hash, readModelFiles, writeModelFiles } from './util';

const dmp = new diff_match_patch();

interface FileDelta {
    fileName: string,
    baseHash: string,
    newHash: string,
    patchesFromBase?: patch_obj[],
    patchesToBase?: patch_obj[],
}

export class UndoRedoEntry {
    message: string;
    fileInfos: Map<string, FileDelta>;

    constructor(message: string, fileInfos?: Map<string, FileDelta>) {
        this.message = message;
        this.fileInfos = fileInfos || new Map<string, FileDelta>();
    }

    getUpdatedFiles() {
        const fnames = [];
        this.fileInfos.forEach((fDelta, fName) => {
            if (fDelta.baseHash !== fDelta.newHash) {
                fnames.push(fName);
            }
        });

        return fnames;
    }

    getBaseModelHash() {
        const fileNameToHash = {};
        this.fileInfos.forEach((fDelta, fName) => {
            fileNameToHash[fName] = fDelta.baseHash;
        });

        return computeModelHash(fileNameToHash);
    }

    getNewModelHash() {
        const fileNameToHash = {};
        this.fileInfos.forEach((fDelta, fName) => {
            fileNameToHash[fName] = fDelta.newHash;
        });

        return computeModelHash(fileNameToHash);
    }
}

/**
 * Computes the undo/redo entry for the base files in the specified directory.
 *
 * @param {Uri} modelDirUri - The directory URI containing the model files.
 * @param {Map<string, string>} baseFiles - A Map containing the base filenames and their content as key-value pairs.
 * @param {string} message - A string message associated with the change.
 * @returns {Promise<UndoRedoEntry>} - A Promise that resolves to a UndoRedoEntry.
 */
export async function getUndoRedoEntry(modelDirUri: Uri, baseFiles: Map<string, string>, message: string): Promise<UndoRedoEntry> {
    const updatedFiles = await readModelFiles(modelDirUri);
    const res = new UndoRedoEntry(message);

    baseFiles.forEach((baseContent, fileName) => {
        const baseHash = getSHA1Hash(baseContent);
        const newHash = getSHA1Hash(updatedFiles.get(fileName));
        const fileDelta = {
            fileName,
            baseHash,
            newHash,
            patchesFromBase: null,
            patchesToBase: null,
        };

        if (baseHash !== newHash) {
            fileDelta.patchesFromBase = computePatches(baseContent, updatedFiles.get(fileName));
            fileDelta.patchesToBase = computePatches(updatedFiles.get(fileName), baseContent);
        }

        res.fileInfos.set(fileName, fileDelta);
    });

    return res;
}

/**
 * Applies the undo operation for the specified undo/redo entry in the model directory.
 *
 * @param {Uri} modelDirUri - The directory URI containing the model files.
 * @param {UndoRedoEntry} undoRedoEntry - The information about what changes to undo.
 * @returns {Promise<string[]>} - A Promise that resolves with a list of the updated file names after the undo.
 */
export async function applyUndo(modelDirUri: Uri, undoRedoEntry: UndoRedoEntry): Promise<string[]> {
    const currentFiles = await readModelFiles(modelDirUri);
    if (currentFiles.size !== undoRedoEntry.fileInfos.size) {
        throw new Error('Cannot undo - not the same number of gsn files anymore!');
    }

    const fileToContent = new Map<string, string>();

    currentFiles.forEach((currentContent, fileName) => {
        if (!undoRedoEntry.fileInfos.has(fileName)) {
            throw new Error('Cannot undo - gsn files do not match anymore!');
        }

        const { newHash, baseHash, patchesToBase } = undoRedoEntry.fileInfos.get(fileName);
        const currentHash = getSHA1Hash(currentContent);
        if (currentHash !== newHash) {
            throw new Error(`Cannot undo - gsn file content do not match anymore for ${fileName}`);
        }

        if (newHash !== baseHash) {
            const newBaseContent = applyPatches(currentContent, patchesToBase);
            if (getSHA1Hash(newBaseContent) !== baseHash) {
                throw new Error(`Cannot undo - new file content do not match previous ${fileName}`);
            }

            fileToContent.set(fileName, newBaseContent);
        } else {
            // console.log('No changes, skipping', fileName);
        }
    });

    await writeModelFiles(modelDirUri, fileToContent);
    return [...fileToContent.keys()];
}

/**
 * Applies the redo operation for the specified undo/redo entry in the model directory.
 *
 * @param {Uri} modelDirUri - The directory URI containing the model files.
* @param {UndoRedoEntry} undoRedoEntry - The information about what changes to redo.
 * @returns {Promise<string[]>} - A Promise that resolves with a list of the updated file names after the redo.
 */
export async function applyRedo(modelDirUri: Uri, undoRedoEntry: UndoRedoEntry): Promise<string[]> {
    const currentFiles = await readModelFiles(modelDirUri);
    if (currentFiles.size !== undoRedoEntry.fileInfos.size) {
        throw new Error('Cannot redo - not the same number of gsn files anymore!');
    }

    const fileToContent = new Map<string, string>();

    currentFiles.forEach((currentContent, fileName) => {
        if (!undoRedoEntry.fileInfos.has(fileName)) {
            throw new Error('Cannot redo - gsn files do not match anymore!');
        }

        const { newHash, baseHash, patchesFromBase } = undoRedoEntry.fileInfos.get(fileName);
        const currentHash = getSHA1Hash(currentContent);
        if (currentHash !== baseHash) {
            throw new Error(`Cannot redo - gsn file content do not match anymore for ${fileName}`);
        }

        if (newHash !== baseHash) {
            const newUpdatedContent = applyPatches(currentContent, patchesFromBase);
            if (getSHA1Hash(newUpdatedContent) !== newHash) {
                throw new Error(`Cannot redo - new file content do not match previous ${fileName}`);
            }

            fileToContent.set(fileName, newUpdatedContent);
        } else {
            // console.log('No changes, skipping', fileName);
        }
    });

    await writeModelFiles(modelDirUri, fileToContent);
    return [...fileToContent.keys()];
}

/**
 * Computes the diff-match-patch patches between the base string and the target string.
 *
 * @param {string} base - The base string.
 * @param {string} target - The target string.
 * @returns {patch_obj[]} - An array of patch_obj objects representing the patches between the base and target strings.
 */
export function computePatches(base: string, target: string): patch_obj[] {
    const dt = Date.now();
    const res = dmp.patch_make(base, target);
    // console.log('Computing patch', Date.now() - dt, '[ms]', 'patch size', JSON.stringify(res).length);
    return res;
}

/**
 * Applies the given patches to the base string.
 *
 * @param {string} base - The base string.
 * @param {patch_obj[]} patches - An array of patch_obj objects representing the patches to apply.
 * @returns {string} - The resulting string after applying the patches.
 */
export function applyPatches(base: string, patches: patch_obj[]): string {
    const dt = Date.now();
    const res = dmp.patch_apply(patches, base);
    // console.log('Applying patch', Date.now() - dt, '[ms]', 'patch size', JSON.stringify(patches).length,
    //     'content size', base.length);
    return res[0];
}


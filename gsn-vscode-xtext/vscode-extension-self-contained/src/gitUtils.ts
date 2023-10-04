import { extensions, Extension, Uri, FileSystemError, workspace, window, ViewColumn } from 'vscode';
import { API as GitAPI, GitExtension, Repository } from './@types/git';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as parseGitConfig from 'parse-git-config';
import { Resource } from './@types/depi';

const DIRS_CONFIG_KEY = 'git_directories';

async function tryGetGitRepoInfo(dir: string) {
    const gitConfig = await parseGitConfig({ cwd: dir, path: '.git/config' });
    if (!gitConfig) {
        throw new Error('parseGitConfig returned null');
    }

    // TODO: main is hardcoded now!
    const commitVersion = Buffer.from(
        await workspace.fs.readFile(Uri.joinPath(Uri.parse(dir), '.git', 'refs/heads/main'))
    ).toString('utf8');

    return { dir, gitUrl: gitConfig['remote "origin"'].url, commitVersion };
}

async function readDirectoriesInDirectory(dir: string) {
    try {
        const contents = await fs.readdir(dir);

        const directoryNames = [];

        for (const content of contents) {
            const contentPath = path.join(dir, content);
            const stat = await fs.stat(contentPath);

            if (stat.isDirectory()) {
                directoryNames.push(content);
            }
        }

        return directoryNames;
    } catch (err: any) {
        if (err.code === 'EACCES') {
            return [];
        }

        console.error('Error reading directories:', err);
        throw err;
    }
}

export async function getGitApi(): Promise<GitAPI> {
    const extension = extensions.getExtension('vscode.git') as Extension<GitExtension>;
    if (extension) {
        const gitExtension = extension.isActive ? extension.exports : await extension.activate();

        return gitExtension.getAPI(1);
    } else {
        throw new Error('Could not load git-api from vscode extension');
    }
}

export async function getGitResourceInfoFromPath(
    git: GitAPI,
    uri: Uri,
    localGit: boolean,
    log: Function
): Promise<{ gitUrl: string; commitVersion: string; resourceRelativePath: string }> {
    var repo: Repository | null = null;

    for (let r of git.repositories) {
        await r.status();

        if (uri.fsPath.startsWith(r.rootUri.path)) {
            repo = r;
            break;
        }
    }

    if (repo === null) {
        log(`Git repo for file "${path.basename(uri.fsPath)}" is not open in vscode.`);
        let parentDir = path.dirname(uri.fsPath);
        // FIXME: Is this a valid check?
        while (parentDir && parentDir.length > 1) {
            log('At dir', parentDir);
            const directoryNames = await readDirectoriesInDirectory(parentDir);

            if (directoryNames.includes('.git')) {
                log('Found .git parent');
                const { gitUrl, commitVersion } = await tryGetGitRepoInfo(parentDir);
                return { gitUrl, commitVersion, resourceRelativePath: uri.fsPath.substring(parentDir.length + 1) };
            }

            parentDir = path.dirname(parentDir);
        }

        if (repo === null) {
            throw new Error(`Could not find git-repo for "${path.basename(uri.fsPath)}"`);
        }
    }

    function getRemoteRepoUrl() {
        if (repo!.state.remotes.length > 0 && repo!.state.remotes[0].fetchUrl) {
            return repo!.state.remotes[0].fetchUrl;
        }

        throw new Error('Could not obtain remote git-url!');
    }

    const root = repo!.rootUri.path;
    const gitUrl = localGit ? repo!.rootUri.path : getRemoteRepoUrl();
    const commitVersion = repo.state.HEAD?.commit;

    if (!commitVersion) {
        throw new Error('Could not obtain a version for the git repository!');
    }

    return { gitUrl, commitVersion, resourceRelativePath: uri.fsPath.substring(root.length + 1) };
}

export async function findGitRepos(
    rootDir: string,
    log: Function,
    maxDepth = -1,
    skipDotDirs = true
): Promise<{ dir: string; gitUrl: string }[]> {
    const gitInfos: { dir: string; gitUrl: string; commitVersion: string }[] = [];

    async function traverseDirRec(dir: string, depth: number) {
        if (maxDepth > 0 && depth > maxDepth) {
            log(`Reached maximum depth at ${rootDir}`);
            return;
        }

        const directoryNames = await readDirectoriesInDirectory(dir);

        if (directoryNames.includes('.git')) {
            try {
                gitInfos.push(await tryGetGitRepoInfo(dir));
            } catch (err) {
                log('Error reading/parsing .get repo:', err);
            }

            return;
        }

        for (const dirName of directoryNames) {
            if (skipDotDirs && dirName[0] === '.') {
                break;
            }

            await traverseDirRec(path.join(dir, dirName), depth + 1);
        }
    }

    await traverseDirRec(rootDir, 1);

    return gitInfos;
}

export async function tryGetLocalGitUri(repos: Repository[], gitUrl: string, log: Function): Promise<Uri | null> {
    const repo = repos.find((r) => r.rootUri.path === gitUrl);
    let localRepoDir: Uri | null = null;

    // Repository is ...
    if (repo) {
        // ... opened in vscode.
        localRepoDir = repo.rootUri;
    } else if (!gitUrl.includes(':')) {
        // ... a local git repo.
        localRepoDir = Uri.file(gitUrl);
    } else {
        // ... perhaps a remote repository checked out locally.
        let configuration = workspace.getConfiguration('depi');
        const rootDirs = configuration.get<string[]>(DIRS_CONFIG_KEY);
        if (!rootDirs || rootDirs.length === 0) {
        } else {
            for (const rootDir of rootDirs) {
                if (localRepoDir) {
                    break;
                }

                for (const repoData of await findGitRepos(rootDir, log)) {
                    if (repoData.gitUrl === gitUrl) {
                        localRepoDir = Uri.file(repoData.dir);
                        break;
                    }
                }
            }
        }
    }

    return localRepoDir;
}

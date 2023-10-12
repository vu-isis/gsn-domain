import * as path from 'path';

import { commands, Extension, extensions, Uri, window } from 'vscode';
import { API as GitAPI } from './@types/git';
import { getGitResourceInfoFromPath } from './gitUtils';
import CONSTANTS from './CONSTANTS';
import { CmdResponse, ResourceLink, Resource, ResourcePattern, ResourceGroup } from './@types/depi';

let log: any;
let depiExtensionActivated: boolean = false;
let depiExtensionUnavailable: boolean = false;

async function tryActivateDepi() {
    try {
        let depiExtension = extensions.getExtension('vanderbilt.depi');
        if (!depiExtension) {
            throw new Error('Could not find "vanderbilt.depi" extension');
        }

        if (depiExtension.isActive) {
            return true;
        }

        await depiExtension.activate();
        return true;
    } catch (err) {
        log(err.message);
        depiExtensionUnavailable = true;
        return false;
    }
}

export default class GsnDepi {
    localGit = false;

    git: GitAPI;
    dirUri: Uri;

    constructor(git: GitAPI, dirUri: Uri, _log: any) {
        log = _log;
        this.git = git;
        this.dirUri = dirUri;
    }

    _resolveDepiResource = async ({ nodeId, uuid }: { nodeId: string, uuid: string }): Promise<Resource> => {
        const { gitUrl, commitVersion }
            = await getGitResourceInfoFromPath(this.git, this.dirUri, this.localGit, log);

        const resourceGroupName = path.basename(this.dirUri.fsPath);
        const resourceUrl = `${CONSTANTS.DEPI.PATH_DIVIDER}${nodeId}`;
        const resourceName = path.basename(nodeId);

        return {
            toolId: CONSTANTS.DEPI.TOOL_ID,
            resourceGroupName,
            resourceGroupUrl: `${gitUrl}${CONSTANTS.DEPI.GIT_URL_END_CHAR}${resourceGroupName}`,
            resourceGroupVersion: commitVersion,
            id: uuid,
            name: resourceName,
            url: resourceUrl,
            deleted: false,
        };
    }

    _getDependencyGraph = async (resource: Resource): Promise<ResourceLink[]> => {
        if (depiExtensionUnavailable || (!depiExtensionActivated && !await tryActivateDepi())) {
            throw new Error('Depi unreachable!');
        }

        const res: CmdResponse = await commands.executeCommand('depi.getDependencyGraph',
            resource.toolId, resource.resourceGroupUrl, resource.url);

        if (res.error) {
            if (res.error.includes('Parent resource not found')) {
                return [];
            }

            throw new Error(res.error);
        }

        return res.result as ResourceLink[];
    };

    getEvidenceInfo = async ({ nodeId, uuid }: { nodeId: string, uuid: string }) => {
        if (depiExtensionUnavailable || (!depiExtensionActivated && !await tryActivateDepi())) {
            return CONSTANTS.SOLUTION_DEPI_STATES.DEPI_UNAVAILABLE;
        }

        const resource = await this._resolveDepiResource({ nodeId, uuid });
        const result = {
            status: CONSTANTS.SOLUTION_DEPI_STATES.NO_LINKED_RESOURCE,
            evidence: []
        };

        let depGraph = await this._getDependencyGraph(resource);

        if (depGraph.length === 0) {
            return result;
        }

        let hasDirt = false;
        depGraph.forEach((link) => {
            hasDirt = hasDirt || link.dirty || link.inferredDirtiness.length > 0;

            if (link.source &&
                link.source.resourceGroupUrl === resource.resourceGroupUrl &&
                link.source.url === resource.url) {
                result.evidence.push(link.target);
            }
        });

        result.status = hasDirt ?
            CONSTANTS.SOLUTION_DEPI_STATES.RESOURCE_DIRTY : CONSTANTS.SOLUTION_DEPI_STATES.RESOURCE_UP_TO_DATE;

        return result;
    }

    linkEvidence = async ({ nodeId, uuid }: { nodeId: string, uuid: string }) => {
        if (depiExtensionUnavailable || (!depiExtensionActivated && !await tryActivateDepi())) {
            throw new Error('Depi unreachable!');
        }

        const resource = await this._resolveDepiResource({ nodeId, uuid });

        const selectedOption = await window.showInformationMessage(
            "If you are linking to a resource under git version control and you have a local copy of that resource, " +
            " you can select such right away. \n\n Would you like to select such resource now?",
            { modal: true },
            "Yes",
            "No - I will link to it using the Depi Blackboard"
        );

        if (selectedOption === 'Yes') {
            const fileUris = await window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                openLabel: `Use as evidence for the GSN-node "${resource.name}".`,
            });

            if (fileUris && fileUris.length > 0) {
                const addGitResponce: CmdResponse
                    = await commands.executeCommand('depi.addGitResourceToBlackboard', fileUris[0], true);

                if (addGitResponce.error) {
                    throw new Error(addGitResponce.error);
                }

                const addResponse: CmdResponse = await commands.executeCommand('depi.addResourcesToBlackboard', [resource]);
                if (addResponse.error) {
                    throw new Error(addResponse.error);
                }

                const linkResponse: CmdResponse = await commands.executeCommand('depi.addLinkToBlackboard',
                    { source: resource, target: addGitResponce.result });

                if (linkResponse.error) {
                    throw new Error(linkResponse.error);
                }
            }
        } else {
            const addResponse: CmdResponse = await commands.executeCommand('depi.addResourcesToBlackboard', [resource]);
            if (addResponse.error) {
                throw new Error(addResponse.error);
            }
        }

        await commands.executeCommand('depi.showBlackboard');
    }

    showDependencyGraph = async ({ nodeId, uuid }: { nodeId: string, uuid: string }) => {
        if (depiExtensionUnavailable || (!depiExtensionActivated && !await tryActivateDepi())) {
            throw new Error('Depi unreachable!');
        }

        const resource = await this._resolveDepiResource({ nodeId, uuid });
        commands.executeCommand('depi.showDependencyGraph', resource);
    };

    revealEvidence = async (resource: Resource) => {
        if (depiExtensionUnavailable || (!depiExtensionActivated && !await tryActivateDepi())) {
            throw new Error('Depi unreachable!');
        }

        await commands.executeCommand('depi.revealResource', resource);
    };

    unlinkEvidence = async ({ nodeId, uuid }: { nodeId: string, uuid: string }) => {
        if (depiExtensionUnavailable || (!depiExtensionActivated && !await tryActivateDepi())) {
            throw new Error('Depi unreachable!');
        }

        const resource = await this._resolveDepiResource({ nodeId, uuid });
        // TODO: Use getDependencyGraph
        const depGraph = await this._getDependencyGraph(resource);

        const linksToRemove = depGraph.filter((link) =>
            link.target && link.source &&
            link.source.toolId === resource.toolId &&
            link.source.resourceGroupUrl === resource.resourceGroupUrl &&
            link.source.url === resource.url);


        const deleteResponse: CmdResponse
            = await commands.executeCommand('depi.deleteEntriesFromDepi', { links: linksToRemove, resources: [] });

        if (deleteResponse.error) {
            throw new Error(deleteResponse.error);
        }
    };
}
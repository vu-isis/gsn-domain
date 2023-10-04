export interface ResourceGroup {
    url: string;
    toolId: string;
    name: string;
    pathDivider: string;
    version: string;
    isActiveInEditor: boolean;
}

export interface ResourceRef {
    toolId: string;
    resourceGroupUrl: string;
    url: string;
}

export interface Resource extends ResourceRef {
    resourceGroupName: string;
    resourceGroupVersion: string;
    name: string;
    id: string;
    deleted: boolean;
}

export interface ResourcePattern {
    toolId: string;
    resourceGroupName: string;
    resourceGroupUrl: string;
    urlPattern: string;
}

export interface ResourceLinkRef {
    source: ResourceRef;
    target: ResourceRef;
}

export interface ResourceLink {
    source: Resource;
    target: Resource;
    deleted: boolean;
    dirty: boolean;
    lastCleanVersion: string;
    inferredDirtiness: { resource: Resource; lastCleanVersion: string }[];
}

export interface LinkPattern {
    sourcePattern: ResourcePattern;
    targetPattern: ResourcePattern;
}

export interface CmdResponse {
    result: any | null;
    error: string | null;
}

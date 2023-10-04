const CONSTANTS = {
    MAX_NUMBER_OF_UNDO: 50,
    FILE_EXTENSION: '.gsn',
    STATE_DIRECTORY: '.gsn-editor',
    LABELS_FILENAME: 'labels.json',
    VIEWS_FILENAME: 'views.json',
    DEPI: {
        TOOL_ID: 'git-gsn',
        PATH_DIVIDER: '/',
        GIT_URL_END_CHAR: '#',
    },
    LSP: {
        GET_MODEL_JSON_COMMAND: 'gsn.GET_MODEL_JSON',
        GENERATE_MODEL_JSON_COMMAND: 'gsn.GENERATE_MODEL_JSON',
        MODEL_UPDATE_COMMAND: 'gsn.MODEL_UPDATE',
        REVEAL_ORIGIN_COMMAND: 'gsn.REVEAL_ORIGIN',
        ASSIGN_UUIDS_COMMAND: 'gsn.ASSIGN_UUIDS',
    },
    SOLUTION_DEPI_STATES: {
        DEPI_UNAVAILABLE: 'DepiUnavailable',
        NO_LINKED_RESOURCE: 'NoLinkedResource',
        RESOURCE_UP_TO_DATE: 'ResourceUpToDate',
        RESOURCE_DIRTY: 'ResourceDirty',
    },
    EVENTS: {
        TYPES: {
            STATE_UPDATE: 'STATE_UPDATE',
            DEPI_CMD: 'DEPI_CMD',
            REVEAL_ORIGIN: 'REVEAL_ORIGIN',
            REQUEST_MODEL: 'REQUEST_MODEL',
            REQUEST_VIEWS: 'REQUEST_VIEWS',
            REQUEST_LABELS: 'REQUEST_LABELS',
            ERROR_MESSAGE: 'ERROR_MESSAGE',
            UNDO: 'UNDO',
            REDO: 'REDO',
            UNDO_REDO_AVAILABLE: 'UNDO_REDO_AVAILABLE',
        },
        STATE_TYPES: {
            VIEWS: 'views',
            LABELS: 'labels',
            MODEL: 'model',
            // Updates the attribute
            onAttributeChange: {
                cmd: 'onAttributeChange',
                nodeId: '<string>',
                attr: '<string>',
                newValue: '<string>|<bool>|<string[]>',
            },
            // Creates a new node inlined at the node at nodeId
            onNewChildNode: {
                cmd: 'onNewChildNode',
                nodeId: '<string>',
                relationType: 'inContextOf|solvedBy',
                childType: '<string>',
                childName: '<string>',
            },
            // Adds the existing node at childId as a ref at nodeId
            onNewChildRef: {
                cmd: 'onNewChildRef',
                nodeId: '<string>',
                relationType: 'inContextOf|solvedBy',
                childId: '<string>',
            },
            // Deletes the node completely (node is a leaf node)
            onDeleteNode: {
                cmd: 'onDeleteNode',
                nodeId: '<string>',
                nodeType: '<string>',
            },
            // Deletes the reference to child at the parent
            onRemoveChildRef: {
                cmd: 'onRemoveChildRef',
                nodeId: '<string>',
                relationType: 'inContextOf|solvedBy',
                childId: '<string>',
            },
        },
        DEPI_CMD_TYPES: {
            GET_EVIDENCE_INFO: 'getEvidenceInfo',
            UNLINK_EVIDENCE: 'unlinkEvidence',
            LINK_EVIDENCE: 'linkEvidence',
            SHOW_DEPENDENCY_GRAPH: 'showDependencyGraph',
            REVEAL_EVIDENCE: 'revealEvidence'
        }
    },
};

export default CONSTANTS;
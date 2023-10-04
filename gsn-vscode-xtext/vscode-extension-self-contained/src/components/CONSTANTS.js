export default {
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
            LABELS: 'labels',
            VIEWS: 'views',
            MODEL: 'model',
        },
        DEPI_CMD_TYPES: {
            GET_EVIDENCE_INFO: 'getEvidenceInfo',
            UNLINK_EVIDENCE: 'unlinkEvidence',
            LINK_EVIDENCE: 'linkEvidence',
            SHOW_DEPENDENCY_GRAPH: 'showDependencyGraph',
            REVEAL_EVIDENCE: 'revealEvidence'
        }
    }
};

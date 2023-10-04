const GSN_CONSTANTS = {
    TYPES: {
        GOAL: 'Goal',
        STRATEGY: 'Strategy',
        SOLUTION: 'Solution',
        ASSUMPTION: 'Assumption',
        CONTEXT: 'Context',
        JUSTIFICATION: 'Justification',
    },
    GSN_NODES: ['Goal', 'Strategy', 'Solution', 'Assumption', 'Context', 'Justification'],
    RELATION_TYPES: { IN_CONTEXT_OF: 'inContextOf', SOLVED_BY: 'solvedBy' },
    RELATION_NAMES: ['inContextOf', 'solvedBy'],
    CONTEXT_NODES: ['Assumption', 'Context', 'Justification'],
    SOLVED_BY_OWNERS: ['Goal', 'Strategy'],
    SOLVED_BY_TARGETS: {
        Goal: ['Goal', 'Strategy', 'Solution'],
        Strategy: ['Goal'],
        Choice: ['Goal', 'Strategy'],
    },
    IN_CONTEXT_OF_OWNERS: ['Goal', 'Strategy'],
    IN_CONTEXT_OF_TARGETS: {
        Goal: ['Assumption', 'Context', 'Justification'],
        Strategy: ['Assumption', 'Context', 'Justification'],
    },
    SOLUTION_STATUS_OPTIONS: {
        NOT_REVIEWED: 'NotReviewed',
        APPROVED: 'Approved',
        DISAPPROVED: 'Disapproved',
    },
    SOLUTION_DEPI_STATES: {
        LOADING: 'Loading ...',
        DEPI_UNAVAILABLE: 'DepiUnavailable',
        NO_LINKED_RESOURCE: 'NoLinkedResource',
        RESOURCE_UP_TO_DATE: 'ResourceUpToDate',
        RESOURCE_DIRTY: 'ResourceDirty',
    },
    NAME_REGEX: /^[a-zA-Z_][0-9a-zA-Z_]*$/,
    NAME_REGEX_HINT:
        "Must start with a letter ('a'..'z'|'A'..'Z') or underscore '_' followed by any number of letters, underscores and numbers ('0'..'9').",
    LABEL_REGEX: /^[a-zA-Z_][0-9a-zA-Z_]*$/,
    LABEL_REGEX_HINT:
        "Must start with a letter ('a'..'z'|'A'..'Z') or underscore '_' followed by any number of letters, underscores and numbers ('0'..'9').",
    LOGICAL_SYMBOLS: {
        AND: '&&',
        OR: '||',
        NOT: '!',
        OPEN: '(',
        CLOSE: ')',
        UNIVERSE: '*',
    },
    IN_DEV_PREFIX: 'In-Development--',
};

GSN_CONSTANTS.VALID_TYPES = Object.keys(GSN_CONSTANTS.TYPES).map((key) => GSN_CONSTANTS.TYPES[key]);

export default GSN_CONSTANTS;

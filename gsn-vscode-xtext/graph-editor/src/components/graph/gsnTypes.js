import PropTypes from 'prop-types';

export const NodeType = PropTypes.shape({
    name: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    uuid: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    summary: PropTypes.string,
    info: PropTypes.string,
    status: PropTypes.string,
    solvedBy: PropTypes.arrayOf(PropTypes.string),
    inContextOf: PropTypes.arrayOf(PropTypes.string),
    labels: PropTypes.arrayOf(PropTypes.string),
});

export const LabelType = PropTypes.shape({
    name: PropTypes.string.isRequired,
    isGroup: PropTypes.bool,
    description: PropTypes.string,
    members: PropTypes.arrayOf(PropTypes.string),
    parent: PropTypes.string,
});

export const ViewType = PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string,
    timestamp: PropTypes.number,
    expression: PropTypes.string.isRequired,
    includeSubtrees: PropTypes.bool,
    includeParents: PropTypes.bool,
    expandAll: PropTypes.bool,
    highlightMatches: PropTypes.bool,
});

export const ActiveViewType = PropTypes.shape({
    expression: PropTypes.string.isRequired,
    includeSubtrees: PropTypes.bool,
    includeParents: PropTypes.bool,
    expandAll: PropTypes.bool,
    highlightMatches: PropTypes.bool,
});

export const LayoutOptsType = PropTypes.shape({
    headerHeight: PropTypes.number,
    leftMenuPanel: PropTypes.bool,
    sideMenuWidth: PropTypes.number,
    topMenuHeight: PropTypes.number,
    defaultSideMenuItemWidth: PropTypes.number,
    defaultTopMenuItemHeight: PropTypes.number,
});

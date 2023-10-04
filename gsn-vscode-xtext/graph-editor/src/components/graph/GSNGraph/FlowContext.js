import { createContext } from 'react';

const FlowContext = createContext({
    selectedNodes: new Set(),
    searchString: null,
    expanded: {},
    themeMode: 'light',
    nonReactive: false,
    highlightedNodes: null,
    showLabels: false,
    showReferences: false,
});

export default FlowContext;

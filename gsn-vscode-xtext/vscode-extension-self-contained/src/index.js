import React from 'react';
import ReactDOM from 'react-dom/client';
import GSNVSCodeEditor from './components/GSNVSCodeEditor';

const rootEl = document.getElementById('root');
const { svgDir, userPreferences, darkMode, nodeId } = rootEl.dataset;

const root = ReactDOM.createRoot(rootEl);


// color: #212B36;

root.render(
    <GSNVSCodeEditor
        svgDir={svgDir}
        userPreferences={JSON.parse(userPreferences)}
        darkMode={darkMode === 'true'}
        initialNodeId={nodeId}
    />
);

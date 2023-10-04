/* globals acquireVsCodeApi */
import PropTypes from 'prop-types';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
// components
import GSNEditor from './graph/GSNEditor';
import ConfirmChangeDialog from './graph/ChangeConfirmation/ConfirmChangeDialog';
import ErrorPage from './ErrorPage';
import UndoRedoButtons from './UndoRedoButtons';
import { lightTheme, darkTheme } from './graph/theme';
// util
import modelUtils from './graph/modelUtils';
import CONSTANTS from './CONSTANTS';
import getDeleteImplications, { getParentId } from './graph/ChangeConfirmation/getDeleteImplications';
import { getNewLabelsAfterRenaming, getNewLabelsAfterDeletion, getRenameLabelImplications, getDeleteLabelImplications } from './graph/TopMenu/labelUtils';

// --------------------------------------------------------------------------------------------
const vscode = acquireVsCodeApi();

GSNVSCodeEditor.propTypes = {
    svgDir: PropTypes.string,
    darkMode: PropTypes.bool, // Dark-theme dependent on on editor setting
    userPreferences: PropTypes.shape({
        enableDepi: PropTypes.bool,
        enforceUniqueNames: PropTypes.bool,
        useShortGsnNames: PropTypes.bool,
    }),
    initialNodeId: PropTypes.string,
};

const depiResponses = {};

const depiMethods = {
    getEvidenceInfo: ({ nodeId, uuid }) => new Promise((resolve, reject) => {
        console.log('getEvidenceInfo', uuid, '@', nodeId);
        const commandId = crypto.randomUUID();
        depiResponses[commandId] = { resolve, reject };
        vscode.postMessage({
            type: CONSTANTS.EVENTS.TYPES.DEPI_CMD,
            key: CONSTANTS.EVENTS.DEPI_CMD_TYPES.GET_EVIDENCE_INFO,
            commandId,
            value: { nodeId, uuid },
        });
    }),
    linkEvidence: ({ nodeId, uuid }) => new Promise((resolve, reject) => {
        console.log('linkEvidence', uuid, '@', nodeId);
        const commandId = crypto.randomUUID();
        depiResponses[commandId] = { resolve, reject };
        vscode.postMessage({
            type: CONSTANTS.EVENTS.TYPES.DEPI_CMD,
            key: CONSTANTS.EVENTS.DEPI_CMD_TYPES.LINK_EVIDENCE,
            commandId,
            value: { nodeId, uuid },
        });
    }),
    unlinkEvidence: ({ nodeId, uuid }) => new Promise((resolve, reject) => {
        console.log('unlinkEvidence', uuid, '@', nodeId);
        const commandId = crypto.randomUUID();
        depiResponses[commandId] = { resolve, reject };
        vscode.postMessage({
            type: CONSTANTS.EVENTS.TYPES.DEPI_CMD,
            key: CONSTANTS.EVENTS.DEPI_CMD_TYPES.UNLINK_EVIDENCE,
            commandId,
            value: { nodeId, uuid },
        });
    }),
    showDependencyGraph: ({ nodeId, uuid }) => new Promise((resolve, reject) => {
        console.log('showDependencyGraph', uuid, '@', nodeId);
        const commandId = crypto.randomUUID();
        depiResponses[commandId] = { resolve, reject };
        vscode.postMessage({
            type: CONSTANTS.EVENTS.TYPES.DEPI_CMD,
            key: CONSTANTS.EVENTS.DEPI_CMD_TYPES.SHOW_DEPENDENCY_GRAPH,
            commandId,
            value: { nodeId, uuid },
        });
    }),
    revealEvidence: (resource) => new Promise((resolve, reject) => {
        const commandId = crypto.randomUUID();
        depiResponses[commandId] = { resolve, reject };
        vscode.postMessage({
            type: CONSTANTS.EVENTS.TYPES.DEPI_CMD,
            key: CONSTANTS.EVENTS.DEPI_CMD_TYPES.REVEAL_EVIDENCE,
            commandId,
            value: resource,
        });
    }),
};

let awaitingSelectedNode = null;

export default function GSNVSCodeEditor({ svgDir, userPreferences, darkMode, initialNodeId }) {
    const [model, setModel] = useState([]);
    const [views, setViews] = useState([]);
    const [labels, setLabels] = useState([]);
    const [selectedNode, setSelectedNode] = useState({ nodeId: null, treeId: null });
    const [size, setSize] = useState({ height: 0, width: 0 });
    const [pendingChanges, setPendingChanges] = useState([]);
    const [error, setError] = useState('');
    const [undoRedo, setUndoRedo] = useState({ undo: 0, redo: 0 });

    useEffect(() => {
        function handleResize() {
            const { innerWidth, innerHeight } = window;
            setSize({ width: innerWidth, height: innerHeight });
        }

        function handleMessage({ data }) {
            if (data?.type === CONSTANTS.EVENTS.TYPES.STATE_UPDATE) {
                switch (data.key) {
                    case CONSTANTS.EVENTS.STATE_TYPES.MODEL:
                        setModel(data.value);
                        setError('');
                        break;
                    case CONSTANTS.EVENTS.STATE_TYPES.VIEWS:
                        setViews(data.value);
                        break;
                    case CONSTANTS.EVENTS.STATE_TYPES.LABELS:
                        setLabels(data.value);
                        break;
                    default:
                        setError(`Does not recognize state update key ${data.key}`);
                        break;
                }
            } else if (data?.type === CONSTANTS.EVENTS.TYPES.DEPI_CMD) {
                if (data.error) {
                    depiResponses[data.commandId].reject(new Error(data.error));
                } else {
                    depiResponses[data.commandId].resolve(data.value);
                }

                delete depiResponses[data.commandId];
            } else if (data?.type === CONSTANTS.EVENTS.TYPES.UNDO_REDO_AVAILABLE) {
                setUndoRedo(data.value);
            } else if (data?.type === CONSTANTS.EVENTS.TYPES.ERROR_MESSAGE) {
                setError(data.value);
            } else {
                setError(`Unknown message from vscode:${JSON.stringify(data)}`);
            }
        }

        window.addEventListener('resize', handleResize);
        window.addEventListener('message', handleMessage);

        // Invoke once at start-up.
        handleResize();

        // Request initial model.
        vscode.postMessage({
            type: CONSTANTS.EVENTS.TYPES.REQUEST_LABELS,
            value: null,
        });

        vscode.postMessage({
            type: CONSTANTS.EVENTS.TYPES.REQUEST_MODEL,
            value: null,
        });

        vscode.postMessage({
            type: CONSTANTS.EVENTS.TYPES.REQUEST_VIEWS,
            value: null,
        });

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    useEffect(() => {
        if (initialNodeId) {
            awaitingSelectedNode = {nodeId: initialNodeId, treeId: null};
        }

    }, [initialNodeId]);

    useEffect(() => {
        if (model.length === 0) {
            return;
        }

        if (awaitingSelectedNode) {
            setSelectedNode(awaitingSelectedNode);
            awaitingSelectedNode = null;
        } else if (selectedNode.nodeId && !model.find(node => node.id === selectedNode.nodeId)) {
            // There is no longer a node with that id.
            setSelectedNode({nodeId: null, treeId: null});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [model]);

    // Event handlers from editing model
    const onAttributeChange = useCallback((nodeId, attr, newValue) => {
        function replaceNameInPath(path, newName) {
            if (!path) {
                return null;
            }

            const parts = path.split('/');
            parts.pop();
            return `${parts.join('/')}/${newName}`;
        }

        if (attr === 'name' && selectedNode.nodeId === nodeId) {

            awaitingSelectedNode = {
                nodeId: replaceNameInPath(nodeId, newValue),
                treeId: replaceNameInPath(selectedNode.treeId, newValue),
            };

            console.log('set during name change', awaitingSelectedNode);
        }

        vscode.postMessage({
            type: CONSTANTS.EVENTS.TYPES.STATE_UPDATE,
            key: CONSTANTS.EVENTS.STATE_TYPES.MODEL,
            value: [{ cmd: 'onAttributeChange', nodeId, attr, newValue }],
        });
    }, [selectedNode]);

    const onNewChildNode = useCallback(
        (nodeId, relationType, childType, childId = null) => {
            if (childId) {
                vscode.postMessage({
                    type: CONSTANTS.EVENTS.TYPES.STATE_UPDATE,
                    key: CONSTANTS.EVENTS.STATE_TYPES.MODEL,
                    value: [{ cmd: 'onNewChildRef', nodeId, relationType, childId }],
                });
            } else {
                const prefix = userPreferences.useShortGsnNames ? modelUtils.getShortTypeName(childType) : childType;
                const childName = modelUtils.generateUniqueChildName(prefix, model.map((n) => n.name));
                vscode.postMessage({
                    type: CONSTANTS.EVENTS.TYPES.STATE_UPDATE,
                    key: CONSTANTS.EVENTS.STATE_TYPES.MODEL,
                    value: [{ cmd: 'onNewChildNode', nodeId, relationType, childType, childName }],
                });
            }
        },
        [model, userPreferences.useShortGsnNames]
    );

    const onDeleteConnection = useCallback((nodeId, relationType, childId) => {
        if (getParentId(childId) === nodeId) {
            setPendingChanges(getDeleteImplications(childId, model));
            return;
        }

        vscode.postMessage({
            type: CONSTANTS.EVENTS.TYPES.STATE_UPDATE,
            key: CONSTANTS.EVENTS.STATE_TYPES.MODEL,
            value: [{ cmd: 'onRemoveChildRef', nodeId, relationType, childId }],
        });
    }, [model]);

    const onDeleteNode = useCallback(
        (nodeId /* , nodeType */) => {
            const changes = getDeleteImplications(nodeId, model);
            setPendingChanges(changes);
        },
        [model]
    );

    const onAddNewView = useCallback(
        (newView) => {
            const newViews = [newView, ...views];
            setViews(newViews);
            vscode.postMessage({
                type: CONSTANTS.EVENTS.TYPES.STATE_UPDATE,
                key: CONSTANTS.EVENTS.STATE_TYPES.VIEWS,
                value: newViews,
            });
        },
        [views]
    );

    const onDeleteView = useCallback(
        (viewId) => {
            const newViews = views.filter((view) => view.id !== viewId);
            setViews(newViews);
            vscode.postMessage({
                type: CONSTANTS.EVENTS.TYPES.STATE_UPDATE,
                key: CONSTANTS.EVENTS.STATE_TYPES.VIEWS,
                value: newViews,
            });
        },
        [views]
    );

    const onRenameView = useCallback(
        (viewId, name) => {
            const newViews = views.map((view) => {
                if (view.id !== viewId) {
                    return view;
                }

                const updatedView = { ...view };
                updatedView.name = name;

                return updatedView;
            });

            setViews(newViews);
            vscode.postMessage({
                type: CONSTANTS.EVENTS.TYPES.STATE_UPDATE,
                key: CONSTANTS.EVENTS.STATE_TYPES.VIEWS,
                value: newViews,
            });
        },
        [views]
    );

    const onAddNewLabel = useCallback(
        (newLabel) => {
            const newLabels = [newLabel, ...labels].sort((a, b) => a.name.localeCompare(b.name));
            setLabels(newLabels);
            vscode.postMessage({
                type: CONSTANTS.EVENTS.TYPES.STATE_UPDATE,
                key: CONSTANTS.EVENTS.STATE_TYPES.LABELS,
                value: newLabels,
            });
        },
        [labels]
    );

    const onDeleteLabel = useCallback(
        (name) => {
            const deletedLabel = labels.find((l) => l.name === name);
            if (!deletedLabel.isGroup) {
                const nodeUpdates = getDeleteLabelImplications(model, name);
                if (nodeUpdates.length > 0) {
                    vscode.postMessage({
                        type: CONSTANTS.EVENTS.TYPES.STATE_UPDATE,
                        key: CONSTANTS.EVENTS.STATE_TYPES.MODEL,
                        value: nodeUpdates
                            .map(({ nodeId, newValue }) => ({ cmd: 'onAttributeChange', nodeId, attr: 'labels', newValue })),
                    });
                }
            }

            const newLabels = getNewLabelsAfterDeletion(labels, name);
            setLabels(newLabels);
            vscode.postMessage({
                type: CONSTANTS.EVENTS.TYPES.STATE_UPDATE,
                key: CONSTANTS.EVENTS.STATE_TYPES.LABELS,
                value: newLabels,
            });
        },
        [labels, model]
    );

    const onUpdateLabel = useCallback(
        (oldName, newLabel) => {
            let newLabels;

            if (newLabel.name !== oldName) {
                if (!newLabel.isGroup) {
                    const nodeUpdates = getRenameLabelImplications(model, newLabel.name, oldName);
                    if (nodeUpdates.length > 0) {
                        vscode.postMessage({
                            type: CONSTANTS.EVENTS.TYPES.STATE_UPDATE,
                            key: CONSTANTS.EVENTS.STATE_TYPES.MODEL,
                            value: nodeUpdates
                                .map(({ nodeId, newValue }) => ({ cmd: 'onAttributeChange', nodeId, attr: 'labels', newValue })),
                        });
                    }
                }

                newLabels = getNewLabelsAfterRenaming(labels, newLabel, oldName)
                    .sort((a, b) => a.name.localeCompare(b.name));
            } else {
                newLabels = labels.map((label) => {
                    if (label.name !== oldName) {
                        return label;
                    }

                    return newLabel;
                });
            }

            setLabels(newLabels);
            vscode.postMessage({
                type: CONSTANTS.EVENTS.TYPES.STATE_UPDATE,
                key: CONSTANTS.EVENTS.STATE_TYPES.LABELS,
                value: newLabels,
            });
        },
        [labels, model]
    );

    const onRevealOrigin = useCallback((nodeId) => {
        vscode.postMessage({
            type: CONSTANTS.EVENTS.TYPES.REVEAL_ORIGIN,
            value: { nodeId },
        });
    }, []);

    const onUndo = useCallback(() => {
        setUndoRedo({ undo: 0, redo: 0 });
        vscode.postMessage({
            type: CONSTANTS.EVENTS.TYPES.UNDO,
        });
    }, []);

    const onRedo = useCallback(() => {
        setUndoRedo({ undo: 0, redo: 0 });
        vscode.postMessage({
            type: CONSTANTS.EVENTS.TYPES.REDO,
        });
    }, []);

    const onOk = () => {
        vscode.postMessage({
            type: CONSTANTS.EVENTS.TYPES.STATE_UPDATE,
            key: CONSTANTS.EVENTS.STATE_TYPES.MODEL,
            value: pendingChanges,
        });
        setSelectedNode({ nodeId: null, treeId: null });
        setPendingChanges([]);
    };

    const onCancel = () => {
        setPendingChanges([]);
    }

    const undoRedoBtns = useMemo(() => UndoRedoButtons({ undoRedo, onUndo, onRedo }), [undoRedo, onUndo, onRedo]);

    if (error) {
        return <ErrorPage message={error} refreshModel={() => {
            vscode.postMessage({
                type: CONSTANTS.EVENTS.TYPES.REQUEST_MODEL,
                value: null,
            });
        }} />;
    }

    return (
        <div
            style={{
                position: 'relative',
                height: '100vh',
                width: '100vw',
                overflow: 'hidden',
            }}
        >
            <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
                {pendingChanges.length > 0 ? <ConfirmChangeDialog
                    model={model}
                    width={size.width * 0.8}
                    height={size.height * 0.8}
                    changes={pendingChanges}
                    onOk={onOk}
                    onCancel={onCancel}
                /> : null}
                <GSNEditor
                    userPreferences={userPreferences}
                    svgDir={svgDir}
                    model={model}
                    views={views}
                    labels={labels}
                    width={size.width}
                    height={size.height}
                    isReadOnly={false}
                    selectedNode={selectedNode}
                    extraSideMenuBottomActionEls={undoRedoBtns}
                    setSelectedNode={setSelectedNode}
                    onAttributeChange={onAttributeChange}
                    onNewChildNode={onNewChildNode}
                    onDeleteConnection={onDeleteConnection}
                    onDeleteNode={onDeleteNode}
                    onAddNewView={onAddNewView}
                    onDeleteView={onDeleteView}
                    onRenameView={onRenameView}
                    onRevealOrigin={onRevealOrigin}
                    onAddNewLabel={onAddNewLabel}
                    onDeleteLabel={onDeleteLabel}
                    onUpdateLabel={onUpdateLabel}
                    depiMethods={userPreferences.enableDepi ? depiMethods : null}
                />
            </ThemeProvider>
        </div>
    );
}

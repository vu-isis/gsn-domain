import PropTypes from 'prop-types';
import { useState, useCallback } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
// components
import GSNGraph from '../GSNGraph';
// utils
// import GSN_CONSTANTS from '../GSN_CONSTANTS';
import { CMDS, isParent } from './getDeleteImplications';
import modelUtils from '../modelUtils';

ConfirmChangeDialog.propTypes = {
    model: PropTypes.array,
    changes: PropTypes.arrayOf(
        PropTypes.shape({
            cmd: PropTypes.string,
            nodeId: PropTypes.string,
        })
    ),
    onOk: PropTypes.func,
    onCancel: PropTypes.func,
};

function computeSize(elem) {
    const computedStyle = getComputedStyle(elem);
    const verticalPadding = parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);
    const horizontalPadding = parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight);

    const height = elem.clientHeight - verticalPadding;
    const width = elem.clientWidth - horizontalPadding;

    return { height, width };
}

export default function ConfirmChangeDialog({ model, changes, onOk, onCancel }) {
    const nodes = {};
    model.forEach((n) => {
        nodes[n.id] = n;
    });

    const [size, setSize] = useState({ width: 0, height: 0 });

    const atRef = useCallback((elem) => {
        if (elem !== null) {
            setSize(computeSize(elem));
        }
    }, []);

    const removeElements = new Set();

    changes.forEach((change) => {
        const node = nodes[change.nodeId];
        if (change.cmd === CMDS.ON_DELETE_NODE) {
            removeElements.add(change.nodeId);
            modelUtils.iterateOverRelations(node, ({ relationType, childId }) => {
                removeElements.add(modelUtils.getModelIdForConnNode(node.id, relationType, childId));
            });

            const parent = model.find((n) => isParent(n.id, node.id));
            if (parent) {
                modelUtils.iterateOverRelations(parent, ({ relationType, childId }) => {
                    if (childId === node.id) {
                        removeElements.add(modelUtils.getModelIdForConnNode(parent.id, relationType, node.id));
                    }
                });
            }
        } else if (change.cmd === CMDS.ON_REMOVE_CHILD_REF) {
            removeElements.add(modelUtils.getModelIdForConnNode(node.id, change.relationType, change.childId));
        }
    });

    return (
        <Dialog
            open
            disableEscapeKeyDown
            PaperProps={{
                sx: {
                    maxHeight: '90vh',
                    minHeight: '90vh',
                    maxWidth: '90vw',
                    minWidth: '90vw',
                },
            }}
            onClose={onCancel}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">
                {'Confirm Changes - Highlighted nodes and edges will be removed from model'}
            </DialogTitle>
            <DialogContent ref={atRef}>
                <GSNGraph
                    width={size.width}
                    height={size.height}
                    nonReactive
                    showReferencesAtStart
                    data={model}
                    selectedNode={[...removeElements]}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel}>Cancel</Button>
                <Button onClick={onOk} autoFocus>
                    OK
                </Button>
            </DialogActions>
        </Dialog>
    );
}

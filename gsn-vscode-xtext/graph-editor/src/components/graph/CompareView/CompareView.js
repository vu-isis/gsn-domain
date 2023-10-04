/* eslint-disable no-restricted-syntax */
import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { compare } from 'fast-json-patch';
// @mui
import { Divider, List, Container, Typography, Paper, Button } from '@mui/material';
import {
    AddCircleOutline as AddCircleOutlineIcon,
    RemoveCircleOutline as RemoveCircleOutlineIcon,
    Contrast as ContrastIcon,
} from '@mui/icons-material';
// components
import CompareNodeItem from './CompareNodeItem';
// utils
import { getParentId } from '../ChangeConfirmation/getDeleteImplications';
import GSN_CONSTANTS from '../GSN_CONSTANTS';
import { COLORS } from '../theme';

const { RELATION_NAMES } = GSN_CONSTANTS;

CompareView.propTypes = {
    oldModel: PropTypes.array.isRequired,
    newModel: PropTypes.array.isRequired,
};

// Helper functions..
function shallowCopyNodeAndResolveRelations(node, pathMap) {
    const result = { ...node };
    Object.keys(result).forEach((key) => {
        const value = result[key];
        if (value === '') {
            delete result[key];
        } else if (value instanceof Array && value.length === 0) {
            delete result[key];
        }
    });

    resolveRelationsToUuids(result, pathMap);

    return result;
}

// Swap relations to be uuids instead of path-ids.
function resolveRelationsToUuids(diffNode, pathMap) {
    RELATION_NAMES.forEach((relationType) => {
        diffNode.children = {};
        if (diffNode[relationType]?.length > 0) {
            diffNode[relationType].forEach((path) => {
                diffNode.children[pathMap.get(path).uuid] = true;
            });
        }

        // Remove the array.
        delete diffNode[relationType];
    });
}

export default function CompareView({ oldModel, newModel }) {
    const [expandAll, setExpandAll] = useState(false);
    const { changes, oldUuidToNode, newUuidToNode } = useMemo(() => {
        const changes = { modified: [], added: [], removed: [] };
        const oldPathToNode = new Map();
        const oldUuidToNode = new Map();
        const newPathToNode = new Map();
        const newUuidToNode = new Map();

        // Build up helper maps.
        oldModel.forEach((node) => {
            oldUuidToNode.set(node.uuid, node);
            oldPathToNode.set(node.id, node);
        });

        newModel.forEach((node) => {
            newUuidToNode.set(node.uuid, node);
            newPathToNode.set(node.id, node);
        });

        const addedPaths = new Set();
        const removedPaths = new Set();

        newUuidToNode.forEach((newNode, nuuid) => {
            const nodeDiff = {
                oldNode: null,
                newNode: shallowCopyNodeAndResolveRelations(newNode, newPathToNode),
                indentLevel: 0,
            };

            if (oldUuidToNode.has(nuuid)) {
                nodeDiff.oldNode = shallowCopyNodeAndResolveRelations(oldUuidToNode.get(nuuid), oldPathToNode);
                // Remove the id/paths - the name change is only reported at the renamed node.
                const oldId = nodeDiff.oldNode.id;
                const newId = nodeDiff.newNode.id;
                delete nodeDiff.oldNode.id;
                delete nodeDiff.newNode.id;

                nodeDiff.diff = compare(nodeDiff.oldNode, nodeDiff.newNode);
                if (nodeDiff.diff.length === 0) {
                    return;
                }

                nodeDiff.oldNode.id = oldId;
                nodeDiff.newNode.id = newId;

                changes.modified.push(nodeDiff);
            } else {
                addedPaths.add(nodeDiff.newNode.id);
                changes.added.push(nodeDiff);
            }
        });

        oldUuidToNode.forEach((oldNode, ouuid) => {
            if (!newUuidToNode.has(ouuid)) {
                const nodeDiff = {
                    oldNode: shallowCopyNodeAndResolveRelations(oldNode, oldPathToNode),
                    newNode: null,
                    indentLevel: 0,
                };
                removedPaths.add(nodeDiff.oldNode.id);
                changes.removed.push(nodeDiff);
            }
        });

        changes.added.sort((a, b) => a.newNode.id.localeCompare(b.newNode.id));
        changes.modified.sort((a, b) => a.oldNode.id.localeCompare(b.oldNode.id));
        changes.removed.sort((a, b) => a.oldNode.id.localeCompare(b.oldNode.id));

        [
            { collection: changes.added, paths: addedPaths },
            { collection: changes.removed, paths: removedPaths },
        ].forEach(({ collection, paths }) => {
            collection.forEach((nodeDiff) => {
                const { id } = nodeDiff.oldNode || nodeDiff.newNode;
                let parentId = getParentId(id);
                while (parentId && paths.has(parentId)) {
                    nodeDiff.indentLevel += 1;
                    parentId = getParentId(parentId);
                }
            });
        });

        return { changes, oldUuidToNode, newUuidToNode };
    }, [oldModel, newModel]);

    return (
        <Container maxWidth="lg">
            <div style={{ position: 'relative' }}>
                <Paper elevation={3} style={{ padding: '16px', marginTop: '50px' }}>
                    <Typography variant="h4" gutterBottom>
                        Compare
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        Changes since oldest saved commit (LHS) and current model (RHS).
                    </Typography>
                    <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => {
                                setExpandAll(!expandAll);
                            }}
                        >
                            {expandAll ? 'Collapse All' : 'Expand All'}
                        </Button>
                    </div>
                    <List>
                        {changes.added.map((change) => (
                            <CompareNodeItem
                                key={`${expandAll}-${change.newNode.uuid}`}
                                change={change}
                                oldUuidToNode={oldUuidToNode}
                                newUuidToNode={newUuidToNode}
                                initiallyShowDetails={expandAll}
                                headerIcon={<AddCircleOutlineIcon style={{ color: '#a5d6a7' }} />}
                            />
                        ))}
                    </List>
                    <Divider />
                    <List>
                        {changes.removed.map((change) => (
                            <CompareNodeItem
                                key={`${expandAll}-${change.oldNode.uuid}`}
                                change={change}
                                oldUuidToNode={oldUuidToNode}
                                newUuidToNode={newUuidToNode}
                                initiallyShowDetails={expandAll}
                                headerIcon={<RemoveCircleOutlineIcon style={{ color: '#ef9a9a' }} />}
                            />
                        ))}
                    </List>
                    <Divider />
                    <List>
                        {changes.modified.map((change) => (
                            <CompareNodeItem
                                key={`${expandAll}-${change.oldNode.uuid}`}
                                change={change}
                                oldUuidToNode={oldUuidToNode}
                                newUuidToNode={newUuidToNode}
                                initiallyShowDetails={expandAll}
                                headerIcon={<ContrastIcon style={{ color: COLORS.DIFF.MODIFIED }} />}
                            />
                        ))}
                    </List>
                </Paper>
            </div>
        </Container>
    );
}

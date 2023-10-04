import { useCallback, useState } from 'react';
import PropTypes from 'prop-types';

import './compare.css';

// @mui
import { Collapse, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Paper } from '@mui/material';
import { ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
// utils
import { isReference } from '../ChangeConfirmation/getDeleteImplications';
import { COLORS } from '../theme';

CompareNodeItem.propTypes = {
    change: PropTypes.shape({
        oldNode: PropTypes.object,
        newNode: PropTypes.object,
        indentLevel: PropTypes.number.isRequired,
        diff: PropTypes.arrayOf(
            PropTypes.shape({
                op: PropTypes.string.isRequired, // 'add', 'remove', 'replace'
                path: PropTypes.string.isRequired,
                value: PropTypes.any,
            })
        ),
    }),
    oldUuidToNode: PropTypes.object,
    newUuidToNode: PropTypes.object,
    initiallyShowDetails: PropTypes.bool,
    headerIcon: PropTypes.element,
};

function nodeDiffToGsnDiff(oldNode, newNode, oldUuidToNode, newUuidToNode, diff) {
    const lines = [];
    const pathToChange = {};

    const addedChildren = [];
    const removedChildren = {};

    if (diff) {
        diff.forEach((change) => {
            const path = change.path.split('/').pop();
            // Example: {op: 'add', path: '/children/2954bef8-ca54-47b6-b162-c1a4b3ec29ea', value: true}
            if (change.path.startsWith('/children/')) {
                if (change.op === 'remove') {
                    removedChildren[path] = true;
                } else {
                    addedChildren.push(path);
                }
                return;
            }

            pathToChange[path] = change;
        });
    } else if (oldNode) {
        Object.keys(oldNode).forEach((key) => {
            if (key === 'children') {
                Object.keys(oldNode[key]).forEach((childUuid) => {
                    removedChildren[childUuid] = true;
                });
                return;
            }
            pathToChange[key] = { op: 'remove', path: `/${key}` };
        });
    } else if (newNode) {
        Object.keys(newNode).forEach((key) => {
            if (key === 'children') {
                Object.keys(newNode[key]).forEach((childUuid) => {
                    addedChildren.push(childUuid);
                });
                return;
            }
            pathToChange[key] = { op: 'add', path: `/${key}`, value: newNode[key] };
        });
    }

    function addRemovedLine(textStr) {
        lines.push(
            <td className="line-remove">
                <pre className="inline-diff-remove">{textStr}</pre>
            </td>
        );
    }

    function addAddedLine(textStr) {
        lines.push(
            <td className="line-add">
                <pre className="inline-diff-add">{textStr}</pre>
            </td>
        );
    }

    function addEqualLine(textStr) {
        lines.push(
            <td className="line-equal">
                <pre>{textStr}</pre>
            </td>
        );
    }

    const oneLineChildren = true;

    function addChild(parentId, childNode, addLineFn) {
        if (isReference(parentId, childNode.id)) {
            addLineFn(`    ref_${childNode.type.toLowerCase()} ${childNode.id.replace(/\//g, '.')};`);
        } else if (oneLineChildren) {
            addLineFn(`    ${childNode.type.toLowerCase()} ${childNode.name} {  uuid: ${childNode.uuid}; ... }`);
        } else {
            addLineFn(`    ${childNode.type.toLowerCase()} ${childNode.name}`);
            addLineFn('    {');
            addLineFn(`        uuid: ${childNode.uuid};`);
            addLineFn('        ...');
            addLineFn('    }');
        }
    }

    if (pathToChange.type || pathToChange.name) {
        if (oldNode) {
            addRemovedLine(`${oldNode.type.toLowerCase()} ${oldNode.name}`);
        }
        if (newNode) {
            addAddedLine(`${newNode.type.toLowerCase()} ${newNode.name}`);
        }
    } else {
        addEqualLine(`${oldNode.type.toLowerCase()} ${oldNode.name}`);
    }

    addEqualLine('{');

    ['uuid', 'summary', 'info'].forEach((strKey) => {
        if (pathToChange[strKey]) {
            if (oldNode?.[strKey]) {
                addRemovedLine(`    ${strKey}: ${oldNode[strKey]};`);
            }
            if (newNode?.[strKey]) {
                addAddedLine(`    ${strKey}: ${newNode[strKey]};`);
            }
        } else if (oldNode?.[strKey]) {
            addEqualLine(`    ${strKey}: ${oldNode[strKey]};`);
        }
    });

    if (pathToChange.labels) {
        if (oldNode?.labels?.length > 0) {
            addEqualLine(' ');
            addRemovedLine(`    label: ${oldNode.labels.join(',')};`);
        }
        if (newNode?.labels?.length > 0) {
            addEqualLine(' ');
            addAddedLine(`    label: ${newNode.labels.join(',')};`);
        }
    } else if (oldNode?.labels?.length > 0) {
        addEqualLine(' ');
        addEqualLine(`    label: ${oldNode.labels.join(',')};`);
    }

    if (addedChildren.length > 0 || (oldNode && Object.keys(oldNode.children).length > 0)) {
        addEqualLine(' ');
    }

    if (oldNode) {
        Object.keys(oldNode.children).forEach((uuid) => {
            const childNode = oldUuidToNode.get(uuid);
            if (removedChildren[uuid]) {
                addChild(oldNode.id, childNode, addRemovedLine);
            } else {
                addChild(oldNode.id, childNode, addEqualLine);
            }
        });
    }

    if (newNode) {
        // newNode check redundant as addedChildren will be empty if there is no newNode..
        addedChildren.forEach((uuid) => {
            const childNode = newUuidToNode.get(uuid);
            addChild(newNode.id, childNode, addAddedLine);
        });
    }

    addEqualLine('}');

    return (
        <table className="gsn-compare-table-viewer">
            <tbody>
                {lines.map((line, idx) => (
                    <tr key={`${idx}`}>{line}</tr>
                ))}
            </tbody>
        </table>
    );
}

export default function CompareNodeItem({
    change,
    oldUuidToNode,
    newUuidToNode,
    initiallyShowDetails = false,
    headerIcon,
}) {
    const { diff, oldNode, newNode, indentLevel } = change;

    const [showDetails, setShowDetails] = useState(initiallyShowDetails);

    const nodeHeader = newNode || oldNode;

    const onShowHideDetails = useCallback(() => {
        if (showDetails) {
            setShowDetails(false);
            return;
        }

        setShowDetails(true);
    }, [showDetails]);

    const diffView = nodeDiffToGsnDiff(oldNode, newNode, oldUuidToNode, newUuidToNode, diff);

    let backgroundColor = '#d3d3d340';
    let className = '';
    if (!oldNode) {
        backgroundColor = COLORS.DIFF.ADDED;
        className = 'gsn-compare-addition';
    } else if (!newNode) {
        backgroundColor = COLORS.DIFF.REMOVED;
        className = 'gsn-compare-removal';
    }

    return (
        <>
            <ListItemButton sx={{ pl: 4 * indentLevel }} onClick={onShowHideDetails}>
                <ListItemIcon>{headerIcon}</ListItemIcon>
                <ListItemText primary={`${nodeHeader.name}`} secondary={`${nodeHeader.id} [${nodeHeader.uuid}]`} />
                {showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ListItemButton>
            <Collapse in={showDetails} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                    <ListItem sx={{ pl: 4 * indentLevel + 6 }}>
                        <Paper className={className} elevation={0} sx={{ padding: 1, backgroundColor }}>
                            {diffView}
                        </Paper>
                    </ListItem>
                </List>
            </Collapse>
        </>
    );
}

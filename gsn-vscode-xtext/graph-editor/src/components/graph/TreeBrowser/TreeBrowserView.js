import PropTypes from 'prop-types';
import React from 'react';
// @mui
import { Typography } from '@mui/material';
import { TreeView, TreeItem } from '@mui/lab';
import { ExpandMore as ExpandMoreIcon, ChevronRight as ChevronRightIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
// components
import Icons from '../icons';

// -----------------------------------------------------------------------------------------------
TreeBrowserView.propTypes = {
    treeRoots: PropTypes.array.isRequired,
    expanded: PropTypes.arrayOf(PropTypes.string),
    selectedIds: PropTypes.arrayOf(PropTypes.string),
    onNodeClick: PropTypes.func.isRequired,
    onNodeToggleExpand: PropTypes.func.isRequired,
    style: PropTypes.object,
};

export default function TreeBrowserView({ treeRoots, expanded, selectedIds, onNodeClick, onNodeToggleExpand, style }) {
    const theme = useTheme();
    const renderTree = (treeNode) => {
        const hasChildren = Boolean(treeNode.children);

        return (
            <TreeItem
                key={treeNode.id}
                nodeId={treeNode.id}
                label={treeNode.node.name}
                icon={
                    hasChildren
                        ? null
                        : React.createElement(Icons[treeNode.node.type], { style: { height: 10 }, strokeWidth: 20 })
                }
                style={{
                    color: treeNode.hidden ? theme.palette.text.disabled : theme.palette.text.primary,
                }}
                sx={{
                    '& .MuiTreeItem-group': {
                        marginLeft: 1, // Adjust this value to change the indentation
                    },
                }}
            >
                {hasChildren ? treeNode.children.map((childNode) => renderTree(childNode)) : null}
            </TreeItem>
        );
    };

    if (treeRoots.length === 0) {
        return <Typography variant="body1">No nodes ...</Typography>;
    }

    return (
        <TreeView
            defaultCollapseIcon={<ExpandMoreIcon />}
            expanded={expanded}
            defaultExpandIcon={<ChevronRightIcon />}
            selected={selectedIds}
            onNodeSelect={(event, treeNodeId) => {
                const { target } = event;
                if (target?.classList?.contains('MuiTreeItem-label')) {
                    onNodeClick(treeNodeId);
                } else {
                    onNodeToggleExpand(treeNodeId);
                }
            }}
            sx={{ height: 110, flexGrow: 1, overflowX: 'clip' }}
            style={style}
        >
            {treeRoots.map((root) => renderTree(root))}
        </TreeView>
    );
}

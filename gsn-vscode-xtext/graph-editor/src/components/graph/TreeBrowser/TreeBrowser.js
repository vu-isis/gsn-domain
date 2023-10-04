import PropTypes from 'prop-types';
import React, { useCallback, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
// @mui
import { Button, InputAdornment, Grid, Menu, MenuItem, TextField } from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon, Menu as MenuIcon } from '@mui/icons-material';
// components
import TreeBrowserView from './TreeBrowserView';
// utils
import { getGraphElements } from '../GSNGraph/graphUtils';

// -----------------------------------------------------------------------------------------------

const SEARCH_CATEGORIES = {
    name: { id: 'name', displayName: 'Name' },
    labels: { id: 'labels', displayName: 'Labels' },
    info: { id: 'info', displayName: 'Summary/Info' },
};

TreeBrowser.propTypes = {
    data: PropTypes.array.isRequired,
    selectedNode: PropTypes.shape({
        nodeId: PropTypes.string,
        treeId: PropTypes.string,
    }),
    setSelectedNode: PropTypes.func.isRequired,
    width: PropTypes.number.isRequired,
};

export default function TreeBrowser({ data, selectedNode, setSelectedNode, width }) {
    const [searchValue, setSearchValue] = useState('');
    const [searchString] = useDebounce(searchValue, 200);
    const [searchCategory, setSearchCategory] = useState(SEARCH_CATEGORIES.name);
    const [searchActive, setSearchActive] = useState(true);

    const [treeRoots, modelIdToTreeNodes, idToTreeNode] = useMemo(() => {
        const roots = [];
        const idToTreeNode = {};
        const modelIdToTreeNodes = {};
        getGraphElements(
            data,
            (node, nodeId, parentId) => {
                idToTreeNode[nodeId] = {
                    id: nodeId,
                    node,
                };

                if (!modelIdToTreeNodes[node.id]) {
                    modelIdToTreeNodes[node.id] = [];
                }

                modelIdToTreeNodes[node.id].push(idToTreeNode[nodeId]);

                if (parentId) {
                    idToTreeNode[parentId].children = idToTreeNode[parentId].children || [];
                    idToTreeNode[parentId].children.push(idToTreeNode[nodeId]);
                    idToTreeNode[nodeId].parent = idToTreeNode[parentId];
                } else {
                    roots.push(idToTreeNode[nodeId]);
                }
            },
            () => {}
        );

        return [roots, modelIdToTreeNodes, idToTreeNode];
    }, [data]);

    const [expanded, setExpanded] = useState(treeRoots.map((n) => n.id));

    const searchRoots = useMemo(() => {
        const hiddenModelIds = new Set();
        if (!searchString) {
            return null;
        }

        const compareString = searchString.toLowerCase();

        data.forEach((node) => {
            function compare(values) {
                // eslint-disable-next-line no-restricted-syntax
                for (const value of values) {
                    if (value.toLowerCase().includes(compareString)) {
                        return true;
                    }
                }

                return false;
            }

            let match = false;

            switch (searchCategory.id) {
                case SEARCH_CATEGORIES.name.id:
                    match = compare([node.name]);
                    break;
                case SEARCH_CATEGORIES.info.id:
                    match = compare([node.summary || '', node.info || '']);
                    break;
                case SEARCH_CATEGORIES.labels.id:
                    match = compare(node.labels || []);
                    break;
                default:
                    match = false;
                    break;
            }

            if (!match) {
                hiddenModelIds.add(node.id);
            }
        });

        // Optimize corner cases.
        if (hiddenModelIds.size === 0) {
            return treeRoots;
        }

        if (hiddenModelIds.size === data.length) {
            return [];
        }

        // These exclude nodes that themselves aren't matches but are parents of matches.
        const hiddenTreeNodeIds = new Set();

        treeRoots.forEach((root) => {
            function traverseRec(treeNode) {
                let isHidden = hiddenModelIds.has(treeNode.node.id);
                (treeNode.children || []).forEach((childNode) => {
                    const childHidden = traverseRec(childNode);
                    isHidden = isHidden ? childHidden : isHidden;
                });

                if (isHidden) {
                    hiddenTreeNodeIds.add(treeNode.id);
                }

                return isHidden;
            }

            traverseRec(root);
        });

        const filteredRoots = [];
        treeRoots.forEach((root) => {
            function traverseRec(treeNode, newNode) {
                if (hiddenModelIds.has(treeNode.node.id)) {
                    // It didn't match the search but has children -> keep it but "grey it out".
                    newNode.hidden = true;
                }

                (treeNode.children || []).forEach((childNode) => {
                    if (hiddenTreeNodeIds.has(childNode.id)) {
                        return;
                    }

                    if (!newNode.children) {
                        newNode.children = [];
                    }

                    const newChildNode = { id: childNode.id, node: childNode.node };
                    newNode.children.push(newChildNode);

                    traverseRec(childNode, newChildNode);
                });
            }

            if (!hiddenTreeNodeIds.has(root)) {
                const newRoot = { id: root.id, node: root.node };
                filteredRoots.push(newRoot);
                traverseRec(root, newRoot);
            }
        });

        return filteredRoots;
    }, [searchString, data, treeRoots, searchCategory]);

    const selection = useMemo(() => {
        const { nodeId } = selectedNode;
        if (!nodeId || !modelIdToTreeNodes[nodeId]) {
            return [];
        }

        return modelIdToTreeNodes[nodeId].map((n) => n.id);
    }, [selectedNode, modelIdToTreeNodes]);

    const onTreeNodeClick = useCallback(
        (treeNodeId) => {
            const treeNode = idToTreeNode[treeNodeId];
            if (treeNode?.node?.id) {
                setSelectedNode({ nodeId: treeNode.node.id, treeId: treeNodeId });
            }
        },
        [idToTreeNode, setSelectedNode]
    );

    const onToggleExpandClick = useCallback(
        (treeNodeId) => {
            if (expanded.includes(treeNodeId)) {
                setExpanded(expanded.filter((id) => id !== treeNodeId));
            } else {
                setExpanded([...expanded, treeNodeId]);
            }
        },
        [expanded]
    );

    const onSearchNodeClick = useCallback(
        (treeNodeId) => {
            // First expand all nodes up to the treeNode
            let treeNode = idToTreeNode[treeNodeId];
            const toExpand = [];

            while (treeNode && treeNode.parent) {
                treeNode = treeNode.parent;
                if (expanded.includes(treeNode.id)) {
                    break;
                }

                toExpand.push(treeNode.id);
            }

            setExpanded([...expanded, ...toExpand]);
            onTreeNodeClick(treeNodeId);
            setSearchActive(false);
            setSearchValue('');
        },
        [onTreeNodeClick, expanded, idToTreeNode]
    );

    const showSearch = Boolean(searchActive || searchString);

    return (
        <Grid container spacing={1} style={{ padding: 10 }}>
            {showSearch && (
                <Grid item xs={12}>
                    <TextField
                        size="small"
                        fullWidth
                        variant="outlined"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                                setSearchActive(false);
                                setSearchValue('');
                            }
                        }}
                        value={searchValue}
                        label={searchCategory.displayName}
                        onChange={(event) => {
                            setSearchValue(event.target.value);
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                            endAdornment: searchValue ? (
                                <InputAdornment
                                    position="end"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => {
                                        setSearchActive(false);
                                        setSearchValue('');
                                    }}
                                >
                                    <ClearIcon />
                                </InputAdornment>
                            ) : (
                                <CategorySelector
                                    searchCategory={searchCategory}
                                    setSearchCategory={setSearchCategory}
                                />
                            ),
                        }}
                    />
                </Grid>
            )}

            <Grid item xs={12}>
                {!showSearch && (
                    <Button
                        style={{ fontSize: '0.8rem', textTransform: 'none' }}
                        size="sm"
                        color="default"
                        onClick={() => setSearchActive(true)}
                        startIcon={<SearchIcon />}
                    >
                        Search ..
                    </Button>
                )}
                <TreeBrowserView
                    style={{ maxWidth: width, display: searchRoots ? 'none' : undefined }}
                    treeRoots={treeRoots}
                    expanded={expanded}
                    onNodeClick={onTreeNodeClick}
                    onNodeToggleExpand={onToggleExpandClick}
                    selectedIds={selection}
                />
                {searchString ? (
                    <TreeBrowserView
                        treeRoots={searchRoots}
                        style={{ maxWidth: width }}
                        selectedIds={selection}
                        expanded={Object.keys(idToTreeNode)}
                        onNodeClick={onSearchNodeClick}
                        onNodeToggleExpand={onSearchNodeClick}
                    />
                ) : null}
            </Grid>
        </Grid>
    );
}

CategorySelector.propTypes = {
    searchCategory: PropTypes.shape({
        id: PropTypes.string,
        displayName: PropTypes.string,
    }),
    setSearchCategory: PropTypes.func.isRequired,
};

function CategorySelector({ searchCategory, setSearchCategory }) {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleSelect = (categoryId) => {
        setAnchorEl(null);
        setSearchCategory(SEARCH_CATEGORIES[categoryId]);
    };

    return (
        <InputAdornment position="end">
            <MenuIcon style={{ cursor: 'pointer' }} onClick={handleClick} />
            <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={() => {
                    setAnchorEl(null);
                }}
                MenuListProps={{
                    'aria-labelledby': 'basic-button',
                }}
            >
                {Object.keys(SEARCH_CATEGORIES).map((categoryId) => (
                    <MenuItem
                        disabled={categoryId === searchCategory.id}
                        key={categoryId}
                        onClick={() => handleSelect(categoryId)}
                    >
                        {SEARCH_CATEGORIES[categoryId].displayName}
                    </MenuItem>
                ))}
            </Menu>
        </InputAdornment>
    );
}

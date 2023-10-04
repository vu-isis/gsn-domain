import PropTypes from 'prop-types';
import { useState, useMemo, useCallback, useEffect } from 'react';
// @mui
import { Drawer, Tab, Tabs } from '@mui/material';
import { FiberManualRecord as FiberManualRecordIcon } from '@mui/icons-material';
// components
import LabelTable from './LabelTable';
import GroupTable from './GroupTable';
import GroupGraph from './GroupsGraph';
import ViewContent from './ViewEditor';
import TopResizeableDrawer from './TopResizeableDrawer';
// utils
import { NodeType, LabelType, ViewType, ActiveViewType, LayoutOptsType } from '../gsnTypes';

TopMenu.propTypes = {
    isReadOnly: PropTypes.bool,
    width: PropTypes.number.isRequired,
    totalHeight: PropTypes.number.isRequired,
    left: PropTypes.number.isRequired,
    layoutOpts: LayoutOptsType,
    labels: PropTypes.arrayOf(LabelType),
    views: PropTypes.arrayOf(ViewType),
    model: PropTypes.arrayOf(NodeType),
    activeView: ActiveViewType,
    topMenuIndex: PropTypes.number.isRequired,
    setTopMenuIndex: PropTypes.func.isRequired,
    setActiveView: PropTypes.func.isRequired,
    onAddNewView: PropTypes.func.isRequired,
    onDeleteView: PropTypes.func.isRequired,
    onRenameView: PropTypes.func.isRequired,
    onAddNewLabel: PropTypes.func.isRequired,
    onDeleteLabel: PropTypes.func.isRequired,
    onUpdateLabel: PropTypes.func.isRequired,
};

export default function TopMenu({ layoutOpts, width, totalHeight, left, topMenuIndex, setTopMenuIndex, ...restProps }) {
    const [height, setHeight] = useState(layoutOpts.defaultTopMenuItemHeight);
    const [displayedIndicies, setDisplayedIndices] = useState([0]);

    const heightStyle = useMemo(
        () => ({ height: layoutOpts.topMenuHeight, minHeight: layoutOpts.topMenuHeight }),
        [layoutOpts.topMenuHeight]
    );

    const handleTabChange = (_, newValue) => {
        setTopMenuIndex(newValue);
    };

    const onHeightChange = useCallback(
        (newHeight) => {
            if (newHeight > 0) {
                setHeight(newHeight);
            } else {
                setTopMenuIndex(-1);
            }
        },
        [setTopMenuIndex]
    );

    useEffect(() => {
        if (topMenuIndex > -1 && !displayedIndicies.includes(topMenuIndex)) {
            setDisplayedIndices([...displayedIndicies, topMenuIndex]);
        }
    }, [topMenuIndex, displayedIndicies]);

    return (
        <>
            <Drawer
                sx={{
                    height: 0,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        marginBottom: 0,
                        paddingBottom: 0,
                        height: layoutOpts.topMenuHeight,
                        left,
                        boxSizing: 'border-box',
                        overflowX: 'auto',
                    },
                }}
                variant="persistent"
                anchor="top"
                open
            >
                <Tabs
                    sx={{ ...heightStyle, '& .MuiTabs-flexContainer': heightStyle }}
                    value={topMenuIndex > -1 ? topMenuIndex : false}
                    onChange={handleTabChange}
                >
                    <Tab
                        sx={heightStyle}
                        label={
                            restProps.activeView ? (
                                <span>
                                    Views{' '}
                                    <FiberManualRecordIcon
                                        style={{
                                            color: '#05b714',
                                            position: 'absolute',
                                            top: (layoutOpts.topMenuHeight - 14) / 2,
                                            right: 4,
                                            height: 14,
                                        }}
                                    />
                                </span>
                            ) : (
                                'Views'
                            )
                        }
                        onClick={() => topMenuIndex === 0 && setTopMenuIndex(-1)}
                    />
                    <Tab sx={heightStyle} label="Labels" onClick={() => topMenuIndex === 1 && setTopMenuIndex(-1)} />
                    <Tab sx={heightStyle} label="Groups" onClick={() => topMenuIndex === 2 && setTopMenuIndex(-1)} />
                    <Tab
                        sx={heightStyle}
                        label="Group Graph"
                        onClick={() => topMenuIndex === 3 && setTopMenuIndex(-1)}
                    />
                </Tabs>
            </Drawer>
            {topMenuIndex > -1 ? (
                <TopResizeableDrawer
                    left={left}
                    width={width}
                    layoutOpts={layoutOpts}
                    totalHeight={totalHeight}
                    initialHeight={height}
                    onHeightChange={onHeightChange}
                >
                    {topMenuIndex === 0 && <ViewContent {...restProps} />}
                    {displayedIndicies.includes(1) && (
                        <div style={{ display: topMenuIndex === 1 ? undefined : 'none' }}>
                            <LabelTable {...restProps} />
                        </div>
                    )}
                    {displayedIndicies.includes(2) && (
                        <div style={{ display: topMenuIndex === 2 ? undefined : 'none' }}>
                            <GroupTable {...restProps} />
                        </div>
                    )}
                    {displayedIndicies.includes(3) && (
                        <div style={{ display: topMenuIndex === 3 ? undefined : 'none' }}>
                            <GroupGraph width={width - 2 * 16} height={height - 4} {...restProps} />
                        </div>
                    )}
                </TopResizeableDrawer>
            ) : null}
        </>
    );
}

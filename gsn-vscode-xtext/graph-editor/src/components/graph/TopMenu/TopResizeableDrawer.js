import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { useDebounce } from 'use-debounce';
// @mui
import { Drawer } from '@mui/material';
// hooks
import usePanelResize from '../hooks/usePanelResize';
// utils
import { LayoutOptsType } from '../gsnTypes';

const LOWER_THRESHOLD_TO_MINIMIZE = 120;
const UPPER_THRESHOLD_TO_MINIMIZE = 180;
const MAX_HEIGHT_MARGIN = 150;

TopResizeableDrawer.propTypes = {
    layoutOpts: LayoutOptsType,
    totalHeight: PropTypes.number,
    left: PropTypes.number,
    width: PropTypes.number,
    initialHeight: PropTypes.number,
    onHeightChange: PropTypes.func,
    children: PropTypes.array,
};

export default function TopResizeableDrawer({
    layoutOpts,
    totalHeight,
    initialHeight,
    onHeightChange,
    left,
    width,
    children,
}) {
    const [height, isResizing, draggerEl, resetSize] = usePanelResize({
        initialSize: initialHeight,
        minSize: 0,
        maxSize: totalHeight - MAX_HEIGHT_MARGIN,
        lowerThreshold: LOWER_THRESHOLD_TO_MINIMIZE,
        upperThreshold: UPPER_THRESHOLD_TO_MINIMIZE,
        offset: layoutOpts.topMenuHeight + layoutOpts.headerHeight,
        orientation: 'top',
    });

    useEffect(() => {
        resetSize(initialHeight);
    }, [initialHeight, resetSize]);

    const [debouncedHeight] = useDebounce(height, 100);

    useEffect(() => {
        if (!isResizing) {
            onHeightChange(debouncedHeight);
        }
    }, [debouncedHeight, isResizing, onHeightChange]);

    return (
        <>
            <Drawer
                sx={{
                    width: 0,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        top: layoutOpts.headerHeight + layoutOpts.topMenuHeight,
                        height: debouncedHeight,
                        width,
                        left,
                        boxSizing: 'border-box',
                        overflow: 'auto',
                    },
                }}
                variant="persistent"
                anchor="top"
                open
            >
                {children}
            </Drawer>
            {draggerEl}
        </>
    );
}

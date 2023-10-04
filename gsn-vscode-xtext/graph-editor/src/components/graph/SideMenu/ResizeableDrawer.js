import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { useDebounce } from 'use-debounce';
// @mui
import { Drawer } from '@mui/material';
// hooks
import usePanelResize from '../hooks/usePanelResize';
// utils
import { LayoutOptsType } from '../gsnTypes';

const LOWER_THRESHOLD_TO_MINIMIZE = 80;
const UPPER_THRESHOLD_TO_MINIMIZE = 180;
const MAX_WIDTH_MARGIN = 380;

ResizeableDrawer.propTypes = {
    layoutOpts: LayoutOptsType,
    totalWidth: PropTypes.number,
    initialWidth: PropTypes.number,
    onWidthChange: PropTypes.func,
    children: PropTypes.object,
};

export default function ResizeableDrawer({ layoutOpts, totalWidth, initialWidth, onWidthChange, children }) {
    const { leftMenuPanel } = layoutOpts;
    const [width, isResizing, draggerEl, resetSize] = usePanelResize({
        initialSize: initialWidth,
        minSize: 0,
        maxSize: totalWidth - MAX_WIDTH_MARGIN,
        lowerThreshold: LOWER_THRESHOLD_TO_MINIMIZE,
        upperThreshold: UPPER_THRESHOLD_TO_MINIMIZE,
        offset: layoutOpts.sideMenuWidth,
        orientation: leftMenuPanel ? 'left' : 'right',
    });

    useEffect(() => {
        resetSize(initialWidth);
    }, [initialWidth, resetSize]);

    const [debouncedWidth] = useDebounce(width, 100);

    useEffect(() => {
        if (!isResizing) {
            onWidthChange(debouncedWidth);
        }
    }, [debouncedWidth, isResizing, onWidthChange]);

    return (
        <>
            <Drawer
                sx={{
                    width: 0,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        marginTop: `${layoutOpts.headerHeight}px`,
                        right: leftMenuPanel ? undefined : layoutOpts.sideMenuWidth,
                        left: leftMenuPanel ? layoutOpts.sideMenuWidth : undefined,
                        width: debouncedWidth,
                        boxSizing: 'border-box',
                        overflow: 'auto',
                    },
                }}
                variant="persistent"
                anchor={leftMenuPanel ? 'left' : 'right'}
                open
            >
                {children}
            </Drawer>
            {draggerEl}
        </>
    );
}

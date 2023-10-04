import { useState, useCallback, useEffect, useMemo } from 'react';
import { styled } from '@mui/material';

export default function usePanelResize({
    initialSize,
    maxSize,
    minSize,
    upperThreshold,
    lowerThreshold,
    offset = 0,
    orientation = 'right', // 'left', 'right', 'top', 'bottom'
}) {
    const [isResizing, setIsResizing] = useState(false);
    const [size, setSize] = useState(initialSize);

    const enableResize = useCallback(() => {
        setIsResizing(true);
    }, []);

    const disableResize = useCallback(() => {
        setIsResizing(false);
    }, []);

    const resetSize = useCallback((newSize) => {
        setSize(newSize);
    }, []);

    const resize = useCallback(
        (event) => {
            if (isResizing) {
                let newSize;

                switch (orientation) {
                    case 'left':
                        newSize = event.clientX - offset;
                        break;
                    case 'right':
                        newSize = event.view.innerWidth - event.clientX - offset;
                        break;
                    case 'top':
                        newSize = event.clientY - offset;
                        break;
                    case 'bottom':
                        newSize = event.view.innerHeight - event.clientY - offset;
                        break;
                    default:
                        throw new Error(`Unknow orientation "${orientation}" must be 'right', 'left', 'top', 'bottom'`);
                }

                if (newSize < lowerThreshold) {
                    setSize(minSize);
                } else if (newSize < upperThreshold) {
                    setSize(upperThreshold);
                } else if (newSize < maxSize) {
                    setSize(newSize);
                } else {
                    setSize(maxSize);
                }
            }

            event.preventDefault();
        },
        [minSize, maxSize, upperThreshold, lowerThreshold, isResizing, orientation, offset]
    );

    useEffect(() => {
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', disableResize);

        return () => {
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', disableResize);
        };
    }, [disableResize, resize]);

    const onMouseDown = useCallback(
        (event) => {
            if (event.target === event.currentTarget) {
                enableResize();
                event.preventDefault();
            }
        },
        [enableResize]
    );

    const draggerEl = useMemo(() => {
        const position = size + offset - 2;
        switch (orientation) {
            case 'left':
                return <LeftRightDragger left={position} isResizing={isResizing} onMouseDown={onMouseDown} />;
            case 'right':
                return <LeftRightDragger right={position} isResizing={isResizing} onMouseDown={onMouseDown} />;
            case 'top':
                return <TopBottomDragger top={position} isResizing={isResizing} onMouseDown={onMouseDown} />;
            case 'bottom':
                return <TopBottomDragger bottom={position} isResizing={isResizing} onMouseDown={onMouseDown} />;
            default:
                throw new Error(`Unknow orientation "${orientation}" must be 'right', 'left', 'top', 'bottom'`);
        }
    }, [orientation, offset, onMouseDown, size, isResizing]);

    return [size, isResizing, draggerEl, resetSize];
}

const LeftRightDragger = styled('div')(({ right, left, isResizing }) => ({
    top: 0,
    bottom: 0,
    width: '4px',
    cursor: 'ew-resize',
    padding: '0 2px 0 2px',
    right,
    left,
    // common
    position: 'absolute',
    zIndex: 1300,
    backgroundColor: isResizing ? '#f4f7f9' : 'unset',
}));

const TopBottomDragger = styled('div')(({ top, bottom, isResizing }) => ({
    left: 0,
    right: 0,
    height: '4px',
    cursor: 'ns-resize',
    padding: '2px 0 2px 0',
    top,
    bottom,
    // common
    position: 'absolute',
    zIndex: 1300,
    backgroundColor: isResizing ? '#f4f7f9' : 'unset',
}));

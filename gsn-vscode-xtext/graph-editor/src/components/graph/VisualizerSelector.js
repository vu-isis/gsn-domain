import { useCallback } from 'react';
import PropTypes from 'prop-types';

import { BottomNavigation, BottomNavigationAction } from '@mui/material';
import { AccountTree as AccountTreeIcon, BlurOn as BlurOnIcon, HdrWeak as HdrWeakIcon } from '@mui/icons-material';

VisualizerSelector.propTypes = {
    right: PropTypes.number.isRequired,
    selectedVisualizer: PropTypes.string.isRequired,
    setSelectedVisualizer: PropTypes.func.isRequired,
};

const navActionStyle = { p: 0, minWidth: 38 };

export default function VisualizerSelector({ right, selectedVisualizer, setSelectedVisualizer }) {
    const handleChange = useCallback(
        (event, newValue) => {
            setSelectedVisualizer(newValue);
        },
        [setSelectedVisualizer]
    );

    return (
        <BottomNavigation
            sx={{
                position: 'absolute',
                top: 0,
                zIndex: 1250,
                height: 27,
                right,
            }}
            showLabels={false}
            value={selectedVisualizer}
            onChange={handleChange}
        >
            <BottomNavigationAction
                sx={navActionStyle}
                value="default"
                title="Tree Graph Visualization"
                icon={<AccountTreeIcon sx={{ transform: 'rotate(90deg)' }} />}
            />
            <BottomNavigationAction
                sx={navActionStyle}
                value="overview"
                title="Radial Visualization"
                icon={<BlurOnIcon />}
            />
            <BottomNavigationAction
                sx={navActionStyle}
                value="overview2"
                title="Cluster Visualization"
                icon={<HdrWeakIcon />}
            />
        </BottomNavigation>
    );
}

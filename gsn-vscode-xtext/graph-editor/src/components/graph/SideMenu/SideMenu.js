import PropTypes from 'prop-types';
import { useCallback, useState } from 'react';
// @mui
import { Drawer, List, ListItem, ListItemButton, ListItemIcon } from '@mui/material';
import { useTheme } from '@mui/material/styles';
// component
import ResizeableDrawer from './ResizeableDrawer';

// -----------------------------------------------------------------------------------------------

SideMenu.propTypes = {
    layoutOpts: PropTypes.shape({
        headerHeight: PropTypes.number,
        leftMenuPanel: PropTypes.bool,
        sideMenuWidth: PropTypes.number,
        defaultSideMenuItemWidth: PropTypes.number,
    }),
    menuItems: PropTypes.arrayOf(
        PropTypes.shape({
            icon: PropTypes.element.isRequired,
            content: PropTypes.element.isRequired,
            title: PropTypes.string.isRequired,
        })
    ).isRequired,
    bottomActionEls: PropTypes.arrayOf(PropTypes.element),
    totalWidth: PropTypes.number.isRequired,
    sideMenuIndex: PropTypes.number.isRequired,
    setSideMenuIndex: PropTypes.func.isRequired,
    onWidthChange: PropTypes.func.isRequired,
};

export default function SideMenu({
    layoutOpts,
    menuItems,
    bottomActionEls,
    totalWidth,
    sideMenuIndex,
    setSideMenuIndex,
    onWidthChange,
}) {
    const { palette } = useTheme();
    const activeColor = palette.primary[palette.mode];

    // Width even though minimized (used when show/hide panel).
    const [width, setWidth] = useState(layoutOpts.defaultSideMenuItemWidth);

    const onWidthChangeCb = useCallback(
        (newWidth) => {
            if (newWidth > 0) {
                setWidth(newWidth);
            } else {
                setSideMenuIndex(-1);
            }

            onWidthChange(newWidth);
        },
        [onWidthChange, setSideMenuIndex]
    );

    return (
        <>
            <Drawer
                sx={{
                    width: 0,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        marginTop: layoutOpts.headerHeight,
                        width: layoutOpts.sideMenuWidth,
                        boxSizing: 'border-box',
                        overflow: 'auto',
                    },
                }}
                variant="persistent"
                anchor={layoutOpts.leftMenuPanel ? 'left' : 'right'}
                open
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100vh',
                        justifyContent: 'space-between',
                    }}
                >
                    <List disablePadding>
                        {menuItems.map((item, idx) => {
                            const isActive = idx === sideMenuIndex;
                            const { leftMenuPanel } = layoutOpts;
                            const activeBorder = `4px solid ${activeColor}`;
                            return (
                                <ListItem
                                    key={`${idx}`}
                                    disablePadding
                                    sx={{
                                        display: 'block',
                                        borderRight: isActive && !leftMenuPanel ? activeBorder : undefined,
                                        borderLeft: isActive && leftMenuPanel ? activeBorder : undefined,
                                    }}
                                >
                                    <ListItemButton
                                        sx={{
                                            minHeight: 48,
                                            justifyContent: 'center',
                                            px: 2.5,
                                        }}
                                        onClick={() => {
                                            if (isActive) {
                                                onWidthChange(0);
                                            }

                                            setSideMenuIndex(isActive ? -1 : idx);
                                        }}
                                    >
                                        <ListItemIcon
                                            sx={{
                                                minWidth: 0,
                                                mr: 'auto',
                                                justifyContent: 'center',
                                                color: isActive ? activeColor : undefined,
                                            }}
                                        >
                                            {item.icon}
                                        </ListItemIcon>
                                    </ListItemButton>
                                </ListItem>
                            );
                        })}
                    </List>
                    <List disablePadding>{bottomActionEls}</List>
                </div>
            </Drawer>

            {sideMenuIndex > -1 ? (
                <ResizeableDrawer
                    layoutOpts={layoutOpts}
                    totalWidth={totalWidth}
                    initialWidth={width}
                    onWidthChange={onWidthChangeCb}
                >
                    {menuItems[sideMenuIndex].content}
                </ResizeableDrawer>
            ) : null}
        </>
    );
}

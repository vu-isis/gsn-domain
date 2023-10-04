import PropTypes from 'prop-types';
import { Badge, ListItem, ListItemButton, ListItemIcon } from '@mui/material';
import { Undo as UndoIcon, Redo as RedoIcon } from '@mui/icons-material';

UndoRedoButtons.propTypes = {
    undoRedo: PropTypes.shape({
        undo: PropTypes.number,
        redo: PropTypes.number,
    }),
    onUndo: PropTypes.func,
    onRedo: PropTypes.func,
};

export default function UndoRedoButtons({ undoRedo, onUndo, onRedo }) {
    const { undo, redo } = undoRedo;
    return [
        <ListItem key="undo-button" disablePadding sx={{ display: 'block' }}>
            <ListItemButton
                sx={{
                    minHeight: 48,
                    justifyContent: 'center',
                    px: 2.5,
                }}
                onClick={onUndo}
                title="Undo"
                disabled={undo === 0}
            >
                <ListItemIcon
                    sx={{
                        minWidth: 0,
                        mr: 'auto',
                        justifyContent: 'center',
                    }}
                >
                    <Badge color="primary" badgeContent={undo}>
                        <UndoIcon />
                    </Badge>
                </ListItemIcon>
            </ListItemButton>
        </ListItem>,
        <ListItem key="redo-button" disablePadding sx={{ display: 'block' }}>
            <ListItemButton
                sx={{
                    minHeight: 48,
                    justifyContent: 'center',
                    px: 2.5,
                }}
                onClick={onRedo}
                title="Redo"
                disabled={redo === 0}
            >
                <ListItemIcon
                    sx={{
                        minWidth: 0,
                        mr: 'auto',
                        justifyContent: 'center',
                    }}
                >
                    <Badge color="secondary" badgeContent={redo}>
                        <RedoIcon />
                    </Badge>
                </ListItemIcon>
            </ListItemButton>
        </ListItem>,
    ];
}

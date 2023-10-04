import PropTypes from 'prop-types';
import { ListItem, ListItemButton, ListItemIcon } from '@mui/material';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';

DefaultSideMenuBottomActions.propTypes = {
    doValidate: PropTypes.bool.isRequired,
    setDoValidate: PropTypes.func.isRequired,
};

export default function DefaultSideMenuBottomActions({ doValidate, setDoValidate }) {
    return [
        <ListItem key="toggle-validate-button" disablePadding sx={{ display: 'block' }}>
            <ListItemButton
                sx={{
                    minHeight: 48,
                    justifyContent: 'center',
                    px: 2.5,
                }}
                onClick={() => setDoValidate(!doValidate)}
                title={doValidate ? 'Turn OFF validation' : 'Turn ON validation'}
            >
                <ListItemIcon
                    sx={{
                        minWidth: 0,
                        mr: 'auto',
                        justifyContent: 'center',
                    }}
                >
                    <CheckCircleIcon color={doValidate ? 'primary' : 'default'} />
                </ListItemIcon>
            </ListItemButton>
        </ListItem>,
    ];
}

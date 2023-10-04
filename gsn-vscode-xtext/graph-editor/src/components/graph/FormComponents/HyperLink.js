import PropTypes from 'prop-types';
// @mui
import { Typography } from '@mui/material';

HyperLink.propTypes = {
    value: PropTypes.string.isRequired,
    title: PropTypes.string,
    onClick: PropTypes.func.isRequired,
};

export default function HyperLink({ value, title, onClick }) {
    return (
        <Typography
            title={title}
            style={{ marginTop: 9, textDecoration: 'underline', cursor: 'pointer', color: 'rgb(25, 118, 210)' }}
            variant="body2"
            onClick={onClick}
        >
            {value}
        </Typography>
    );
}

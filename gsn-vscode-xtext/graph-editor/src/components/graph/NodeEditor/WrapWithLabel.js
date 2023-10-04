import PropTypes from 'prop-types';
// @mui
import { Grid, Typography } from '@mui/material';
// utils
import { labelStyle } from '../FormComponents/common';

WrapWithLabel.propTypes = {
    label: PropTypes.string,
    children: PropTypes.oneOfType([PropTypes.element, PropTypes.array]),
};

export default function WrapWithLabel({ label, children }) {
    return (
        <>
            <Grid item xs={3}>
                <Typography style={labelStyle} variant="subtitle2">
                    {label}
                </Typography>
            </Grid>
            <Grid item xs={9}>
                {children}
            </Grid>
        </>
    );
}

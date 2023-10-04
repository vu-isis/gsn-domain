import PropTypes from 'prop-types';
// @mui
import { Chip, Typography } from '@mui/material';
import { Cancel } from '@mui/icons-material';
import { getPaletteClassName } from '../theme';
// util
import { labelStyle } from './common';

// ----------------------------------------------------------------------

ChipListValues.propTypes = {
    isReadOnly: PropTypes.bool,
    values: PropTypes.arrayOf(PropTypes.string),
    noValuesMessage: PropTypes.string,
    variant: PropTypes.string,
    stacked: PropTypes.bool,
    deleteIcon: PropTypes.element,
    onClick: PropTypes.func,
};

export default function ChipListValues({
    isReadOnly,
    values,
    onClick,
    stacked,
    noValuesMessage = 'None added ..',
    variant = 'outlined',
    deleteIcon = <Cancel />,
}) {
    function handleDelete(valToDelete) {
        return () => {
            onClick(valToDelete);
        };
    }

    return (
        <>
            {values &&
                values.map((val) => (
                    <span key={val}>
                        <Chip
                            sx={{
                                marginRight: '2px',
                                marginTop: '4px',
                                marginBottom: 0,
                                height: 20,
                            }}
                            key={val}
                            label={val}
                            variant={variant}
                            color={getPaletteClassName(val)}
                            size="small"
                            deleteIcon={deleteIcon}
                            onDelete={isReadOnly ? undefined : handleDelete(val)}
                        />
                        {stacked ? <br /> : null}
                    </span>
                ))}
            {(!values || values.length === 0) && noValuesMessage ? (
                <Typography style={{ color: 'grey', fontStyle: 'italic', ...labelStyle }} variant="body2">
                    {noValuesMessage}
                </Typography>
            ) : null}
        </>
    );
}

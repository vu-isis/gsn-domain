import { useCallback } from 'react';
import PropTypes from 'prop-types';
// @mui
import { Checkbox } from '@mui/material';

BooleanInput.propTypes = {
    isReadOnly: PropTypes.bool,
    initValue: PropTypes.bool.isRequired,
    onSubmit: PropTypes.func.isRequired,
};

export default function BooleanInput({ initValue, onSubmit, isReadOnly = false }) {
    const onChange = useCallback(
        (el) => {
            onSubmit(el.target.checked);
        },
        [onSubmit]
    );

    return <Checkbox disabled={isReadOnly} checked={initValue} onChange={onChange} />;
}

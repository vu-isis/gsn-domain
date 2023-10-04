import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
// components
import StringInputExternalState from './StringInputExternalState';
// ----------------------------------------------------------------------

StringInput.propTypes = {
    isReadOnly: PropTypes.bool,
    rows: PropTypes.number,
    initText: PropTypes.string.isRequired,
    checkFunction: PropTypes.func,
    onSubmit: PropTypes.func.isRequired,
    onClear: PropTypes.func,
};

export default function StringInput({
    initText,
    onSubmit,
    checkFunction = (/* newValue */) => ({ valid: true, hint: '' }),
    ...restProps
}) {
    const [textInfo, setTextInfo] = useState({ value: initText, valid: true, hint: '' });
    const [isSubmitted, setIsSubmitted] = useState(false);

    useEffect(() => {
        setTextInfo({ value: initText, valid: true, hint: '' });
        setIsSubmitted(false);
    }, [initText]);

    const onChange = useCallback(
        (newValue) => {
            const { valid, hint } = checkFunction(newValue);
            setTextInfo({ value: newValue, valid, hint });
        },
        [checkFunction]
    );

    const trySubmit = useCallback(() => {
        if (textInfo.valid && textInfo.value !== initText) {
            onSubmit(textInfo.value);
        }

        setIsSubmitted(true);
    }, [initText, onSubmit, textInfo]);

    return (
        <StringInputExternalState
            fullWidth
            textInfo={textInfo}
            isSubmitted={isSubmitted}
            onChange={onChange}
            onBlur={trySubmit}
            {...restProps}
        />
    );
}

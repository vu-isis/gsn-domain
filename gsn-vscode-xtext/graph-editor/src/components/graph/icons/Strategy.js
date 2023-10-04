import PropTypes from 'prop-types';
import { COLORS } from '../theme';

Strategy.propTypes = {
    style: PropTypes.object,
    strokeWidth: PropTypes.number,
};

export default function Strategy({ style, strokeWidth = 4, ...props }) {
    return (
        <svg viewBox="0.0 0.0 200 120" xmlns="http://www.w3.org/2000/svg" style={style} {...props}>
            <rect
                x={strokeWidth / 2 + 22}
                y={strokeWidth / 2}
                width={200 - 22 - strokeWidth}
                height={120 - strokeWidth}
                fill="none"
                strokeWidth={strokeWidth}
                transform="skewX(-10)"
                stroke={COLORS.Strategy}
            />
        </svg>
    );
}

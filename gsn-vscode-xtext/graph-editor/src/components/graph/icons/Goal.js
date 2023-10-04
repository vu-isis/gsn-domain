import PropTypes from 'prop-types';
import { COLORS } from '../theme';

Goal.propTypes = {
    style: PropTypes.object,
    strokeWidth: PropTypes.number,
};

export default function Goal({ style, strokeWidth = 4, ...props }) {
    return (
        <svg viewBox="0.0 0.0 180 120" xmlns="http://www.w3.org/2000/svg" style={style} {...props}>
            <rect
                x={strokeWidth / 2}
                y={strokeWidth / 2}
                width={180 - strokeWidth}
                height={120 - strokeWidth}
                fill="none"
                strokeWidth={strokeWidth}
                stroke={COLORS.Goal}
            />
        </svg>
    );
}

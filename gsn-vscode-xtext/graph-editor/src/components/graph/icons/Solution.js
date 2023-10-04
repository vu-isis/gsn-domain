import PropTypes from 'prop-types';
import { COLORS } from '../theme';

Solution.propTypes = {
    style: PropTypes.object,
    strokeWidth: PropTypes.number,
};

export default function Solution({ style, strokeWidth = 4, ...props }) {
    return (
        <svg viewBox="0.0 0.0 140 120" xmlns="http://www.w3.org/2000/svg" style={style} {...props}>
            <rect
                x={strokeWidth / 2}
                y={strokeWidth / 2}
                width={140 - strokeWidth}
                height={120 - strokeWidth}
                rx="15"
                ry="15"
                fill="none"
                strokeWidth={strokeWidth}
                stroke={COLORS.Solution}
            />
        </svg>
    );
}

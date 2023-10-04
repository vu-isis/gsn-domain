import PropTypes from 'prop-types';
import { COLORS } from '../theme';

Assumption.propTypes = {
    style: PropTypes.object,
    strokeWidth: PropTypes.number,
};

export default function Assumption({ style, strokeWidth = 4, ...props }) {
    return (
        <svg viewBox="0.0 0.0 180 120" xmlns="http://www.w3.org/2000/svg" style={style} {...props}>
            <ellipse
                cx="90"
                cy="60"
                rx={90 - strokeWidth / 2}
                ry={60 - strokeWidth / 2}
                fill="none"
                strokeWidth={strokeWidth}
                stroke={COLORS.Assumption}
            />
        </svg>
    );
}

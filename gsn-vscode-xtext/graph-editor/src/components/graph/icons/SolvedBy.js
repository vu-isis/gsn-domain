import PropTypes from 'prop-types';
import { COLORS } from '../theme';

SolvedBy.propTypes = {
    style: PropTypes.object,
};

export default function SolvedBy({ style, ...props }) {
    return (
        <svg viewBox="0.0 0.0 180 120" xmlns="http://www.w3.org/2000/svg" style={style} {...props}>
            <defs>
                <marker
                    id="arrow"
                    markerWidth="4"
                    markerHeight="4"
                    refX="10"
                    refY="10"
                    orient="auto"
                    viewBox="0 0 20 20"
                >
                    <path d="M0,0 L18,10 L0,18 Z" stroke={COLORS.Edge} fill={COLORS.Edge} strokeWidth="3" />
                </marker>
            </defs>
            <line x1="10" y1="58" x2="160" y2="58" stroke={COLORS.Edge} strokeWidth="6" markerEnd="url(#arrow)" />
        </svg>
    );
}

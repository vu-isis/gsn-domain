import { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
// @mui
import { IconButton, Grid } from '@mui/material';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
// components
import PreviousViewItem from './PreviousViewItem';
// hooks
import usePrevious from '../../hooks/usePrevious';
// types
import { NodeType, LabelType, ViewType } from '../../gsnTypes';

// --------------------------------------------------------------------------------------------------

const NUMBER_OF_CAROUSELS = 3; // Must divide 12 into an integer. {2, 3, 4, 6, 12}
const MUI_GRID_SIZE = 4; // = 12 / 3

PreviousViewsCarousel.propTypes = {
    isReadOnly: PropTypes.bool,
    views: PropTypes.arrayOf(ViewType),
    model: PropTypes.arrayOf(NodeType).isRequired,
    labels: PropTypes.arrayOf(LabelType).isRequired,
    setActiveView: PropTypes.func.isRequired,
    onDeleteView: PropTypes.func.isRequired,
    onRenameView: PropTypes.func.isRequired,
};

export default function PreviousViewsCarousel({
    isReadOnly,
    views,
    model,
    labels,
    setActiveView,
    onDeleteView,
    onRenameView,
}) {
    const previousViews = usePrevious(views);
    const [index, setIndex] = useState(0);

    const items = useMemo(() => {
        const n = views.length;
        const res = [];
        let indexToUse = index;

        if (n === 0) {
            return [];
        }

        const diff = views.length - (previousViews || []).length;

        if (diff > 0 && index !== 0) {
            // New view created (or first render)
            indexToUse = 0;
            setIndex(0);
        } else if (diff < 0) {
            // View deleted
            if (index > views.length - NUMBER_OF_CAROUSELS) {
                indexToUse = index + diff;
                indexToUse = indexToUse > 0 ? indexToUse : 0;
                setIndex(indexToUse);
            }
        }

        const added = new Set();
        for (let i = 0; i < NUMBER_OF_CAROUSELS; i += 1) {
            const idx = indexToUse + i;
            const view = views[idx % n];
            if (added.has(view.id)) {
                // Less than three items.
                break;
            }

            added.add(view.id);

            res.push(
                <Grid key={view.id} item xs={MUI_GRID_SIZE}>
                    <PreviousViewItem
                        isReadOnly={isReadOnly}
                        model={model}
                        labels={labels}
                        view={view}
                        onDeleteView={onDeleteView}
                        onRenameView={onRenameView}
                        setActiveView={setActiveView}
                    />
                </Grid>
            );
        }

        return res;
    }, [index, model, labels, views, previousViews, isReadOnly, setActiveView, onDeleteView, onRenameView]);

    useEffect(() => {}, [previousViews, views, index]);

    const navigateLeft = () => {
        setIndex(index - 1);
    };

    const navigateRight = () => {
        setIndex(index + 1);
    };

    const leftDisabled = index < 1;
    const rightDisabled = index > views.length - 1 - NUMBER_OF_CAROUSELS;

    return (
        <>
            {items.map((item) => item)}
            {views.length > NUMBER_OF_CAROUSELS ? (
                <>
                    <IconButton disabled={leftDisabled} style={btnStyle(true, leftDisabled)} onClick={navigateLeft}>
                        <KeyboardArrowLeft />
                    </IconButton>
                    <IconButton disabled={rightDisabled} style={btnStyle(false, rightDisabled)} onClick={navigateRight}>
                        <KeyboardArrowRight />
                    </IconButton>
                </>
            ) : null}
        </>
    );
}

const btnStyle = (isLeft, disabled) => ({
    position: 'absolute',
    top: '50%',
    left: isLeft ? '34%' : '97%',
    visibility: disabled ? 'hidden' : 'visible',
});

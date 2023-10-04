import PropTypes from 'prop-types';
// @mui
import { Grid } from '@mui/material';
// components
import ViewConfigForm from './ViewConfigForm';
import PreviousViewsCarousel from './PreviousViewsCarousel';
import { LabelType, NodeType, ViewType, ActiveViewType } from '../../gsnTypes';

// --------------------------------------------------------------------------------------------------

ViewEditor.propTypes = {
    isReadOnly: PropTypes.bool,
    labels: PropTypes.arrayOf(LabelType),
    views: PropTypes.arrayOf(ViewType),
    model: PropTypes.arrayOf(NodeType),
    activeView: ActiveViewType,
    setActiveView: PropTypes.func.isRequired,
    onAddNewView: PropTypes.func.isRequired,
    onDeleteView: PropTypes.func.isRequired,
    onRenameView: PropTypes.func.isRequired,
};

export default function ViewEditor({
    isReadOnly,
    labels,
    views,
    model,
    activeView,
    setActiveView,
    onAddNewView,
    onDeleteView,
    onRenameView,
}) {
    return (
        <Grid container spacing={2} sx={{ padding: 1 }}>
            <Grid item xs={4}>
                <ViewConfigForm
                    isReadOnly={isReadOnly}
                    labels={labels}
                    activeView={activeView}
                    setActiveView={setActiveView}
                    onAddNewView={onAddNewView}
                />
            </Grid>
            <Grid item xs={8}>
                <Grid container spacing={2}>
                    <PreviousViewsCarousel
                        isReadOnly={isReadOnly}
                        model={model}
                        labels={labels}
                        views={views}
                        activeView={activeView}
                        setActiveView={setActiveView}
                        onDeleteView={onDeleteView}
                        onRenameView={onRenameView}
                    />
                </Grid>
            </Grid>
        </Grid>
    );
}

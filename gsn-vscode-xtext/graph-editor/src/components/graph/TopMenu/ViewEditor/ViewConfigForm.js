import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
// @mui
import { Button, Card, CardActions, CardContent, Grid, Typography, IconButton } from '@mui/material';
import { AddCircle as AddCircleIcon, HelpOutline as HelpOutlineIcon } from '@mui/icons-material';
// form-components
import { StringInputExternalState, BooleanInput, ChipListValues } from '../../FormComponents';
// utils
import { checkViewExpression } from './viewUtils';
import GSN_CONSTANTS from '../../GSN_CONSTANTS';
import { LabelType, ActiveViewType } from '../../gsnTypes';

const { LOGICAL_SYMBOLS } = GSN_CONSTANTS;

// --------------------------------------------------------------------------------------------------

ViewConfigForm.propTypes = {
    isReadOnly: PropTypes.bool,
    labels: PropTypes.arrayOf(LabelType),
    activeView: ActiveViewType,
    setActiveView: PropTypes.func,
    onAddNewView: PropTypes.func,
};

export default function ViewConfigForm({ isReadOnly, labels, activeView, setActiveView, onAddNewView }) {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [captionVisible, setCaptionVisible] = useState(false);
    // State for the view
    const [includeSubtrees, setIncludeSubtrees] = useState(Boolean(activeView?.includeSubtrees));
    const [includeParents, setIncludeParents] = useState(Boolean(activeView?.includeParents));
    const [highlightMatches, setHighlightMatches] = useState(Boolean(activeView?.highlightMatches));
    const [expandAll, setExpandAll] = useState(Boolean(activeView?.expandAll));
    const [expression, setExpression] = useState({
        value: activeView ? activeView.expression : '',
        valid: true,
        hint: '',
    });

    useEffect(() => {
        if (activeView) {
            const { expression, includeSubtrees, includeParents, expandAll, highlightMatches } = activeView;
            setIncludeSubtrees(includeSubtrees);
            setIncludeParents(includeParents);
            setExpandAll(Boolean(expandAll));
            setHighlightMatches(Boolean(highlightMatches));
            setExpression({ value: expression, valid: true, hint: '' });
        }
    }, [activeView]);

    const onClear = () => {
        setIncludeSubtrees(false);
        setIncludeParents(false);
        setExpression({ value: '', valid: true, hint: '' });
        setActiveView(null);
    };

    const onApply = () => {
        setActiveView({ expression: expression.value, includeSubtrees, includeParents, expandAll, highlightMatches });
    };

    const onSubmitBoolean = (setter) => (newValue) => {
        setter(newValue);
    };

    const onExpressionChange = (newValue) => {
        const { valid, hint } = checkViewExpression(newValue, labels);
        setExpression({ value: newValue, valid, hint });
    };

    const trySubmitExpression = () => {
        setIsSubmitted(true);
    };

    const onSave = () => {
        const newView = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            expression: expression.value,
            includeSubtrees,
            includeParents,
            expandAll,
            highlightMatches,
        };

        onAddNewView(newView);
        setActiveView(newView);
    };

    const onAddLabel = (label) => {
        const newExpression = { ...expression };
        if (newExpression.value) {
            newExpression.value += ` ${LOGICAL_SYMBOLS.OR} `;
        }
        newExpression.value += label;
        setExpression(newExpression);
    };

    const handleInfoButtonClick = () => {
        setCaptionVisible(!captionVisible);
    };

    return (
        <Card sx={{ minWidth: 300 }}>
            <CardContent>
                <Typography variant="h6" component="div">
                    {'Configure view'}
                    <IconButton onClick={handleInfoButtonClick} size="small">
                        <HelpOutlineIcon style={{ maxWidth: '1rem', maxHeight: '1rem' }} />
                    </IconButton>
                </Typography>
                {captionVisible ? (
                    <Typography variant="caption" component="div">
                        {`Build a simple logical expression (using ${LOGICAL_SYMBOLS.AND},
 ${LOGICAL_SYMBOLS.OR}, ${LOGICAL_SYMBOLS.NOT}) composed of any of the available labels or groups.
 Nodes that do not have labels fulfillinig the expression will be filtered out from the graph. Extend the returned 
 graph by including either the "spine" of parents, or entire subtree from the directly matched nodes.`}
                    </Typography>
                ) : null}

                <Grid container spacing={1}>
                    <Grid item xs={12}>
                        {labels.length > 0 ? (
                            <ChipListValues
                                isReadOnly={isReadOnly}
                                values={labels.map((d) => d.name)}
                                deleteIcon={<AddCircleIcon />}
                                onClick={onAddLabel}
                            />
                        ) : (
                            <Typography variant="body2" component="div">
                                {'No lablels defined in model ..'}
                            </Typography>
                        )}
                    </Grid>
                    <Grid item xs={12}>
                        <StringInputExternalState
                            fullWidth
                            label={'Expression '}
                            textInfo={expression}
                            isSubmitted={isSubmitted}
                            onChange={onExpressionChange}
                            onBlur={trySubmitExpression}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <BooleanInput initValue={includeParents} onSubmit={onSubmitBoolean(setIncludeParents)} />
                        <Typography variant="body2" component="span">
                            {'Include Parents '}
                        </Typography>
                        <BooleanInput initValue={includeSubtrees} onSubmit={onSubmitBoolean(setIncludeSubtrees)} />
                        <Typography variant="body2" component="span">
                            {'Include Subtrees '}
                        </Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <BooleanInput initValue={expandAll} onSubmit={onSubmitBoolean(setExpandAll)} />
                        <Typography variant="body2" component="span">
                            {'Expand All '}
                        </Typography>
                        <BooleanInput initValue={highlightMatches} onSubmit={onSubmitBoolean(setHighlightMatches)} />
                        <Typography variant="body2" component="span">
                            {'Highlight Matches '}
                        </Typography>
                    </Grid>
                </Grid>
            </CardContent>

            <CardActions>
                <Button variant="text" size="small" onClick={onClear}>
                    CLEAR
                </Button>
                <Button disabled={!expression.valid} variant="text" size="small" onClick={onApply}>
                    APPLY
                </Button>
                <Button disabled={isReadOnly || !expression.valid} variant="text" size="small" onClick={onSave}>
                    SAVE AS NEW
                </Button>
            </CardActions>
        </Card>
    );
}

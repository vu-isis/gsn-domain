import { useMemo } from 'react';
import PropTypes from 'prop-types';
// @mui
import { Button, Card, CardActions, CardContent, CardHeader } from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
// components
import GSNGraph from '../../GSNGraph/GSNGraph';
// utils
import { applyViewToModel, checkViewExpression } from './viewUtils';
import { fToNow } from '../../formatTime';
import { InlineStringInput } from '../../FormComponents';
// types
import { NodeType, LabelType, ViewType } from '../../gsnTypes';

PreviousViewItem.propTypes = {
    isReadOnly: PropTypes.bool,
    model: PropTypes.arrayOf(NodeType).isRequired,
    labels: PropTypes.arrayOf(LabelType).isRequired,
    view: ViewType,
    setActiveView: PropTypes.func,
    onDeleteView: PropTypes.func,
    onRenameView: PropTypes.func,
};

export default function PreviousViewItem({
    isReadOnly,
    model,
    labels,
    view,
    setActiveView,
    onDeleteView,
    onRenameView,
}) {
    const graphData = useMemo(() => applyViewToModel(model, labels, view), [model, view, labels]);
    const valid = useMemo(() => checkViewExpression(view.expression, labels), [view.expression, labels]);

    return (
        <Card sx={{ minWidth: 275 }}>
            <CardHeader
                action={
                    valid.valid ? null : (
                        <div title={`Expression "${view.expression}" is not valid: ${valid.hint}`}>
                            <WarningIcon />
                        </div>
                    )
                }
                title={
                    <InlineStringInput
                        fullWidth
                        label="Name"
                        isReadOnly={isReadOnly}
                        initialValue={view.name || view.expression || 'No expression ..'}
                        onSubmit={(val) => {
                            if (!val) {
                                onRenameView(view.id, view.expression);
                            } else if (val !== view.name) {
                                onRenameView(view.id, val);
                            }
                        }}
                    />
                }
                subheader={fToNow(view.timestamp)}
            />
            <CardContent>
                <div
                    role="button"
                    style={{ margin: '0 auto', width: 300, height: 150 }}
                    tabIndex={-1}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') setActiveView(view);
                    }}
                    onClick={() => setActiveView(view)}
                >
                    <GSNGraph nonReactive width={300} height={150} data={graphData} />
                </div>
            </CardContent>
            <CardActions>
                <Button variant="text" size="small" onClick={() => setActiveView(view)}>
                    APPLY
                </Button>
                <Button
                    color="error"
                    disabled={isReadOnly}
                    variant="text"
                    size="small"
                    onClick={() => onDeleteView(view.id)}
                >
                    DELETE
                </Button>
            </CardActions>
        </Card>
    );
}

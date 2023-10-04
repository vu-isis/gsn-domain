import { Typography, Grid } from '@mui/material';
import CopyrightVandy from '../CopyrightVandy';

export default function NoSelectionInfo() {
    return (
        <>
            <Grid container spacing={2} style={{ padding: 10 }}>
                <Grid item xs={12}>
                    <Typography variant="h6" component="div">
                        GSN Assurance
                    </Typography>
                </Grid>
                <Grid item xs={12}>
                    <Typography variant="body2" component="div">
                        Navigate down the assurance case tree by expanding the sub-goals. Holding down Ctrl will
                        expand/collapse all sub-goals recurisvely.
                    </Typography>
                </Grid>
                <Grid item xs={12}>
                    <Typography variant="body2" component="div">
                        Use the control-menu (bottom left corner) for additional actions, e.g. exapnd all nodes, export
                        graph as svg, fit screen, etc.
                    </Typography>
                </Grid>
            </Grid>
            <CopyrightVandy />
        </>
    );
}

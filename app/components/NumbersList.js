import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Grid,
    Paper,
} from '@mui/material';

const NumbersList = ({ combinations }) => {
    if (!combinations || combinations.length === 0) {
        return (
            <Card>
                <CardContent>
                    <Typography color="textSecondary">
                        No prediction data available
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Generated Combinations
                </Typography>
                <Grid container spacing={2}>
                    {combinations.map((combination, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                            <Paper elevation={3} style={{ padding: '16px' }}>
                                <Box
                                    display="flex"
                                    justifyContent="center"
                                    alignItems="center"
                                >
                                    {/* Column for First Number */}
                                    <Box
                                        display="flex"
                                        flexDirection="column"
                                        alignItems="center"
                                        mx={2}
                                    >
                                        <Typography variant="h4">
                                            {combination.numbers[0]}
                                        </Typography>
                                        <Typography variant="subtitle1" color="textSecondary">
                                            {combination.movements[0]}
                                        </Typography>
                                        <Typography variant="subtitle1" color="textSecondary">
                                            {combination.currentNumbers[0]}
                                        </Typography>
                                        <Typography variant="subtitle1" color="textSecondary">
                                            {combination.currentMovements[0]}
                                        </Typography>
                                        <Typography variant="subtitle1" color="textSecondary">
                                            {combination.previousNumbers1[0]}
                                        </Typography>
                                        <Typography variant="subtitle1" color="textSecondary">
                                            {combination.previousMovements1[0]}
                                        </Typography>
                                        <Typography variant="subtitle1" color="textSecondary">
                                            {combination.previousNumbers2[0]}
                                        </Typography>
                                    </Box>

                                    {/* Column for Second Number */}
                                    <Box
                                        display="flex"
                                        flexDirection="column"
                                        alignItems="center"
                                        mx={2}
                                    >
                                        <Typography variant="h4">
                                            {combination.numbers[1]}
                                        </Typography>
                                        <Typography variant="subtitle1" color="textSecondary">
                                            {combination.movements[1]}
                                        </Typography>
                                        <Typography variant="subtitle1" color="textSecondary">
                                            {combination.currentNumbers[1]}
                                        </Typography>
                                        <Typography variant="subtitle1" color="textSecondary">
                                            {combination.currentMovements[1]}
                                        </Typography>
                                        <Typography variant="subtitle1" color="textSecondary">
                                            {combination.previousNumbers1[1]}
                                        </Typography>
                                        <Typography variant="subtitle1" color="textSecondary">
                                            {combination.previousMovements1[1]}
                                        </Typography>
                                        <Typography variant="subtitle1" color="textSecondary">
                                            {combination.previousNumbers2[1]}
                                        </Typography>
                                    </Box>

                                    {/* Column for Third Number */}
                                    <Box
                                        display="flex"
                                        flexDirection="column"
                                        alignItems="center"
                                        mx={2}
                                    >
                                        <Typography variant="h4">
                                            {combination.numbers[2]}
                                        </Typography>
                                        <Typography variant="subtitle1" color="textSecondary">
                                            {combination.movements[2]}
                                        </Typography>
                                        <Typography variant="subtitle1" color="textSecondary">
                                            {combination.currentNumbers[2]}
                                        </Typography>
                                        <Typography variant="subtitle1" color="textSecondary">
                                            {combination.currentMovements[2]}
                                        </Typography>
                                        <Typography variant="subtitle1" color="textSecondary">
                                            {combination.previousNumbers1[2]}
                                        </Typography>
                                        <Typography variant="subtitle1" color="textSecondary">
                                            {combination.previousMovements1[2]}
                                        </Typography>
                                        <Typography variant="subtitle1" color="textSecondary">
                                            {combination.previousNumbers2[2]}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            </CardContent>
        </Card>
    );
};

export default NumbersList;





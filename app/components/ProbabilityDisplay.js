import React from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    LinearProgress,
    Paper,
    Divider,
    styled
} from '@mui/material';

const StyledCard = styled(Card)(({ theme }) => ({
    height: '100%',
    transition: 'transform 0.2s',
    '&:hover': {
        transform: 'scale(1.02)',
    },
}));

const ProgressLabel = styled(Typography)(({ theme }) => ({
    marginBottom: theme.spacing(1),
    display: 'flex',
    justifyContent: 'space-between',
}));

const StyledLinearProgress = styled(LinearProgress)(({ theme }) => ({
    height: 10,
    borderRadius: 5,
}));

const ProbabilityDisplay = () => {
    const individualProbabilities = [
        {
            position: 'First Number',
            range: '[0,1,2]',
            accuracy: 66.99,
            fraction: '406/606',
        },
        {
            position: 'Second Number',
            range: '[3,4,5,6]',
            accuracy: 59.24,
            fraction: '359/606',
        },
        {
            position: 'Third Number',
            range: '[7,8,9]',
            accuracy: 65.35,
            fraction: '396/606',
        },
    ];

    const combinationProbabilities = [
        {
            combination: 'First and Second Numbers',
            ranges: '[0,1,2] and [3,4,5,6]',
            probability: 37.29,
            fraction: '226/606',
        },
        {
            combination: 'First and Third Numbers',
            ranges: '[0,1,2] and [7,8,9]',
            probability: 41.58,
            fraction: '252/606',
        },
        {
            combination: 'Second and Third Numbers',
            ranges: '[3,4,5,6] and [7,8,9]',
            probability: 39.11,
            fraction: '237/606',
        },
        {
            combination: 'All Three Numbers',
            ranges: 'All in respective ranges',
            probability: 22.77,
            fraction: '138/606',
        },
    ];

    return (
        <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
                {/* Individual Probabilities Section */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h5" gutterBottom>
                            Analysis of Probabilities for Each Position
                        </Typography>
                        <Grid container spacing={3}>
                            {individualProbabilities.map((item, index) => (
                                <Grid item xs={12} md={4} key={index}>
                                    <StyledCard>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                {item.position}
                                            </Typography>
                                            <Typography variant="subtitle1" color="textSecondary">
                                                Range: {item.range}
                                            </Typography>
                                            <Box sx={{ mt: 2 }}>
                                                <ProgressLabel>
                                                    <span>Accuracy</span>
                                                    <span>{item.accuracy}% ({item.fraction})</span>
                                                </ProgressLabel>
                                                <StyledLinearProgress
                                                    variant="determinate"
                                                    value={item.accuracy}
                                                    color="primary"
                                                />
                                            </Box>
                                        </CardContent>
                                    </StyledCard>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                </Grid>

                {/* Combination Probabilities Section */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h5" gutterBottom>
                            Combination Probabilities
                        </Typography>
                        <Grid container spacing={3}>
                            {combinationProbabilities.map((item, index) => (
                                <Grid item xs={12} md={6} key={index}>
                                    <StyledCard>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                {item.combination}
                                            </Typography>
                                            <Typography variant="subtitle1" color="textSecondary">
                                                Ranges: {item.ranges}
                                            </Typography>
                                            <Box sx={{ mt: 2 }}>
                                                <ProgressLabel>
                                                    <span>Probability</span>
                                                    <span>{item.probability}% ({item.fraction})</span>
                                                </ProgressLabel>
                                                <StyledLinearProgress
                                                    variant="determinate"
                                                    value={item.probability}
                                                    color="secondary"
                                                />
                                            </Box>
                                        </CardContent>
                                    </StyledCard>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ProbabilityDisplay;
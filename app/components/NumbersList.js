import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Grid,
    Paper,
    Divider,
    styled,
    Chip,
    Tooltip,
} from '@mui/material';
import {
    TrendingUp,
    TrendingDown,
    TrendingFlat,
    CheckCircle,
    Cancel,
} from '@mui/icons-material';
import ConnectionsVisualizer from "@/app/components/ConnectionsVisualizer";

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
    height: '100%',
    background: 'linear-gradient(to bottom, #ffffff, #f8f9fa)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.shadows[8],
    },
}));

const PredictionNumber = styled(Typography)(({ theme }) => ({
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: theme.palette.primary.main,
    marginBottom: theme.spacing(1),
}));

const MovementChip = styled(Chip)(({ trend, theme }) => ({
    margin: theme.spacing(1, 0),
    backgroundColor: trend === 'up'
        ? theme.palette.success.light
        : trend === 'down'
            ? theme.palette.error.light
            : theme.palette.grey[300],
    '& .MuiChip-icon': {
        color: trend === 'up'
            ? theme.palette.success.dark
            : trend === 'down'
                ? theme.palette.error.dark
                : theme.palette.grey[700],
    },
}));

const HistoryBox = styled(Box)(({ theme }) => ({
    marginTop: theme.spacing(2),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.grey[50],
    borderRadius: theme.shape.borderRadius,
}));

const RangeIndicator = styled(Box)(({ inrange, theme }) => ({
    backgroundColor: inrange === 'true'
        ? theme.palette.success.light
        : 'transparent',
    padding: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
}));

const PatternChip = styled(Chip)(({ count, theme }) => ({
    margin: theme.spacing(0.5),
    backgroundColor: count === 3
        ? theme.palette.success.light
        : count === 2
            ? theme.palette.info.light
            : count === 1
                ? theme.palette.warning.light
                : theme.palette.error.light,
}));

const NumbersList = ({ combinations }) => {
    const getMovementIcon = (movement) => {
        if (movement.toLowerCase().includes('up')) return <TrendingUp />;
        if (movement.toLowerCase().includes('down')) return <TrendingDown />;
        return <TrendingFlat />;
    };

    const getMovementTrend = (movement) => {
        if (movement.toLowerCase().includes('up')) return 'up';
        if (movement.toLowerCase().includes('down')) return 'down';
        return 'flat';
    };

    const isInRange = (number, position) => {
        if (position === 0) return [0, 1, 2].includes(Number(number));
        if (position === 1) return [3, 4, 5, 6].includes(Number(number));
        if (position === 2) return [7, 8, 9].includes(Number(number));
        return false;
    };

    const analyzeRangePattern = (numbers) => {
        const inRange = numbers.map((num, idx) => isInRange(num, idx));
        const count = inRange.filter(Boolean).length;

        let pattern = '';
        if (count === 3) {
            pattern = 'All numbers in range';
        } else if (count === 2) {
            if (inRange[0] && inRange[1]) pattern = '1st & 2nd in range';
            else if (inRange[0] && inRange[2]) pattern = '1st & 3rd in range';
            else if (inRange[1] && inRange[2]) pattern = '2nd & 3rd in range';
        } else if (count === 1) {
            pattern = 'One number in range';
        } else {
            pattern = 'No numbers in range';
        }

        return { count, pattern };
    };

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
        <Card elevation={0} sx={{ backgroundColor: 'transparent' }}>
            <CardContent>

                <ConnectionsVisualizer combinations={combinations} />

                <Grid container spacing={3}>
                    {combinations.map((combination, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                            <StyledPaper elevation={3}>
                                {/* Prediction Section */}
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="overline" color="primary" gutterBottom>
                                        Prediction #{index + 1}
                                    </Typography>
                                    <Box display="flex" justifyContent="space-around" sx={{ mb: 2 }}>
                                        {combination.numbers.map((number, idx) => (
                                            <Box key={idx} textAlign="center">
                                                <PredictionNumber>
                                                    {number}
                                                </PredictionNumber>
                                                <MovementChip
                                                    icon={getMovementIcon(combination.movements[idx])}
                                                    label={combination.movements[idx]}
                                                    trend={getMovementTrend(combination.movements[idx])}
                                                    size="small"
                                                />
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>

                                <Divider sx={{ my: 2 }} />

                                {/* Historical Data Section */}
                                <Typography variant="overline" color="textSecondary" gutterBottom>
                                    Historical Data
                                </Typography>
                                <HistoryBox>
                                    {[
                                        {
                                            numbers: combination.currentNumbers,
                                            movements: combination.currentMovements,
                                            label: 'Current'
                                        },
                                        {
                                            numbers: combination.previousNumbers1,
                                            movements: combination.previousMovements1,
                                            label: 'Previous 1'
                                        },
                                        {
                                            numbers: combination.previousNumbers2,
                                            movements: combination.previousMovements2,
                                            label: 'Previous 2'
                                        },
                                        {
                                            numbers: combination.previousNumbers3,
                                            movements: combination.previousMovements3,
                                            label: 'Previous 3'
                                        }
                                    ].map((history, historyIndex) => {
                                        const rangePattern = analyzeRangePattern(history.numbers);
                                        return (
                                            <Box key={historyIndex} sx={{ mb: 3 }}>
                                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                                    <Typography variant="caption" color="textSecondary">
                                                        {history.label}
                                                    </Typography>
                                                    <PatternChip
                                                        label={rangePattern.pattern}
                                                        size="small"
                                                        count={rangePattern.count}
                                                    />
                                                </Box>
                                                <Box display="flex" justifyContent="space-around" sx={{ mt: 1 }}>
                                                    {history.numbers.map((num, numIndex) => (
                                                        <Tooltip
                                                            key={numIndex}
                                                            title={`Range ${numIndex === 0 ? '[0,1,2]' : numIndex === 1 ? '[3,4,5,6]' : '[7,8,9]'}`}
                                                        >
                                                            <RangeIndicator
                                                                inrange={isInRange(num, numIndex).toString()}
                                                            >
                                                                <Box textAlign="center">
                                                                    <Typography variant="h6" fontWeight="medium">
                                                                        {num}
                                                                    </Typography>
                                                                    {history.movements && (
                                                                        <Typography variant="h6" color="textSecondary">
                                                                            {history.movements[numIndex]}
                                                                        </Typography>
                                                                    )}
                                                                </Box>
                                                            </RangeIndicator>
                                                        </Tooltip>
                                                    ))}
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </HistoryBox>
                            </StyledPaper>
                        </Grid>
                    ))}
                </Grid>
            </CardContent>
        </Card>
    );
};

export default NumbersList;
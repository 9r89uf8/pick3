import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Grid,
    Box,
    Chip,
    Tooltip,
    styled,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
    CheckCircleOutline,
    Cancel,
    Today,
    AccessTime,
} from '@mui/icons-material';

const StyledCard = styled(Card)(({ theme }) => ({
    width: '100%',
    background: `linear-gradient(135deg, 
        ${alpha(theme.palette.primary.dark, 0.8)}, 
        ${alpha(theme.palette.primary.main, 0.6)})`,
    backdropFilter: 'blur(10px)',
    borderRadius: theme.spacing(2),
    border: `1px solid ${alpha('#ffffff', 0.2)}`,
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}`,
    },
}));

const NumberBox = styled(Box)(({ assignedrange, theme }) => ({
    padding: theme.spacing(1),
    borderRadius: theme.spacing(1),
    backgroundColor: assignedrange
        ? alpha(theme.palette.success.main, 0.2)
        : alpha(theme.palette.error.main, 0.1),
    border: `1px solid ${assignedrange
        ? theme.palette.success.main
        : theme.palette.error.main}`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '60px',
}));

const PatternChip = styled(Chip)(({ isvalid, theme }) => ({
    backgroundColor: isvalid === 'true'
        ? alpha(theme.palette.success.main, 0.9)
        : alpha(theme.palette.error.main, 0.9),
    color: '#ffffff',
    fontWeight: 'bold',
    marginTop: theme.spacing(1),
}));

const DrawList = ({ draws }) => {
    const RANGES = {
        range1: { min: 0, max: 3, label: '[0-3]' },
        range2: { min: 2, max: 7, label: '[2-7]' },
        range3: { min: 6, max: 9, label: '[6-9]' }
    };

    const getNumberRanges = (num) => {
        const matches = [];
        if (num >= RANGES.range1.min && num <= RANGES.range1.max) matches.push('range1');
        if (num >= RANGES.range2.min && num <= RANGES.range2.max) matches.push('range2');
        if (num >= RANGES.range3.min && num <= RANGES.range3.max) matches.push('range3');
        return matches;
    };

    const analyzeRangePattern = (numbers) => {
        const nums = numbers.map(n => parseInt(n));

        // Get all possible range matches for each number
        const numberPossibilities = nums.map(num => ({
            number: num,
            possibleRanges: getNumberRanges(num)
        }));

        // Try to assign exactly one number to each range
        const rangeAssignments = new Map(); // range -> number
        const numberAssignments = new Map(); // number -> range

        // Helper function to try all possible assignments
        const tryAssignments = (index) => {
            if (index === nums.length) {
                // Check if we have exactly one number in each range
                return rangeAssignments.size === 3 &&
                    ['range1', 'range2', 'range3'].every(r => rangeAssignments.has(r));
            }

            const currentNumber = numberPossibilities[index].number;
            const possibleRanges = numberPossibilities[index].possibleRanges;

            for (const range of possibleRanges) {
                if (!rangeAssignments.has(range)) {
                    // Try this assignment
                    rangeAssignments.set(range, currentNumber);
                    numberAssignments.set(currentNumber, range);

                    if (tryAssignments(index + 1)) {
                        return true;
                    }

                    // Undo assignment if it didn't work
                    rangeAssignments.delete(range);
                    numberAssignments.delete(currentNumber);
                }
            }

            return tryAssignments(index + 1);
        };

        // Try to find a valid assignment
        const isValid = tryAssignments(0);

        return {
            isValid,
            numberAssignments: nums.map(num => numberAssignments.get(num) || null),
            pattern: isValid ? 'Valid Pattern - One number in each range' : 'Invalid Pattern'
        };
    };

    return (
        <Grid container spacing={2} sx={{ p: 2 }}>
            {draws && draws.length > 0 && draws.slice(0, 60).map((item, index) => {
                const numbers = [
                    item.originalFirstNumber.toString(),
                    item.originalSecondNumber.toString(),
                    item.originalThirdNumber.toString()
                ];
                const analysis = analyzeRangePattern(numbers);

                return (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                        <StyledCard elevation={4}>
                            <CardContent>
                                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
                                    {numbers.map((num, idx) => (
                                        <Tooltip
                                            key={idx}
                                            title={analysis.numberAssignments[idx]
                                                ? `Assigned to range: ${RANGES[analysis.numberAssignments[idx]].label}`
                                                : 'Not assigned to any range'}
                                        >
                                            <NumberBox assignedrange={analysis.numberAssignments[idx]}>
                                                <Typography variant="h4" color="white">
                                                    {num}
                                                </Typography>
                                                {analysis.numberAssignments[idx] ? (
                                                    <CheckCircleOutline
                                                        sx={{ color: 'success.light', mt: 0.5 }}
                                                    />
                                                ) : (
                                                    <Cancel
                                                        sx={{ color: 'error.light', mt: 0.5 }}
                                                    />
                                                )}
                                            </NumberBox>
                                        </Tooltip>
                                    ))}
                                </Box>

                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 1
                                }}>
                                    <PatternChip
                                        label={analysis.pattern}
                                        isvalid={analysis.isValid.toString()}
                                    />

                                    <Typography variant="body2" color="white" sx={{ mt: 1, textAlign: 'center' }}>
                                        Need exactly one number in each range: [0-3], [2-7], [6-9]
                                    </Typography>

                                    <Box sx={{
                                        display: 'flex',
                                        gap: 2,
                                        mt: 2,
                                        color: 'white',
                                        opacity: 0.8
                                    }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Today fontSize="small" />
                                            <Typography variant="body2">
                                                {item.drawDate}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <AccessTime fontSize="small" />
                                            <Typography variant="body2">
                                                {item.time}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </CardContent>
                        </StyledCard>
                    </Grid>
                );
            })}
        </Grid>
    );
};

export default DrawList;
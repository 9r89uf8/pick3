import React from 'react';
import {
    ListItem,
    Card,
    CardContent,
    Typography,
    Grid,
    Box,
    Chip,
    Tooltip,
    styled,
    Paper,
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

const NumberBox = styled(Box)(({ inrange, theme }) => ({
    padding: theme.spacing(1),
    borderRadius: theme.spacing(1),
    backgroundColor: inrange === 'true'
        ? alpha(theme.palette.success.main, 0.2)
        : 'transparent',
    border: `1px solid ${inrange === 'true'
        ? theme.palette.success.main
        : alpha('#ffffff', 0.2)}`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '60px',
}));

const PatternChip = styled(Chip)(({ count, theme }) => ({
    backgroundColor: count === 3
        ? alpha(theme.palette.success.main, 0.9)
        : count === 2
            ? alpha(theme.palette.info.main, 0.9)
            : count === 1
                ? alpha(theme.palette.warning.main, 0.9)
                : alpha(theme.palette.error.main, 0.9),
    color: '#ffffff',
    fontWeight: 'bold',
    marginTop: theme.spacing(1),
}));

const DrawList = ({ draws }) => {
    const isInRange = (number, position) => {
        const num = parseInt(number);
        if (position === 0) return [0, 1, 2].includes(num);
        if (position === 1) return [3, 4, 5, 6].includes(num);
        if (position === 2) return [7, 8, 9].includes(num);
        return false;
    };

    const analyzeRangePattern = (numbers) => {
        const inRange = numbers.map((num, idx) => isInRange(num, idx));
        const count = inRange.filter(Boolean).length;

        let pattern = '';
        if (count === 3) {
            pattern = 'All in Range';
        } else if (count === 2) {
            const positions = inRange
                .map((val, idx) => val ? idx + 1 : null)
                .filter(pos => pos !== null)
                .join(' & ');
            pattern = `Positions ${positions} in Range`;
        } else if (count === 1) {
            pattern = 'One in Range';
        } else {
            pattern = 'None in Range';
        }

        return { count, pattern };
    };

    return (
        <Grid container spacing={2} sx={{ p: 2 }}>
            {draws && draws.length > 0 && draws.slice(0, 60).map((item, index) => {
                const numbers = item.currentDraw.split('');
                const rangePattern = analyzeRangePattern(numbers);

                return (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                        <StyledCard elevation={4}>
                            <CardContent>
                                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
                                    {numbers.map((num, idx) => (
                                        <Tooltip
                                            key={idx}
                                            title={`Expected Range: ${idx === 0 ? '[0,1,2]' : idx === 1 ? '[3,4,5,6]' : '[7,8,9]'}`}
                                        >
                                            <NumberBox inrange={isInRange(num, idx).toString()}>
                                                <Typography variant="h4" color="white">
                                                    {num}
                                                </Typography>
                                                {isInRange(num, idx) ? (
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
                                        label={rangePattern.pattern}
                                        count={rangePattern.count}
                                    />

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

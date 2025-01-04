import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Grid,
    Box,
    Chip,
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

const NumberBox = styled(Box)(({ isvalid, theme }) => ({
    padding: theme.spacing(1),
    borderRadius: theme.spacing(1),
    backgroundColor: isvalid
        ? alpha(theme.palette.success.main, 0.2)
        : alpha(theme.palette.error.main, 0.1),
    border: `1px solid ${isvalid
        ? theme.palette.success.main
        : theme.palette.error.main}`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '60px',
}));

const StatusChip = styled(Chip)(({ isvalid, theme }) => ({
    backgroundColor: isvalid
        ? alpha(theme.palette.success.main, 0.9)
        : alpha(theme.palette.error.main, 0.9),
    color: '#ffffff',
    fontWeight: 'bold',
    marginTop: theme.spacing(1),
}));

const DrawList = ({ draws }) => {
    const validateNumbers = (numbers) => {
        const [first, second, third] = numbers.map(Number);

        const firstValid = first >= 0 && first <= 3;
        const secondValid = second >= 2 && second <= 7 && second > first && second < third;
        const thirdValid = third >= 6 && third <= 9 && third > second;

        return {
            firstValid,
            secondValid,
            thirdValid,
            isValid: firstValid && secondValid && thirdValid
        };
    };

    return (
        <Grid container spacing={2} sx={{ p: 2 }}>
            {draws?.slice(0, 60).map((item, index) => {
                const numbers = [
                    item.sortedFirstNumber.toString(),
                    item.sortedSecondNumber.toString(),
                    item.sortedThirdNumber.toString()
                ];
                const validation = validateNumbers(numbers);

                return (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                        <StyledCard elevation={4}>
                            <CardContent>
                                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
                                    {numbers.map((num, idx) => (
                                        <NumberBox
                                            key={idx}
                                            isvalid={
                                                (idx === 0 && validation.firstValid) ||
                                                (idx === 1 && validation.secondValid) ||
                                                (idx === 2 && validation.thirdValid)
                                            }
                                        >
                                            <Typography variant="h4" color="white">
                                                {num}
                                            </Typography>
                                            {(idx === 0 && validation.firstValid) ||
                                            (idx === 1 && validation.secondValid) ||
                                            (idx === 2 && validation.thirdValid) ? (
                                                <CheckCircleOutline
                                                    sx={{ color: 'success.light', mt: 0.5 }}
                                                />
                                            ) : (
                                                <Cancel
                                                    sx={{ color: 'error.light', mt: 0.5 }}
                                                />
                                            )}
                                        </NumberBox>
                                    ))}
                                </Box>

                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 1
                                }}>
                                    <StatusChip
                                        label={validation.isValid ? 'Valid Pattern' : 'Invalid Pattern'}
                                        isvalid={validation.isValid}
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
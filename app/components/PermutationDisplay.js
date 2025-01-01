import React from 'react';
import { Card, CardHeader, CardContent, Box, Typography } from '@mui/material';

const PERMUTATION_COLORS = {
    'L-M-H': '#FF6B6B',
    'L-H-M': '#4ECDC4',
    'M-L-H': '#45B7D1',
    'M-H-L': '#00103a',
    'H-L-M': '#8f0000',
    'H-M-L': '#D4A5A5'
};

const PermutationDisplay = ({displayData}) => {
    // Get last 10 permutations in reverse order (most recent first)
    const recentPermutations = displayData.orderedPermutations
        .slice(0, 10);

    return (
        <Card>
            <CardHeader
                title={
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Recent Permutations
                    </Typography>
                }
            />
            <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {recentPermutations.map((item, index) => (
                        <Box
                            key={index}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                p: 1.5,
                                borderRadius: 1,
                                bgcolor: '#f5f5f5',
                                boxShadow: 1
                            }}
                        >
                            <Typography
                                sx={{
                                    flex: 1,
                                    textAlign: 'center',
                                    fontWeight: 500
                                }}
                            >
                                {item.permutation}
                            </Typography>
                            <Box
                                sx={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    bgcolor: PERMUTATION_COLORS[item.permutation],
                                    ml: 2
                                }}
                            />
                        </Box>
                    ))}
                </Box>
            </CardContent>
        </Card>
    );
};

export default PermutationDisplay;
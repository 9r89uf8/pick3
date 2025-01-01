import React, { useEffect, useState } from 'react';
import { useStore } from '@/app/store/store';
import {
    Typography,
    CircularProgress,
    Paper,
    Grid,
    Box,
    Button,
} from '@mui/material';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar,
} from 'recharts';
import { getDisplayData, createDisplay } from '@/app/services/historyService';
import PermutationDisplay from "@/app/components/PermutationDisplay";
const PERMUTATION_COLORS = {
    'L-M-H': '#FF6B6B',
    'L-H-M': '#4ECDC4',
    'M-L-H': '#45B7D1',
    'M-H-L': '#96CEB4',
    'H-L-M': '#FFEEAD',
    'H-M-L': '#D4A5A5'
};

const DisplayData = () => {
    const displayData = useStore((state) => state.display);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDisplayData = async () => {
            setLoading(true);
            try {
                await getDisplayData();
            } catch (error) {
                console.error('Error fetching number frequency:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDisplayData();
    }, []);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Loading...</Typography>
            </Box>
        );
    }

    // Prepare data for permutation counts chart
    const permutationData = displayData?.permutationCounts ? [
        { name: 'L-M-H', value: displayData.permutationCounts['L-M-H'] },
        { name: 'L-H-M', value: displayData.permutationCounts['L-H-M'] },
        { name: 'M-L-H', value: displayData.permutationCounts['M-L-H'] },
        { name: 'M-H-L', value: displayData.permutationCounts['M-H-L'] },
        { name: 'H-L-M', value: displayData.permutationCounts['H-L-M'] },
        { name: 'H-M-L', value: displayData.permutationCounts['H-M-L'] },
    ] : [];

    // Map L/M/H to numeric values for the line charts
    const getPositionValue = (pos) => {
        switch(pos) {
            case 'L': return 1;
            case 'M': return 2;
            case 'H': return 3;
            default: return 0;
        }
    };

    // Prepare data for position trends - reverse order so latest draw is last
    const positionData = displayData?.orderedPermutations
        ?.slice()
        .reverse()
        .map((draw, index) => ({
            name: index + 1,
            position0: getPositionValue(draw.positions.position0),
            position1: getPositionValue(draw.positions.position1),
            position2: getPositionValue(draw.positions.position2),
            // Add original values for tooltip
            label0: draw.positions.position0,
            label1: draw.positions.position1,
            label2: draw.positions.position2,
        })) || [];

    const update = async () => {
        await createDisplay();
    };

    return (
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', flexGrow: 1, gap: 4, p: 2 }}>
            <Paper sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2} alignItems="center" justifyContent="center">
                    <Grid item xs={12} sx={{ textAlign: 'center' }}>
                        {displayData?.latestDraw && (
                            <>
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    gap: 2,
                                    mb: 1
                                }}>
                                    {/*<Typography variant="subtitle1" fontWeight="bold">*/}
                                    {/*    Latest Draw:*/}
                                    {/*</Typography>*/}
                                    <Box sx={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        gap: 1
                                    }}>
                                        {displayData.latestDraw.numbers.map((num, idx) => (
                                            <Typography
                                                key={idx}
                                                sx={{
                                                    bgcolor: 'primary.main',
                                                    color: 'white',
                                                    px: 2,
                                                    py: 0.5,
                                                    borderRadius: 1,
                                                    minWidth: 32,
                                                    textAlign: 'center'
                                                }}
                                            >
                                                {num}
                                            </Typography>
                                        ))}
                                    </Box>
                                    <Typography color="text.secondary">
                                        {displayData.latestDraw.drawDate} - {displayData.latestDraw.time}
                                    </Typography>
                                </Box>
                                {displayData?.createdAt && (
                                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                                        Last Updated: {new Date(displayData.createdAt).toLocaleString()}
                                    </Typography>
                                )}
                            </>
                        )}
                    </Grid>
                    <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Button variant="contained" onClick={update}>
                            Update Display
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* Permutation Counts Chart */}
            <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Permutation Counts
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={permutationData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                </ResponsiveContainer>
            </Paper>

            {/* Position Trends */}
            <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Position Trends
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" gutterBottom>
                            Position 0 Trends
                        </Typography>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={positionData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis domain={[0, 4]} ticks={[1, 2, 3]} tickFormatter={(value) => {
                                    switch(value) {
                                        case 1: return 'L';
                                        case 2: return 'M';
                                        case 3: return 'H';
                                        default: return '';
                                    }
                                }}/>
                                <Tooltip formatter={(value, name) => {
                                    switch(value) {
                                        case 1: return 'L';
                                        case 2: return 'M';
                                        case 3: return 'H';
                                        default: return '';
                                    }
                                }}/>
                                <Line type="monotone" dataKey="position0" stroke="#8884d8" />
                            </LineChart>
                        </ResponsiveContainer>
                    </Grid>

                    {/* Position 1 Chart */}
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" gutterBottom>
                            Position 1 Trends
                        </Typography>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={positionData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis domain={[0, 4]} ticks={[1, 2, 3]} tickFormatter={(value) => {
                                    switch(value) {
                                        case 1: return 'L';
                                        case 2: return 'M';
                                        case 3: return 'H';
                                        default: return '';
                                    }
                                }}/>
                                <Tooltip formatter={(value, name) => {
                                    switch(value) {
                                        case 1: return 'L';
                                        case 2: return 'M';
                                        case 3: return 'H';
                                        default: return '';
                                    }
                                }}/>
                                <Line type="monotone" dataKey="position1" stroke="#82ca9d" />
                            </LineChart>
                        </ResponsiveContainer>
                    </Grid>

                    {/* Position 2 Chart */}
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" gutterBottom>
                            Position 2 Trends
                        </Typography>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={positionData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis domain={[0, 4]} ticks={[1, 2, 3]} tickFormatter={(value) => {
                                    switch(value) {
                                        case 1: return 'L';
                                        case 2: return 'M';
                                        case 3: return 'H';
                                        default: return '';
                                    }
                                }}/>
                                <Tooltip formatter={(value, name) => {
                                    switch(value) {
                                        case 1: return 'L';
                                        case 2: return 'M';
                                        case 3: return 'H';
                                        default: return '';
                                    }
                                }}/>
                                <Line type="monotone" dataKey="position2" stroke="#ffc658" />
                            </LineChart>
                        </ResponsiveContainer>
                    </Grid>
                </Grid>
            </Paper>
            <PermutationDisplay displayData={displayData}/>
        </Box>
    );
};

export default DisplayData;
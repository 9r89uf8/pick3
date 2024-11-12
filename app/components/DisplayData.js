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
} from 'recharts';
import { getDisplayData, createDisplay } from '@/app/services/historyService';

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

    // Prepare data as before...
    const firstNumbers = displayData.last8FirstNumbers.slice().reverse();
    const secondNumbers = displayData.last8SecondNumbers.slice().reverse();
    const thirdNumbers = displayData.last8ThirdNumbers.slice().reverse();

    const movementFirst = displayData.lastMovementsFirstNumber.slice().reverse();
    const movementSecond = displayData.lastMovementsSecondNumber.slice().reverse();
    const movementThird = displayData.lastMovementsThirdNumber.slice().reverse();

    const data = firstNumbers.map((_, index) => ({
        name: index + 1,
        firstNumber: firstNumbers[index],
        secondNumber: secondNumbers[index],
        thirdNumber: thirdNumbers[index]
    }));

    const movementMap = { Up: 1, Equal: 0, Down: -1 };
    const movementData = movementFirst.map((_, index) => ({
        name: index + 1,
        firstMovement: movementMap[movementFirst[index]],
        secondMovement: movementMap[movementSecond[index]],
        thirdMovement: movementMap[movementThird[index]],
    }));

    const update = async () => {
        await createDisplay();
    };

    return (
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
            {/* Latest Draw Information */}
            <Paper sx={{ p: 2, mb: 3, width: '100%' }}>
                <Grid container spacing={2}>
                    <Grid
                        item
                        xs={12}
                        md={4}
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        <Box sx={{ mb: 2 }}>
                            <Button
                                variant="contained"
                                size="large"
                                onClick={update}
                                sx={{
                                    mb: 1,
                                    background: 'linear-gradient(to right, #f8f9fa, #e9ecef)',
                                    color: 'black',
                                }}
                            >
                                Create Latest
                            </Button>
                        </Box>
                        <Typography variant="h6" gutterBottom>
                            Latest Draw
                        </Typography>
                        <Typography>Date: {displayData.latestDrawDate}</Typography>
                        <Typography>Time: {displayData.latestDrawTime}</Typography>
                        <Typography>Numbers: {displayData.currentDraw}</Typography>
                        <Typography>Sum: {displayData.currentDrawSum}</Typography>
                    </Grid>
                </Grid>
            </Paper>


            {/* Numbers Line Chart */}
            <Paper sx={{ p: 2, mb: 3, width: '100%', height: '500px' }}>
                <Typography variant="h6" gutterBottom>
                    Number Trends (Last 8 Draws)
                </Typography>
                <Box sx={{ width: '100%', height: 'calc(100% - 40px)' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={data}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis domain={[0, 9]} tickCount={10} />
                            <Tooltip />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="firstNumber"
                                stroke="#c1121f"
                                activeDot={{ r: 8 }}
                                name="First Number"
                            />
                            <Line
                                type="monotone"
                                dataKey="secondNumber"
                                stroke="#82ca9d"
                                name="Second Number"
                            />
                            <Line
                                type="monotone"
                                dataKey="thirdNumber"
                                stroke="#ffc658"
                                name="Third Number"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </Box>
            </Paper>

            {/* Movement Chart */}
            <Paper sx={{ p: 2, mb: 3, width: '100%', height: '400px' }}>
                <Typography variant="h6" gutterBottom>
                    Number Movement Patterns
                </Typography>
                <Box sx={{ width: '100%', height: 'calc(100% - 40px)' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={movementData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis
                                domain={[-1, 1]}
                                ticks={[-1, 0, 1]}
                                tickFormatter={(value) => {
                                    if (value === -1) return 'Down';
                                    if (value === 0) return 'Equal';
                                    if (value === 1) return 'Up';
                                    return '';
                                }}
                            />
                            <Tooltip
                                formatter={(value) => {
                                    if (value === -1) return 'Down';
                                    if (value === 0) return 'Equal';
                                    if (value === 1) return 'Up';
                                    return '';
                                }}
                            />
                            <Legend
                                formatter={(value) => {
                                    if (value === 'firstMovement') return 'First Number Movement';
                                    if (value === 'secondMovement') return 'Second Number Movement';
                                    if (value === 'thirdMovement') return 'Third Number Movement';
                                    return value;
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="firstMovement"
                                stroke="#c1121f"
                                name="firstMovement"
                                strokeDasharray="5 5"
                                strokeWidth={2}
                            />
                            <Line
                                type="monotone"
                                dataKey="secondMovement"
                                stroke="#82ca9d"
                                fill="#82ca9d"
                                name="secondMovement"
                            />
                            <Line
                                type="monotone"
                                dataKey="thirdMovement"
                                stroke="#ffc658"
                                name="thirdMovement"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </Box>
            </Paper>
        </Box>
    );
};

export default DisplayData;

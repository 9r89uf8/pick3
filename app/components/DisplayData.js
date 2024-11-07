// components/NumberFrequencyChart.jsx
import React, { useEffect, useState } from 'react';
import { useStore } from '@/app/store/store';
import {
    Typography,
    CircularProgress,
    Paper,
    Grid,
    Box, Button,
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
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <CircularProgress />
                <Typography>Loading...</Typography>
            </div>
        );
    }

    // Reverse the arrays to maintain chronological order
    const firstNumbers = displayData.last8FirstNumbers.slice().reverse();
    const secondNumbers = displayData.last8SecondNumbers.slice().reverse();
    const thirdNumbers = displayData.last8ThirdNumbers.slice().reverse();

    const movementFirst = displayData.lastMovementsFirstNumber.slice().reverse();
    const movementSecond = displayData.lastMovementsSecondNumber.slice().reverse();
    const movementThird = displayData.lastMovementsThirdNumber.slice().reverse();

    // Prepare data for the number line chart
    const data = firstNumbers.map((_, index) => ({
        name: `Draw ${index + 1}`,
        firstNumber: firstNumbers[index],
        secondNumber: secondNumbers[index],
        thirdNumber: thirdNumbers[index]
    }));

    // Prepare data for the movements chart
    const movementMap = { Up: 1, Equal: 0, Down: -1 };
    const movementData = movementFirst.map((_, index) => ({
        name: `Draw ${index + 1}`,
        firstMovement: movementMap[movementFirst[index]],
        secondMovement: movementMap[movementSecond[index]],
        thirdMovement: movementMap[movementThird[index]],
    }));

    const update = async () => {
        await createDisplay()

    };

    return (
        <div>
            {/* Latest Draw Information */}
            <Paper style={{ padding: '16px', marginBottom: '24px' }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                        <div>
                            <Button
                                variant="contained"
                                color="primary"
                                size='large'
                                style={{margin: 5}}
                                onClick={() => update()}
                                sx={{
                                    background: 'linear-gradient(to right, #f8f9fa, #e9ecef)', // Green gradient
                                    color: 'black',
                                    // Add more styling as needed
                                }}
                            >
                                create latest
                            </Button>
                        </div>
                        <Typography variant="h6">Latest Draw</Typography>
                        <Typography>Date: {displayData.latestDrawDate}</Typography>
                        <Typography>Time: {displayData.latestDrawTime}</Typography>
                        <Typography>Numbers: {displayData.currentDraw}</Typography>
                        <Typography>Sum: {displayData.currentDrawSum}</Typography>
                    </Grid>
                    <Grid item xs={12} md={8}>
                        <Typography variant="h6">Winning Combinations</Typography>
                        <Box display="flex" flexWrap="wrap" gap={2}>
                            {displayData.winningCombinations.map((combo, index) => (
                                <Typography key={index} variant="body1">
                                    {combo}
                                </Typography>
                            ))}
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Numbers Line Chart */}
            <Paper style={{ padding: '16px', marginBottom: '32px' }}>
                <Typography variant="h6" gutterBottom>
                    Number Trends (Last 8 Draws)
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
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
                            stroke="#8884d8"
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
            </Paper>

            {/* Movement Chart */}
            <Paper style={{ padding: '16px' }}>
                <Typography variant="h6" gutterBottom>
                    Number Movement Patterns
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
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
                            stroke="#8884d8"
                            name="firstMovement"
                        />
                        <Line
                            type="monotone"
                            dataKey="secondMovement"
                            stroke="#82ca9d"
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
            </Paper>
        </div>
    );
};

export default DisplayData;

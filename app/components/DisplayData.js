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

    const data = firstNumbers.map((_, index) => ({
        name: index + 1,
        firstNumber: firstNumbers[index],
        secondNumber: secondNumbers[index],
        thirdNumber: thirdNumbers[index]
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
        </Box>
    );
};

export default DisplayData;

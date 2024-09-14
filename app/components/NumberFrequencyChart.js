// components/NumberFrequencyChart.jsx
import React, { useEffect, useState } from 'react';
import {getHistory} from "@/app/services/historyService";
import { useStore } from '@/app/store/store';
import {
    Card,
    CardContent,
    Typography,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

// Define month names and helper functions before the component
const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const getCurrentMonthIndex = () => new Date().getMonth();
const getCurrentMonth = () => monthNames[getCurrentMonthIndex()];
const getMonthsUpToCurrent = () =>
    monthNames.slice(0, getCurrentMonthIndex() + 1);

const NumberFrequencyChart = () => {
    const numberFrequency = useStore((state) => state.history);
    const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
    const [loading, setLoading] = useState(false);

    const months = getMonthsUpToCurrent();

    // Fetch data when the selected month changes
    useEffect(() => {
        const fetchNumberFrequency = async () => {
            setLoading(true);
            try {
                await getHistory({month:selectedMonth})
            } catch (error) {
                console.error('Error fetching number frequency:', error);
                setNumberFrequency(null);
            } finally {
                setLoading(false);
            }
        };

        fetchNumberFrequency();
    }, [selectedMonth]);

    // Convert numberFrequency object into an array of { number, frequency }
    let data = [];
    if (numberFrequency) {
        data = Object.keys(numberFrequency).map((number) => ({
            number: Number(number),
            frequency: numberFrequency[number],
        }));

        // Sort data by number
        data.sort((a, b) => a.number - b.number);
    }

    return (
        <Card
            sx={{
                minWidth: 275,
                textAlign: 'center',
                color: '#ffffff',
                background: 'rgba(16,16,16,0.8)',
                backdropFilter: 'blur(10px)',
                borderRadius: 4,
                border: `1px solid ${alpha('#ffffff', 0.2)}`,
                padding: 2,
            }}
        >
            <CardContent>
                <Typography variant="h5" gutterBottom>
                    Number Frequency
                </Typography>
                <FormControl
                    variant="outlined"
                    sx={{ minWidth: 120, marginBottom: 2, color: '#fff' }}
                >
                    <InputLabel
                        id="month-select-label"
                        sx={{ color: '#ffffff' }}
                    >
                        Month
                    </InputLabel>
                    <Select
                        labelId="month-select-label"
                        id="month-select"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        label="Month"
                        sx={{
                            color: '#ffffff',
                            '.MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(255, 255, 255, 0.5)',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#ffffff',
                            },
                            '.MuiSvgIcon-root ': {
                                fill: '#ffffff !important',
                            },
                        }}
                    >
                        {months.map((month) => (
                            <MenuItem key={month} value={month}>
                                {month}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                {loading ? (
                    <Typography variant="body1">Loading...</Typography>
                ) : numberFrequency ? (
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="number"
                                label={{
                                    value: 'Number',
                                    position: 'insideBottom',
                                    offset: -5,
                                }}
                            />
                            <YAxis
                                label={{
                                    value: 'Frequency',
                                    angle: -90,
                                    position: 'insideLeft',
                                }}
                            />
                            <Tooltip />
                            <Bar dataKey="frequency" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <Typography variant="body1">No data available</Typography>
                )}
            </CardContent>
        </Card>
    );
};

export default NumberFrequencyChart;



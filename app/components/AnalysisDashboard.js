// AnalysisDashboard.jsx
import { useState, useEffect } from 'react';
import { useStore } from '@/app/store/store';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Divider,
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {createDataCollection} from "@/app/services/dataService";
import MovementPatternsCard from "@/app/components/MovementPatternsCard";

// Number Movement Pairs Analysis
const NumberMovementTable = ({ numberMovementPairs }) => {
    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Number-Movement Analysis
                </Typography>
                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Number</TableCell>
                                <TableCell>Movement</TableCell>
                                <TableCell>Total Occurrences</TableCell>
                                <TableCell>Top Next Numbers</TableCell>
                                <TableCell>Top Next Movements</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {Object.entries(numberMovementPairs || {}).map(([number, movements]) =>
                                Object.entries(movements).map(([movement, data]) => (
                                    <TableRow key={`${number}-${movement}`}>
                                        <TableCell>{number}</TableCell>
                                        <TableCell>{movement}</TableCell>
                                        <TableCell>{data.totalOccurrences}</TableCell>
                                        <TableCell>
                                            {data.nextNumbers?.mostCommon?.map((item, index) => (
                                                <div key={index}>
                                                    {item.number} ({item.percentage})
                                                </div>
                                            ))}
                                        </TableCell>
                                        <TableCell>
                                            {data.nextMovements?.mostCommon?.map((item, index) => (
                                                <div key={index}>
                                                    {item.movement} ({item.percentage})
                                                </div>
                                            ))}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </CardContent>
        </Card>
    );
};


// Summary Statistics Card
const SummaryCard = ({ analysis }) => {
    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Summary Statistics
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <Typography variant="body2">
                            Total Draws: {analysis.totalDraws}
                        </Typography>
                        <Typography variant="body2">
                            Average First Number: {analysis.averageFirstNumber}
                        </Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="body2">
                            Up/Down Ratio: {analysis.additionalStats?.upToDownRatio}
                        </Typography>
                        <Typography variant="body2">
                            Equal Percentage: {analysis.additionalStats?.equalPercentage}
                        </Typography>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};

// Main Dashboard Component
const AnalysisDashboard = () => {
    const data = useStore((state) => state.data);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDisplayData = async () => {
            setLoading(true);
            try {
                await createDataCollection();
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
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography color="error">Error: {error}</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <SummaryCard analysis={data.analysis} />
                </Grid>
                <Grid item xs={12} md={6}>
                    <MovementPatternsCard movementPatterns={data.analysis.movementPatterns} />
                </Grid>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                First Number Frequencies
                            </Typography>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Number</TableCell>
                                            <TableCell>Frequency</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {Object.entries(data.analysis.firstNumberFrequencies || {}).map(([number, frequency]) => (
                                            <TableRow key={number}>
                                                <TableCell>{number}</TableCell>
                                                <TableCell>{frequency}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12}>
                    <NumberMovementTable numberMovementPairs={data.analysis.numberMovementPairs} />
                </Grid>
            </Grid>
        </Box>
    );
};

export default AnalysisDashboard;
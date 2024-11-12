// MovementPatternsCard.jsx
import { useState } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper
} from '@mui/material';

const MovementPatternsCard = ({ movementPatterns }) => {
    const [tabValue, setTabValue] = useState(0);

    const handleChange = (event, newValue) => {
        setTabValue(newValue);
    };

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Movement Patterns
                </Typography>
                <Tabs value={tabValue} onChange={handleChange}>
                    <Tab label="Single-Step Transitions" />
                    <Tab label="Two-Step Transitions" />
                </Tabs>
                {tabValue === 0 && (
                    <Box sx={{ mt: 2 }}>
                        <TransitionTable
                            transitions={movementPatterns.singleStep.transitions}
                            percentages={movementPatterns.singleStep.percentages}
                            mostCommon={movementPatterns.singleStep.mostCommon}
                            title="Single-Step Transitions"
                        />
                    </Box>
                )}
                {tabValue === 1 && (
                    <Box sx={{ mt: 2 }}>
                        <TransitionTable
                            transitions={movementPatterns.twoStep.transitions}
                            percentages={movementPatterns.twoStep.percentages}
                            mostCommon={movementPatterns.twoStep.mostCommon}
                            title="Two-Step Transitions"
                        />
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

const TransitionTable = ({ transitions, percentages, mostCommon, title }) => {
    const rows = Object.entries(transitions).map(([from, toTransitions]) => ({
        from,
        toTransitions,
        percentages: percentages[from],
    }));

    return (
        <>
            <Typography variant="subtitle1" gutterBottom>
                {title}
            </Typography>
            <TableContainer component={Paper}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>From</TableCell>
                            <TableCell>To Up</TableCell>
                            <TableCell>To Down</TableCell>
                            <TableCell>To Equal</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow key={row.from}>
                                <TableCell>{row.from}</TableCell>
                                <TableCell>
                                    {row.toTransitions.Up} ({row.percentages.Up})
                                </TableCell>
                                <TableCell>
                                    {row.toTransitions.Down} ({row.percentages.Down})
                                </TableCell>
                                <TableCell>
                                    {row.toTransitions.Equal} ({row.percentages.Equal})
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Typography variant="subtitle2" sx={{ mt: 2 }}>
                Most Common Patterns:
            </Typography>
            <ul>
                {mostCommon.map((pattern, index) => (
                    <li key={index}>
                        {pattern.pattern}: {pattern.count} times
                    </li>
                ))}
            </ul>
        </>
    );
};

export default MovementPatternsCard;

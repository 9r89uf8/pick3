import React from 'react';
import { Box, styled } from '@mui/material';

const VisualizerContainer = styled(Box)(({ theme }) => ({
    width: '100%',
    height: '500px', // Increased height
    marginBottom: theme.spacing(4),
    backgroundColor: theme.palette.grey[50],
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(2),
}));

const ConnectionsVisualizer = ({ combinations }) => {
    const columnRanges = [
        { min: 0, max: 3 },  // First column range
        { min: 2, max: 7 },  // Second column range
        { min: 6, max: 9 },  // Third column range
    ];

    // Define total height and margins
    const totalHeight = 600;
    const margin = 30;
    const usableHeight = totalHeight - 2 * margin;

    // Calculate the vertical position for a number in its column
    const getYPosition = (number, columnIndex) => {
        const { min, max } = columnRanges[columnIndex];
        const range = max - min;
        const position = (number - min) / range;
        // Invert the position since SVG coordinates go from top to bottom
        return totalHeight - (position * usableHeight + margin); // Adjusted for new height
    };

    // Get X position for each column
    const getXPosition = (columnIndex) => {
        return 100 + columnIndex * 150; // 100px margin on left, 150px between columns
    };

    return (
        <VisualizerContainer>
            <svg
                viewBox={`0 0 500 ${totalHeight}`} // Adjusted viewBox height
                style={{ width: '100%', height: '100%' }}
            >
                {/* Draw vertical lines for each column */}
                {[0, 1, 2].map((columnIndex) => (
                    <line
                        key={`vline-${columnIndex}`}
                        x1={getXPosition(columnIndex)}
                        y1={margin} // Adjusted for new height
                        x2={getXPosition(columnIndex)}
                        y2={totalHeight - margin} // Adjusted for new height
                        stroke="#e5e7eb"
                        strokeWidth="2"
                    />
                ))}

                {/* Draw the numbers for each column */}
                {columnRanges.map((range, columnIndex) => {
                    const numbers = Array.from(
                        { length: range.max - range.min + 1 },
                        (_, i) => range.min + i
                    );
                    return numbers.map((number) => (
                        <text
                            key={`text-${columnIndex}-${number}`}
                            x={getXPosition(columnIndex)}
                            y={getYPosition(number, columnIndex)}
                            textAnchor="middle"
                            style={{
                                fill: '#666',
                                fontSize: '3rem', // Adjusted font size if needed
                                fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                            }}
                        >
                            {number}
                        </text>
                    ));
                })}

                {/* Draw connections for each combination */}
                {combinations.map((combination, combIndex) => {
                    // Using MUI default palette colors
                    const colors = ['#1976d2', '#2e7d32', '#ed6c02', '#000000']; // primary, success, warning
                    return (
                        <g key={`combination-${combIndex}`}>
                            {/* Line from first to second number */}
                            <line
                                x1={getXPosition(0)}
                                y1={getYPosition(combination.numbers[0], 0)}
                                x2={getXPosition(1)}
                                y2={getYPosition(combination.numbers[1], 1)}
                                stroke={colors[combIndex]}
                                strokeWidth="2"
                                strokeOpacity="0.6"
                            />
                            {/* Line from second to third number */}
                            <line
                                x1={getXPosition(1)}
                                y1={getYPosition(combination.numbers[1], 1)}
                                x2={getXPosition(2)}
                                y2={getYPosition(combination.numbers[2], 2)}
                                stroke={colors[combIndex]}
                                strokeWidth="2"
                                strokeOpacity="0.6"
                            />
                            {/* Highlight selected numbers */}
                            {combination.numbers.map((number, numIndex) => (
                                <circle
                                    key={`point-${combIndex}-${numIndex}`}
                                    cx={getXPosition(numIndex)}
                                    cy={getYPosition(number, numIndex)}
                                    r="6"
                                    fill={colors[combIndex]}
                                    opacity="0.8"
                                />
                            ))}
                        </g>
                    );
                })}
            </svg>
        </VisualizerContainer>
    );
};

export default ConnectionsVisualizer;


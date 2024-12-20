import React from 'react';

const ConnectionsVisualizer = ({numbers}) => {
    // Increased all dimensions by roughly 1.5x
    const totalHeight = 1570;  // Increased from 780
    const totalWidth = 975;    // Increased from 650
    const margin = 60;         // Increased from 39
    const usableHeight = totalHeight - 2 * margin;
    const numberXOffset = 70;  // Increased from 46
    const numberYOffset = 18;  // Increased from 12

    const usedNumbers = numbers.reduce((acc, combination) => {
        combination.forEach((num, index) => {
            if (!acc[index]) acc[index] = new Set();
            acc[index].add(num);
        });
        return acc;
    }, []);

    const getYPosition = (number) => {
        const position = number / 9;
        return totalHeight - (position * usableHeight + margin) + 8; // Adjusted offset
    };

    const getXPosition = (columnIndex) => {
        return 195 + columnIndex * 293; // Increased spacing between columns
    };

    const colors = [
        '#3B82F6', // blue
        '#10B981', // emerald
        '#F59E0B', // amber
        '#EF4444', // red
        '#8B5CF6', // purple
        '#EC4899'  // pink
    ];

    const isNumberUsed = (number, columnIndex) => {
        return usedNumbers[columnIndex]?.has(number);
    };

    return (
        <div style={{ width: '100%', maxWidth: '1560px', margin: '0 auto' }}> {/* Increased maxWidth */}
            <svg
                viewBox={`0 0 ${totalWidth} ${totalHeight}`}
                style={{ width: '100%', height: '100%' }}
            >
                {/* Draw vertical lines for each column */}
                {[0, 1, 2].map((columnIndex) => (
                    <line
                        key={`vline-${columnIndex}`}
                        x1={getXPosition(columnIndex)}
                        y1={margin}
                        x2={getXPosition(columnIndex)}
                        y2={totalHeight - margin}
                        stroke="#e5e7eb"
                        strokeWidth="7" // Increased from 4.6
                    />
                ))}

                {/* Draw connections for each combination FIRST */}
                {numbers.map((combination, combIndex) => (
                    <g key={`combination-${combIndex}`}>
                        {/* Line from first to second number */}
                        <line
                            x1={getXPosition(0)}
                            y1={getYPosition(combination[0])}
                            x2={getXPosition(1)}
                            y2={getYPosition(combination[1])}
                            stroke={colors[combIndex % colors.length]}
                            strokeWidth="7" // Increased from 4.6
                            strokeOpacity="0.6"
                        />
                        {/* Line from second to third number */}
                        <line
                            x1={getXPosition(1)}
                            y1={getYPosition(combination[1])}
                            x2={getXPosition(2)}
                            y2={getYPosition(combination[2])}
                            stroke={colors[combIndex % colors.length]}
                            strokeWidth="7" // Increased from 4.6
                            strokeOpacity="0.6"
                        />
                    </g>
                ))}

                {/* Draw all numbers and circles for each column LAST */}
                {[0, 1, 2].map((columnIndex) => (
                    <React.Fragment key={`col-${columnIndex}`}>
                        {[...Array(10)].map((_, i) => (
                            <g key={`text-${columnIndex}-${i}`}>
                                {/* White circle background */}
                                <circle
                                    cx={getXPosition(columnIndex) + numberXOffset}
                                    cy={getYPosition(i) - 21 + numberYOffset}
                                    r="35" // Adjusted to fit new font size
                                    fill="white"
                                />
                                <text
                                    x={getXPosition(columnIndex) + numberXOffset}
                                    y={getYPosition(i) + numberYOffset}
                                    textAnchor="middle"
                                    style={{
                                        fill: isNumberUsed(i, columnIndex) ? '#3B82F6' : '#CBD5E1',
                                        fontSize: '65px', // Updated font size
                                        fontFamily: 'sans-serif'
                                    }}
                                >
                                    {i}
                                </text>
                            </g>
                        ))}
                        {/* Draw highlight circles for selected numbers on top */}
                        {numbers.map((combination, combIndex) => (
                            <circle
                                key={`point-${combIndex}-${combination[columnIndex]}`}
                                cx={getXPosition(columnIndex)}
                                cy={getYPosition(combination[columnIndex])}
                                r="16" // Increased from 10.8
                                fill={colors[combIndex % colors.length]}
                                opacity="0.8"
                            />
                        ))}
                    </React.Fragment>
                ))}
            </svg>
        </div>
    );
};

export default ConnectionsVisualizer;


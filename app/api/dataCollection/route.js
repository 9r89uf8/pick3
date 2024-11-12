import { adminDb } from "@/app/utils/firebaseAdmin";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        const firestore = adminDb.firestore();
        const drawsCollection = firestore.collection("draws");
        const snapshot = await drawsCollection.get();
        const draws = [];

        snapshot.forEach((doc) => {
            const drawData = doc.data();
            drawData.id = doc.id;
            draws.push(drawData);
        });

        const analysis = {
            firstNumberFrequencies: {},
            movementPatterns: {
                Up: 0,
                Down: 0,
                Equal: 0
            },
            averageFirstNumber: 0
        };

        draws.forEach((draw) => {
            const firstNumber = draw.currentFirstNumber;
            analysis.firstNumberFrequencies[firstNumber] = (analysis.firstNumberFrequencies[firstNumber] || 0) + 1;

            if (draw.firstNumberMovement) {
                analysis.movementPatterns[draw.firstNumberMovement]++;
            }
        });

        const sum = draws.reduce((acc, draw) => acc + (draw.currentFirstNumber || 0), 0);
        analysis.averageFirstNumber = (sum / draws.length).toFixed(2);

        // Single-step movement transitions (previous → current)
        const singleStepTransitions = {
            'Up': { 'Up': 0, 'Down': 0, 'Equal': 0 },
            'Down': { 'Up': 0, 'Down': 0, 'Equal': 0 },
            'Equal': { 'Up': 0, 'Down': 0, 'Equal': 0 }
        };

        // Two-step movement transitions (previous2,previous1 → current)
        const twoStepTransitions = {};
        ['Up', 'Down', 'Equal'].forEach(move1 => {
            ['Up', 'Down', 'Equal'].forEach(move2 => {
                const key = `${move1},${move2}`;
                twoStepTransitions[key] = {
                    'Up': 0,
                    'Down': 0,
                    'Equal': 0
                };
            });
        });

        // Calculate both types of transitions
        for (let i = 2; i < draws.length; i++) {
            const currentMovement = draws[i].firstNumberMovement;
            const previousMovement1 = draws[i].previousFirstNumberMovement1;
            const previousMovement2 = draws[i].previousFirstNumberMovement2;

            // Single-step transitions
            if (previousMovement1 && currentMovement &&
                ['Up', 'Down', 'Equal'].includes(previousMovement1) &&
                ['Up', 'Down', 'Equal'].includes(currentMovement)) {
                singleStepTransitions[previousMovement1][currentMovement]++;
            }

            // Two-step transitions
            if (previousMovement2 && previousMovement1 && currentMovement &&
                ['Up', 'Down', 'Equal'].includes(previousMovement2) &&
                ['Up', 'Down', 'Equal'].includes(previousMovement1) &&
                ['Up', 'Down', 'Equal'].includes(currentMovement)) {
                const key = `${previousMovement2},${previousMovement1}`;
                twoStepTransitions[key][currentMovement]++;
            }
        }

        // Calculate percentages for both transition types
        const singleStepPercentages = {};
        Object.entries(singleStepTransitions).forEach(([fromMove, transitions]) => {
            const total = Object.values(transitions).reduce((a, b) => a + b, 0);
            singleStepPercentages[fromMove] = {};
            Object.entries(transitions).forEach(([toMove, count]) => {
                singleStepPercentages[fromMove][toMove] = total > 0 ?
                    ((count / total) * 100).toFixed(2) + '%' : '0%';
            });
        });

        const twoStepPercentages = {};
        Object.entries(twoStepTransitions).forEach(([fromMoves, transitions]) => {
            const total = Object.values(transitions).reduce((a, b) => a + b, 0);
            twoStepPercentages[fromMoves] = {};
            Object.entries(transitions).forEach(([toMove, count]) => {
                twoStepPercentages[fromMoves][toMove] = total > 0 ?
                    ((count / total) * 100).toFixed(2) + '%' : '0%';
            });
        });

        // Find most common patterns
        const mostCommonSingleStep = Object.entries(singleStepTransitions)
            .flatMap(([from, transitions]) =>
                Object.entries(transitions).map(([to, count]) => ({
                    pattern: `${from}→${to}`,
                    count
                })))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);

        const mostCommonTwoStep = Object.entries(twoStepTransitions)
            .flatMap(([fromMoves, transitions]) =>
                Object.entries(transitions).map(([to, count]) => ({
                    pattern: `${fromMoves}→${to}`,
                    count
                })))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);


        // Add new analysis for number-movement pairs
        const numberMovementPairs = {};
        // Initialize the structure
        for (let num = 0; num <= 9; num++) {
            numberMovementPairs[num] = {
                'Up': {
                    nextNumbers: {},      // Frequencies of next numbers
                    nextMovements: {      // Frequencies of next movements
                        'Up': 0,
                        'Down': 0,
                        'Equal': 0
                    },
                    totalOccurrences: 0
                },
                'Down': {
                    nextNumbers: {},
                    nextMovements: {
                        'Up': 0,
                        'Down': 0,
                        'Equal': 0
                    },
                    totalOccurrences: 0
                },
                'Equal': {
                    nextNumbers: {},
                    nextMovements: {
                        'Up': 0,
                        'Down': 0,
                        'Equal': 0
                    },
                    totalOccurrences: 0
                }
            };
        }

        // Analyze pairs
        draws.forEach((draw, index) => {
            if (index > 0) { // Skip first draw as it won't have previous values
                const prevNumber = draw.previousFirstNumber1;
                const prevMovement = draw.previousFirstNumberMovement1;
                const currentNumber = draw.currentFirstNumber;
                const currentMovement = draw.firstNumberMovement;

                // Only process if we have valid previous and current values
                if (prevNumber !== null && prevMovement && currentNumber !== null && currentMovement &&
                    ['Up', 'Down', 'Equal'].includes(prevMovement)) {

                    // Increment number frequency
                    numberMovementPairs[prevNumber][prevMovement].nextNumbers[currentNumber] =
                        (numberMovementPairs[prevNumber][prevMovement].nextNumbers[currentNumber] || 0) + 1;

                    // Increment movement frequency
                    numberMovementPairs[prevNumber][prevMovement].nextMovements[currentMovement]++;

                    // Increment total occurrences
                    numberMovementPairs[prevNumber][prevMovement].totalOccurrences++;
                }
            }
        });

        // Calculate percentages and find most common outcomes
        const pairAnalysis = {};

        Object.entries(numberMovementPairs).forEach(([number, movements]) => {
            pairAnalysis[number] = {};

            Object.entries(movements).forEach(([movement, data]) => {
                const total = data.totalOccurrences;
                if (total > 0) {
                    pairAnalysis[number][movement] = {
                        totalOccurrences: total,
                        nextNumbers: {
                            raw: data.nextNumbers,
                            percentages: Object.entries(data.nextNumbers).reduce((acc, [num, count]) => {
                                acc[num] = ((count / total) * 100).toFixed(2) + '%';
                                return acc;
                            }, {}),
                            mostCommon: Object.entries(data.nextNumbers)
                                .sort(([,a], [,b]) => b - a)
                                .slice(0, 3)
                                .map(([num, count]) => ({
                                    number: num,
                                    count,
                                    percentage: ((count / total) * 100).toFixed(2) + '%'
                                }))
                        },
                        nextMovements: {
                            raw: data.nextMovements,
                            percentages: Object.entries(data.nextMovements).reduce((acc, [mov, count]) => {
                                acc[mov] = ((count / total) * 100).toFixed(2) + '%';
                                return acc;
                            }, {}),
                            mostCommon: Object.entries(data.nextMovements)
                                .sort(([,a], [,b]) => b - a)
                                .slice(0, 3)
                                .map(([mov, count]) => ({
                                    movement: mov,
                                    count,
                                    percentage: ((count / total) * 100).toFixed(2) + '%'
                                }))
                        }
                    };
                }
            });
        });

        const response = {
            analysis: {
                ...analysis,
                numberMovementPairs: pairAnalysis,
                movementPatterns: {
                    singleStep: {
                        transitions: singleStepTransitions,
                        percentages: singleStepPercentages,
                        mostCommon: mostCommonSingleStep
                    },
                    twoStep: {
                        transitions: twoStepTransitions,
                        percentages: twoStepPercentages,
                        mostCommon: mostCommonTwoStep
                    }
                },
                totalDraws: draws.length,
                mostFrequentFirstNumber: Object.entries(analysis.firstNumberFrequencies)
                    .sort(([,a], [,b]) => b - a)[0],
                additionalStats: {
                    upToDownRatio: (analysis.movementPatterns.Up / analysis.movementPatterns.Down).toFixed(2),
                    equalPercentage: ((analysis.movementPatterns.Equal / draws.length) * 100).toFixed(2) + '%'
                }
            }
        };

        // console.log('Full Analysis:', JSON.stringify(response, null, 2));

        return new Response(JSON.stringify(response), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, max-age=0'
            },
        });
    } catch (error) {
        console.log(error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

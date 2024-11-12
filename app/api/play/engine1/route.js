// app/api/posts/route.js
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/app/utils/firebaseAdmin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;


const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const getCurrentMonth = () => {
    const currentDate = new Date();
    const currentMonthIndex = currentDate.getMonth();
    return monthNames[currentMonthIndex];
};

function predictNextNumber(lastNumbers, lastMovements) {
    // Validate inputs
    if (!Array.isArray(lastNumbers) || lastNumbers.length !== 8) {
        throw new Error("Last numbers must be an array of 8 numbers");
    }
    if (!Array.isArray(lastMovements) || lastMovements.length !== 6) {
        throw new Error("Last movements must be an array of 6 movements");
    }

    // Get the most recent values
    const currentNumber = lastNumbers[lastNumbers.length - 1];
    const currentMovement = lastMovements[lastMovements.length - 1];
    const prevMovement = lastMovements[lastMovements.length - 2];

    // Initialize scoring system and reasoning tracker
    let numberScores = Array(10).fill(0);
    let reasoningLog = Array(10).fill().map(() => ({
        twoStepPatterns: [],
        numberMovementPairs: [],
        frequencyBonus: 0,
        recentPenalty: 0,
        movementPredictions: new Set()
    }));

    // 1. Two-step movement pattern analysis (highest weight: 40%)
    const twoStepPattern = `${prevMovement},${currentMovement}`;
    const twoStepData = analysisData.movementPatterns.twoStep.percentages[twoStepPattern];
    if (twoStepData) {
        Object.entries(twoStepData).forEach(([movement, percentage]) => {
            const prob = parseFloat(percentage) / 100;
            if (movement === 'Up') {
                for (let i = currentNumber + 1; i <= 9; i++) {
                    const score = prob * 40;
                    numberScores[i] += score;
                    reasoningLog[i].twoStepPatterns.push({
                        pattern: `${twoStepPattern}→${movement}`,
                        probability: percentage,
                        score: score.toFixed(2)
                    });
                    reasoningLog[i].movementPredictions.add('Up');
                }
            } else if (movement === 'Down') {
                for (let i = 0; i < currentNumber; i++) {
                    const score = prob * 40;
                    numberScores[i] += score;
                    reasoningLog[i].twoStepPatterns.push({
                        pattern: `${twoStepPattern}→${movement}`,
                        probability: percentage,
                        score: score.toFixed(2)
                    });
                    reasoningLog[i].movementPredictions.add('Down');
                }
            } else { // Equal
                const score = prob * 40;
                numberScores[currentNumber] += score;
                reasoningLog[currentNumber].twoStepPatterns.push({
                    pattern: `${twoStepPattern}→${movement}`,
                    probability: percentage,
                    score: score.toFixed(2)
                });
                reasoningLog[currentNumber].movementPredictions.add('Equal');
            }
        });
    }

    // 2. Number-Movement pair analysis (30% weight)
    const pairData = analysisData.numberMovementPairs[currentNumber]?.[currentMovement];
    if (pairData) {
        Object.entries(pairData.nextNumbers.percentages).forEach(([num, percentage]) => {
            const score = parseFloat(percentage) * 0.30;
            numberScores[num] += score;
            reasoningLog[num].numberMovementPairs.push({
                combination: `${currentNumber}${currentMovement}→${num}`,
                probability: percentage,
                score: score.toFixed(2)
            });
        });
    }

    // 3. Overall frequency distribution (10% weight)
    Object.entries(analysisData.firstNumberFrequencies).forEach(([num, freq]) => {
        const score = (freq / analysisData.totalDraws) * 10;
        numberScores[num] += score;
        reasoningLog[num].frequencyBonus = score.toFixed(2);
    });

    // 4. Recent number penalty (apply 30% penalty)
    lastNumbers.slice(-3).forEach(num => {
        const originalScore = numberScores[num];
        const penalty = originalScore * 0.3;
        numberScores[num] -= penalty;
        reasoningLog[num].recentPenalty = -penalty.toFixed(2);
    });

    // Find the top candidates with their scores
    const predictions = numberScores
        .map((score, number) => ({
            number,
            score,
            reasoning: reasoningLog[number]
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

    // Generate detailed explanation for each prediction
    const explanations = predictions.map(pred => {
        const reasoning = [];

        // Two-step pattern explanation
        if (pred.reasoning.twoStepPatterns.length > 0) {
            const patterns = pred.reasoning.twoStepPatterns
                .map(p => `${p.pattern} (${p.probability} probability, +${p.score} points)`)
                .join(', ');
            reasoning.push(`Movement Patterns: ${patterns}`);
        }

        // Number-Movement pair explanation
        if (pred.reasoning.numberMovementPairs.length > 0) {
            const pairs = pred.reasoning.numberMovementPairs
                .map(p => `${p.combination} (${p.probability} probability, +${p.score} points)`)
                .join(', ');
            reasoning.push(`Number-Movement Pairs: ${pairs}`);
        }

        // Frequency bonus explanation
        if (pred.reasoning.frequencyBonus > 0) {
            const freq = analysisData.firstNumberFrequencies[pred.number];
            reasoning.push(`Historical Frequency: ${freq}/${analysisData.totalDraws} occurrences (+${pred.reasoning.frequencyBonus} points)`);
        }

        // Recent penalty explanation
        if (pred.reasoning.recentPenalty < 0) {
            reasoning.push(`Recent Number Penalty: ${pred.reasoning.recentPenalty} points`);
        }

        // Expected movement
        const movements = Array.from(pred.reasoning.movementPredictions).join(' or ');
        if (movements) {
            reasoning.push(`Expected Movement: ${movements}`);
        }

        return {
            number: pred.number,
            confidence: (pred.score / Math.max(...numberScores) * 100).toFixed(1) + '%',
            totalScore: pred.score.toFixed(2),
            reasoning: reasoning
        };
    });

    return {
        predictions: explanations,
        inputSummary: {
            lastNumber: currentNumber,
            lastTwoMovements: twoStepPattern,
            recentNumbers: lastNumbers.slice(-3)
        }
    };
}

const analysisData = {
        "firstNumberFrequencies": {
            "0": 178,
            "1": 144,
            "2": 96,
            "3": 70,
            "4": 62,
            "5": 44,
            "6": 20,
            "7": 10,
            "8": 1,
            "9": 1
        },
        "movementPatterns": {
            "singleStep": {
                "transitions": {
                    "Up": {
                        "Up": 57,
                        "Down": 169,
                        "Equal": 30
                    },
                    "Down": {
                        "Up": 138,
                        "Down": 46,
                        "Equal": 54
                    },
                    "Equal": {
                        "Up": 55,
                        "Down": 28,
                        "Equal": 25
                    }
                },
                "percentages": {
                    "Up": {
                        "Up": "22.27%",
                        "Down": "66.02%",
                        "Equal": "11.72%"
                    },
                    "Down": {
                        "Up": "57.98%",
                        "Down": "19.33%",
                        "Equal": "22.69%"
                    },
                    "Equal": {
                        "Up": "50.93%",
                        "Down": "25.93%",
                        "Equal": "23.15%"
                    }
                },
                "mostCommon": [
                    {
                        "pattern": "Up→Down",
                        "count": 169
                    },
                    {
                        "pattern": "Down→Up",
                        "count": 138
                    },
                    {
                        "pattern": "Up→Up",
                        "count": 57
                    }
                ]
            },
            "twoStep": {
                "transitions": {
                    "Up,Up": {
                        "Up": 5,
                        "Down": 44,
                        "Equal": 7
                    },
                    "Up,Down": {
                        "Up": 87,
                        "Down": 37,
                        "Equal": 38
                    },
                    "Up,Equal": {
                        "Up": 12,
                        "Down": 12,
                        "Equal": 5
                    },
                    "Down,Up": {
                        "Up": 39,
                        "Down": 84,
                        "Equal": 15
                    },
                    "Down,Down": {
                        "Up": 29,
                        "Down": 7,
                        "Equal": 10
                    },
                    "Down,Equal": {
                        "Up": 30,
                        "Down": 11,
                        "Equal": 12
                    },
                    "Equal,Up": {
                        "Up": 12,
                        "Down": 34,
                        "Equal": 8
                    },
                    "Equal,Down": {
                        "Up": 20,
                        "Down": 2,
                        "Equal": 6
                    },
                    "Equal,Equal": {
                        "Up": 12,
                        "Down": 5,
                        "Equal": 8
                    }
                },
                "percentages": {
                    "Up,Up": {
                        "Up": "8.93%",
                        "Down": "78.57%",
                        "Equal": "12.50%"
                    },
                    "Up,Down": {
                        "Up": "53.70%",
                        "Down": "22.84%",
                        "Equal": "23.46%"
                    },
                    "Up,Equal": {
                        "Up": "41.38%",
                        "Down": "41.38%",
                        "Equal": "17.24%"
                    },
                    "Down,Up": {
                        "Up": "28.26%",
                        "Down": "60.87%",
                        "Equal": "10.87%"
                    },
                    "Down,Down": {
                        "Up": "63.04%",
                        "Down": "15.22%",
                        "Equal": "21.74%"
                    },
                    "Down,Equal": {
                        "Up": "56.60%",
                        "Down": "20.75%",
                        "Equal": "22.64%"
                    },
                    "Equal,Up": {
                        "Up": "22.22%",
                        "Down": "62.96%",
                        "Equal": "14.81%"
                    },
                    "Equal,Down": {
                        "Up": "71.43%",
                        "Down": "7.14%",
                        "Equal": "21.43%"
                    },
                    "Equal,Equal": {
                        "Up": "48.00%",
                        "Down": "20.00%",
                        "Equal": "32.00%"
                    }
                },
                "mostCommon": [
                    {
                        "pattern": "Up,Down→Up",
                        "count": 87
                    },
                    {
                        "pattern": "Down,Up→Down",
                        "count": 84
                    },
                    {
                        "pattern": "Up,Up→Down",
                        "count": 44
                    }
                ]
            }
        },
        "averageFirstNumber": "1.95",
        "numberMovementPairs": {
            "0": {
                "Down": {
                    "totalOccurrences": 123,
                    "nextNumbers": {
                        "raw": {
                            "0": 30,
                            "1": 32,
                            "2": 16,
                            "3": 19,
                            "4": 14,
                            "5": 7,
                            "6": 3,
                            "7": 2
                        },
                        "percentages": {
                            "0": "24.39%",
                            "1": "26.02%",
                            "2": "13.01%",
                            "3": "15.45%",
                            "4": "11.38%",
                            "5": "5.69%",
                            "6": "2.44%",
                            "7": "1.63%"
                        },
                        "mostCommon": [
                            {
                                "number": "1",
                                "count": 32,
                                "percentage": "26.02%"
                            },
                            {
                                "number": "0",
                                "count": 30,
                                "percentage": "24.39%"
                            },
                            {
                                "number": "3",
                                "count": 19,
                                "percentage": "15.45%"
                            }
                        ]
                    },
                    "nextMovements": {
                        "raw": {
                            "Up": 93,
                            "Down": 0,
                            "Equal": 30
                        },
                        "percentages": {
                            "Up": "75.61%",
                            "Down": "0.00%",
                            "Equal": "24.39%"
                        },
                        "mostCommon": [
                            {
                                "movement": "Up",
                                "count": 93,
                                "percentage": "75.61%"
                            },
                            {
                                "movement": "Equal",
                                "count": 30,
                                "percentage": "24.39%"
                            },
                            {
                                "movement": "Down",
                                "count": 0,
                                "percentage": "0.00%"
                            }
                        ]
                    }
                },
                "Equal": {
                    "totalOccurrences": 46,
                    "nextNumbers": {
                        "raw": {
                            "0": 15,
                            "1": 15,
                            "2": 6,
                            "3": 2,
                            "4": 3,
                            "5": 3,
                            "6": 1,
                            "7": 1
                        },
                        "percentages": {
                            "0": "32.61%",
                            "1": "32.61%",
                            "2": "13.04%",
                            "3": "4.35%",
                            "4": "6.52%",
                            "5": "6.52%",
                            "6": "2.17%",
                            "7": "2.17%"
                        },
                        "mostCommon": [
                            {
                                "number": "0",
                                "count": 15,
                                "percentage": "32.61%"
                            },
                            {
                                "number": "1",
                                "count": 15,
                                "percentage": "32.61%"
                            },
                            {
                                "number": "2",
                                "count": 6,
                                "percentage": "13.04%"
                            }
                        ]
                    },
                    "nextMovements": {
                        "raw": {
                            "Up": 31,
                            "Down": 0,
                            "Equal": 15
                        },
                        "percentages": {
                            "Up": "67.39%",
                            "Down": "0.00%",
                            "Equal": "32.61%"
                        },
                        "mostCommon": [
                            {
                                "movement": "Up",
                                "count": 31,
                                "percentage": "67.39%"
                            },
                            {
                                "movement": "Equal",
                                "count": 15,
                                "percentage": "32.61%"
                            },
                            {
                                "movement": "Down",
                                "count": 0,
                                "percentage": "0.00%"
                            }
                        ]
                    }
                }
            },
            "1": {
                "Up": {
                    "totalOccurrences": 50,
                    "nextNumbers": {
                        "raw": {
                            "0": 11,
                            "1": 10,
                            "2": 7,
                            "3": 9,
                            "4": 4,
                            "5": 4,
                            "6": 2,
                            "7": 2,
                            "9": 1
                        },
                        "percentages": {
                            "0": "22.00%",
                            "1": "20.00%",
                            "2": "14.00%",
                            "3": "18.00%",
                            "4": "8.00%",
                            "5": "8.00%",
                            "6": "4.00%",
                            "7": "4.00%",
                            "9": "2.00%"
                        },
                        "mostCommon": [
                            {
                                "number": "0",
                                "count": 11,
                                "percentage": "22.00%"
                            },
                            {
                                "number": "1",
                                "count": 10,
                                "percentage": "20.00%"
                            },
                            {
                                "number": "3",
                                "count": 9,
                                "percentage": "18.00%"
                            }
                        ]
                    },
                    "nextMovements": {
                        "raw": {
                            "Up": 29,
                            "Down": 11,
                            "Equal": 10
                        },
                        "percentages": {
                            "Up": "58.00%",
                            "Down": "22.00%",
                            "Equal": "20.00%"
                        },
                        "mostCommon": [
                            {
                                "movement": "Up",
                                "count": 29,
                                "percentage": "58.00%"
                            },
                            {
                                "movement": "Down",
                                "count": 11,
                                "percentage": "22.00%"
                            },
                            {
                                "movement": "Equal",
                                "count": 10,
                                "percentage": "20.00%"
                            }
                        ]
                    }
                },
                "Down": {
                    "totalOccurrences": 62,
                    "nextNumbers": {
                        "raw": {
                            "0": 16,
                            "1": 15,
                            "2": 9,
                            "3": 5,
                            "4": 8,
                            "5": 6,
                            "6": 2,
                            "7": 1
                        },
                        "percentages": {
                            "0": "25.81%",
                            "1": "24.19%",
                            "2": "14.52%",
                            "3": "8.06%",
                            "4": "12.90%",
                            "5": "9.68%",
                            "6": "3.23%",
                            "7": "1.61%"
                        },
                        "mostCommon": [
                            {
                                "number": "0",
                                "count": 16,
                                "percentage": "25.81%"
                            },
                            {
                                "number": "1",
                                "count": 15,
                                "percentage": "24.19%"
                            },
                            {
                                "number": "2",
                                "count": 9,
                                "percentage": "14.52%"
                            }
                        ]
                    },
                    "nextMovements": {
                        "raw": {
                            "Up": 31,
                            "Down": 16,
                            "Equal": 15
                        },
                        "percentages": {
                            "Up": "50.00%",
                            "Down": "25.81%",
                            "Equal": "24.19%"
                        },
                        "mostCommon": [
                            {
                                "movement": "Up",
                                "count": 31,
                                "percentage": "50.00%"
                            },
                            {
                                "movement": "Down",
                                "count": 16,
                                "percentage": "25.81%"
                            },
                            {
                                "movement": "Equal",
                                "count": 15,
                                "percentage": "24.19%"
                            }
                        ]
                    }
                },
                "Equal": {
                    "totalOccurrences": 27,
                    "nextNumbers": {
                        "raw": {
                            "0": 10,
                            "1": 3,
                            "2": 4,
                            "3": 4,
                            "4": 2,
                            "5": 3,
                            "7": 1
                        },
                        "percentages": {
                            "0": "37.04%",
                            "1": "11.11%",
                            "2": "14.81%",
                            "3": "14.81%",
                            "4": "7.41%",
                            "5": "11.11%",
                            "7": "3.70%"
                        },
                        "mostCommon": [
                            {
                                "number": "0",
                                "count": 10,
                                "percentage": "37.04%"
                            },
                            {
                                "number": "2",
                                "count": 4,
                                "percentage": "14.81%"
                            },
                            {
                                "number": "3",
                                "count": 4,
                                "percentage": "14.81%"
                            }
                        ]
                    },
                    "nextMovements": {
                        "raw": {
                            "Up": 14,
                            "Down": 10,
                            "Equal": 3
                        },
                        "percentages": {
                            "Up": "51.85%",
                            "Down": "37.04%",
                            "Equal": "11.11%"
                        },
                        "mostCommon": [
                            {
                                "movement": "Up",
                                "count": 14,
                                "percentage": "51.85%"
                            },
                            {
                                "movement": "Down",
                                "count": 10,
                                "percentage": "37.04%"
                            },
                            {
                                "movement": "Equal",
                                "count": 3,
                                "percentage": "11.11%"
                            }
                        ]
                    }
                }
            },
            "2": {
                "Up": {
                    "totalOccurrences": 42,
                    "nextNumbers": {
                        "raw": {
                            "0": 14,
                            "1": 8,
                            "2": 8,
                            "3": 6,
                            "4": 4,
                            "5": 2
                        },
                        "percentages": {
                            "0": "33.33%",
                            "1": "19.05%",
                            "2": "19.05%",
                            "3": "14.29%",
                            "4": "9.52%",
                            "5": "4.76%"
                        },
                        "mostCommon": [
                            {
                                "number": "0",
                                "count": 14,
                                "percentage": "33.33%"
                            },
                            {
                                "number": "1",
                                "count": 8,
                                "percentage": "19.05%"
                            },
                            {
                                "number": "2",
                                "count": 8,
                                "percentage": "19.05%"
                            }
                        ]
                    },
                    "nextMovements": {
                        "raw": {
                            "Up": 12,
                            "Down": 22,
                            "Equal": 8
                        },
                        "percentages": {
                            "Up": "28.57%",
                            "Down": "52.38%",
                            "Equal": "19.05%"
                        },
                        "mostCommon": [
                            {
                                "movement": "Down",
                                "count": 22,
                                "percentage": "52.38%"
                            },
                            {
                                "movement": "Up",
                                "count": 12,
                                "percentage": "28.57%"
                            },
                            {
                                "movement": "Equal",
                                "count": 8,
                                "percentage": "19.05%"
                            }
                        ]
                    }
                },
                "Down": {
                    "totalOccurrences": 34,
                    "nextNumbers": {
                        "raw": {
                            "0": 10,
                            "1": 5,
                            "2": 6,
                            "3": 4,
                            "4": 6,
                            "5": 2,
                            "7": 1
                        },
                        "percentages": {
                            "0": "29.41%",
                            "1": "14.71%",
                            "2": "17.65%",
                            "3": "11.76%",
                            "4": "17.65%",
                            "5": "5.88%",
                            "7": "2.94%"
                        },
                        "mostCommon": [
                            {
                                "number": "0",
                                "count": 10,
                                "percentage": "29.41%"
                            },
                            {
                                "number": "2",
                                "count": 6,
                                "percentage": "17.65%"
                            },
                            {
                                "number": "4",
                                "count": 6,
                                "percentage": "17.65%"
                            }
                        ]
                    },
                    "nextMovements": {
                        "raw": {
                            "Up": 13,
                            "Down": 15,
                            "Equal": 6
                        },
                        "percentages": {
                            "Up": "38.24%",
                            "Down": "44.12%",
                            "Equal": "17.65%"
                        },
                        "mostCommon": [
                            {
                                "movement": "Down",
                                "count": 15,
                                "percentage": "44.12%"
                            },
                            {
                                "movement": "Up",
                                "count": 13,
                                "percentage": "38.24%"
                            },
                            {
                                "movement": "Equal",
                                "count": 6,
                                "percentage": "17.65%"
                            }
                        ]
                    }
                },
                "Equal": {
                    "totalOccurrences": 18,
                    "nextNumbers": {
                        "raw": {
                            "0": 6,
                            "1": 1,
                            "2": 5,
                            "4": 2,
                            "5": 2,
                            "6": 2
                        },
                        "percentages": {
                            "0": "33.33%",
                            "1": "5.56%",
                            "2": "27.78%",
                            "4": "11.11%",
                            "5": "11.11%",
                            "6": "11.11%"
                        },
                        "mostCommon": [
                            {
                                "number": "0",
                                "count": 6,
                                "percentage": "33.33%"
                            },
                            {
                                "number": "2",
                                "count": 5,
                                "percentage": "27.78%"
                            },
                            {
                                "number": "4",
                                "count": 2,
                                "percentage": "11.11%"
                            }
                        ]
                    },
                    "nextMovements": {
                        "raw": {
                            "Up": 6,
                            "Down": 7,
                            "Equal": 5
                        },
                        "percentages": {
                            "Up": "33.33%",
                            "Down": "38.89%",
                            "Equal": "27.78%"
                        },
                        "mostCommon": [
                            {
                                "movement": "Down",
                                "count": 7,
                                "percentage": "38.89%"
                            },
                            {
                                "movement": "Up",
                                "count": 6,
                                "percentage": "33.33%"
                            },
                            {
                                "movement": "Equal",
                                "count": 5,
                                "percentage": "27.78%"
                            }
                        ]
                    }
                }
            },
            "3": {
                "Up": {
                    "totalOccurrences": 48,
                    "nextNumbers": {
                        "raw": {
                            "0": 15,
                            "1": 14,
                            "2": 6,
                            "3": 5,
                            "4": 2,
                            "5": 4,
                            "6": 1,
                            "8": 1
                        },
                        "percentages": {
                            "0": "31.25%",
                            "1": "29.17%",
                            "2": "12.50%",
                            "3": "10.42%",
                            "4": "4.17%",
                            "5": "8.33%",
                            "6": "2.08%",
                            "8": "2.08%"
                        },
                        "mostCommon": [
                            {
                                "number": "0",
                                "count": 15,
                                "percentage": "31.25%"
                            },
                            {
                                "number": "1",
                                "count": 14,
                                "percentage": "29.17%"
                            },
                            {
                                "number": "2",
                                "count": 6,
                                "percentage": "12.50%"
                            }
                        ]
                    },
                    "nextMovements": {
                        "raw": {
                            "Up": 8,
                            "Down": 35,
                            "Equal": 5
                        },
                        "percentages": {
                            "Up": "16.67%",
                            "Down": "72.92%",
                            "Equal": "10.42%"
                        },
                        "mostCommon": [
                            {
                                "movement": "Down",
                                "count": 35,
                                "percentage": "72.92%"
                            },
                            {
                                "movement": "Up",
                                "count": 8,
                                "percentage": "16.67%"
                            },
                            {
                                "movement": "Equal",
                                "count": 5,
                                "percentage": "10.42%"
                            }
                        ]
                    }
                },
                "Down": {
                    "totalOccurrences": 11,
                    "nextNumbers": {
                        "raw": {
                            "0": 2,
                            "1": 2,
                            "2": 3,
                            "3": 2,
                            "4": 1,
                            "6": 1
                        },
                        "percentages": {
                            "0": "18.18%",
                            "1": "18.18%",
                            "2": "27.27%",
                            "3": "18.18%",
                            "4": "9.09%",
                            "6": "9.09%"
                        },
                        "mostCommon": [
                            {
                                "number": "2",
                                "count": 3,
                                "percentage": "27.27%"
                            },
                            {
                                "number": "0",
                                "count": 2,
                                "percentage": "18.18%"
                            },
                            {
                                "number": "1",
                                "count": 2,
                                "percentage": "18.18%"
                            }
                        ]
                    },
                    "nextMovements": {
                        "raw": {
                            "Up": 2,
                            "Down": 7,
                            "Equal": 2
                        },
                        "percentages": {
                            "Up": "18.18%",
                            "Down": "63.64%",
                            "Equal": "18.18%"
                        },
                        "mostCommon": [
                            {
                                "movement": "Down",
                                "count": 7,
                                "percentage": "63.64%"
                            },
                            {
                                "movement": "Up",
                                "count": 2,
                                "percentage": "18.18%"
                            },
                            {
                                "movement": "Equal",
                                "count": 2,
                                "percentage": "18.18%"
                            }
                        ]
                    }
                },
                "Equal": {
                    "totalOccurrences": 8,
                    "nextNumbers": {
                        "raw": {
                            "0": 3,
                            "1": 2,
                            "3": 1,
                            "4": 1,
                            "6": 1
                        },
                        "percentages": {
                            "0": "37.50%",
                            "1": "25.00%",
                            "3": "12.50%",
                            "4": "12.50%",
                            "6": "12.50%"
                        },
                        "mostCommon": [
                            {
                                "number": "0",
                                "count": 3,
                                "percentage": "37.50%"
                            },
                            {
                                "number": "1",
                                "count": 2,
                                "percentage": "25.00%"
                            },
                            {
                                "number": "3",
                                "count": 1,
                                "percentage": "12.50%"
                            }
                        ]
                    },
                    "nextMovements": {
                        "raw": {
                            "Up": 2,
                            "Down": 5,
                            "Equal": 1
                        },
                        "percentages": {
                            "Up": "25.00%",
                            "Down": "62.50%",
                            "Equal": "12.50%"
                        },
                        "mostCommon": [
                            {
                                "movement": "Down",
                                "count": 5,
                                "percentage": "62.50%"
                            },
                            {
                                "movement": "Up",
                                "count": 2,
                                "percentage": "25.00%"
                            },
                            {
                                "movement": "Equal",
                                "count": 1,
                                "percentage": "12.50%"
                            }
                        ]
                    }
                }
            },
            "4": {
                "Up": {
                    "totalOccurrences": 48,
                    "nextNumbers": {
                        "raw": {
                            "0": 12,
                            "1": 14,
                            "2": 8,
                            "3": 4,
                            "4": 5,
                            "5": 2,
                            "6": 2,
                            "7": 1
                        },
                        "percentages": {
                            "0": "25.00%",
                            "1": "29.17%",
                            "2": "16.67%",
                            "3": "8.33%",
                            "4": "10.42%",
                            "5": "4.17%",
                            "6": "4.17%",
                            "7": "2.08%"
                        },
                        "mostCommon": [
                            {
                                "number": "1",
                                "count": 14,
                                "percentage": "29.17%"
                            },
                            {
                                "number": "0",
                                "count": 12,
                                "percentage": "25.00%"
                            },
                            {
                                "number": "2",
                                "count": 8,
                                "percentage": "16.67%"
                            }
                        ]
                    },
                    "nextMovements": {
                        "raw": {
                            "Up": 5,
                            "Down": 38,
                            "Equal": 5
                        },
                        "percentages": {
                            "Up": "10.42%",
                            "Down": "79.17%",
                            "Equal": "10.42%"
                        },
                        "mostCommon": [
                            {
                                "movement": "Down",
                                "count": 38,
                                "percentage": "79.17%"
                            },
                            {
                                "movement": "Up",
                                "count": 5,
                                "percentage": "10.42%"
                            },
                            {
                                "movement": "Equal",
                                "count": 5,
                                "percentage": "10.42%"
                            }
                        ]
                    }
                },
                "Down": {
                    "totalOccurrences": 6,
                    "nextNumbers": {
                        "raw": {
                            "0": 2,
                            "1": 1,
                            "2": 1,
                            "3": 2
                        },
                        "percentages": {
                            "0": "33.33%",
                            "1": "16.67%",
                            "2": "16.67%",
                            "3": "33.33%"
                        },
                        "mostCommon": [
                            {
                                "number": "0",
                                "count": 2,
                                "percentage": "33.33%"
                            },
                            {
                                "number": "3",
                                "count": 2,
                                "percentage": "33.33%"
                            },
                            {
                                "number": "1",
                                "count": 1,
                                "percentage": "16.67%"
                            }
                        ]
                    },
                    "nextMovements": {
                        "raw": {
                            "Up": 0,
                            "Down": 6,
                            "Equal": 0
                        },
                        "percentages": {
                            "Up": "0.00%",
                            "Down": "100.00%",
                            "Equal": "0.00%"
                        },
                        "mostCommon": [
                            {
                                "movement": "Down",
                                "count": 6,
                                "percentage": "100.00%"
                            },
                            {
                                "movement": "Up",
                                "count": 0,
                                "percentage": "0.00%"
                            },
                            {
                                "movement": "Equal",
                                "count": 0,
                                "percentage": "0.00%"
                            }
                        ]
                    }
                },
                "Equal": {
                    "totalOccurrences": 6,
                    "nextNumbers": {
                        "raw": {
                            "0": 3,
                            "2": 1,
                            "4": 1,
                            "5": 1
                        },
                        "percentages": {
                            "0": "50.00%",
                            "2": "16.67%",
                            "4": "16.67%",
                            "5": "16.67%"
                        },
                        "mostCommon": [
                            {
                                "number": "0",
                                "count": 3,
                                "percentage": "50.00%"
                            },
                            {
                                "number": "2",
                                "count": 1,
                                "percentage": "16.67%"
                            },
                            {
                                "number": "4",
                                "count": 1,
                                "percentage": "16.67%"
                            }
                        ]
                    },
                    "nextMovements": {
                        "raw": {
                            "Up": 1,
                            "Down": 4,
                            "Equal": 1
                        },
                        "percentages": {
                            "Up": "16.67%",
                            "Down": "66.67%",
                            "Equal": "16.67%"
                        },
                        "mostCommon": [
                            {
                                "movement": "Down",
                                "count": 4,
                                "percentage": "66.67%"
                            },
                            {
                                "movement": "Up",
                                "count": 1,
                                "percentage": "16.67%"
                            },
                            {
                                "movement": "Equal",
                                "count": 1,
                                "percentage": "16.67%"
                            }
                        ]
                    }
                }
            },
            "5": {
                "Up": {
                    "totalOccurrences": 38,
                    "nextNumbers": {
                        "raw": {
                            "0": 9,
                            "1": 10,
                            "2": 6,
                            "3": 4,
                            "4": 4,
                            "5": 2,
                            "6": 2,
                            "7": 1
                        },
                        "percentages": {
                            "0": "23.68%",
                            "1": "26.32%",
                            "2": "15.79%",
                            "3": "10.53%",
                            "4": "10.53%",
                            "5": "5.26%",
                            "6": "5.26%",
                            "7": "2.63%"
                        },
                        "mostCommon": [
                            {
                                "number": "1",
                                "count": 10,
                                "percentage": "26.32%"
                            },
                            {
                                "number": "0",
                                "count": 9,
                                "percentage": "23.68%"
                            },
                            {
                                "number": "2",
                                "count": 6,
                                "percentage": "15.79%"
                            }
                        ]
                    },
                    "nextMovements": {
                        "raw": {
                            "Up": 3,
                            "Down": 33,
                            "Equal": 2
                        },
                        "percentages": {
                            "Up": "7.89%",
                            "Down": "86.84%",
                            "Equal": "5.26%"
                        },
                        "mostCommon": [
                            {
                                "movement": "Down",
                                "count": 33,
                                "percentage": "86.84%"
                            },
                            {
                                "movement": "Up",
                                "count": 3,
                                "percentage": "7.89%"
                            },
                            {
                                "movement": "Equal",
                                "count": 2,
                                "percentage": "5.26%"
                            }
                        ]
                    }
                },
                "Down": {
                    "totalOccurrences": 3,
                    "nextNumbers": {
                        "raw": {
                            "0": 1,
                            "1": 1,
                            "5": 1
                        },
                        "percentages": {
                            "0": "33.33%",
                            "1": "33.33%",
                            "5": "33.33%"
                        },
                        "mostCommon": [
                            {
                                "number": "0",
                                "count": 1,
                                "percentage": "33.33%"
                            },
                            {
                                "number": "1",
                                "count": 1,
                                "percentage": "33.33%"
                            },
                            {
                                "number": "5",
                                "count": 1,
                                "percentage": "33.33%"
                            }
                        ]
                    },
                    "nextMovements": {
                        "raw": {
                            "Up": 0,
                            "Down": 2,
                            "Equal": 1
                        },
                        "percentages": {
                            "Up": "0.00%",
                            "Down": "66.67%",
                            "Equal": "33.33%"
                        },
                        "mostCommon": [
                            {
                                "movement": "Down",
                                "count": 2,
                                "percentage": "66.67%"
                            },
                            {
                                "movement": "Equal",
                                "count": 1,
                                "percentage": "33.33%"
                            },
                            {
                                "movement": "Up",
                                "count": 0,
                                "percentage": "0.00%"
                            }
                        ]
                    }
                },
                "Equal": {
                    "totalOccurrences": 3,
                    "nextNumbers": {
                        "raw": {
                            "0": 1,
                            "1": 1,
                            "6": 1
                        },
                        "percentages": {
                            "0": "33.33%",
                            "1": "33.33%",
                            "6": "33.33%"
                        },
                        "mostCommon": [
                            {
                                "number": "0",
                                "count": 1,
                                "percentage": "33.33%"
                            },
                            {
                                "number": "1",
                                "count": 1,
                                "percentage": "33.33%"
                            },
                            {
                                "number": "6",
                                "count": 1,
                                "percentage": "33.33%"
                            }
                        ]
                    },
                    "nextMovements": {
                        "raw": {
                            "Up": 1,
                            "Down": 2,
                            "Equal": 0
                        },
                        "percentages": {
                            "Up": "33.33%",
                            "Down": "66.67%",
                            "Equal": "0.00%"
                        },
                        "mostCommon": [
                            {
                                "movement": "Down",
                                "count": 2,
                                "percentage": "66.67%"
                            },
                            {
                                "movement": "Up",
                                "count": 1,
                                "percentage": "33.33%"
                            },
                            {
                                "movement": "Equal",
                                "count": 0,
                                "percentage": "0.00%"
                            }
                        ]
                    }
                }
            },
            "6": {
                "Up": {
                    "totalOccurrences": 18,
                    "nextNumbers": {
                        "raw": {
                            "0": 5,
                            "1": 4,
                            "2": 6,
                            "4": 2,
                            "5": 1
                        },
                        "percentages": {
                            "0": "27.78%",
                            "1": "22.22%",
                            "2": "33.33%",
                            "4": "11.11%",
                            "5": "5.56%"
                        },
                        "mostCommon": [
                            {
                                "number": "2",
                                "count": 6,
                                "percentage": "33.33%"
                            },
                            {
                                "number": "0",
                                "count": 5,
                                "percentage": "27.78%"
                            },
                            {
                                "number": "1",
                                "count": 4,
                                "percentage": "22.22%"
                            }
                        ]
                    },
                    "nextMovements": {
                        "raw": {
                            "Up": 0,
                            "Down": 18,
                            "Equal": 0
                        },
                        "percentages": {
                            "Up": "0.00%",
                            "Down": "100.00%",
                            "Equal": "0.00%"
                        },
                        "mostCommon": [
                            {
                                "movement": "Down",
                                "count": 18,
                                "percentage": "100.00%"
                            },
                            {
                                "movement": "Up",
                                "count": 0,
                                "percentage": "0.00%"
                            },
                            {
                                "movement": "Equal",
                                "count": 0,
                                "percentage": "0.00%"
                            }
                        ]
                    }
                }
            },
            "7": {
                "Up": {
                    "totalOccurrences": 10,
                    "nextNumbers": {
                        "raw": {
                            "0": 4,
                            "1": 1,
                            "2": 2,
                            "3": 1,
                            "5": 2
                        },
                        "percentages": {
                            "0": "40.00%",
                            "1": "10.00%",
                            "2": "20.00%",
                            "3": "10.00%",
                            "5": "20.00%"
                        },
                        "mostCommon": [
                            {
                                "number": "0",
                                "count": 4,
                                "percentage": "40.00%"
                            },
                            {
                                "number": "2",
                                "count": 2,
                                "percentage": "20.00%"
                            },
                            {
                                "number": "5",
                                "count": 2,
                                "percentage": "20.00%"
                            }
                        ]
                    },
                    "nextMovements": {
                        "raw": {
                            "Up": 0,
                            "Down": 10,
                            "Equal": 0
                        },
                        "percentages": {
                            "Up": "0.00%",
                            "Down": "100.00%",
                            "Equal": "0.00%"
                        },
                        "mostCommon": [
                            {
                                "movement": "Down",
                                "count": 10,
                                "percentage": "100.00%"
                            },
                            {
                                "movement": "Up",
                                "count": 0,
                                "percentage": "0.00%"
                            },
                            {
                                "movement": "Equal",
                                "count": 0,
                                "percentage": "0.00%"
                            }
                        ]
                    }
                }
            },
            "8": {
                "Up": {
                    "totalOccurrences": 1,
                    "nextNumbers": {
                        "raw": {
                            "6": 1
                        },
                        "percentages": {
                            "6": "100.00%"
                        },
                        "mostCommon": [
                            {
                                "number": "6",
                                "count": 1,
                                "percentage": "100.00%"
                            }
                        ]
                    },
                    "nextMovements": {
                        "raw": {
                            "Up": 0,
                            "Down": 1,
                            "Equal": 0
                        },
                        "percentages": {
                            "Up": "0.00%",
                            "Down": "100.00%",
                            "Equal": "0.00%"
                        },
                        "mostCommon": [
                            {
                                "movement": "Down",
                                "count": 1,
                                "percentage": "100.00%"
                            },
                            {
                                "movement": "Up",
                                "count": 0,
                                "percentage": "0.00%"
                            },
                            {
                                "movement": "Equal",
                                "count": 0,
                                "percentage": "0.00%"
                            }
                        ]
                    }
                }
            },
            "9": {
                "Up": {
                    "totalOccurrences": 1,
                    "nextNumbers": {
                        "raw": {
                            "0": 1
                        },
                        "percentages": {
                            "0": "100.00%"
                        },
                        "mostCommon": [
                            {
                                "number": "0",
                                "count": 1,
                                "percentage": "100.00%"
                            }
                        ]
                    },
                    "nextMovements": {
                        "raw": {
                            "Up": 0,
                            "Down": 1,
                            "Equal": 0
                        },
                        "percentages": {
                            "Up": "0.00%",
                            "Down": "100.00%",
                            "Equal": "0.00%"
                        },
                        "mostCommon": [
                            {
                                "movement": "Down",
                                "count": 1,
                                "percentage": "100.00%"
                            },
                            {
                                "movement": "Up",
                                "count": 0,
                                "percentage": "0.00%"
                            },
                            {
                                "movement": "Equal",
                                "count": 0,
                                "percentage": "0.00%"
                            }
                        ]
                    }
                }
            }
        },
        "totalDraws": 626,
        "mostFrequentFirstNumber": [
            "0",
            178
        ],
        "additionalStats": {
            "upToDownRatio": "1.05",
            "equalPercentage": "17.57%"
        }
}


export async function GET() {
    try {
        let month = getCurrentMonth();

        const firestore = adminDb.firestore();

        // Query the latest draw in the current month, ordered by index descending
        const drawsCollection = firestore
            .collection("draws")
            .where("drawMonth", "==", month)
            .orderBy("index", "desc")
            .limit(1);

        const snapshot = await drawsCollection.get();

        if (snapshot.empty) {
            return new Response(JSON.stringify({ error: "No draws found for the current month." }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Get the latest draw data
        const latestDrawDoc = snapshot.docs[0];
        const latestDraw = latestDrawDoc.data();

        // Extract the last 8 first numbers
        const last8FirstNumbers = [
            latestDraw.previousFirstNumber7,
            latestDraw.previousFirstNumber6,
            latestDraw.previousFirstNumber5,
            latestDraw.previousFirstNumber4,
            latestDraw.previousFirstNumber3,
            latestDraw.previousFirstNumber2,
            latestDraw.previousFirstNumber1,
            latestDraw.currentFirstNumber,
        ]

        // Extract all movements for first numbers
        const lastMovementsFirstNumber = [
            latestDraw.previousFirstNumberMovement5,
            latestDraw.previousFirstNumberMovement4,
            latestDraw.previousFirstNumberMovement3,
            latestDraw.previousFirstNumberMovement2,
            latestDraw.previousFirstNumberMovement1,
            latestDraw.firstNumberMovement,
        ]

        const prediction = predictNextNumber(last8FirstNumbers, lastMovementsFirstNumber);

        return new Response(JSON.stringify(prediction), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, max-age=0',
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
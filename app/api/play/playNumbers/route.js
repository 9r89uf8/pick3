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

function getMovement(currentNumber, selectedNumber) {
    if (selectedNumber > currentNumber) {
        return 'Up';
    } else if (selectedNumber < currentNumber) {
        return 'Down';
    } else {
        return 'Equal';
    }
}

// Helper function to check if a number exists in any combination
function isNumberUsedInCombinations(number, position, combinations) {
    return combinations.some(combo => combo.numbers[position] === number);
}

// Helper function to generate a partial match combination
function generatePartialMatchCombination(currentNumbers, previousData, usedCombinations) {
    const inRangeNumbers = [
        [0, 1, 2],      // Position 0 in-range numbers
        [3, 4, 5, 6],   // Position 1 in-range numbers
        [7, 8, 9]       // Position 2 in-range numbers
    ];

    const outOfRangeNumbers = [
        [3],          // Position 0 out-of-range numbers
        [2, 7],       // Position 1 out-of-range numbers
        [6]           // Position 2 out-of-range numbers
    ];

    const outOfRangePosition = Math.floor(Math.random() * 3);

    let numbers = [];
    let attempts = 0;
    const maxAttempts = 100; // Prevent infinite loops

    for (let i = 0; i < 3; i++) {
        attempts = 0;
        while (attempts < maxAttempts) {
            let possibleNumbers;
            if (i === outOfRangePosition) {
                possibleNumbers = outOfRangeNumbers[i];
            } else {
                possibleNumbers = inRangeNumbers[i];
            }

            // Filter numbers that are already used in other combinations
            possibleNumbers = possibleNumbers.filter(num =>
                !isNumberUsedInCombinations(num, i, usedCombinations)
            );

            // Filter possibleNumbers to those >= last number to maintain order
            if (numbers.length > 0) {
                const lastNumber = numbers[numbers.length - 1];
                possibleNumbers = possibleNumbers.filter(num => num >= lastNumber);
            }

            if (possibleNumbers.length > 0) {
                const randomIndex = Math.floor(Math.random() * possibleNumbers.length);
                const num = possibleNumbers[randomIndex];
                numbers.push(num);
                break;
            }
            attempts++;
        }

        if (attempts >= maxAttempts) {
            // If we can't find valid numbers, return null to trigger regeneration
            return null;
        }
    }

    return {
        numbers: numbers,
        movements: numbers.map((num, idx) => getMovement(currentNumbers[idx], num)),
        currentNumbers: currentNumbers,
        ...previousData
    };
}

// Function to generate unique in-range combinations
function generateUniqueInRangeCombination(currentNumbers, previousData, usedCombinations) {
    const validCombinations = [];

    for (let first = 0; first <= 2; first++) {
        if (isNumberUsedInCombinations(first, 0, usedCombinations)) continue;

        for (let second = 3; second <= 6; second++) {
            if (isNumberUsedInCombinations(second, 1, usedCombinations)) continue;
            if (second <= first) continue;

            for (let third = 7; third <= 9; third++) {
                if (isNumberUsedInCombinations(third, 2, usedCombinations)) continue;
                if (third <= second) continue;

                validCombinations.push({
                    numbers: [first, second, third],
                    movements: [
                        getMovement(currentNumbers[0], first),
                        getMovement(currentNumbers[1], second),
                        getMovement(currentNumbers[2], third)
                    ],
                    currentNumbers,
                    ...previousData
                });
            }
        }
    }

    if (validCombinations.length === 0) return null;

    // Randomly select one combination
    const randomIndex = Math.floor(Math.random() * validCombinations.length);
    return validCombinations[randomIndex];
}

export async function GET() {
    try {
        let month = getCurrentMonth();
        const firestore = adminDb.firestore();

        const drawsCollection = firestore
            .collection("draws")
            .where("drawMonth", "==", month)
            .orderBy("index", "desc")
            .limit(1);

        const snapshot = await drawsCollection.get();

        if (snapshot.empty) {
            throw new Error('No draws found for the current month.');
        }

        const latestDrawDoc = snapshot.docs[0];
        const latestDraw = latestDrawDoc.data();

        const currentNumbers = [
            latestDraw.currentFirstNumber,
            latestDraw.currentSecondNumber,
            latestDraw.currentThirdNumber
        ];

        const previousData = {
            previousNumbers1: [latestDraw.previousFirstNumber1, latestDraw.previousSecondNumber1, latestDraw.previousThirdNumber1],
            previousNumbers2: [latestDraw.previousFirstNumber2, latestDraw.previousSecondNumber2, latestDraw.previousThirdNumber2],
            previousNumbers3: [latestDraw.previousFirstNumber3, latestDraw.previousSecondNumber3, latestDraw.previousThirdNumber3],
            previousMovements1: [latestDraw.previousFirstNumberMovement1, latestDraw.previousSecondNumberMovement1, latestDraw.previousThirdNumberMovement1],
            previousMovements2: [latestDraw.previousFirstNumberMovement2, latestDraw.previousSecondNumberMovement2, latestDraw.previousThirdNumberMovement2],
            previousMovements3: [latestDraw.previousFirstNumberMovement3, latestDraw.previousSecondNumberMovement3, latestDraw.previousThirdNumberMovement3],
            currentMovements: [latestDraw.firstNumberMovement, latestDraw.secondNumberMovement, latestDraw.thirdNumberMovement]
        };

        const combinations = [];
        let maxAttempts = 50;
        let attempts = 0;

        while (combinations.length < 3 && attempts < maxAttempts) {
            if (combinations.length === 0) {
                // Generate first in-range combination
                const inRangeCombination = generateUniqueInRangeCombination(currentNumbers, previousData, combinations);
                if (inRangeCombination) {
                    combinations.push(inRangeCombination);
                }
            } else {
                // Generate partial match combinations
                const partialMatch = generatePartialMatchCombination(currentNumbers, previousData, combinations);
                if (partialMatch) {
                    combinations.push(partialMatch);
                }
            }
            attempts++;
        }

        if (combinations.length < 3) {
            throw new Error('Unable to generate enough unique combinations.');
        }

        // Shuffle the final combinations
        for (let i = combinations.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [combinations[i], combinations[j]] = [combinations[j], combinations[i]];
        }

        return new Response(JSON.stringify(combinations), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, max-age=0',
            },
        });
    } catch (error) {
        console.error(error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

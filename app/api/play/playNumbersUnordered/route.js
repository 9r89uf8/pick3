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

function generateRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isAscendingOrDescending(array) {
    return (array[0] < array[1] && array[1] < array[2]) ||
        (array[0] > array[1] && array[1] > array[2]);
}

function hasRepeatingNumbers(array) {
    return new Set(array).size !== array.length;
}

function generateDraw() {
    const firstNumber = generateRandomInt(0, 3);  // Range 0-3
    const secondNumber = generateRandomInt(2, 7);  // Range 2-7
    const thirdNumber = generateRandomInt(6, 9);  // Range 6-9

    // Randomly shuffle the positions
    const numbers = [firstNumber, secondNumber, thirdNumber];
    for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }

    // If it's ascending/descending or has repeating numbers, generate new draw
    if (isAscendingOrDescending(numbers) || hasRepeatingNumbers(numbers)) {
        return generateDraw();
    }

    return numbers;
}


function tooSimilarToPrevious(combination, latestDraw) {
    let found = false;
    const c = combination;

    // current
    if (c[0] === latestDraw.originalFirstNumber && c[1] === latestDraw.originalSecondNumber) found = true;
    if (c[0] === latestDraw.originalFirstNumber && c[2] === latestDraw.originalThirdNumber) found = true;
    if (c[1] === latestDraw.originalSecondNumber && c[2] === latestDraw.originalThirdNumber) found = true;

    // previous1
    if (c[0] === latestDraw.originalPreviousFirst1 && c[1] === latestDraw.originalPreviousSecond1) found = true;
    if (c[0] === latestDraw.originalPreviousFirst1 && c[2] === latestDraw.originalPreviousThird1) found = true;
    if (c[1] === latestDraw.originalPreviousSecond1 && c[2] === latestDraw.originalPreviousThird1) found = true;

    // previous2
    if (c[0] === latestDraw.originalPreviousFirst2 && c[1] === latestDraw.originalPreviousSecond2) found = true;
    if (c[0] === latestDraw.originalPreviousFirst2 && c[2] === latestDraw.originalPreviousThird2) found = true;
    if (c[1] === latestDraw.originalPreviousSecond2 && c[2] === latestDraw.originalPreviousThird2) found = true;

    // previous3
    if (c[0] === latestDraw.originalPreviousFirst3 && c[1] === latestDraw.originalPreviousSecond3) found = true;
    if (c[0] === latestDraw.originalPreviousFirst3 && c[2] === latestDraw.originalPreviousThird3) found = true;
    if (c[1] === latestDraw.originalPreviousSecond3 && c[2] === latestDraw.originalPreviousThird3) found = true;

    return found;
}

// Previous code remains the same until generateDraws function

function isInLast50Draws(combination, last50Combinations) {
    return last50Combinations.some(existingComb =>
        combination[0] === existingComb[0] &&
        combination[1] === existingComb[1] &&
        combination[2] === existingComb[2]
    );
}

// First, let's add a function to check if a draw contains excluded numbers
function hasExcludedNumbers(draw, excludedNumbers) {
    // Check first position
    if (excludedNumbers.first.includes(draw[0])) return true;
    // Check second position
    if (excludedNumbers.second.includes(draw[1])) return true;
    // Check third position
    if (excludedNumbers.third.includes(draw[2])) return true;
    return false;
}

function generateDraws(latestDraw, last50Combinations, excludedNumbers = { first: [], second: [], third: [] }) {
    const draws = [];
    const numberCounts = new Map(); // Track overall number frequency
    const positionCounts = [new Map(), new Map(), new Map()]; // Track frequency per position

    const MAX_TOTAL_APPEARANCES = 2;
    const MAX_POSITION_APPEARANCES = 1; // Only allow each number once per position
    const MAX_ATTEMPTS = 1000; // Prevent infinite loops
    let attempts = 0;

    while (draws.length < 6 && attempts < MAX_ATTEMPTS) {
        attempts++;
        const draw = generateDraw();

        // Check if the draw satisfies all conditions including excluded numbers
        const canAdd = draw.every((num, pos) => {
                const totalCount = numberCounts.get(num) || 0;
                const posCount = positionCounts[pos].get(num) || 0;

                return totalCount < MAX_TOTAL_APPEARANCES &&
                    posCount < MAX_POSITION_APPEARANCES;
            }) &&
            !tooSimilarToPrevious(draw, latestDraw) &&
            !isInLast50Draws(draw, last50Combinations) &&
            !hasExcludedNumbers(draw, excludedNumbers); // Add check for excluded numbers

        if (canAdd) {
            draws.push(draw);
            // Update both counting maps
            draw.forEach((num, pos) => {
                numberCounts.set(num, (numberCounts.get(num) || 0) + 1);
                positionCounts[pos].set(num, (positionCounts[pos].get(num) || 0) + 1);
            });
        }
    }

    if (draws.length < 6) {
        throw new Error('Could not generate enough valid draws after maximum attempts');
    }

    return draws;
}

export async function POST(req) {
    try {
        const { excludedNumbers = { first: [], second: [], third: [] } } = await req.json();
        let month = getCurrentMonth();
        const firestore = adminDb.firestore();

        const drawsCollection = firestore
            .collection("draws")
            .where("drawMonth", "==", month)
            .orderBy("index", "desc")
            .limit(1);

        const drawsCollectionLast50 = firestore
            .collection("draws")
            .where("drawMonth", "==", month)
            .orderBy("index", "desc")
            .limit(50);

        // Fetch both the latest draw and last 50 draws
        const [latestSnapshot, last50Snapshot] = await Promise.all([
            drawsCollection.get(),
            drawsCollectionLast50.get()
        ]);

        // Get the latest draw data
        const latestDrawDoc = latestSnapshot.docs[0];
        const latestDraw = latestDrawDoc.data();

        // Extract last 50 draws combinations
        const last50Combinations = last50Snapshot.docs.map(doc => {
            const data = doc.data();
            return [data.originalFirstNumber, data.originalSecondNumber, data.originalThirdNumber];
        });

        const result = {
            numbers: generateDraws(latestDraw, last50Combinations, excludedNumbers)
        };

        return new Response(JSON.stringify(result.numbers), {
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
            headers: {
                'Content-Type': 'application/json'
            },
        });
    }
}
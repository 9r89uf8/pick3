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

function isExcluded(num, position, excludedNumbers) {
    if (position === 0) return excludedNumbers.first.includes(num);
    if (position === 1) return excludedNumbers.second.includes(num);
    if (position === 2) return excludedNumbers.third.includes(num);
    return false;
}

function isInLast20Draws(combination, last20Combinations) {
    return last20Combinations.some(existingComb =>
        existingComb[0] === combination.numbers[0] &&
        existingComb[1] === combination.numbers[1] &&
        existingComb[2] === combination.numbers[2]
    );
}

function tooSimilarToPrevious(combination, latestDraw) {
    let found = false;
    const c = combination.numbers;

    // current
    if (c[0] === latestDraw.currentFirstNumber && c[1] === latestDraw.currentSecondNumber) found = true;
    if (c[0] === latestDraw.currentFirstNumber && c[2] === latestDraw.currentThirdNumber) found = true;
    if (c[1] === latestDraw.currentSecondNumber && c[2] === latestDraw.currentThirdNumber) found = true;

    // previous1
    if (c[0] === latestDraw.previousFirstNumber1 && c[1] === latestDraw.previousSecondNumber1) found = true;
    if (c[0] === latestDraw.previousFirstNumber1 && c[2] === latestDraw.previousThirdNumber1) found = true;
    if (c[1] === latestDraw.previousSecondNumber1 && c[2] === latestDraw.previousThirdNumber1) found = true;

    // previous2
    if (c[0] === latestDraw.previousFirstNumber2 && c[1] === latestDraw.previousSecondNumber2) found = true;
    if (c[0] === latestDraw.previousFirstNumber2 && c[2] === latestDraw.previousThirdNumber2) found = true;
    if (c[1] === latestDraw.previousSecondNumber2 && c[2] === latestDraw.previousThirdNumber2) found = true;

    // previous3
    if (c[0] === latestDraw.previousFirstNumber3 && c[1] === latestDraw.previousSecondNumber3) found = true;
    if (c[0] === latestDraw.previousFirstNumber3 && c[2] === latestDraw.previousThirdNumber3) found = true;
    if (c[1] === latestDraw.previousSecondNumber3 && c[2] === latestDraw.previousThirdNumber3) found = true;

    return found;
}

function isValidCombination(combination, excludedNumbers, last20Combinations, latestDraw) {
    const nums = combination.numbers;

    // Check excluded numbers
    for (let i = 0; i < 3; i++) {
        if (isExcluded(nums[i], i, excludedNumbers)) return false;
    }

    // Check order
    if (nums[0] > nums[1] || nums[1] > nums[2]) return false;

    // Check last 20 draws
    if (isInLast20Draws(combination, last20Combinations)) return false;

    // Check similarity
    if (tooSimilarToPrevious(combination, latestDraw)) return false;

    return true;
}

function addMovements(combination, currentNumbers) {
    const nums = combination.numbers;
    combination.movements = [
        getMovement(currentNumbers[0], nums[0]),
        getMovement(currentNumbers[1], nums[1]),
        getMovement(currentNumbers[2], nums[2])
    ];
    return combination;
}

export async function POST(req) {
    try {
        let month = getCurrentMonth();
        const firestore = adminDb.firestore();
        const { excludedNumbers = { first: [], second: [], third: [] } } = await req.json();

        // Validate excluded numbers
        if (!Array.isArray(excludedNumbers.first)) excludedNumbers.first = [];
        if (!Array.isArray(excludedNumbers.second)) excludedNumbers.second = [];
        if (!Array.isArray(excludedNumbers.third)) excludedNumbers.third = [];

        const drawsCollection = firestore
            .collection("draws")
            .where("drawMonth", "==", month)
            .orderBy("index", "desc")
            .limit(1);

        const drawsCollectionLast20 = firestore
            .collection("draws")
            .where("drawMonth", "==", month)
            .orderBy("index", "desc")
            .limit(20);

        // Fetch both the latest draw and last 20 draws
        const [latestSnapshot, last20Snapshot] = await Promise.all([
            drawsCollection.get(),
            drawsCollectionLast20.get()
        ]);

        if (latestSnapshot.empty) {
            throw new Error('No draws found for the current month.');
        }

        // Get the latest draw data
        const latestDrawDoc = latestSnapshot.docs[0];
        const latestDraw = latestDrawDoc.data();

        // Extract last 20 draws combinations
        const last20Combinations = last20Snapshot.docs.map(doc => {
            const data = doc.data();
            return [data.currentFirstNumber, data.currentSecondNumber, data.currentThirdNumber];
        });

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

        // Generate candidates for each draw

        // Draw #1:
        let candidates1 = [];
        for (let f of [0,1,2]) {
            for (let s of [3,4,5,6]) {
                const combo = {
                    numbers: [f,s,6],
                    currentNumbers,
                    ...previousData
                };
                if (isValidCombination(combo, excludedNumbers, last20Combinations, latestDraw)) {
                    candidates1.push(combo);
                }
            }
        }

        // Draw #2:
        let candidates2 = [];
        for (let f of [0,1,2]) {
            for (let sec of [2,7]) {
                for (let t of [7,8,9]) {
                    if (f <= sec && sec <= t) {
                        const combo = {
                            numbers: [f,sec,t],
                            currentNumbers,
                            ...previousData
                        };
                        if (isValidCombination(combo, excludedNumbers, last20Combinations, latestDraw)) {
                            candidates2.push(combo);
                        }
                    }
                }
            }
        }

        // Draw #3:
        let candidates3 = [];
        {
            const f = 3;
            if (!isExcluded(3,0,excludedNumbers)) {
                for (let s of [3,4,5,6]) {
                    for (let t of [7,8,9]) {
                        if (f <= s && s <= t) {
                            const combo = {
                                numbers: [3,s,t],
                                currentNumbers,
                                ...previousData
                            };
                            if (isValidCombination(combo, excludedNumbers, last20Combinations, latestDraw)) {
                                candidates3.push(combo);
                            }
                        }
                    }
                }
            }
        }

        // Draw #4:
        let candidates4 = [];
        for (let f of [0,1,2]) {
            for (let s of [3,4,5,6]) {
                for (let t of [7,8,9]) {
                    if (f <= s && s <= t) {
                        const combo = {
                            numbers: [f,s,t],
                            currentNumbers,
                            ...previousData
                        };
                        if (isValidCombination(combo, excludedNumbers, last20Combinations, latestDraw)) {
                            candidates4.push(combo);
                        }
                    }
                }
            }
        }

        function shuffleArray(arr) {
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
        }

        shuffleArray(candidates1);
        shuffleArray(candidates2);
        shuffleArray(candidates3);
        shuffleArray(candidates4);


        // Backtracking function
        function backtrack(chosen, index, allCandidates, usedNumbersPerPos, requiredCount) {
            if (index === requiredCount) {
                return chosen; // Found the required number of draws
            }

            for (let combo of allCandidates[index]) {
                const nums = combo.numbers;
                // Check no repetition in positions
                let canUse = true;
                for (let pos = 0; pos < 3; pos++) {
                    if (usedNumbersPerPos[pos].has(nums[pos])) {
                        canUse = false;
                        break;
                    }
                }
                if (!canUse) continue;

                // Choose this combo
                for (let pos = 0; pos < 3; pos++) {
                    usedNumbersPerPos[pos].add(nums[pos]);
                }
                chosen.push(combo);

                const result = backtrack(chosen, index+1, allCandidates, usedNumbersPerPos, requiredCount);
                if (result) {
                    return result;
                }

                // Backtrack
                chosen.pop();
                for (let pos = 0; pos < 3; pos++) {
                    usedNumbersPerPos[pos].delete(nums[pos]);
                }
            }

            return null;
        }

        // Try to find 4 first
        function tryForCount(requiredCount) {
            const allCandidates = [candidates1, candidates2, candidates3, candidates4].slice(0, requiredCount);
            const usedNumbersPerPos = [new Set(), new Set(), new Set()];
            return backtrack([], 0, allCandidates, usedNumbersPerPos, requiredCount);
        }

        let result = tryForCount(4);
        if (!result) {
            // Try for 3
            result = tryForCount(3);
            if (!result) {
                // Try for 2
                result = tryForCount(2);
                if (!result) {
                    throw new Error('Unable to find at least 2 draws that meet the constraints.');
                }
            }
        }

        // Add movements to the final chosen combinations
        for (let combo of result) {
            addMovements(combo, currentNumbers);
        }


        return new Response(JSON.stringify(result), {
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

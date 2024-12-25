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


// Check if combination has any repeating numbers
function hasRepeatingNumbers(array) {
    return new Set(array).size !== array.length;
}

// ======================
// Checks against previous draws
// ======================
function tooSimilarToPrevious(combination, latestDraw) {
    if (!latestDraw) return false; // If there's no "latestDraw" data, skip.

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

// Check if combination is in the last 50 draws
function isInLast50Draws(combination, last50Combinations) {
    return last50Combinations.some(existingComb =>
        combination[0] === existingComb[0] &&
        combination[1] === existingComb[1] &&
        combination[2] === existingComb[2]
    );
}

// Check if a draw contains excluded numbers (by position)
function hasExcludedNumbers(draw, excludedNumbers) {
    // Check first position
    if (excludedNumbers.first.includes(draw[0])) return true;
    // Check second position
    if (excludedNumbers.second.includes(draw[1])) return true;
    // Check third position
    if (excludedNumbers.third.includes(draw[2])) return true;
    return false;
}

// ===========================================================
// The MAIN generator that enforces the 6 permutations + no reuse in the same position
// ===========================================================
function generateDraws(latestDraw, last50Combinations, excludedNumbers = { first: [], second: [], third: [] }) {
    /*
      We want exactly 6 draws with the permutations:
         1) (L, M, H)
         2) (L, H, M)
         3) (M, L, H)
         4) (M, H, L)
         5) (H, L, M)
         6) (H, M, L)
      where:
        L in [0..3], M in [2..7], H in [6..9]

      Also, we CANNOT reuse the same number in the same position across draws.
    */

    // The sets from which we pick actual L, M, and H values:
    const L_vals = [0, 1, 2, 3];
    const M_vals = [2, 3, 4, 5, 6, 7];
    const H_vals = [6, 7, 8, 9];

    // The 6 permutations we want to fulfill exactly once each:
    const permutations = [
        ["L", "M", "H"], // #1
        ["L", "H", "M"], // #2
        ["M", "L", "H"], // #3
        ["M", "H", "L"], // #4
        ["H", "L", "M"], // #5
        ["H", "M", "L"], // #6
    ];

    // To ensure “no two draws can have the same number in the same position”:
    // We'll track used values for each column.
    const usedInPosition = [new Set(), new Set(), new Set()];

    const draws = [];
    const MAX_ATTEMPTS = 2000;
    let attempts = 0;

    // Helper to pick a random item from an array
    function pickRandom(arr) {
        const idx = Math.floor(Math.random() * arr.length);
        return arr[idx];
    }

    // For each of the 6 permutations, we attempt to find a valid triple (a,b,c).
    // We'll do a “retry” approach if we fail to find a valid assignment.
    for (let permIndex = 0; permIndex < permutations.length; permIndex++) {
        const [pos1Cat, pos2Cat, pos3Cat] = permutations[permIndex];
        let foundValid = false;

        // We try picking random values (with a limit on attempts to avoid infinite loop).
        for (let localTry = 0; localTry < 500; localTry++) {
            // 1) pick an L, M, H candidate respecting the category for each position
            let val1, val2, val3;

            // pick the correct sets for each position’s category
            if (pos1Cat === "L") val1 = pickRandom(L_vals);
            if (pos1Cat === "M") val1 = pickRandom(M_vals);
            if (pos1Cat === "H") val1 = pickRandom(H_vals);

            if (pos2Cat === "L") val2 = pickRandom(L_vals);
            if (pos2Cat === "M") val2 = pickRandom(M_vals);
            if (pos2Cat === "H") val2 = pickRandom(H_vals);

            if (pos3Cat === "L") val3 = pickRandom(L_vals);
            if (pos3Cat === "M") val3 = pickRandom(M_vals);
            if (pos3Cat === "H") val3 = pickRandom(H_vals);

            const candidate = [val1, val2, val3];

            // Check #1: distinct numbers in the triple?
            if (hasRepeatingNumbers(candidate)) continue;

            // Check #2: not used in the same position
            if (usedInPosition[0].has(val1)) continue;
            if (usedInPosition[1].has(val2)) continue;
            if (usedInPosition[2].has(val3)) continue;

            // Check #3: excluded numbers by position
            if (hasExcludedNumbers(candidate, excludedNumbers)) continue;

            // Check #4: tooSimilarToPrevious
            if (tooSimilarToPrevious(candidate, latestDraw)) continue;

            // Check #5: isInLast50Draws
            if (isInLast50Draws(candidate, last50Combinations)) continue;

            // If we passed all checks, we accept this triple
            draws.push(candidate);

            // Mark used in each position
            usedInPosition[0].add(val1);
            usedInPosition[1].add(val2);
            usedInPosition[2].add(val3);

            foundValid = true;
            break; // break from the localTry loop
        }

        if (!foundValid) {
            // If we fail to find a valid triple for this permutation, we can either:
            // a) Throw an error
            // b) Clear everything and re-try from scratch
            // For simplicity, let's throw an error:
            throw new Error(
                `Could not find a valid assignment for permutation #${permIndex + 1} (${permutations[permIndex]})`
            );
        }

        attempts++;
        if (attempts > MAX_ATTEMPTS) {
            throw new Error("Too many attempts while generating draws.");
        }
    }

    if (draws.length < 6) {
        throw new Error('Could not generate 6 valid draws after maximum attempts.');
    }

    return draws;
}

// ===========================================================
// Generate 2 "extra" draws from the leftover permutations
// ===========================================================
function generateExtraDraws({
                                leftoverPermutations,      // array of ["L","H","M"], etc.
                                count,                     // how many extra draws we want (2)
                                main6Draws,               // the 6 draws we already produced
                                pastFirstPosition,         // e.g. pastNumbersInFirstPosition
                                pastSecondPosition,
                                pastThirdPosition,
                                latestDraw,
                                last50Combinations,
                                excludedNumbers
                            }) {
    /*
      We want 2 extra draws, each from leftoverPermutations (like ["L","H","M"]).
      For each position, we try to use “unused” numbers from the main 6 draws in that position,
      but skipping any that appear in the 'pastNumbers' array for that position.

      If we can't find an “unused” candidate, we fallback to picking from 0..9 in the
      category range (L => [0..3], M => [2..7], H => [6..9]), also skipping 'pastNumbers'.

      We do not prohibit reusing numbers from the main 6 draws in the same position;
      we only skip “pastNumbersInXPosition”.

      We still do these checks:
        - hasRepeatingNumbers
        - excludedNumbers
        - tooSimilarToPrevious
        - isInLast50Draws
    */
    const L_vals = [0, 1, 2, 3];
    const M_vals = [2, 3, 4, 5, 6, 7];
    const H_vals = [6, 7, 8, 9];

    // Build a "usedInPosition" map for the main 6 draws,
    // so we know which numbers were used or not used in each position.
    const usedPos0 = new Set();
    const usedPos1 = new Set();
    const usedPos2 = new Set();
    for (let d of main6Draws) {
        usedPos0.add(d[0]);
        usedPos1.add(d[1]);
        usedPos2.add(d[2]);
    }

    // For each position, figure out which numbers were NOT used among the 6 draws.
    // E.g. notUsedPos0 = all 0..9 minus usedPos0.
    // But we should also respect the category (L, M, H) for each position.
    function getUnusedForCategory(posIndex, cat) {
        let allCandidates;
        if (cat === "L") {
            allCandidates = L_vals;
        } else if (cat === "M") {
            allCandidates = M_vals;
        } else {
            allCandidates = H_vals;
        }

        const usedSet = (posIndex === 0) ? usedPos0 :
            (posIndex === 1) ? usedPos1 :
                usedPos2;

        // The array of items in "allCandidates" that are not in "usedSet"
        return allCandidates.filter(x => !usedSet.has(x));
    }

    // We'll pick exactly 'count' permutations from leftoverPermutations.
    // For simplicity, just shuffle leftoverPermutations and take the first 2.
    function shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
    const shuffled = shuffleArray([...leftoverPermutations]);
    const chosenPerms = shuffled.slice(0, count);

    const extraDraws = [];

    // Helper to pick a single position's number:
    // 1) Attempt to pick from "unused" for that category, skipping "pastNumbersInXPosition".
    // 2) If no good candidate, pick from the entire category minus pastNumbers.
    function pickNumberForPosition(posIndex, cat, notUsedInPos, pastNumbers) {
        // 1) Filter out anything in pastNumbers
        const filteredUnused = notUsedInPos.filter(num => !pastNumbers.includes(num));
        if (filteredUnused.length > 0) {
            // pick one randomly
            return filteredUnused[Math.floor(Math.random() * filteredUnused.length)];
        }

        // If no "unused" left, we pick from entire category (L, M, H) minus pastNumbers
        let allCandidates;
        if (cat === "L") {
            allCandidates = L_vals;
        } else if (cat === "M") {
            allCandidates = M_vals;
        } else {
            allCandidates = H_vals;
        }
        const filteredAll = allCandidates.filter(num => !pastNumbers.includes(num));
        if (filteredAll.length === 0) {
            // This theoretically can happen if 'pastNumbers' excludes all items in the category
            return null;
        }
        return filteredAll[Math.floor(Math.random() * filteredAll.length)];
    }

    // Now build each extra draw
    for (let i = 0; i < chosenPerms.length; i++) {
        const [cat1, cat2, cat3] = chosenPerms[i];
        let drawFound = false;

        // Try up to 500 attempts to find a valid triple
        for (let attempt = 0; attempt < 500; attempt++) {
            const notUsedPos0 = getUnusedForCategory(0, cat1);
            const notUsedPos1 = getUnusedForCategory(1, cat2);
            const notUsedPos2 = getUnusedForCategory(2, cat3);

            // pick first position
            const val1 = pickNumberForPosition(
                0,
                cat1,
                notUsedPos0,
                pastFirstPosition
            );
            if (val1 == null) continue;

            // pick second position
            const val2 = pickNumberForPosition(
                1,
                cat2,
                notUsedPos1,
                pastSecondPosition
            );
            if (val2 == null) continue;

            // pick third position
            const val3 = pickNumberForPosition(
                2,
                cat3,
                notUsedPos2,
                pastThirdPosition
            );
            if (val3 == null) continue;

            const candidate = [val1, val2, val3];

            // 1) Must have distinct numbers
            if (hasRepeatingNumbers(candidate)) continue;

            // 2) excludedNumbers check
            if (hasExcludedNumbers(candidate, excludedNumbers)) continue;

            // 3) tooSimilarToPrevious
            if (tooSimilarToPrevious(candidate, latestDraw)) continue;

            // 4) isInLast50Draws
            if (isInLast50Draws(candidate, last50Combinations)) continue;

            // If it passes all checks, we accept it
            extraDraws.push(candidate);
            drawFound = true;
            break;
        }

        if (!drawFound) {
            // If we fail, you can either throw an error, or just skip.
            // Let's throw an error for clarity.
            throw new Error(`Could not generate extra draw for permutation ${cat1},${cat2},${cat3}`);
        }
    }

    return extraDraws;
}

// ======================
// The POST handler
// ======================
export async function POST(req) {
    try {
        const { excludedNumbers = { first: [], second: [], third: [] } } = await req.json();
        let month = getCurrentMonth();
        const firestore = adminDb.firestore();

        // Query for the latest draw in this month
        const drawsCollection = firestore
            .collection("draws")
            .where("drawMonth", "==", month)
            .orderBy("index", "desc")
            .limit(1);

        // Query for the last 50 draws in this month
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

        // Get the latest draw data (if it exists)
        let latestDraw = null;
        if (!latestSnapshot.empty) {
            const latestDrawDoc = latestSnapshot.docs[0];
            latestDraw = latestDrawDoc.data();
        }

        // In case latestDraw is null, define these arrays safely
        let pastNumbersInFirstPosition = [];
        let pastNumbersInSecondPosition = [];
        let pastNumbersInThirdPosition = [];

        if (latestDraw) {
            // e.g. [latestDraw.originalFirstNumber, latestDraw.originalPreviousFirst1, ...]
            pastNumbersInFirstPosition = [
                latestDraw.originalFirstNumber,
                latestDraw.originalPreviousFirst1,
                latestDraw.originalPreviousFirst2,
                latestDraw.originalPreviousFirst3
            ].filter(x => x !== undefined && x !== null);

            pastNumbersInSecondPosition = [
                latestDraw.originalSecondNumber,
                latestDraw.originalPreviousSecond1,
                latestDraw.originalPreviousSecond2,
                latestDraw.originalPreviousSecond3
            ].filter(x => x !== undefined && x !== null);

            pastNumbersInThirdPosition = [
                latestDraw.originalThirdNumber,
                latestDraw.originalPreviousThird1,
                latestDraw.originalPreviousThird2,
                latestDraw.originalPreviousThird3
            ].filter(x => x !== undefined && x !== null);
        }

        // Extract the last 50 draws combinations
        const last50Combinations = last50Snapshot.docs.map(doc => {
            const data = doc.data();
            return [data.originalFirstNumber, data.originalSecondNumber, data.originalThirdNumber];
        });

        // 1) Generate the 6 main draws
        const main6 = generateDraws(latestDraw, last50Combinations, excludedNumbers);
        console.log("Main 6 draws:", main6);

        // 2) Generate 2 extra draws from leftover permutations
        //    leftover permutations: ["L","H","M"], ["M","L","H"], ["M","H","L"], ["H","L","M"]
        const leftoverPermutations = [
            ["L","H","M"],
            ["M","L","H"],
            ["M","H","L"],
            ["H","L","M"]
        ];

        const extra2 = generateExtraDraws({
            leftoverPermutations,
            count: 2,  // we only want 2 extras
            main6Draws: main6,
            pastFirstPosition: pastNumbersInFirstPosition,
            pastSecondPosition: pastNumbersInSecondPosition,
            pastThirdPosition: pastNumbersInThirdPosition,
            latestDraw,
            last50Combinations,
            excludedNumbers
        });
        console.log("Extra 2 draws:", extra2);

        // Combine them into final result
        const finalDraws = [...main6, ...extra2];

        return new Response(JSON.stringify(finalDraws), {
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

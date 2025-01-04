// app/api/posts/route.js
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/app/utils/firebaseAdmin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getMonths = () => {
    const currentDate = new Date();
    const currentMonthIndex = currentDate.getMonth();

    let twoMonthsAgoIndex;
    let previousMonthIndex;

    if (currentMonthIndex === 0) {  // January
        twoMonthsAgoIndex = 10;     // November of the previous year
        previousMonthIndex = 11;    // December of the previous year
    } else if (currentMonthIndex === 1) {  // February
        twoMonthsAgoIndex = 11;     // December of the previous year
        previousMonthIndex = 0;     // January
    } else {
        twoMonthsAgoIndex = currentMonthIndex - 2;
        previousMonthIndex = currentMonthIndex - 1;
    }

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return [monthNames[previousMonthIndex], monthNames[currentMonthIndex], monthNames[twoMonthsAgoIndex]];
};

function xS(combination, latestDraw) {
    let found = false;
    const current = combination
    const prev0 = [latestDraw.sortedFirstNumber, latestDraw.sortedSecondNumber, latestDraw.sortedThirdNumber];
    const prev1 = [latestDraw.sortedPreviousFirst1, latestDraw.sortedPreviousSecond1, latestDraw.sortedPreviousThird1];
    const prev2 = [latestDraw.sortedPreviousFirst2, latestDraw.sortedPreviousSecond2, latestDraw.sortedPreviousThird2];
    const prev3 = [latestDraw.sortedPreviousFirst3, latestDraw.sortedPreviousSecond3, latestDraw.sortedPreviousThird3];
    const prev4 = [latestDraw.sortedPreviousFirst4, latestDraw.sortedPreviousSecond4, latestDraw.sortedPreviousThird4];
    const prev5 = [latestDraw.sortedPreviousFirst5, latestDraw.sortedPreviousSecond5, latestDraw.sortedPreviousThird5];
    const prev6 = [latestDraw.sortedPreviousFirst6, latestDraw.sortedPreviousSecond6, latestDraw.sortedPreviousThird6];
    const prev7 = [latestDraw.sortedPreviousFirst7, latestDraw.sortedPreviousSecond7, latestDraw.sortedPreviousThird7];

    // Create an array of all previous combinations
    const prevCombinations = [prev0, prev1, prev2, prev3, prev4, prev5, prev6, prev7];

    // Check if current matches any previous combination
    found = prevCombinations.some(prev =>
        prev[0] === current[0] &&
        prev[1] === current[1] &&
        prev[2] === current[2]
    );

    return found;
}

function tooSimilarToPrevious(combination, latestDraw) {
    let found = false;
    const c = combination

    // current
    if (c[0] === latestDraw.sortedFirstNumber && c[1] === latestDraw.sortedSecondNumber) found = true;
    if (c[0] === latestDraw.sortedFirstNumber && c[2] === latestDraw.sortedThirdNumber) found = true;
    if (c[1] === latestDraw.sortedSecondNumber && c[2] === latestDraw.sortedThirdNumber) found = true;

    // previous1
    if (c[0] === latestDraw.sortedPreviousFirst1 && c[1] === latestDraw.sortedPreviousSecond1) found = true;
    if (c[0] === latestDraw.sortedPreviousFirst1 && c[2] === latestDraw.sortedPreviousThird1) found = true;
    if (c[1] === latestDraw.sortedPreviousSecond1 && c[2] === latestDraw.sortedPreviousThird1) found = true;

    // previous2
    // if (c[0] === latestDraw.sortedPreviousFirst2 && c[1] === latestDraw.sortedPreviousSecond2) found = true;
    // if (c[0] === latestDraw.sortedPreviousFirst2 && c[2] === latestDraw.sortedPreviousThird2) found = true;
    // if (c[1] === latestDraw.sortedPreviousSecond2 && c[2] === latestDraw.sortedPreviousThird2) found = true;

    // previous3
    // if (c[0] === latestDraw.sortedPreviousFirst3 && c[1] === latestDraw.sortedPreviousSecond3) found = true;
    // if (c[0] === latestDraw.sortedPreviousFirst3 && c[2] === latestDraw.sortedPreviousThird3) found = true;
    // if (c[1] === latestDraw.sortedPreviousSecond3 && c[2] === latestDraw.sortedPreviousThird3) found = true;

    return found;
}

function generateDraws(numberOfDraws = 5, latestDraw) {
    const usedFirstNumbers = new Set();
    const usedSecondNumbers = new Set();
    const usedThirdNumbers = new Set();
    const draws = [];

    function isValidDraw(draw) {
        const [first, second, third] = draw;

        // Check for repeating numbers in the draw
        if (new Set(draw).size !== 3) return false;

        // Check if numbers are in correct ranges and order
        if (!(first >= 0 && first <= 3)) return false;
        if (!(second >= 2 && second <= 7)) return false;
        if (!(third >= 6 && third <= 9)) return false;

        // Check if numbers are in ascending order
        if (!(first < second && second < third)) return false;

        // Rule 6: if first number is 2 or 3, second number can't be 2 or 3
        if ((first === 2) && (second === 2)) return false;
        if ((first === 3) && (second === 3)) return false;

        // Rule 7: if second number is 6 or 7, third number can't be 6 or 7
        if ((second === 6) && (third === 6)) return false;
        if ((second === 7) && (third === 7)) return false;

        // Rule 8: Check if number has been used in same position before
        if (usedFirstNumbers.has(first)) return false;
        if (usedSecondNumbers.has(second)) return false;
        if (usedThirdNumbers.has(third)) return false;

        return true;
    }

    function generateSingleDraw() {
        const maxAttempts = 1000;
        let attempts = 0;

        while (attempts < maxAttempts) {
            const first = Math.floor(Math.random() * 4); // 0-3
            const second = Math.floor(Math.random() * 6) + 2; // 2-7
            const third = Math.floor(Math.random() * 4) + 6; // 6-9

            const draw = [first, second, third];

            if (isValidDraw(draw)&&!tooSimilarToPrevious(draw, latestDraw)&&!xS(draw, latestDraw)) {
                usedFirstNumbers.add(first);
                usedSecondNumbers.add(second);
                usedThirdNumbers.add(third);
                return draw;
            }

            attempts++;
        }

        return null; // Could not generate valid draw
    }

    while (draws.length < numberOfDraws) {
        const draw = generateSingleDraw();
        if (draw === null) {
            break; // No more valid combinations possible
        }
        draws.push(draw);
    }

    return draws;
}




// Validate all rules for the generated draws
function validateDraws(draws) {
    const validations = {
        rangeCheck: true,
        orderCheck: true,
        uniqueCheck: true,
        positionCheck: true,
        specialRules: true
    };

    const firstNums = new Set();
    const secondNums = new Set();
    const thirdNums = new Set();

    for (const draw of draws) {
        const [first, second, third] = draw;

        // Range checks
        if (first < 0 || first > 3) validations.rangeCheck = false;
        if (second < 2 || second > 7) validations.rangeCheck = false;
        if (third < 6 || third > 9) validations.rangeCheck = false;

        // Order check
        if (!(first < second && second < third)) validations.orderCheck = false;

        // Unique numbers in draw
        if (new Set(draw).size !== 3) validations.uniqueCheck = false;

        // Position uniqueness
        if (firstNums.has(first) || secondNums.has(second) || thirdNums.has(third)) {
            validations.positionCheck = false;
        }
        firstNums.add(first);
        secondNums.add(second);
        thirdNums.add(third);

        // Special rules
        if ((first === 2 || first === 3) && (second === 2 || second === 3)) {
            validations.specialRules = false;
        }
        if ((second === 6 || second === 7) && (third === 6 || third === 7)) {
            validations.specialRules = false;
        }
    }

    return validations;
}



// Modified POST handler
export async function POST(req) {
    try {
        const [prevMonth, currentMonth] = getMonths();
        const firestore = adminDb.firestore();

        // Query for current and previous month
        const drawsCollection = firestore
            .collection("draws")
            .where("drawMonth", "in", [currentMonth, prevMonth]);

        const snapshot = await drawsCollection.get();

        if (snapshot.empty) {
            return new Response(JSON.stringify({ error: "No draws found." }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const allDraws = [];

        // First pass: collect all draws with monthOrder
        snapshot.forEach((doc) => {
            const drawData = doc.data();
            drawData.id = doc.id;
            drawData.monthOrder = drawData.drawMonth === currentMonth ? 1 : 2;
            allDraws.push(drawData);
        });

        // Sort draws by monthOrder and index
        allDraws.sort((a, b) => {
            if (a.monthOrder !== b.monthOrder) {
                return a.monthOrder - b.monthOrder;
            }
            return b.index - a.index;
        });

        const draws = allDraws.slice(0, 4);
// Test the function
        const drawsS = generateDraws(3, draws[0]);

        return new Response(JSON.stringify(drawsS), {
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
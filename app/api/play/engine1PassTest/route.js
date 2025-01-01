// app/api/posts/route.js
import {adminDb} from '@/app/utils/firebaseAdmin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ======================
// Checks against previous draw
// ======================
function tooSimilarToPrevious(combination, latestDraw) {
    if (!latestDraw) return false; // If there's no "latestDraw" data, skip.

    let found = false;
    const c = combination;


    // previous1
    if (c.originalFirstNumber === latestDraw.originalPreviousFirst1 && c.originalSecondNumber === latestDraw.originalPreviousSecond1) found = true;
    if (c.originalFirstNumber === latestDraw.originalPreviousFirst1 && c.originalThirdNumber === latestDraw.originalPreviousThird1) found = true;
    if (c.originalSecondNumber === latestDraw.originalPreviousSecond1 && c.originalThirdNumber === latestDraw.originalPreviousThird1) found = true;

    // previous2
    if (c.originalFirstNumber === latestDraw.originalPreviousFirst2 && c.originalSecondNumber === latestDraw.originalPreviousSecond2) found = true;
    if (c.originalFirstNumber === latestDraw.originalPreviousFirst2 && c.originalThirdNumber === latestDraw.originalPreviousThird2) found = true;
    if (c.originalSecondNumber === latestDraw.originalPreviousSecond2 && c.originalThirdNumber === latestDraw.originalPreviousThird2) found = true;

    // previous3
    if (c.originalFirstNumber === latestDraw.originalPreviousFirst3 && c.originalSecondNumber === latestDraw.originalPreviousSecond3) found = true;
    if (c.originalFirstNumber === latestDraw.originalPreviousFirst3 && c.originalThirdNumber === latestDraw.originalPreviousThird3) found = true;
    if (c.originalSecondNumber === latestDraw.originalPreviousSecond3 && c.originalThirdNumber === latestDraw.originalPreviousThird3) found = true;

    return found;
}

export async function GET() {
    try {
        const firestore = adminDb.firestore();

        // Query the latest draw in the current month, ordered by index descending
        const drawsCollection = firestore
            .collection("draws")

        const snapshot = await drawsCollection.get();
        const draws = [];

        // Assign an order to each month based on its position in the months array
        snapshot.forEach((doc) => {
            const drawData = doc.data();
            draws.push(drawData);
        });

        let totalCorrectPredictions = 0
        let totalDraws = 0


        for (let i = 1; i < draws.length; i++) {
            let draw = draws[i];
            let nums = [
                draw.originalFirstNumber,
                draw.originalSecondNumber,
                draw.originalThirdNumber
            ];

            // Get possible ranges for each number
            let numberRanges = nums.map(num => {
                let ranges = [];
                if (num >= 0 && num <= 3) ranges.push(1);
                if (num >= 2 && num <= 7) ranges.push(2);
                if (num >= 6 && num <= 9) ranges.push(3);
                return ranges;
            });

            // Try to find valid assignments
            let rangeAssignments = new Map();
            let numberAssignments = new Map();

            function tryAssignments(index) {
                if (index === nums.length) {
                    return rangeAssignments.size === 3 &&
                        [1, 2, 3].every(r => rangeAssignments.has(r));
                }

                const currentNumber = nums[index];
                const possibleRanges = numberRanges[index];

                for (const range of possibleRanges) {
                    if (!rangeAssignments.has(range)) {
                        rangeAssignments.set(range, currentNumber);
                        numberAssignments.set(currentNumber, range);

                        if (tryAssignments(index + 1)) {
                            return true;
                        }

                        rangeAssignments.delete(range);
                        numberAssignments.delete(currentNumber);
                    }
                }

                return tryAssignments(index + 1);
            }

            let rr = tooSimilarToPrevious(draw, draw)
            if (tryAssignments(0)&&!rr) {
                totalCorrectPredictions += 1;
            }
        }


        console.log('hello')
        console.log(draws.length)
        console.log(totalCorrectPredictions)

        return new Response(JSON.stringify(totalCorrectPredictions), {
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
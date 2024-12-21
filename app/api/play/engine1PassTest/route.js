// app/api/posts/route.js
import {adminDb} from '@/app/utils/firebaseAdmin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;


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

            if (tryAssignments(0)) {
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
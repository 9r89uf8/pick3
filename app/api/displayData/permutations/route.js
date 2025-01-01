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

const determinePermutation = (numbers) => {
    const sortedNums = [...numbers].sort((a, b) => a - b);
    const categoryMap = new Map();
    categoryMap.set(sortedNums[0], 'L');
    categoryMap.set(sortedNums[1], 'M');
    categoryMap.set(sortedNums[2], 'H');
    return numbers.map(num => categoryMap.get(num)).join('-');
};

export async function GET() {
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

        // Take only the first 10 draws after sorting
        const draws = allDraws.slice(0, 60);

        // Process permutations
        const permutations = {
            'L-M-H': 0,
            'L-H-M': 0,
            'M-L-H': 0,
            'M-H-L': 0,
            'H-L-M': 0,
            'H-M-L': 0
        };

        const processedDraws = draws.map(data => {
            const numbers = [
                data.originalFirstNumber,
                data.originalSecondNumber,
                data.originalThirdNumber
            ];

            const sortedNums = [...numbers].sort((a, b) => a - b);
            const positions = {
                position0: numbers[0] === sortedNums[0] ? 'L' : numbers[0] === sortedNums[1] ? 'M' : 'H',
                position1: numbers[1] === sortedNums[0] ? 'L' : numbers[1] === sortedNums[1] ? 'M' : 'H',
                position2: numbers[2] === sortedNums[0] ? 'L' : numbers[2] === sortedNums[1] ? 'M' : 'H',
            };

            const permutation = determinePermutation(numbers);
            permutations[permutation]++;

            return {
                ...data,
                permutation,
                positions
            };
        });

        const display = {
            createdAt: new Date().toISOString(),
            latestDraw: {
                numbers: [
                    processedDraws[0].originalFirstNumber,
                    processedDraws[0].originalSecondNumber,
                    processedDraws[0].originalThirdNumber
                ],
                time: processedDraws[0].time,
                drawDate: processedDraws[0].drawDate,
                drawMonth: processedDraws[0].drawMonth
            },
            permutationCounts: permutations,
            orderedPermutations: processedDraws.map(draw => ({
                numbers: [
                    draw.originalFirstNumber,
                    draw.originalSecondNumber,
                    draw.originalThirdNumber
                ],
                permutation: draw.permutation,
                positions: draw.positions,
                drawDate: draw.drawDate,
                drawMonth: draw.drawMonth
            }))
        };

        const displaysCollection = firestore.collection("displays");
        const latestDisplayRef = displaysCollection.doc("latestDisplay");

        const displayDoc = await latestDisplayRef.get();
        if (!displayDoc.exists) {
            await latestDisplayRef.create(display);
        } else {
            await latestDisplayRef.update(display);
        }

        return new Response(JSON.stringify(display), {
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
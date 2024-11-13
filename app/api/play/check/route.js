// app/api/posts/route.js
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/app/utils/firebaseAdmin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const isInRange = (number, position) => {
    const num = parseInt(number);
    if (position === 0) return [0, 1, 2].includes(num);
    if (position === 1) return [3, 4, 5, 6].includes(num);
    if (position === 2) return [7, 8, 9].includes(num);
    return false;
};

const analyzeRangePattern = (numbers) => {
    const inRange = numbers.map((num, idx) => isInRange(num, idx));
    const count = inRange.filter(Boolean).length;

    let combinations = [];
    if (inRange[0] && inRange[1]) combinations.push('first_second');
    if (inRange[0] && inRange[2]) combinations.push('first_third');
    if (inRange[1] && inRange[2]) combinations.push('second_third');

    return {
        numbersInRange: count,
        inRangePositions: inRange,
        combinations,
        allInRange: count === 3
    };
};

const getMonths = () => {
    const currentDate = new Date();
    const currentMonthIndex = currentDate.getMonth();

    let twoMonthsAgoIndex;
    let previousMonthIndex;

    if (currentMonthIndex === 0) {
        twoMonthsAgoIndex = 10;
        previousMonthIndex = 11;
    } else if (currentMonthIndex === 1) {
        twoMonthsAgoIndex = 11;
        previousMonthIndex = 0;
    } else {
        twoMonthsAgoIndex = currentMonthIndex - 2;
        previousMonthIndex = currentMonthIndex - 1;
    }

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return [monthNames[previousMonthIndex], monthNames[currentMonthIndex], monthNames[twoMonthsAgoIndex]];
};

export async function GET() {
    try {
        const [prevMonth, currentMonth] = getMonths();
        const drawsCollectionRef = adminDb.firestore().collection('draws')
            .where('drawMonth', '==', currentMonth)
            .orderBy('index', 'desc');
        const snapshot = await drawsCollectionRef.get();
        let total = 0;

        for (let i = 0; i < snapshot.docs.length; i++) {
            const doc = snapshot.docs[i];
            const drawRef = doc.ref;
            const draw = doc.data();

            // Analyze the draw numbers
            const numbers = draw.currentDraw.split('');
            const rangeAnalysis = analyzeRangePattern(numbers);

            const updateData = {
                rangeAnalysis: {
                    numbersInRange: rangeAnalysis.numbersInRange,
                    inRangePositions: rangeAnalysis.inRangePositions,
                    combinations: rangeAnalysis.combinations,
                    allInRange: rangeAnalysis.allInRange,
                    analyzedAt: new Date().toISOString()
                }
            };

            await drawRef.update(updateData);
            total++;
        }

        return new Response(JSON.stringify({
            success: true,
            totalUpdated: total,
            message: `Successfully analyzed and updated ${total} draws`
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, max-age=0',
            },
        });
    } catch (error) {
        console.log(error.message);
        return new Response(JSON.stringify({
            error: error.message,
            success: false
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
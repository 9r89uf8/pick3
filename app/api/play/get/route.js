// app/api/posts/route.js
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/app/utils/firebaseAdmin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;


const getMonths = () => {
    const currentDate = new Date();
    const currentMonthIndex = currentDate.getMonth(); // 0-11 (January is 0, December is 11)

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

async function isSimilarToLastDraws(currentDraw, lastDrawsDocs) {
    for (const draw of lastDrawsDocs) {
        if (currentDraw.currentDraw === draw.currentDraw) {
            return true;
        }
    }
    return false;
}

async function hasZeroOneTwo(draw) {
    const numbers = [
        draw.currentFirstNumber,
        draw.currentSecondNumber,
        draw.currentThirdNumber
    ];
    return numbers.includes(0) || numbers.includes(1);
}

async function isSimilarFirstTwo(currentDraw, lastDrawsDocs) {
    for (const draw of lastDrawsDocs) {
        if (currentDraw.firstAndSecondNumber === draw.firstAndSecondNumber) {
            return true;
        }
    }
    return false;
}


async function isSimilarToLastFirst(currentDraw, lastDrawsDocs) {
    for (const draw of lastDrawsDocs) {
        if (currentDraw.currentFirstNumber === draw.currentFirstNumber) {
            return true;
        }
    }
    return false;
}

async function isSimilarToSecondThird(currentDraw, lastDrawsDocs) {
    for (const draw of lastDrawsDocs) {
        if (currentDraw.secondAndThirdNumber === draw.secondAndThirdNumber) {
            return true;
        }
    }
    return false;
}

export async function GET() {
    try {
        const [prevMonth, currentMonth] = getMonths();
        const firestore = adminDb.firestore();

        // Query for both currentMonth and prevMonth
        const drawsCollection = firestore
            .collection("draws")
            .where("drawMonth", "in", [currentMonth, prevMonth]);

        const snapshot = await drawsCollection.get();
        const draws = [];

        // Loop through the documents and add them to the array
        snapshot.forEach((doc) => {
            const drawData = doc.data();
            drawData.id = doc.id; // Add the document ID to the draw data
            drawData.monthOrder = drawData.drawMonth === currentMonth ? 1 : 2; // Assign an artificial order to the months


            draws.push(drawData);
        });

        // Sort the combined array by 'monthOrder' and then by 'index'
        draws.sort((a, b) => {
            // Sort by 'monthOrder' first
            if (a.monthOrder < b.monthOrder) {
                return -1;
            } else if (a.monthOrder > b.monthOrder) {
                return 1;
            } else {
                // If 'monthOrder' is equal, sort by 'index' in descending order
                return b.index - a.index;
            }
        });

        // Initialize combinations array
        const combinations = [];
        let attempts = 0;
        const maxAttempts = 100

// While combinations.length < 9 and attempts < maxAttempts
        while (combinations.length < 9 && attempts < maxAttempts) {
            attempts++;

            // Generate 4 random digits from 0-9
            const digits = [];
            for (let i = 0; i < 2; i++) {
                digits.push(Math.floor(Math.random() * 10));
            }

            // const currentDraw = {
            //     currentDraw: digits.join(''),
            //     currentFirstNumber: digits[0],
            //     currentSecondNumber: digits[1],
            //     currentThirdNumber: digits[2],
            //     firstAndSecondNumber: digits[0] + digits[1],
            //     secondAndThirdNumber: digits[1] + digits[2]
            // };

            const currentDraw = {
                currentDraw: digits.join(''),
                currentFirstNumber: digits[0],
                currentSecondNumber: digits[1],
                firstAndSecondNumber: digits[0] + digits[1]
            };



            // Now check the conditions
            const isSimilar = await isSimilarToLastDraws(currentDraw, draws.slice(0, 60));
            const isSimilarFS = await isSimilarFirstTwo(currentDraw, draws.slice(0, 20));
            const isSimilarLF = await isSimilarToLastFirst(currentDraw, draws.slice(0, 2));
            const isSimilarST = await isSimilarToSecondThird(currentDraw, draws.slice(0, 10));
            const hasZeroOneTwoCheck = await hasZeroOneTwo(currentDraw)

            if (
                !isSimilarFS &&
                hasZeroOneTwoCheck
            ) {
                // The combination fails all conditions
                combinations.push(currentDraw.currentDraw);
            }
            // If conditions are met, continue looping
        }

        // Return the combinations array as JSON
        return new Response(JSON.stringify(combinations ), {
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

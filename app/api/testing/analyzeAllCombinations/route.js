// app/api/posts/route.js
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/app/utils/firebaseAdmin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;


async function isSimilarToLastDraws(currentDraw, lastDrawsDocs) {
    for (const draw of lastDrawsDocs) {

        if (currentDraw === draw.currentDraw) {
            return true;
        }
    }
    return false;
}

function containsZeroOneTwo(draw) {
    return draw.includes('0') || draw.includes('1') || draw.includes('2');
}

function containsSixSevenEightNine(draw) {
    return draw.includes('6') || draw.includes('7') || draw.includes('8') || draw.includes('9');
}


async function isSimilarFirstTwo(currentDraw, lastDrawsDocs) {
    for (const draw of lastDrawsDocs) {

        if (currentDraw === draw.firstAndSecondNumber) {
            return true;
        }
    }
    return false;
}

async function isSimilarFirstThird(currentDraw, lastDrawsDocs) {
    for (const draw of lastDrawsDocs) {
        if (currentDraw === draw.firstAndThirdNumber) {
            return true;
        }
    }
    return false;
}


async function isSimilarToLastFirst(currentDraw, lastDrawsDocs) {
    for (const draw of lastDrawsDocs) {

        if (currentDraw === draw.currentFirstNumber.toString()) {
            return true;
        }
    }
    return false;
}

async function isSimilarToSecondThird(currentDraw, lastDrawsDocs) {
    for (const draw of lastDrawsDocs) {

        if (currentDraw === draw.secondAndThirdNumber) {
            return true;
        }
    }
    return false;
}


async function checkAllCombinations(draws) {

    let pass = 0;
    let fail = 0;

    // Initialize counters for each condition that wasn't met
    let isSimilarFailCount = 0;
    let isSimilarFSFailCount = 0;
    let isSimilarFTFailCount = 0;
    let isSimilarSTFailCount = 0;

    // Generate all combinations from '0000' to '9999'
    for (let i = 0; i < 1000; i++) {
        // Convert the current number to a 4-digit string with leading zeros
        let currentDraw = i.toString().padStart(3, '0');


        // Extract the first digit
        let firstNumber = currentDraw.charAt(0);

        // Extract the third digit
        let thirdNumber = currentDraw.charAt(2);

        // Extract the first two digits
        let firstTwoNumbers = currentDraw.substring(0, 2);

        let firstAndThirdNumbers = firstNumber + thirdNumber;


        let secondAndThirdNumbers = currentDraw.substring(1, 3);


        // Now you can use these variables in your condition functions
        const isSimilar = await isSimilarToLastDraws(currentDraw, draws.slice(0, 140));
        const isSimilarFS = await isSimilarFirstTwo(firstTwoNumbers, draws.slice(0, 15));
        const isSimilarFT = await isSimilarFirstThird(firstAndThirdNumbers, draws.slice(0, 12));
        const isSimilarST = await isSimilarToSecondThird(secondAndThirdNumbers, draws.slice(0, 12));


        // Check and increment fail counts for each condition
        if (isSimilar) {
            isSimilarFailCount += 1;
        }
        if (isSimilarFS) {
            isSimilarFSFailCount += 1;
        }

        if(isSimilarFT){
            isSimilarFTFailCount += 1;
        }

        if(isSimilarST){
            isSimilarSTFailCount += 1;
        }


        // Determine if the combination passes all conditions
        if (!isSimilar && !isSimilarFS && !isSimilarST && !isSimilarFT) {
            pass += 1;
            // Optionally log passing combinations
            // console.log(`Pass: ${currentDraw}`);
        } else {
            fail += 1;
            // Optionally log failing combinations
            // console.log(`Fail: ${currentDraw}`);
        }
    }

    // Return the counts, including individual condition fail counts
    return {
        pass,
        fail,
        isSimilarFailCount,
        isSimilarFSFailCount,
        isSimilarSTFailCount,
        isSimilarFTFailCount
    };
}



const getMonths = (n) => {
    const currentDate = new Date();
    const currentMonthIndex = currentDate.getMonth(); // 0-11 (January is 0, December is 11)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const months = [];
    for (let i = 0; i < n; i++) {
        // Calculate the month index for i months ago
        let monthIndex = (currentMonthIndex - i + 12) % 12;
        months.push(monthNames[monthIndex]);
    }
    return months; // Months are in reverse chronological order
};


export async function GET() {
    try {
        let months = ['Aug', 'Jul', 'Jun' ]
        // const months = getMonths(5); // Get the current month and the previous 4 months
        const firestore = adminDb.firestore();

        // Query for the specified months
        const drawsCollection = firestore
            .collection("draws")
            .where("drawMonth", "in", months);

        const snapshot = await drawsCollection.get();
        const draws = [];

        // Assign an order to each month based on its position in the months array
        snapshot.forEach((doc) => {
            const drawData = doc.data();
            drawData.id = doc.id; // Add the document ID to the draw data
            drawData.monthOrder = months.indexOf(drawData.drawMonth); // 0 for current month
            draws.push(drawData);
        });

        // Sort the combined array by 'monthOrder' and then by 'index'
        draws.sort((a, b) => {
            // Sort by 'monthOrder' first (ascending order)
            if (a.monthOrder !== b.monthOrder) {
                return a.monthOrder - b.monthOrder;
            } else {
                // If 'monthOrder' is equal, sort by 'index' in descending order
                return b.index - a.index;
            }
        });

        console.log(`draws length: ${draws.length}`)
        // const result = await analyzeMovements(draws)
        const result = await checkAllCombinations(draws)
        console.log(result)
        return new Response(JSON.stringify(draws), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, max-age=0'
            },
        });
    } catch (error) {
        console.log(error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
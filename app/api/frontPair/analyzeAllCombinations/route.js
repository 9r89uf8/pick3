// app/api/posts/route.js
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/app/utils/firebaseAdmin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;


function containsZeroOneTwo(draw) {
    return draw.includes('0') || draw.includes('1');
}



async function isSimilarFirstTwo(currentDraw, lastDrawsDocs) {
    for (const draw of lastDrawsDocs) {

        if (currentDraw === draw.firstAndSecondNumber) {
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



async function checkAllCombinations(draws) {
    // Filter the draws where monthOrder === 1
    const filteredDraws = draws.filter(draw => draw.monthOrder === 1);

    let pass = 0;
    let fail = 0;

    // Initialize counters for each condition that wasn't met
    let isSimilarFailCount = 0;
    let isSimilarFSFailCount = 0;
    let isSimilarLFFailCount = 0;
    let isSimilarTFFailCount = 0;
    let isSimilarSTFailCount = 0;
    let hasZeroOneTwoPassCount = 0;

    // Generate all combinations from '0000' to '9999'
    for (let i = 0; i < 100; i++) {
        // Convert the current number to a 4-digit string with leading zeros
        let currentDraw = i.toString().padStart(2, '0');


        // Extract the first digit
        let firstNumber = currentDraw.charAt(0);

        // Extract the first two digits
        let firstTwoNumbers = currentDraw.substring(0, 2);


        let secondAndThirdNumbers = currentDraw.substring(1, 3);

        // Get the first 60 and first 4 draws from filteredDraws
        const first60Draws = filteredDraws.slice(0, 60);
        const first4Draws = filteredDraws.slice(0, 1);

        // Now you can use these variables in your condition functions
        const isSimilarFS = await isSimilarFirstTwo(firstTwoNumbers, filteredDraws.slice(0, 20));
        const isSimilarLF = await isSimilarToLastFirst(firstNumber, first4Draws);
        const hasZeroOneTwoCheck = await containsZeroOneTwo(currentDraw)

        // Check and increment fail counts for each condition
        if (isSimilarFS) {
            isSimilarFSFailCount += 1;
        }
        if (isSimilarLF) {
            isSimilarLFFailCount += 1;
        }

        if(hasZeroOneTwoCheck){
            hasZeroOneTwoPassCount += 1;
        }

        // Determine if the combination passes all conditions
        if (hasZeroOneTwoCheck && !isSimilarFS) {
            console.log(currentDraw)
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
        isSimilarLFFailCount,
        isSimilarTFFailCount,
        isSimilarSTFailCount,
        hasZeroOneTwoPassCount
    };
}



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


export async function GET() {
    try {
        // const firstSnapshot = await admin.firestore().collection('firstPicks').where("drawMonth", "==", "Jul").orderBy('index', 'desc').get();
        // const first = firstSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // const [prevMonth, currentMonth] = getMonths();
        let currentMonth = 'Aug'
        let prevMonth = 'Jul'
        const firestore = adminDb.firestore();

// Query for both July and June
        const drawsCollection = firestore
            .collection("draws")
            .where("drawMonth", "in", [currentMonth, prevMonth]);

        const snapshot = await drawsCollection.get();
        const draws = [];

// Loop through the documents and add them to the array
        snapshot.forEach((doc) => {
            const drawData = doc.data();
            drawData.id = doc.id; // Add the document ID to the draw data
            drawData.monthOrder = drawData.drawMonth === currentMonth ? 1 : 2;  // Assign an artificial order to the months
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
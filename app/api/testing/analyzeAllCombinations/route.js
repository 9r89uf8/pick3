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

async function isSimilarFirstThree(currentDraw, lastDrawsDocs) {
    for (const draw of lastDrawsDocs) {

        if (currentDraw === draw.firstSecondThird) {
            return true;
        }
    }
    return false;
}

async function isSimilarFirstTwo(currentDraw, lastDrawsDocs) {
    for (const draw of lastDrawsDocs) {

        if (currentDraw === draw.firstAndSecondNumber) {
            return true;
        }
    }
    return false;
}

async function isSimilarLastTwo(currentDraw, lastDrawsDocs) {
    for (const draw of lastDrawsDocs) {

        if (currentDraw === draw.thirdAndFourthNumber) {
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
    // Filter the draws where monthOrder === 1
    const filteredDraws = draws.filter(draw => draw.monthOrder === 1);

    let pass = 0;
    let fail = 0;

    // Initialize counters for each condition that wasn't met
    let isSimilarFailCount = 0;
    let isSimilarFSTFailCount = 0;
    let isSimilarFSFailCount = 0;
    let isSimilarLFFailCount = 0;
    let isSimilarTFFailCount = 0;
    let isSimilarSTFailCount = 0;

    // Generate all combinations from '0000' to '9999'
    for (let i = 0; i < 10000; i++) {
        // Convert the current number to a 4-digit string with leading zeros
        let currentDraw = i.toString().padStart(4, '0');

        // Exclude combinations with 3 or more repeating digits
        if (hasThreeOrMoreRepeatingDigits(currentDraw)) {
            continue; // Skip this combination
        }

        // Extract the first digit
        let firstNumber = currentDraw.charAt(0);

        // Extract the first two digits
        let firstTwoNumbers = currentDraw.substring(0, 2);

        let thirdAndFourthNumbers = currentDraw.substring(2, 4);

        // Extract the first three digits
        let firstThreeNumbers = currentDraw.substring(0, 3);

        let secondAndThirdNumbers = currentDraw.substring(1, 3);

        // Get the first 60 and first 4 draws from filteredDraws
        const first60Draws = filteredDraws.slice(0, 60);
        const first4Draws = filteredDraws.slice(0, 2);

        // Now you can use these variables in your condition functions
        const isSimilar = await isSimilarToLastDraws(currentDraw, first60Draws);
        const isSimilarFST = await isSimilarFirstThree(firstThreeNumbers, first60Draws);
        const isSimilarFS = await isSimilarFirstTwo(firstTwoNumbers, first60Draws);
        const isSimilarLF = await isSimilarToLastFirst(firstNumber, first4Draws);
        const isSimilarLT = await isSimilarLastTwo(thirdAndFourthNumbers, first60Draws);
        const isSimilarST = await isSimilarToSecondThird(secondAndThirdNumbers, first60Draws);

        // Check and increment fail counts for each condition
        if (isSimilar) {
            isSimilarFailCount += 1;
        }
        if (isSimilarFST) {
            isSimilarFSTFailCount += 1;
        }
        if (isSimilarFS) {
            isSimilarFSFailCount += 1;
        }
        if (isSimilarLF) {
            isSimilarLFFailCount += 1;
        }
        if(isSimilarLT){
            isSimilarTFFailCount += 1;
        }
        if(isSimilarST){
            isSimilarSTFailCount += 1;
        }

        // Determine if the combination passes all conditions
        if (!isSimilar && !isSimilarFST && !isSimilarFS && !isSimilarLF && !isSimilarLT && !isSimilarST) {
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
        isSimilarFSTFailCount,
        isSimilarFSFailCount,
        isSimilarLFFailCount,
        isSimilarTFFailCount,
        isSimilarSTFailCount
    };
}

// Function to check if a combination has 3 or more repeating digits
function hasThreeOrMoreRepeatingDigits(draw) {
    // Create an object to count occurrences of each digit
    const digitCounts = {};

    // Iterate over each digit in the draw
    for (let digit of draw) {
        if (digitCounts[digit]) {
            digitCounts[digit] += 1;
        } else {
            digitCounts[digit] = 1;
        }
    }

    // Check if any digit occurs 3 or more times
    for (let count of Object.values(digitCounts)) {
        if (count >= 3) {
            return true; // Combination has 3 or more repeating digits
        }
    }

    return false; // Combination does not have 3 or more repeating digits
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
// app/api/posts/route.js
import {adminDb} from '@/app/utils/firebaseAdmin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;


async function isSimilarToLastDraws(currentDraw, lastDrawsDocs) {
    for (const draw of lastDrawsDocs) {

        if (currentDraw.currentDraw === draw.currentDraw) {
            return true;
        }
    }
    return false;
}

async function countSimilarDraws(currentDraw, lastDrawsDocs) {
    return lastDrawsDocs.filter(draw =>
        currentDraw.winningCombinations.includes(draw.currentDraw)
    ).length;
}

async function hasZeroOneTwo(draw) {
    const numbers = [
        draw.currentFirstNumber,
        draw.currentSecondNumber,
        draw.currentThirdNumber
    ];
    return numbers.includes(0) || numbers.includes(1) || numbers.includes(2);
}

async function hasSixSevenEightNine(draw) {
    const numbers = [
        draw.currentFirstNumber,
        draw.currentSecondNumber,
        draw.currentThirdNumber
    ];
    return numbers.includes(6) || numbers.includes(7) || numbers.includes(8) || numbers.includes(9);
}


async function isSimilarFirstTwo(currentDraw, lastDrawsDocs) {
    for (const draw of lastDrawsDocs) {
        if (currentDraw.firstAndSecondNumber === draw.firstAndSecondNumber) {
            return true;
        }
    }
    return false;
}

async function isSimilarFirstThird(currentDraw, lastDrawsDocs) {
    for (const draw of lastDrawsDocs) {
        if (currentDraw.firstAndThirdNumber === draw.firstAndThirdNumber) {
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

async function analyzeMovements(draws) {
    const filteredDraws = draws.filter(draw => draw.monthOrder === 0);
    let pass = 0;
    let fail = 0;

    // Initialize counters for each condition that wasn't met
    let isSimilarFailCount = 0;
    let isSimilarFSFailCount = 0;
    let isSimilarFTFailCount = 0;
    let isSimilarSTFailCount = 0;

    for (let i = 1; i < filteredDraws.length; i++) {
        let currentDraw = filteredDraws[i];
        const isSimilar = await isSimilarToLastDraws(currentDraw, draws.slice(i + 1, i + 140));
        let countSimilarDrawsInfo = await countSimilarDraws(currentDraw, draws.slice(i + 1, i + 60))
        const isSimilarFS = await isSimilarFirstTwo(currentDraw, draws.slice(i + 1, i + 15));
        const isSimilarFT = await isSimilarFirstThird(currentDraw, draws.slice(i + 1, i + 12));
        const isSimilarST = await isSimilarToSecondThird(currentDraw, draws.slice(i + 1, i + 12));



        // Check and increment fail counts for each condition
        if (isSimilar) {
            isSimilarFailCount += 1;
        }
        if (isSimilarFS) {
            isSimilarFSFailCount += 1;
        }
        if (isSimilarFT) {
            isSimilarFTFailCount += 1;
        }
        if(isSimilarST){
            isSimilarSTFailCount += 1;
        }



        if (!isSimilar&&!isSimilarFS&&!isSimilarST&&!isSimilarFT) {
            pass += 1;
        } else {
            fail += 1;
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

        console.log(`draws length: ${draws.length}`);
        const result = await analyzeMovements(draws);
        console.log(result);
        return new Response(JSON.stringify(draws), {
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

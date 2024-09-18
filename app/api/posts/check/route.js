// app/api/posts/route.js
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/app/utils/firebaseAdmin';

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
        const [prevMonth, currentMonth] = getMonths();
        const firestore = adminDb.firestore();
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
            drawData.ref = doc.ref; // **Add the document reference**
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

// First, set all passCondition to false
        const batch = firestore.batch(); // **Assuming you're using the Firestore instance directly**
        draws.forEach(draw => {
            if (draw.drawMonth === currentMonth) {
                batch.update(draw.ref, { passCondition: false });
            }
        });
        await batch.commit();

        let total = 0;
        for (let i = 0; i < draws.length; i++) {
            const draw = draws[i]; // **draw is now the data object with ref**

            // Only process draws from the current month
            if (draw.drawMonth !== currentMonth) {
                continue; // Skip draws from the previous month
            }

            let checksPass = true;

            // History check
            if (checksPass) {
                const isSimilar = await isSimilarToLastDraws(draw, draws.slice(i + 1, i + 60));
                const isSimilarFS = await isSimilarFirstTwo(draw, draws.slice(i + 1, i + 60));
                const isSimilarLF = await isSimilarToLastFirst(draw, draws.slice(i + 1, i + 2));
                const isSimilarST = await isSimilarToSecondThird(draw, draws.slice(i + 1, i + 10));
                const hasZeroOneTwoCheck = await hasZeroOneTwo(draw);

                if (isSimilar || isSimilarST || isSimilarLF || isSimilarFS || !hasZeroOneTwoCheck) {
                    checksPass = false;
                }
            }

            if (checksPass) {
                total += 1;
                await draw.ref.update({ passCondition: true }); // **Use draw.ref to update the document**
                console.log(`Updated passCondition to true for document ${draw.id}`);
            }
        }


        console.log(`Total passes: ${total}`);

        return NextResponse.json(total, {
            status: 200,
            headers: {
                'Cache-Control': 'no-store, max-age=0'
            }
        });
    } catch (error) {
        console.error('Error in GET function:', error);
        return NextResponse.json({ error: error.message }, {
            status: 500
        });
    }
}
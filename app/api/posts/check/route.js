// app/api/posts/route.js
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/app/utils/firebaseAdmin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;


async function isSimilarToLastDraws(currentDraw, lastDrawsDocs) {
    for (const doc of lastDrawsDocs) {
        const lastDraw = doc.data();

        if (areSimilar(currentDraw, lastDraw)) {
            return true;
        }
    }
    return false;
}

function areSimilar(draw1, draw2) {
    if (draw1.currentDraw === draw2.currentDraw) {
        return true;
    }
    return false;
}

async function isSimilarSecondThirdNum(currentDraw, lastDrawsDocs) {
    for (const doc of lastDrawsDocs) {
        const lastDraw = doc.data();

        if (areSimilarSecondThirdNum(currentDraw, lastDraw)) {
            return true;
        }
    }
    return false;
}

function areSimilarSecondThirdNum(draw1, draw2) {
    if (draw1.secondAndThirdNumber === draw2.secondAndThirdNumber) {
        return true;
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
        const drawsCollectionRef = adminDb.firestore().collection('draws')
            .where('drawMonth', '==', currentMonth)
            .orderBy('index', 'desc');

        const snapshot = await drawsCollectionRef.get();

        // First, set all passCondition to false
        const batch = adminDb.firestore().batch();
        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, { passCondition: false });
        });
        await batch.commit();


        let total = 0;
        for (let i = 0; i < snapshot.docs.length; i++) {
            const doc = snapshot.docs[i];
            const drawRef = doc.ref;
            const draw = doc.data();
            let checksPass = true;
            let currentToCheckZero = draw.currentFirstNumber;
            let currentToCheckOne = draw.currentSecondNumber;
            let currentToCheckTwo = draw.currentThirdNumber;

            // Range checks
            if (currentToCheckZero > 1) {
                checksPass = false;
            }

            // History check
            if (checksPass) {
                const isSimilar = await isSimilarToLastDraws(draw, snapshot.docs.slice(i + 1, i + 60));
                const isSimilarST = await isSimilarSecondThirdNum(draw, snapshot.docs.slice(i + 1, i + 10));
                if (isSimilar || isSimilarST) {
                    checksPass = false;
                }
            }

            if (checksPass) {
                total += 1;
                await drawRef.update({ passCondition: true });
                console.log(`Updated passCondition to true for document ${doc.id}`);
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
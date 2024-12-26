// app/api/posts/route.js
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/app/utils/firebaseAdmin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const getCurrentMonth = () => {
    const currentDate = new Date();
    const currentMonthIndex = currentDate.getMonth();
    return monthNames[currentMonthIndex];
};

export async function GET() {
    try {
        let month = getCurrentMonth();

        const firestore = adminDb.firestore();

        // Query the latest draw in the current month, ordered by index descending
        const drawsCollection = firestore
            .collection("draws")
            .where("drawMonth", "==", month)
            .orderBy("index", "desc")
            .limit(1);

        const snapshot = await drawsCollection.get();

        if (snapshot.empty) {
            return new Response(JSON.stringify({ error: "No draws found for the current month." }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Get the latest draw data
        const latestDrawDoc = snapshot.docs[0];
        const latestDraw = latestDrawDoc.data();

        // Extract the last 8 first numbers
        const last8FirstNumbers = [
            latestDraw.originalFirstNumber,
            latestDraw.originalPreviousFirst1,
            latestDraw.originalPreviousFirst2,
            latestDraw.originalPreviousFirst3,
            latestDraw.originalPreviousFirst4,
            latestDraw.originalPreviousFirst5,
            latestDraw.originalPreviousFirst6,
            latestDraw.originalPreviousFirst7,
            latestDraw.originalPreviousFirst8
        ].filter(num => num !== undefined);

        // Extract the last 8 second numbers
        const last8SecondNumbers = [
            latestDraw.originalSecondNumber,
            latestDraw.originalPreviousSecond1,
            latestDraw.originalPreviousSecond2,
            latestDraw.originalPreviousSecond3,
            latestDraw.originalPreviousSecond4,
            latestDraw.originalPreviousSecond5,
            latestDraw.originalPreviousSecond6,
            latestDraw.originalPreviousSecond7,
            latestDraw.originalPreviousSecond8
        ].filter(num => num !== undefined);

        // Extract the last 8 third numbers
        const last8ThirdNumbers = [
            latestDraw.originalThirdNumber,
            latestDraw.originalPreviousThird1,
            latestDraw.originalPreviousThird2,
            latestDraw.originalPreviousThird3,
            latestDraw.originalPreviousThird4,
            latestDraw.originalPreviousThird5,
            latestDraw.originalPreviousThird6,
            latestDraw.originalPreviousThird7,
            latestDraw.originalPreviousThird8
        ].filter(num => num !== undefined);



        const display = {
            last8FirstNumbers,
            last8SecondNumbers,
            last8ThirdNumbers,
            latestDrawDate: latestDraw.drawDate,
            latestDrawTime: latestDraw.time,
            currentDraw: latestDraw.originalDraw,
            currentDrawSum: latestDraw.originalDrawSum
        };

        const displaysCollection = firestore.collection("displays");
        const latestDisplayRef = displaysCollection.doc("latestDisplay");

        // Check if the display document exists
        const displayDoc = await latestDisplayRef.get();

        if (!displayDoc.exists) {
            // If document doesn't exist, create it
            await latestDisplayRef.create(display);
        } else {
            // If document exists, update it
            await latestDisplayRef.update(display);
        }

        // Return the display data as JSON
        return new Response(JSON.stringify(display), {
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
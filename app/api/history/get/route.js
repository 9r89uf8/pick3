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

export async function POST(req) {
    try {
        let {month} = await req.json();

        const firestore = adminDb.firestore();

        // Reference to the 'numberFrequencies' collection and the document for the specified month
        const docRef = firestore.collection('numberFrequencies').doc(month);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
            const numberFrequency = docSnap.data();

            // Return the frequency data as JSON
            return new Response(JSON.stringify(numberFrequency), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-store, max-age=0'
                },
            });
        } else {
            // If no document exists for the specified month, return a 404 error
            return new Response(JSON.stringify({ error: `No data found for the month: ${month}` }), {
                status: 404,
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        }

    } catch (error) {
        console.log(error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

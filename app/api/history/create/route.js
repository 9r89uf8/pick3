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
        // const { month } = await req.json();
        let month = getCurrentMonth()

        const firestore = adminDb.firestore();

        const drawsCollection = firestore
            .collection("draws")
            .where("drawMonth", "==", month);

        const snapshot = await drawsCollection.get();

        const numberFrequency = {};

        snapshot.forEach((doc) => {
            const drawData = doc.data();

            // Adjust the field name based on your data structure
            const firstNumber = drawData.currentFirstNumber;

            if (firstNumber !== undefined) {
                numberFrequency[firstNumber] = (numberFrequency[firstNumber] || 0) + 1;
            }
        });

        // Save the frequency data to 'numberFrequencies' collection
        await firestore
            .collection('numberFrequencies')
            .doc(month)
            .set(numberFrequency);

        // Return the frequency data as JSON
        return new Response(JSON.stringify(numberFrequency), {
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

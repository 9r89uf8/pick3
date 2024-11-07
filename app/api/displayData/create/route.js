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
            latestDraw.currentFirstNumber,
            latestDraw.previousFirstNumber1,
            latestDraw.previousFirstNumber2,
            latestDraw.previousFirstNumber3,
            latestDraw.previousFirstNumber4,
            latestDraw.previousFirstNumber5,
            latestDraw.previousFirstNumber6,
            latestDraw.previousFirstNumber7,
            latestDraw.previousFirstNumber8
        ].filter(num => num !== undefined);

        // Extract the last 8 second numbers
        const last8SecondNumbers = [
            latestDraw.currentSecondNumber,
            latestDraw.previousSecondNumber1,
            latestDraw.previousSecondNumber2,
            latestDraw.previousSecondNumber3,
            latestDraw.previousSecondNumber4,
            latestDraw.previousSecondNumber5,
            latestDraw.previousSecondNumber6,
            latestDraw.previousSecondNumber7,
            latestDraw.previousSecondNumber8
        ].filter(num => num !== undefined);

        // Extract the last 8 third numbers
        const last8ThirdNumbers = [
            latestDraw.currentThirdNumber,
            latestDraw.previousThirdNumber1,
            latestDraw.previousThirdNumber2,
            latestDraw.previousThirdNumber3,
            latestDraw.previousThirdNumber4,
            latestDraw.previousThirdNumber5,
            latestDraw.previousThirdNumber6,
            latestDraw.previousThirdNumber7,
            latestDraw.previousThirdNumber8
        ].filter(num => num !== undefined);

        // Extract all movements for first numbers
        const lastMovementsFirstNumber = [
            latestDraw.firstNumberMovement,
            latestDraw.previousFirstNumberMovement1,
            latestDraw.previousFirstNumberMovement2,
            latestDraw.previousFirstNumberMovement3,
            latestDraw.previousFirstNumberMovement4,
            latestDraw.previousFirstNumberMovement5,
            latestDraw.previousFirstNumberMovement6
        ].filter(movement => movement !== undefined);

        // Extract all movements for second numbers
        const lastMovementsSecondNumber = [
            latestDraw.secondNumberMovement,
            latestDraw.previousSecondNumberMovement1,
            latestDraw.previousSecondNumberMovement2,
            latestDraw.previousSecondNumberMovement3,
            latestDraw.previousSecondNumberMovement4,
            latestDraw.previousSecondNumberMovement5,
            latestDraw.previousSecondNumberMovement6
        ].filter(movement => movement !== undefined);

        // Extract all movements for third numbers
        const lastMovementsThirdNumber = [
            latestDraw.thirdNumberMovement,
            latestDraw.previousThirdNumberMovement1,
            latestDraw.previousThirdNumberMovement2,
            latestDraw.previousThirdNumberMovement3,
            latestDraw.previousThirdNumberMovement4,
            latestDraw.previousThirdNumberMovement5,
            latestDraw.previousThirdNumberMovement6
        ].filter(movement => movement !== undefined);

        // Extract fireball numbers
        const lastFireballs = [
            latestDraw.fireball,
            latestDraw.previousFireball1,
            latestDraw.previousFireball2,
            latestDraw.previousFireball3,
            latestDraw.previousFireball4,
            latestDraw.previousFireball5,
            latestDraw.previousFireball6,
            latestDraw.previousFireball7,
            latestDraw.previousFireball8
        ].filter(num => num !== undefined);

        const display = {
            last8FirstNumbers,
            last8SecondNumbers,
            last8ThirdNumbers,
            lastMovementsFirstNumber,
            lastMovementsSecondNumber,
            lastMovementsThirdNumber,
            lastFireballs,
            latestDrawDate: latestDraw.drawDate,
            latestDrawTime: latestDraw.time,
            winningCombinations: latestDraw.winningCombinations,
            currentDraw: latestDraw.currentDraw,
            currentDrawSum: latestDraw.currentDrawSum
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
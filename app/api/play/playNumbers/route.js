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

// Helper function to determine movement
function getMovement(currentNumber, selectedNumber) {
    if (selectedNumber > currentNumber) {
        return 'Up';
    } else if (selectedNumber < currentNumber) {
        return 'Down';
    } else {
        return 'Equal';
    }
}

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
            throw new Error('No draws found for the current month.');
        }

        // Get the latest draw data
        const latestDrawDoc = snapshot.docs[0];
        const latestDraw = latestDrawDoc.data();

        // Extract the current numbers from the latest draw
        const currentFirstNumber = latestDraw.currentFirstNumber;
        const currentSecondNumber = latestDraw.currentSecondNumber;
        const currentThirdNumber = latestDraw.currentThirdNumber;

        const allCombinations = [];
        // Generate all possible combinations
        for (let firstNumber = 0; firstNumber <= 2; firstNumber++) {
            for (let secondNumber = 3; secondNumber <= 6; secondNumber++) {
                for (let thirdNumber = 7; thirdNumber <= 9; thirdNumber++) {
                    // Compute movement for each number
                    const firstMovement = getMovement(currentFirstNumber, firstNumber);
                    const secondMovement = getMovement(currentSecondNumber, secondNumber);
                    const thirdMovement = getMovement(currentThirdNumber, thirdNumber);

                    // Add the combination with movements
                    allCombinations.push({
                        numbers: [firstNumber, secondNumber, thirdNumber],
                        movements: [firstMovement, secondMovement, thirdMovement],
                        currentNumbers: [currentFirstNumber, currentSecondNumber, currentThirdNumber],
                        previousNumbers1: [latestDraw.previousFirstNumber1, latestDraw.previousSecondNumber1, latestDraw.previousThirdNumber1],
                        previousNumbers2: [latestDraw.previousFirstNumber2, latestDraw.previousSecondNumber2, latestDraw.previousThirdNumber2],
                        previousMovements1: [latestDraw.previousFirstNumberMovement1, latestDraw.previousSecondNumberMovement1, latestDraw.previousThirdNumberMovement1],
                        currentMovements: [latestDraw.firstNumberMovement, latestDraw.secondNumberMovement, latestDraw.thirdNumberMovement]
                    });
                }
            }
        }

        // Shuffle allCombinations using the Fisher-Yates algorithm
        for (let i = allCombinations.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allCombinations[i], allCombinations[j]] = [allCombinations[j], allCombinations[i]];
        }

        // Take the first 10 unique combinations
        const combinations = allCombinations.slice(0, 10);

        // Return the combinations array as JSON
        return new Response(JSON.stringify(combinations), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, max-age=0',
            },
        });
    } catch (error) {
        console.error(error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}



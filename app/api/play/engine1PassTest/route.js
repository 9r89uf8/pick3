// app/api/posts/route.js
import {adminDb} from '@/app/utils/firebaseAdmin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;


function predictNextNumber(draw) {
    // Always include 0 as it has highest probability (28.43%)
    const predictions = [];

    if (draw.previousFirstNumber1 === 0) {
        if (draw.previousFirstNumber2 === 0) {
            //0-0
            // {
            //   '0': 15,
            //   '1': 15,
            //   '2': 6,
            //   '3': 2,
            //   '4': 3,
            //   '5': 3,
            //   '6': 1,
            //   '7': 1,
            //   '8': 0,
            //   '9': 0
            // }
            predictions.push({ number: 1, confidence: 95 });
            predictions.push({ number: 0, confidence: 85 });
        } else if (draw.previousFirstNumber2 === 1) {
            //0-1
            // {
            //   '0': 7,
            //   '1': 6,
            //   '2': 6,
            //   '3': 9,
            //   '4': 4,
            //   '5': 1,
            //   '6': 2,
            //   '7': 1,
            //   '8': 0,
            //   '9': 0
            // }
            predictions.push({ number: 3, confidence: 95 });
            predictions.push({ number: 0, confidence: 85 });
        }else if (draw.previousFirstNumber2 === 2) {
            //0-2
            //{
            //   '0': 6,
            //   '1': 6,
            //   '2': 5,
            //   '3': 6,
            //   '4': 5,
            //   '5': 2,
            //   '6': 0,
            //   '7': 0,
            //   '8': 0,
            //   '9': 0
            // }
            predictions.push({ number: 0, confidence: 95 });
            predictions.push({ number: 1, confidence: 85 });
        }else if (draw.previousFirstNumber2 === 3) {
            //0-3
            //{
            //   '0': 7,
            //   '1': 7,
            //   '2': 4,
            //   '3': 1,
            //   '4': 1,
            //   '5': 0,
            //   '6': 0,
            //   '7': 0,
            //   '8': 0,
            //   '9': 0
            // }
            predictions.push({ number: 0, confidence: 95 });
            predictions.push({ number: 1, confidence: 85 });
        }else if (draw.previousFirstNumber2 === 4) {
            //0-4
            //{
            //   '0': 4,
            //   '1': 7,
            //   '2': 1,
            //   '3': 1,
            //   '4': 2,
            //   '5': 2,
            //   '6': 0,
            //   '7': 1,
            //   '8': 0,
            //   '9': 0
            // }
            predictions.push({ number: 0, confidence: 95 });
            predictions.push({ number: 1, confidence: 85 });
        }
    } else if (draw.previousFirstNumber1 === 1) {
        if (draw.previousFirstNumber2 === 0) {
            //1-0
            // {
            //   '0': 11,
            //   '1': 10,
            //   '2': 7,
            //   '3': 9,
            //   '4': 4,
            //   '5': 4,
            //   '6': 2,
            //   '7': 2,
            //   '8': 0,
            //   '9': 1
            // }
            predictions.push({ number: 0, confidence: 90 });
            predictions.push({ number: 1, confidence: 85 });
        } else if (draw.previousFirstNumber2 === 1) {
            //1-1 data
            // {
            //   '0': 10,
            //   '1': 3,
            //   '2': 4,
            //   '3': 4,
            //   '4': 2,
            //   '5': 3,
            //   '6': 0,
            //   '7': 1,
            //   '8': 0,
            //   '9': 0
            // }
            predictions.push({ number: 0, confidence: 90 });
            predictions.push({ number: 1, confidence: 85 });
        }else if (draw.previousFirstNumber2 === 2) {
            //1-2 data
            //{
            //   '0': 5,
            //   '1': 3,
            //   '2': 0,
            //   '3': 2,
            //   '4': 2,
            //   '5': 1,
            //   '6': 0,
            //   '7': 1,
            //   '8': 0,
            //   '9': 0
            // }
            predictions.push({ number: 0, confidence: 90 });
            predictions.push({ number: 1, confidence: 85 });
        }
    } else if (draw.previousFirstNumber1 === 2) {
        if (draw.previousFirstNumber2 === 2) {
            //2-2
            // {
            //   '0': 6,
            //   '1': 1,
            //   '2': 5,
            //   '3': 0,
            //   '4': 2,
            //   '5': 2,
            //   '6': 2,
            //   '7': 0,
            //   '8': 0,
            //   '9': 0
            // }
            predictions.push({ number: 0, confidence: 90 });
            predictions.push({ number: 2, confidence: 85 });
        } else if (draw.previousFirstNumber2 === 1) {
            //2-1
            // {
            //   '0': 6,
            //   '1': 3,
            //   '2': 4,
            //   '3': 3,
            //   '4': 2,
            //   '5': 2,
            //   '6': 0,
            //   '7': 0,
            //   '8': 0,
            //   '9': 0
            // }
            predictions.push({ number: 0, confidence: 90 });
            predictions.push({ number: 2, confidence: 85 });
        }else if (draw.previousFirstNumber2 === 3) {
            //2-3
            //{
            //   '0': 1,
            //   '1': 2,
            //   '2': 1,
            //   '3': 4,
            //   '4': 0,
            //   '5': 1,
            //   '6': 0,
            //   '7': 0,
            //   '8': 0,
            //   '9': 0
            // }
            predictions.push({ number: 1, confidence: 90 });
            predictions.push({ number: 3, confidence: 85 });
        }
    } else if (draw.previousFirstNumber1 >= 3) {
        // {
        //   '0': 58,
        //   '1': 50,
        //   '2': 34,
        //   '3': 19,
        //   '4': 16,
        //   '5': 13,
        //   '6': 9,
        //   '7': 2,
        //   '8': 1,
        //   '9': 0
        // }
        predictions.push({ number: 0, confidence: 95 });
        predictions.push({ number: 1, confidence: 85 });
    }

    // If no specific pattern matched or as a fallback
    if (predictions.length === 0) {
        // Default to highest probability numbers based on overall frequency
        predictions.push({ number: 0, confidence: 90 }); // ~28.43% chance
        predictions.push({ number: 1, confidence: 85 }); // ~23.00% chance
    }




    return { predictions };
}




export async function GET() {
    try {
        const firestore = adminDb.firestore();

        // Query the latest draw in the current month, ordered by index descending
        const drawsCollection = firestore
            .collection("draws")
            .where("drawMonth", "==", 'Mar')
            .orderBy("index", "desc")

        const snapshot = await drawsCollection.get();
        const draws = [];

        // Assign an order to each month based on its position in the months array
        snapshot.forEach((doc) => {
            const drawData = doc.data();
            draws.push(drawData);
        });

        let totalCorrectPredictions = 0
        let totalDraws = 0


        for (let i = 1; i < draws.length; i++) {
            // Extract the last 8 first numbers
            let latestDraw = draws[i];
            if(latestDraw.currentFirstNumber<=2){
                if(latestDraw.currentSecondNumber>=3&&latestDraw.currentSecondNumber<=6){
                    if(latestDraw.currentThirdNumber>=7&&latestDraw.currentThirdNumber<=9){
                        totalCorrectPredictions += 1;
                    }
                }
            }


        }


        console.log(totalDraws)
        console.log(totalCorrectPredictions)

        return new Response(JSON.stringify(totalCorrectPredictions), {
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
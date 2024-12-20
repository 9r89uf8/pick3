// app/api/posts/route.js
import {adminDb} from '@/app/utils/firebaseAdmin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;


export async function GET() {
    try {
        const firestore = adminDb.firestore();

        // Query the latest draw in the current month, ordered by index descending
        const drawsCollection = firestore
            .collection("draws")

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
            if(latestDraw.currentFirstNumber<=3){
                if(latestDraw.currentSecondNumber>=2&&latestDraw.currentSecondNumber<=7){
                    if(latestDraw.currentThirdNumber>=6&&latestDraw.currentThirdNumber<=9){
                        totalCorrectPredictions += 1;
                    }
                }
            }


        }


        console.log(draws.length)
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
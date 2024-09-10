import { adminDb } from '@/app/utils/firebaseAdmin';
import axios from 'axios';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export async function POST(req) {
    try {
        // Prepare the data you want to send to the Lambda function
        const requestData = {
            // Add your request payload here, if necessary
        };

        // Set a longer timeout for the axios request (e.g., 3 minutes)
        const timeoutMs = 180000; // 3 minutes


        // Call the AWS Lambda function using Axios with a longer timeout
        const lambdaResponse = await axios.get(
            'https://qysdnsuoryaiyih2mx3eolvcwm0quwin.lambda-url.us-east-2.on.aws/',
            {
                timeout: timeoutMs,
                // You can add headers here if needed
                // headers: { ... }
            }
        );

        // Get the response data from Lambda
        const response = lambdaResponse.data;
        console.log(response)


        const infoCollection = adminDb.firestore().collection('draws');
        const batch = adminDb.firestore().batch();

        response.forEach(numObj => {
            const docRef = infoCollection.doc();
            numObj['timestamp'] = adminDb.firestore.FieldValue.serverTimestamp()
            batch.set(docRef, numObj);
        });

        batch.commit().then(() => {
            console.log('Batch write succeeded all');
        }).catch(error => {
            console.error('Batch write failed:', error);
        });

        // Continue with your logic...
        return new Response(JSON.stringify({ response }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, max-age=0'
            },
        });
    } catch (error) {
        console.error('Error calling Lambda:', error.message);

        // Check if it's a timeout error
        if (error.code === 'ECONNABORTED') {
            return new Response(JSON.stringify({ error: 'Request timed out' }), {
                status: 504,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // For other errors, return a 500 status
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
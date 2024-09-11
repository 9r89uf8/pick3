import { adminDb } from '@/app/utils/firebaseAdmin';
import axios from 'axios';


export const dynamic = 'force-dynamic';
export const revalidate = 0;


export async function GET(req) {
    try {
        // Prepare the data you want to send to the Lambda function
        const requestData = {
            // Add your request payload here, if necessary
        };

        // Set a longer timeout for the axios request (e.g., 3 minutes)
        const timeoutMs = 180000; // 3 minutes

        // Call the AWS Lambda function using Axios with a longer timeout
        const lambdaResponse = await axios.get(
            'https://cpp4cknnn7rn6idxxtmwvkylxq0bzefn.lambda-url.us-east-2.on.aws/',
            {
                timeout: timeoutMs,
                // You can add headers here if needed
                // headers: { ... }
            }
        );

        // Get the response data from Lambda
        const response = lambdaResponse.data;


        const draws = adminDb.firestore().collection('draws');

        response['timestamp'] = adminDb.firestore.FieldValue.serverTimestamp()
        // Save the response data to Firestore
        draws.add(response)
            .then((docRef) => {
                console.log("Document successfully written with ID: ", docRef.id);
            })
            .catch((error) => {
                console.error("Error adding document: ", error);
            });

        console.log(response)
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




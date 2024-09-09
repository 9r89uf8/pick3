// app/api/posts/route.js
import { adminDb } from '@/app/utils/firebaseAdmin';


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
        // const firstSnapshot = await admin.firestore().collection('firstPicks').where("drawMonth", "==", "Jul").orderBy('index', 'desc').get();
        // const first = firstSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const [prevMonth, currentMonth] = getMonths();
        const firestore = adminDb.firestore();

// Query for both July and June
        const drawsCollection = firestore
            .collection("draws")
            .where("drawMonth", "in", [currentMonth, prevMonth]);

        const snapshot = await drawsCollection.get();
        const draws = [];

// Loop through the documents and add them to the array
        snapshot.forEach((doc) => {
            const drawData = doc.data();
            drawData.id = doc.id; // Add the document ID to the draw data
            drawData.monthOrder = drawData.drawMonth === currentMonth ? 1 : 2;  // Assign an artificial order to the months
            draws.push(drawData);
        });


// Sort the combined array by 'monthOrder' and then by 'index'
        draws.sort((a, b) => {
            // Sort by 'monthOrder' first
            if (a.monthOrder < b.monthOrder) {
                return -1;
            } else if (a.monthOrder > b.monthOrder) {
                return 1;
            } else {
                // If 'monthOrder' is equal, sort by 'index' in descending order
                return b.index - a.index;
            }
        });


        return new Response(JSON.stringify(draws), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

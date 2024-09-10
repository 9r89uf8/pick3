// app/api/posts/route.js
import { adminDb } from '@/app/utils/firebaseAdmin';


function generateNumberArray() {
    // Generate the first number between 0 and 1
    let firstNumber = Math.floor(Math.random() * 2);

    // Generate the second number between 2 and 9
    let secondNumber = Math.floor(Math.random() * 8) + 2;

    // Generate the third number between 2 and 9, different from secondNumber
    let thirdNumber;
    do {
        thirdNumber = Math.floor(Math.random() * 8) + 2;
    } while (thirdNumber === secondNumber);

    // Ensure that secondNumber is less than thirdNumber
    if (secondNumber > thirdNumber) {
        // Swap the values if secondNumber is greater than thirdNumber
        let temp = secondNumber;
        secondNumber = thirdNumber;
        thirdNumber = temp;
    }

    return [firstNumber, secondNumber, thirdNumber];
}
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

        const [prevMonth, currentMonth] = getMonths();
        const firestore = adminDb.firestore();

        // Query for both July and June
        const drawsCollection = firestore
            .collection("draws")
            .where("drawMonth", "in", [currentMonth, prevMonth]);
        //                                                 [first, second]

        // ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

        const snapshot = await drawsCollection.get();
        console.log("Firebase connection successful.");
        console.log(`Found ${snapshot.size} documents`);
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



        // Assuming getX is a synchronous function. If it's asynchronous, you'd need to use await inside the loop.
        let finalDraws = [];

        function arrayExistsInFinalDraws(arr, finalDraws) {
            const arrString = JSON.stringify(arr);
            return finalDraws.some(draw => JSON.stringify(draw) === arrString);
        }


        // Function to check if a draw result is similar to any in the last 60 draws
        function isUniqueInLast50Draws(draw, draws) {
            let endPosition = Math.min(60, draws.length);
            for (let j = 0; j < endPosition; j++) {
                if (`${draw[0]}${draw[1]}${draw[2]}` === draws[j].currentDraw) {
                    console.log('-----------------------------------')
                    return false;
                }
            }
            return true;
        }

        // Function to check if a draw result is similar to any in the last 10 draws
        function similarSecondAndThird(draw, draws) {
            let endPosition = Math.min(10, draws.length);
            for (let j = 0; j < endPosition; j++) {
                if (`${draw[1]}${draw[2]}` === draws[j].secondAndThirdNumber) {
                    console.log('++++++++++++++++++++++++++++++++++++++=')
                    return false;
                }
            }
            return true;
        }


        let attempts = 0;
        const maxAttempts = 1000; // Limit the number of attempts to prevent infinite loop

        while (finalDraws.length < 10 && attempts < maxAttempts) {
            let result = generateNumberArray(draws.slice(0, 60));

            if (isUniqueInLast50Draws(result, draws)&&!arrayExistsInFinalDraws(result, finalDraws)&&similarSecondAndThird(result, draws)) {
                finalDraws.push(result);
            }

            attempts++;
        }


        return new Response(JSON.stringify(finalDraws), {
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
import { adminDb } from '@/app/utils/firebaseAdmin';
import puppeteer from 'puppeteer-core';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BROWSER_WS = process.env.PROXY;




export async function GET(req) {
    try {

        let firstPicks = [];
        let previousPick = [null, null, null];

        console.log('Connecting to Scraping Browser...');
        const browser = await puppeteer.connect({
            browserWSEndpoint: BROWSER_WS,
        });
        const page = await browser.newPage();

        const checkResults = async () => {
            await page.goto('https://www.illinoislottery.com/dbg/results/pick3?page=1', {
                waitUntil: 'networkidle0'
            });


            await page.waitForFunction(() => {
                const elements = document.querySelectorAll('.results__list-item');
                return elements.length > 0;
            });

            const divsWithClassDfs = await page.evaluate(() => Array.from(document.querySelectorAll('.results__list-item')).map(elem => ({
                dateInfo: elem.querySelector('.dbg-results__date-info').textContent,
                drawInfo: elem.querySelector('.dbg-results__draw-info').textContent,
                pick: Array.from(elem.querySelectorAll(".grid-ball--pick3-primary")).map(e => parseInt(e.textContent.replace(/[^0-9]/g, ""))),
            })));

            if (divsWithClassDfs.length < 2) {
                throw new Error('Not enough draw data found');
            }

            // Get the first and second draw
            const currentDraw = divsWithClassDfs[0];
            const previousDraw = divsWithClassDfs[1];

            const parseDraw = (draw) => {
                const { dateInfo, drawInfo, pick } = draw;
                let [firstNumber = null, secondNumber = null, thirdNumber = null] = pick;

                let r = parseInt(dateInfo.match(/\d+/)?.[0])
                let y = drawInfo.replace(/[^a-zA-Z]+/g, "");
                if(y === 'midday'){
                    r = r * 2
                } else {
                    r = (r * 2) + 1
                }

                // Putting the numbers into an array
                let numbers = [firstNumber, secondNumber, thirdNumber];

                // Sorting the array
                numbers.sort((a, b) => a - b);

                // Destructuring the sorted array back into variables
                [firstNumber, secondNumber, thirdNumber] = numbers;

                return {
                    currentFirstNumber: firstNumber,
                    currentSecondNumber: secondNumber,
                    currentThirdNumber: thirdNumber,
                    currentDraw: `${firstNumber}${secondNumber}${thirdNumber}`,
                    currentDrawSum: firstNumber+secondNumber+thirdNumber,
                    firstAndSecondNumber: `${firstNumber}${secondNumber}`,
                    secondAndThirdNumber: `${secondNumber}${thirdNumber}`,
                    drawDate: dateInfo,
                    drawMonth: dateInfo.substring(0, 3),
                    index: r,
                    time: drawInfo.replace(/[^a-zA-Z]+/g, ""),
                    firstAndThirdNumber: `${firstNumber}${thirdNumber}`,
                    timestamp: adminDb.firestore.FieldValue.serverTimestamp()
                }
            };

            const parsedCurrentDraw = parseDraw(currentDraw);


            firstPicks.push(parsedCurrentDraw);
        };

        await checkResults();


        const draws = adminDb.firestore().collection('draws');


        console.log('Saving response to Firestore...');
        const docRef = await draws.add(firstPicks[0]);
        console.log("Document successfully written with ID: ", docRef.id);

        // Continue with your logic...
        return new Response(JSON.stringify( firstPicks[0] ), {
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




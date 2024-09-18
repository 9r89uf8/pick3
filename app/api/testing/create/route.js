import { adminDb } from '@/app/utils/firebaseAdmin';
import puppeteer from 'puppeteer-core';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BROWSER_WS = process.env.PROXY;


export async function GET(req) {
    try {

        console.log('creating')
        let firstPicks = [];
        let previousPick = [null, null, null];

        console.log('Connecting to Scraping Browser...');
        const browser = await puppeteer.connect({
            browserWSEndpoint: BROWSER_WS,
        });
        const page = await browser.newPage();




        const checkResults = async () => {
            for (let pageNum = 11; pageNum >= 1; pageNum--) {
                await page.goto(`https://www.illinoislottery.com/dbg/results/pick3?page=${pageNum}`, {
                    waitUntil: 'networkidle0'
                });

                console.log('page found')


                await page.waitForSelector('.results__list-item');

                const divsWithClassDfs = await page.evaluate(() => Array.from(document.querySelectorAll('.results__list-item')).map(elem => ({
                    dateInfo: elem.querySelector('.dbg-results__date-info').textContent,
                    drawInfo: elem.querySelector('.dbg-results__draw-info').textContent,
                    pick: Array.from(elem.querySelectorAll(".grid-ball--pick3-primary")).map(e => parseInt(e.textContent.replace(/[^0-9]/g, ""))),
                })));

                divsWithClassDfs.reverse();

                for (let i = 0; i < divsWithClassDfs.length; i++) {
                    const { dateInfo, drawInfo, pick } = divsWithClassDfs[i];
                    if (dateInfo.substring(0, 3) === 'Sep') {
                        let [firstNumber = null, secondNumber = null, thirdNumber = null] = pick;

                        let r = parseInt(dateInfo.match(/\d+/)?.[0])
                        let y = drawInfo.replace(/[^a-zA-Z]+/g, "");
                        if(y === 'midday'){
                            r = r * 2
                        } else {
                            r = (r * 2) + 1
                        }

                        // Putting the numbers into an array
                        // Sorting the array
                        // numbers.sort((a, b) => a - b);

                        // Destructuring the sorted array back into variables
                        [firstNumber, secondNumber, thirdNumber] = [firstNumber, secondNumber, thirdNumber];


                        firstPicks.push({
                            currentFirstNumber: firstNumber,
                            currentSecondNumber: secondNumber,
                            currentThirdNumber: thirdNumber,
                            currentDraw: `${firstNumber}${secondNumber}${thirdNumber}`,
                            currentDrawSum: firstNumber+secondNumber+thirdNumber,
                            firstAndSecondNumber: `${firstNumber}${secondNumber}`,
                            secondAndThirdNumber: `${secondNumber}${thirdNumber}`,
                            firstAndThirdNumber: `${firstNumber}${thirdNumber}`,
                            drawDate: dateInfo,
                            drawMonth: dateInfo.substring(0, 3),
                            index: r,
                            time: drawInfo.replace(/[^a-zA-Z]+/g, ""),
                            timestamp: adminDb.firestore.Timestamp.now()
                        });

                        previousPick = [firstNumber, secondNumber, thirdNumber];
                    }
                }
            }
        };

        await checkResults();

        await browser.close();

        const infoCollection = adminDb.firestore().collection('draws');
        const batch = adminDb.firestore().batch();

        // Loop through the array and add write operations to the batch
        firstPicks.forEach(numObj => {
            const docRef = infoCollection.doc();
            batch.set(docRef, numObj);
        });

        // Commit the batch
        batch.commit().then(() => {
            console.log('Batch write succeededdddddddddddd');
        }).catch(error => {
            console.error('Batch write failed:');
        });
        let response = 'good'

        // Continue with your logic...
        return new Response(JSON.stringify(response), {
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







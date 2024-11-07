import { adminDb } from '@/app/utils/firebaseAdmin';
import puppeteer from 'puppeteer-core';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BROWSER_WS = process.env.PROXY;


export async function GET(req) {
    try {

        console.log('creating')
        let firstPicks = [];
        let previousPick1 = [null, null, null];
        let previousPick2 = [null, null, null];
        let previousPick3 = [null, null, null];

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
                    if (dateInfo.substring(0, 3) === 'Oct') {
                        let [firstNumber = null, secondNumber = null, thirdNumber = null] = pick;

                        let r = parseInt(dateInfo.match(/\d+/)?.[0])
                        let y = drawInfo.replace(/[^a-zA-Z]+/g, "");
                        if(y === 'midday'){
                            r = r * 2
                        } else {
                            r = (r * 2) + 1
                        }

                        // Destructuring the sorted array back into variables
                        [firstNumber, secondNumber, thirdNumber] = [firstNumber, secondNumber, thirdNumber];

                        let movementFirst1 = '';
                        let movementFirst2 = '';
                        let movementFirst3 = '';

                        let movementSecond1 = '';
                        let movementSecond2 = '';
                        let movementSecond3 = '';

                        let movementThird1 = '';
                        let movementThird2 = '';
                        let movementThird3 = '';

                        if (firstNumber > previousPick1[0]) {
                            movementFirst1 = 'Up';
                        } else if (firstNumber < previousPick1[0]) {
                            movementFirst1 = 'Down';
                        } else {
                            movementFirst1 = 'Equal';
                        }

                        if (previousPick1[0] > previousPick2[0]) {
                            movementFirst2 = 'Up';
                        } else if (previousPick1[0] < previousPick2[0]) {
                            movementFirst2 = 'Down';
                        } else {
                            movementFirst2 = 'Equal';
                        }

                        if (previousPick2[0] > previousPick3[0]) {
                            movementFirst3 = 'Up';
                        } else if (previousPick2[0] < previousPick3[0]) {
                            movementFirst3 = 'Down';
                        } else {
                            movementFirst3 = 'Equal';
                        }

                        if (secondNumber > previousPick1[1]) {
                            movementSecond1 = 'Up';
                        } else if (secondNumber < previousPick1[1]) {
                            movementSecond1 = 'Down';
                        } else {
                            movementSecond1 = 'Equal';
                        }

                        if (previousPick1[1] > previousPick2[1]) {
                            movementSecond2 = 'Up';
                        } else if (previousPick1[1] < previousPick2[1]) {
                            movementSecond2 = 'Down';
                        } else {
                            movementSecond2 = 'Equal';
                        }

                        if (previousPick2[1] > previousPick3[1]) {
                            movementSecond3 = 'Up';
                        } else if (previousPick2[1] < previousPick3[1]) {
                            movementSecond3 = 'Down';
                        } else {
                            movementSecond3 = 'Equal';
                        }

                        if (thirdNumber > previousPick1[2]) {
                            movementThird1 = 'Up';
                        } else if (thirdNumber < previousPick1[2]) {
                            movementThird1 = 'Down';
                        } else {
                            movementThird1 = 'Equal';
                        }

                        if (previousPick1[2] > previousPick2[2]) {
                            movementThird2 = 'Up';
                        } else if (previousPick1[2] < previousPick2[2]) {
                            movementThird2 = 'Down';
                        } else {
                            movementThird2 = 'Equal';
                        }

                        if (previousPick2[2] > previousPick3[2]) {
                            movementThird3 = 'Up';
                        } else if (previousPick2[2] < previousPick3[2]) {
                            movementThird3 = 'Down';
                        } else {
                            movementThird3 = 'Equal';
                        }


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
                            timestamp: adminDb.firestore.Timestamp.now(),

                            secondNumberMovement: movementSecond1,
                            previousSecondNumberMovement1: movementSecond2,
                            previousSecondNumberMovement2: movementSecond3,

                            firstNumberMovement: movementFirst1,
                            previousFirstNumberMovement1: movementFirst2,
                            previousFirstNumberMovement2: movementFirst3,

                            thirdNumberMovement: movementThird1,
                            previousThirdNumberMovement1: movementThird2,
                            previousThirdNumberMovement2: movementThird3,

                            previousFirstNumber1: previousPick1[0],
                            previousFirstNumber2: previousPick2[0],
                            previousFirstNumber3: previousPick3[0],
                            previousSecondNumber1: previousPick1[1],
                            previousSecondNumber2: previousPick2[1],
                            previousSecondNumber3: previousPick3[1],
                            previousThirdNumber1: previousPick1[2],
                            previousThirdNumber2: previousPick2[2],
                            previousThirdNumber3: previousPick3[2],

                        });

                        previousPick3 = [...previousPick2];
                        previousPick2 = [...previousPick1];
                        previousPick1 = [firstNumber, secondNumber, thirdNumber];
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







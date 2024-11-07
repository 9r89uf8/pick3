import { adminDb } from '@/app/utils/firebaseAdmin';
import puppeteer from 'puppeteer-core';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BROWSER_WS = process.env.PROXY;




export async function GET(req) {
    try {
        let firstPicks = [];
        let previousPicks = Array(8).fill().map(() => [null, null, null]);

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

            const divsWithClassDfs = await page.evaluate(() => Array.from(document.querySelectorAll('.results__list-item')).slice(0, 9).map(elem => ({
                dateInfo: elem.querySelector('.dbg-results__date-info').textContent,
                drawInfo: elem.querySelector('.dbg-results__draw-info').textContent,
                pick: Array.from(elem.querySelectorAll(".grid-ball--pick3-primary")).map(e => parseInt(e.textContent.replace(/[^0-9]/g, ""))),
                fireball: elem.querySelector('.grid-ball--pick3-secondary--selected')?.textContent.trim() || null,
            })));

            // Create an array of 9 draws, filling missing data with null values
            const allDraws = Array(9).fill(null).map((_, index) => {
                if (index < divsWithClassDfs.length) {
                    const draw = divsWithClassDfs[index];
                    const { dateInfo, drawInfo, pick, fireball } = draw;
                    let [firstNumber = null, secondNumber = null, thirdNumber = null] = pick;

                    let r = parseInt(dateInfo.match(/\d+/)?.[0]) || 0;
                    let y = drawInfo.replace(/[^a-zA-Z]+/g, "");
                    if(y === 'midday'){
                        r = r * 2;
                    } else {
                        r = (r * 2) + 1;
                    }

                    // Sort numbers if they exist
                    if (firstNumber !== null && secondNumber !== null && thirdNumber !== null) {
                        let numbers = [firstNumber, secondNumber, thirdNumber];
                        numbers.sort((a, b) => a - b);
                        [firstNumber, secondNumber, thirdNumber] = numbers;
                    }

                    return {
                        firstNumber,
                        secondNumber,
                        thirdNumber,
                        fireball: fireball ? parseInt(fireball) : null,
                        dateInfo,
                        drawInfo,
                        r
                    };
                } else {
                    // Return null values for missing draws
                    return {
                        firstNumber: null,
                        secondNumber: null,
                        thirdNumber: null,
                        fireball: null,
                        dateInfo: null,
                        drawInfo: null,
                        r: null
                    };
                }
            });

            // Function to determine movement, handling null values
            const getMovement = (current, previous) => {
                if (current === null || previous === null) return null;
                if (current > previous) return 'Up';
                if (current < previous) return 'Down';
                return 'Equal';
            };

            // Calculate movements between each consecutive pair of draws
            const movements = {
                first: Array(7).fill(null),
                second: Array(7).fill(null),
                third: Array(7).fill(null)
            };

            for (let i = 0; i < 7; i++) {
                movements.first[i] = getMovement(allDraws[i]?.firstNumber, allDraws[i + 1]?.firstNumber);
                movements.second[i] = getMovement(allDraws[i]?.secondNumber, allDraws[i + 1]?.secondNumber);
                movements.third[i] = getMovement(allDraws[i]?.thirdNumber, allDraws[i + 1]?.thirdNumber);
            }

            // Get current draw (first in the list)
            const currentDraw = allDraws[0];

            // Handle winning combinations with null check
            const winningCombinations = currentDraw.fireball !== null && currentDraw.firstNumber !== null ? [
                `${currentDraw.fireball}${currentDraw.secondNumber}${currentDraw.thirdNumber}`,
                `${currentDraw.firstNumber}${currentDraw.fireball}${currentDraw.thirdNumber}`,
                `${currentDraw.firstNumber}${currentDraw.secondNumber}${currentDraw.fireball}`,
                `${currentDraw.firstNumber}${currentDraw.secondNumber}${currentDraw.thirdNumber}`
            ] : currentDraw.firstNumber !== null ?
                [`${currentDraw.firstNumber}${currentDraw.secondNumber}${currentDraw.thirdNumber}`] :
                [];

            // Calculate current draw sum with null check
            const currentDrawSum = currentDraw.firstNumber !== null &&
            currentDraw.secondNumber !== null &&
            currentDraw.thirdNumber !== null ?
                currentDraw.firstNumber + currentDraw.secondNumber + currentDraw.thirdNumber :
                null;

            const completeCurrentDraw = {
                currentFirstNumber: currentDraw.firstNumber,
                currentSecondNumber: currentDraw.secondNumber,
                currentThirdNumber: currentDraw.thirdNumber,
                currentDraw: currentDraw.firstNumber !== null ?
                    `${currentDraw.firstNumber}${currentDraw.secondNumber}${currentDraw.thirdNumber}` :
                    null,
                currentDrawSum,
                firstAndSecondNumber: currentDraw.firstNumber !== null ?
                    `${currentDraw.firstNumber}${currentDraw.secondNumber}` :
                    null,
                secondAndThirdNumber: currentDraw.secondNumber !== null ?
                    `${currentDraw.secondNumber}${currentDraw.thirdNumber}` :
                    null,
                firstAndThirdNumber: currentDraw.firstNumber !== null ?
                    `${currentDraw.firstNumber}${currentDraw.thirdNumber}` :
                    null,
                winningCombinations,

                // Movement data
                firstNumberMovement: movements.first[0],
                previousFirstNumberMovement1: movements.first[1],
                previousFirstNumberMovement2: movements.first[2],
                previousFirstNumberMovement3: movements.first[3],
                previousFirstNumberMovement4: movements.first[4],
                previousFirstNumberMovement5: movements.first[5],
                previousFirstNumberMovement6: movements.first[6],

                secondNumberMovement: movements.second[0],
                previousSecondNumberMovement1: movements.second[1],
                previousSecondNumberMovement2: movements.second[2],
                previousSecondNumberMovement3: movements.second[3],
                previousSecondNumberMovement4: movements.second[4],
                previousSecondNumberMovement5: movements.second[5],
                previousSecondNumberMovement6: movements.second[6],

                thirdNumberMovement: movements.third[0],
                previousThirdNumberMovement1: movements.third[1],
                previousThirdNumberMovement2: movements.third[2],
                previousThirdNumberMovement3: movements.third[3],
                previousThirdNumberMovement4: movements.third[4],
                previousThirdNumberMovement5: movements.third[5],
                previousThirdNumberMovement6: movements.third[6],

                // Previous numbers
                previousFirstNumber1: allDraws[1]?.firstNumber ?? null,
                previousFirstNumber2: allDraws[2]?.firstNumber ?? null,
                previousFirstNumber3: allDraws[3]?.firstNumber ?? null,
                previousFirstNumber4: allDraws[4]?.firstNumber ?? null,
                previousFirstNumber5: allDraws[5]?.firstNumber ?? null,
                previousFirstNumber6: allDraws[6]?.firstNumber ?? null,
                previousFirstNumber7: allDraws[7]?.firstNumber ?? null,
                previousFirstNumber8: allDraws[8]?.firstNumber ?? null,

                previousSecondNumber1: allDraws[1]?.secondNumber ?? null,
                previousSecondNumber2: allDraws[2]?.secondNumber ?? null,
                previousSecondNumber3: allDraws[3]?.secondNumber ?? null,
                previousSecondNumber4: allDraws[4]?.secondNumber ?? null,
                previousSecondNumber5: allDraws[5]?.secondNumber ?? null,
                previousSecondNumber6: allDraws[6]?.secondNumber ?? null,
                previousSecondNumber7: allDraws[7]?.secondNumber ?? null,
                previousSecondNumber8: allDraws[8]?.secondNumber ?? null,

                previousThirdNumber1: allDraws[1]?.thirdNumber ?? null,
                previousThirdNumber2: allDraws[2]?.thirdNumber ?? null,
                previousThirdNumber3: allDraws[3]?.thirdNumber ?? null,
                previousThirdNumber4: allDraws[4]?.thirdNumber ?? null,
                previousThirdNumber5: allDraws[5]?.thirdNumber ?? null,
                previousThirdNumber6: allDraws[6]?.thirdNumber ?? null,
                previousThirdNumber7: allDraws[7]?.thirdNumber ?? null,
                previousThirdNumber8: allDraws[8]?.thirdNumber ?? null,

                // Previous fireballs
                fireball: currentDraw.fireball,
                previousFireball1: allDraws[1]?.fireball ?? null,
                previousFireball2: allDraws[2]?.fireball ?? null,
                previousFireball3: allDraws[3]?.fireball ?? null,
                previousFireball4: allDraws[4]?.fireball ?? null,
                previousFireball5: allDraws[5]?.fireball ?? null,
                previousFireball6: allDraws[6]?.fireball ?? null,
                previousFireball7: allDraws[7]?.fireball ?? null,
                previousFireball8: allDraws[8]?.fireball ?? null,

                drawDate: currentDraw.dateInfo || null,
                drawMonth: currentDraw.dateInfo ? currentDraw.dateInfo.substring(0, 3) : null,
                index: currentDraw.r || null,
                time: currentDraw.drawInfo ? currentDraw.drawInfo.replace(/[^a-zA-Z]+/g, "") : null,
                timestamp: adminDb.firestore.FieldValue.serverTimestamp()
            };

            firstPicks.push(completeCurrentDraw);
        };

        await checkResults();
        await browser.close();

        const draws = adminDb.firestore().collection('draws');

        console.log('Saving response to Firestore...');
        const docRef = await draws.add(firstPicks[0]);
        console.log("Document successfully written with ID: ", docRef.id);

        return new Response(JSON.stringify(firstPicks[0]), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, max-age=0'
            },
        });
    } catch (error) {
        console.error('Error calling Lambda:', error.message);

        if (error.code === 'ECONNABORTED') {
            return new Response(JSON.stringify({ error: 'Request timed out' }), {
                status: 504,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}




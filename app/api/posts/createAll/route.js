import { adminDb } from '@/app/utils/firebaseAdmin';
import puppeteer from 'puppeteer-core';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BROWSER_WS = process.env.PROXY;
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

export async function GET(req) {
    try {
        const [prevMonth, currentMonth] = getMonths();
        console.log('creating')
        let firstPicks = [];
        // Initialize 8 previous pick arrays
        let previousPick1 = [null, null, null];
        let previousPick2 = [null, null, null];
        let previousPick3 = [null, null, null];
        let previousPick4 = [null, null, null];
        let previousPick5 = [null, null, null];
        let previousPick6 = [null, null, null];
        let previousPick7 = [null, null, null];
        let previousPick8 = [null, null, null];

        // Initialize 8 previous fireballs
        let previousFireball1 = null;
        let previousFireball2 = null;
        let previousFireball3 = null;
        let previousFireball4 = null;
        let previousFireball5 = null;
        let previousFireball6 = null;
        let previousFireball7 = null;
        let previousFireball8 = null;

        console.log('Connecting to Scraping Browser...');
        const browser = await puppeteer.connect({
            browserWSEndpoint: BROWSER_WS,
        });
        const page = await browser.newPage();

        const checkResults = async () => {
            for (let pageNum = 9; pageNum >= 1; pageNum--) {
                await page.goto(`https://www.illinoislottery.com/dbg/results/pick3?page=${pageNum}`, {
                    waitUntil: 'networkidle0'
                });

                console.log('page found')

                await page.waitForSelector('.results__list-item');

                const divsWithClassDfs = await page.evaluate(() => Array.from(document.querySelectorAll('.results__list-item')).map(elem => {
                    try {
                        return {
                            dateInfo: elem.querySelector('.dbg-results__date-info')?.textContent || null,
                            drawInfo: elem.querySelector('.dbg-results__draw-info')?.textContent || null,
                            fireball: elem.querySelector('.grid-ball--pick3-secondary--selected')?.textContent.trim() || null,
                            pick: Array.from(elem.querySelectorAll(".grid-ball--pick3-primary")).map(e => {
                                const num = parseInt(e.textContent.replace(/[^0-9]/g, ""));
                                return isNaN(num) ? null : num;
                            }),
                        };
                    } catch (error) {
                        return {
                            dateInfo: null,
                            drawInfo: null,
                            fireball: null,
                            pick: [null, null, null]
                        };
                    }
                }));

                divsWithClassDfs.reverse();

                for (let i = 0; i < divsWithClassDfs.length; i++) {
                    const { dateInfo, drawInfo, pick, fireball } = divsWithClassDfs[i];
                    if (dateInfo?.substring(0, 3) === currentMonth) {
                        let [firstNumber = null, secondNumber = null, thirdNumber = null] = pick;

                        let r = parseInt(dateInfo?.match(/\d+/)?.[0] || '0')
                        let y = drawInfo?.replace(/[^a-zA-Z]+/g, "") || '';
                        if(y === 'midday'){
                            r = r * 2
                        } else {
                            r = (r * 2) + 1
                        }

                        // Sort the numbers if they're all valid
                        if (firstNumber !== null && secondNumber !== null && thirdNumber !== null) {
                            let numbers = [firstNumber, secondNumber, thirdNumber];
                            numbers.sort((a, b) => a - b);
                            [firstNumber, secondNumber, thirdNumber] = numbers;
                        }

                        // Function to determine movement with null handling
                        const getMovement = (current, previous) => {
                            if (current === null || previous === null) return null;
                            if (current > previous) return 'Up';
                            if (current < previous) return 'Down';
                            return 'Equal';
                        };

                        // Calculate movements with null handling
                        const movements = {
                            first: Array(7).fill(null),
                            second: Array(7).fill(null),
                            third: Array(7).fill(null)
                        };

                        // Calculate all movements with null checking
                        movements.first[0] = getMovement(firstNumber, previousPick1[0]);
                        movements.second[0] = getMovement(secondNumber, previousPick1[1]);
                        movements.third[0] = getMovement(thirdNumber, previousPick1[2]);

                        movements.first[1] = getMovement(previousPick1[0], previousPick2[0]);
                        movements.second[1] = getMovement(previousPick1[1], previousPick2[1]);
                        movements.third[1] = getMovement(previousPick1[2], previousPick2[2]);

                        movements.first[2] = getMovement(previousPick2[0], previousPick3[0]);
                        movements.second[2] = getMovement(previousPick2[1], previousPick3[1]);
                        movements.third[2] = getMovement(previousPick2[2], previousPick3[2]);

                        movements.first[3] = getMovement(previousPick3[0], previousPick4[0]);
                        movements.second[3] = getMovement(previousPick3[1], previousPick4[1]);
                        movements.third[3] = getMovement(previousPick3[2], previousPick4[2]);

                        movements.first[4] = getMovement(previousPick4[0], previousPick5[0]);
                        movements.second[4] = getMovement(previousPick4[1], previousPick5[1]);
                        movements.third[4] = getMovement(previousPick4[2], previousPick5[2]);

                        movements.first[5] = getMovement(previousPick5[0], previousPick6[0]);
                        movements.second[5] = getMovement(previousPick5[1], previousPick6[1]);
                        movements.third[5] = getMovement(previousPick5[2], previousPick6[2]);

                        movements.first[6] = getMovement(previousPick6[0], previousPick7[0]);
                        movements.second[6] = getMovement(previousPick6[1], previousPick7[1]);
                        movements.third[6] = getMovement(previousPick6[2], previousPick7[2]);

                        // Create winning combinations only if all numbers are valid
                        const parsedFireball = fireball ? parseInt(fireball) : null;
                        let winningCombinations = [];
                        if (firstNumber !== null && secondNumber !== null && thirdNumber !== null) {
                            if (parsedFireball !== null) {
                                winningCombinations = [
                                    `${parsedFireball}${secondNumber}${thirdNumber}`,
                                    `${firstNumber}${parsedFireball}${thirdNumber}`,
                                    `${firstNumber}${secondNumber}${parsedFireball}`,
                                    `${firstNumber}${secondNumber}${thirdNumber}`
                                ];
                            } else {
                                winningCombinations = [`${firstNumber}${secondNumber}${thirdNumber}`];
                            }
                        }

                        // Calculate currentDrawSum only if all numbers are valid
                        const currentDrawSum = (firstNumber !== null && secondNumber !== null && thirdNumber !== null)
                            ? firstNumber + secondNumber + thirdNumber
                            : null;

                        firstPicks.push({
                            currentFirstNumber: firstNumber,
                            currentSecondNumber: secondNumber,
                            currentThirdNumber: thirdNumber,
                            fireball: parsedFireball,
                            winningCombinations,
                            currentDraw: (firstNumber !== null && secondNumber !== null && thirdNumber !== null)
                                ? `${firstNumber}${secondNumber}${thirdNumber}`
                                : null,
                            currentDrawSum,
                            firstAndSecondNumber: (firstNumber !== null && secondNumber !== null)
                                ? `${firstNumber}${secondNumber}`
                                : null,
                            secondAndThirdNumber: (secondNumber !== null && thirdNumber !== null)
                                ? `${secondNumber}${thirdNumber}`
                                : null,
                            firstAndThirdNumber: (firstNumber !== null && thirdNumber !== null)
                                ? `${firstNumber}${thirdNumber}`
                                : null,

                            // Previous fireballs with null handling
                            previousFireball1: previousFireball1 ? parseInt(previousFireball1) : null,
                            previousFireball2: previousFireball2 ? parseInt(previousFireball2) : null,
                            previousFireball3: previousFireball3 ? parseInt(previousFireball3) : null,
                            previousFireball4: previousFireball4 ? parseInt(previousFireball4) : null,
                            previousFireball5: previousFireball5 ? parseInt(previousFireball5) : null,
                            previousFireball6: previousFireball6 ? parseInt(previousFireball6) : null,
                            previousFireball7: previousFireball7 ? parseInt(previousFireball7) : null,
                            previousFireball8: previousFireball8 ? parseInt(previousFireball8) : null,

                            drawDate: dateInfo || null,
                            drawMonth: dateInfo ? dateInfo.substring(0, 3) : null,
                            index: r,
                            time: drawInfo ? drawInfo.replace(/[^a-zA-Z]+/g, "") : null,
                            timestamp: adminDb.firestore.Timestamp.now(),

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
                            previousFirstNumber1: previousPick1[0],
                            previousFirstNumber2: previousPick2[0],
                            previousFirstNumber3: previousPick3[0],
                            previousFirstNumber4: previousPick4[0],
                            previousFirstNumber5: previousPick5[0],
                            previousFirstNumber6: previousPick6[0],
                            previousFirstNumber7: previousPick7[0],
                            previousFirstNumber8: previousPick8[0],

                            previousSecondNumber1: previousPick1[1],
                            previousSecondNumber2: previousPick2[1],
                            previousSecondNumber3: previousPick3[1],
                            previousSecondNumber4: previousPick4[1],
                            previousSecondNumber5: previousPick5[1],
                            previousSecondNumber6: previousPick6[1],
                            previousSecondNumber7: previousPick7[1],
                            previousSecondNumber8: previousPick8[1],

                            previousThirdNumber1: previousPick1[2],
                            previousThirdNumber2: previousPick2[2],
                            previousThirdNumber3: previousPick3[2],
                            previousThirdNumber4: previousPick4[2],
                            previousThirdNumber5: previousPick5[2],
                            previousThirdNumber6: previousPick6[2],
                            previousThirdNumber7: previousPick7[2],
                            previousThirdNumber8: previousPick8[2],
                        });

                        // Shift all previous picks down
                        previousPick8 = [...previousPick7];
                        previousPick7 = [...previousPick6];
                        previousPick6 = [...previousPick5];
                        previousPick5 = [...previousPick4];
                        previousPick4 = [...previousPick3];
                        previousPick3 = [...previousPick2];
                        previousPick2 = [...previousPick1];
                        previousPick1 = [firstNumber, secondNumber, thirdNumber];

                        // Shift all previous fireballs down
                        previousFireball8 = previousFireball7;
                        previousFireball7 = previousFireball6;
                        previousFireball6 = previousFireball5;
                        previousFireball5 = previousFireball4;
                        previousFireball4 = previousFireball3;
                        previousFireball3 = previousFireball2;
                        previousFireball2 = previousFireball1;
                        previousFireball1 = fireball;
                    }
                }
            }
        };

        await checkResults();
        await browser.close();

        const infoCollection = adminDb.firestore().collection('draws');
        const batch = adminDb.firestore().batch();

        firstPicks.forEach(numObj => {
            const docRef = infoCollection.doc();
            batch.set(docRef, numObj);
        });
        console.log(firstPicks.length)

        batch.commit().then(() => {
            console.log('Batch write succeeded');
        }).catch(error => {
            console.log(error.message)
            console.error('Batch write failed:');
        });

        let response = 'good'
        return new Response(JSON.stringify(response), {
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
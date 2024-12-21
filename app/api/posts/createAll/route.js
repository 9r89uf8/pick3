import { adminDb } from '@/app/utils/firebaseAdmin';
import puppeteer from 'puppeteer-core';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BROWSER_WS = process.env.PROXY;
const getMonths = () => {
    const currentDate = new Date();
    const currentMonthIndex = currentDate.getMonth();

    let twoMonthsAgoIndex;
    let previousMonthIndex;

    if (currentMonthIndex === 0) {
        twoMonthsAgoIndex = 10;
        previousMonthIndex = 11;
    } else if (currentMonthIndex === 1) {
        twoMonthsAgoIndex = 11;
        previousMonthIndex = 0;
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
        let draws = [];

        // Initialize previous pick arrays for both sorted and original order
        let previousSortedPick1 = [null, null, null];
        let previousSortedPick2 = [null, null, null];
        let previousSortedPick3 = [null, null, null];
        let previousSortedPick4 = [null, null, null];
        let previousSortedPick5 = [null, null, null];
        let previousSortedPick6 = [null, null, null];
        let previousSortedPick7 = [null, null, null];
        let previousSortedPick8 = [null, null, null];

        let previousOriginalPick1 = [null, null, null];
        let previousOriginalPick2 = [null, null, null];
        let previousOriginalPick3 = [null, null, null];
        let previousOriginalPick4 = [null, null, null];
        let previousOriginalPick5 = [null, null, null];
        let previousOriginalPick6 = [null, null, null];
        let previousOriginalPick7 = [null, null, null];
        let previousOriginalPick8 = [null, null, null];

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
                        // Original order numbers
                        let [originalFirst = null, originalSecond = null, originalThird = null] = pick;

                        let r = parseInt(dateInfo?.match(/\d+/)?.[0] || '0')
                        let y = drawInfo?.replace(/[^a-zA-Z]+/g, "") || '';
                        if(y === 'midday'){
                            r = r * 2
                        } else {
                            r = (r * 2) + 1
                        }

                        // Create sorted version
                        let sortedNumbers = [...pick];
                        if (originalFirst !== null && originalSecond !== null && originalThird !== null) {
                            sortedNumbers.sort((a, b) => a - b);
                        }
                        let [sortedFirst, sortedSecond, sortedThird] = sortedNumbers;

                        const parsedFireball = fireball ? parseInt(fireball) : null;

                        // Calculate sums
                        const sortedDrawSum = (sortedFirst !== null && sortedSecond !== null && sortedThird !== null)
                            ? sortedFirst + sortedSecond + sortedThird
                            : null;

                        const originalDrawSum = (originalFirst !== null && originalSecond !== null && originalThird !== null)
                            ? originalFirst + originalSecond + originalThird
                            : null;

                        // Create combined data object
                        draws.push({
                            // Original order data
                            originalFirstNumber: originalFirst,
                            originalSecondNumber: originalSecond,
                            originalThirdNumber: originalThird,
                            originalDraw: (originalFirst !== null && originalSecond !== null && originalThird !== null)
                                ? `${originalFirst}${originalSecond}${originalThird}`
                                : null,
                            originalDrawSum,
                            originalFirstAndSecond: (originalFirst !== null && originalSecond !== null)
                                ? `${originalFirst}${originalSecond}`
                                : null,
                            originalSecondAndThird: (originalSecond !== null && originalThird !== null)
                                ? `${originalSecond}${originalThird}`
                                : null,
                            originalFirstAndThird: (originalFirst !== null && originalThird !== null)
                                ? `${originalFirst}${originalThird}`
                                : null,

                            // Previous numbers (original order)
                            originalPreviousFirst1: previousOriginalPick1[0],
                            originalPreviousFirst2: previousOriginalPick2[0],
                            originalPreviousFirst3: previousOriginalPick3[0],
                            originalPreviousFirst4: previousOriginalPick4[0],
                            originalPreviousFirst5: previousOriginalPick5[0],
                            originalPreviousFirst6: previousOriginalPick6[0],
                            originalPreviousFirst7: previousOriginalPick7[0],
                            originalPreviousFirst8: previousOriginalPick8[0],

                            originalPreviousSecond1: previousOriginalPick1[1],
                            originalPreviousSecond2: previousOriginalPick2[1],
                            originalPreviousSecond3: previousOriginalPick3[1],
                            originalPreviousSecond4: previousOriginalPick4[1],
                            originalPreviousSecond5: previousOriginalPick5[1],
                            originalPreviousSecond6: previousOriginalPick6[1],
                            originalPreviousSecond7: previousOriginalPick7[1],
                            originalPreviousSecond8: previousOriginalPick8[1],

                            originalPreviousThird1: previousOriginalPick1[2],
                            originalPreviousThird2: previousOriginalPick2[2],
                            originalPreviousThird3: previousOriginalPick3[2],
                            originalPreviousThird4: previousOriginalPick4[2],
                            originalPreviousThird5: previousOriginalPick5[2],
                            originalPreviousThird6: previousOriginalPick6[2],
                            originalPreviousThird7: previousOriginalPick7[2],
                            originalPreviousThird8: previousOriginalPick8[2],

                            // Sorted data
                            sortedFirstNumber: sortedFirst,
                            sortedSecondNumber: sortedSecond,
                            sortedThirdNumber: sortedThird,
                            sortedDraw: (sortedFirst !== null && sortedSecond !== null && sortedThird !== null)
                                ? `${sortedFirst}${sortedSecond}${sortedThird}`
                                : null,
                            sortedDrawSum,
                            sortedFirstAndSecond: (sortedFirst !== null && sortedSecond !== null)
                                ? `${sortedFirst}${sortedSecond}`
                                : null,
                            sortedSecondAndThird: (sortedSecond !== null && sortedThird !== null)
                                ? `${sortedSecond}${sortedThird}`
                                : null,
                            sortedFirstAndThird: (sortedFirst !== null && sortedThird !== null)
                                ? `${sortedFirst}${sortedThird}`
                                : null,

                            // Previous numbers (sorted)
                            sortedPreviousFirst1: previousSortedPick1[0],
                            sortedPreviousFirst2: previousSortedPick2[0],
                            sortedPreviousFirst3: previousSortedPick3[0],
                            sortedPreviousFirst4: previousSortedPick4[0],
                            sortedPreviousFirst5: previousSortedPick5[0],
                            sortedPreviousFirst6: previousSortedPick6[0],
                            sortedPreviousFirst7: previousSortedPick7[0],
                            sortedPreviousFirst8: previousSortedPick8[0],

                            sortedPreviousSecond1: previousSortedPick1[1],
                            sortedPreviousSecond2: previousSortedPick2[1],
                            sortedPreviousSecond3: previousSortedPick3[1],
                            sortedPreviousSecond4: previousSortedPick4[1],
                            sortedPreviousSecond5: previousSortedPick5[1],
                            sortedPreviousSecond6: previousSortedPick6[1],
                            sortedPreviousSecond7: previousSortedPick7[1],
                            sortedPreviousSecond8: previousSortedPick8[1],

                            sortedPreviousThird1: previousSortedPick1[2],
                            sortedPreviousThird2: previousSortedPick2[2],
                            sortedPreviousThird3: previousSortedPick3[2],
                            sortedPreviousThird4: previousSortedPick4[2],
                            sortedPreviousThird5: previousSortedPick5[2],
                            sortedPreviousThird6: previousSortedPick6[2],
                            sortedPreviousThird7: previousSortedPick7[2],
                            sortedPreviousThird8: previousSortedPick8[2],

                            // Common fields
                            fireball: parsedFireball,
                            drawDate: dateInfo || null,
                            drawMonth: dateInfo ? dateInfo.substring(0, 3) : null,
                            index: r,
                            time: drawInfo ? drawInfo.replace(/[^a-zA-Z]+/g, "") : null,
                            timestamp: adminDb.firestore.Timestamp.now(),
                        });

                        // Update previous picks for sorted numbers
                        previousSortedPick8 = [...previousSortedPick7];
                        previousSortedPick7 = [...previousSortedPick6];
                        previousSortedPick6 = [...previousSortedPick5];
                        previousSortedPick5 = [...previousSortedPick4];
                        previousSortedPick4 = [...previousSortedPick3];
                        previousSortedPick3 = [...previousSortedPick2];
                        previousSortedPick2 = [...previousSortedPick1];
                        previousSortedPick1 = [sortedFirst, sortedSecond, sortedThird];

                        // Update previous picks for original order
                        previousOriginalPick8 = [...previousOriginalPick7];
                        previousOriginalPick7 = [...previousOriginalPick6];
                        previousOriginalPick6 = [...previousOriginalPick5];
                        previousOriginalPick5 = [...previousOriginalPick4];
                        previousOriginalPick4 = [...previousOriginalPick3];
                        previousOriginalPick3 = [...previousOriginalPick2];
                        previousOriginalPick2 = [...previousOriginalPick1];
                        previousOriginalPick1 = [originalFirst, originalSecond, originalThird];
                    }
                }
            }
        };

        await checkResults();
        await browser.close();

        const infoCollection = adminDb.firestore().collection('draws');
        const batch = adminDb.firestore().batch();

        // Write the combined data
        draws.forEach(draw => {
            const docRef = infoCollection.doc();
            batch.set(docRef, draw);
        });

        console.log('Total documents to write:', draws.length);

        await batch.commit();
        console.log('Batch write succeeded');

        return new Response(JSON.stringify('good'), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, max-age=0'
            },
        });
    } catch (error) {
        console.error('Error:', error.message);

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
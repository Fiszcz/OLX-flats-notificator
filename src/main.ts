import filterAsync from "node-filter-async";
import * as puppeteer from 'puppeteer';
import {ElementHandle} from "puppeteer";
import delay from "delay";
import {sendEmail} from "./emailService";

async function run() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto('https://www.olx.pl/nieruchomosci/mieszkania/wynajem/warszawa/?search%5Bfilter_float_price%3Afrom%5D=1500&search%5Bfilter_float_price%3Ato%5D=2500&search%5Bfilter_float_m%3Afrom%5D=25&search%5Bphotos%5D=1', {waitUntil: 'domcontentloaded'});
    await page.click('.cookie-close');

    const firstDate = new Date();
    let hour = firstDate.getHours();
    let minutes = firstDate.getMinutes();

    const setNewPointInTime = (newHour: number, newMinutes: number) => {
        hour = newHour;
        minutes = newMinutes;
    };

    const getDifferenceBetweenTimeOfAdvertisementAndTimeOfLastChecking = async (advertisement: ElementHandle) => {
        const innerHTMLOfTimeElement = await advertisement.$eval('.breadcrumb:nth-child(2)', (element) => {
            return element.innerHTML
        });
        const partsOfTime = innerHTMLOfTimeElement.split(':');
        const hourOfAdvertisement = Number(partsOfTime[0].slice(-2));
        const minutesOfAdvertisement = Number(partsOfTime[1].slice(0, 2));
        return (hourOfAdvertisement === 0 ? 24 : hourOfAdvertisement) * 60 + minutesOfAdvertisement - hour * 60 - minutes;
    };

    const examineAdvertisements = async () => {
        const timeOfCheck = new Date();
        const otherAdvertisementsTable = (await page.$$('table.offers'));

        const advertisements: ElementHandle[] = await otherAdvertisementsTable[1].$$('tr.wrap');
        const filteredAdvertisements = await filterAsync(advertisements, async (advertisement) => {
            const difference = await getDifferenceBetweenTimeOfAdvertisementAndTimeOfLastChecking(advertisement);
            return difference >= 0;
        });
        filteredAdvertisements.map(async (advertisement) => {
            const advertisementHref = await advertisement.$eval('a.link', (linkElement) => {
                return linkElement.getAttribute('href')
            });
            const advertisementTitle = await advertisement.$eval('a strong', (titleElement) => {
                return titleElement.innerHTML
            });
            console.log('Open advertisement: ' + advertisementTitle + '\nWith address: ' + advertisementHref + '\n\n');

            const page = await browser.newPage();
            await page.setViewport({width: 1280, height: 1080});
            await page.goto(advertisementHref!);
            await delay(10000);
            const screenshotPath = '../screenshots/' + (Math.floor(Math.random() * 999999) + 1).toString() + '.png';
            await page.screenshot({ path: screenshotPath, fullPage: true});
            console.log('Screeanshot has been taken - file: ' + screenshotPath + ' from: ' + advertisementHref);

            sendEmail(screenshotPath, advertisementHref!, advertisementTitle);

            await page.close();
        });

        setNewPointInTime(timeOfCheck.getHours(), timeOfCheck.getMinutes());
    };

    await examineAdvertisements();
    setInterval(examineAdvertisements, 3600000);

    // await browser.close();
}

run();
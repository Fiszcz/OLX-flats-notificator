import filterAsync from "node-filter-async";
import puppeteer, {ElementHandle} from 'puppeteer';
import delay from "delay";
import { sendEmail } from "./emailService";
import { findLocationOfFlatInDescription } from "./positionFinder";
import { checkTransportTime, TransportInformation } from "./transportConnection";
import { websiteSelectors } from "../config/websiteSelectors";

const config =  require("../config/config.json");

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(config.filterUrl, {waitUntil: 'domcontentloaded'});
    await page.click(websiteSelectors.closeCookie);

    const firstDate = new Date();
    let hour = 19;
    let minutes = 10;

    const setNewPointInTime = (newHour: number, newMinutes: number) => {
        hour = newHour;
        minutes = newMinutes;
    };

    const getDifferenceBetweenTimeOfAdvertisementAndTimeOfLastChecking = async (advertisement: ElementHandle) => {
        const innerHTMLOfTimeElement = await advertisement.$eval(websiteSelectors.advertisementTimePublication, (element) => {
            return element.innerHTML;
        });
        const partsOfTime = innerHTMLOfTimeElement.split(':');
        const hourOfAdvertisement = Number(partsOfTime[0].slice(-2));
        const minutesOfAdvertisement = Number(partsOfTime[1].slice(0, 2));
        return (hourOfAdvertisement === 0 ? 24 : hourOfAdvertisement) * 60 + minutesOfAdvertisement - hour * 60 - minutes;
    };

    const examineAdvertisements = async () => {
        const timeOfCheck = new Date();
        const otherAdvertisementsTable = (await page.$$(websiteSelectors.tableOffers));

        const advertisements: ElementHandle[] = await otherAdvertisementsTable[1].$$(websiteSelectors.advertisements);
        const filteredAdvertisements = await filterAsync(advertisements, async (advertisement) => {
            const difference = await getDifferenceBetweenTimeOfAdvertisementAndTimeOfLastChecking(advertisement);
            return difference >= 0;
        });
        filteredAdvertisements.map(async (advertisement) => {
            const advertisementHref = await advertisement.$eval(websiteSelectors.advertisementLink, (linkElement) => {
                return linkElement.getAttribute('href');
            });
            const advertisementTitle = await advertisement.$eval(websiteSelectors.advertisementTitle, (titleElement) => {
                return titleElement.innerHTML;
            });
            console.log('Open advertisement: ' + advertisementTitle + '\nWith address: ' + advertisementHref + '\n\n');

            const page = await browser.newPage();
            await page.setViewport({width: 1280, height: 1080});
            await delay(10000);
            await page.goto(advertisementHref!);

            let advertisementDescription;
            if (advertisementHref!.startsWith('https://www.otodom.pl'))
                advertisementDescription = await page.$(websiteSelectors.otoDom.advertisementDescription);
            else
                advertisementDescription = await page.$(websiteSelectors.olx.advertisementDescription);
            const innerHTMLOfTimeElement = await page!.evaluate((element) => element.innerHTML, advertisementDescription);
            const foundPosition = findLocationOfFlatInDescription(advertisementTitle + ', ' + innerHTMLOfTimeElement);

            let emailDescription = '';
            let timeInfo = '';
            if (foundPosition === 1)
                timeInfo = '[DOBRA POZYCJA] ';
            else if (foundPosition !== -1) {
                const informationAboutTransport: TransportInformation | undefined = await checkTransportTime(foundPosition);
                if (informationAboutTransport)
                    if (informationAboutTransport.timeInSeconds < 2761) {// less than 45 min.
                        timeInfo = '[' + informationAboutTransport.textTime + '] ';
                        debugger;
                        emailDescription = ' Location: ' + foundPosition + '\n'
                            + informationAboutTransport.transportSteps.map((step) => step.html_instructions);
                    } else
                        return;
            }

            const screenshotPath = '../screenshots/' + (Math.floor(Math.random() * 999999) + 1).toString() + '.png';
            await page.screenshot({ path: screenshotPath, fullPage: true});
            console.log('Screenshot has been taken - file: ' + screenshotPath + ' from: ' + advertisementHref);

            sendEmail(screenshotPath, advertisementHref!, timeInfo + advertisementTitle, emailDescription);

            await page.close();
        });

        setNewPointInTime(timeOfCheck.getHours(), timeOfCheck.getMinutes());
    };

    await examineAdvertisements();
    setInterval(examineAdvertisements, config.checkInterval);

    // await browser.close();
})();

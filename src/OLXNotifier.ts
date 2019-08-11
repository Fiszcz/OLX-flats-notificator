import { Browser, ElementHandle, Page } from 'puppeteer';
import delay from "delay";
import { sendEmail } from "./email/emailService";
import { findLocationOfFlatInDescription } from "./positionChecker/positionFinder";
import { checkTransportTime, TransportInformation } from "./positionChecker/transportConnection";
import { websiteSelectors } from "../config/websiteSelectors";
import { Advertisement } from "./advertisement/Advertisement";
import { Iteration } from "./iteration/Iteration";
import {filterUrl} from "../config/config.json";

export class OLXNotifier {

    private readonly browser: Browser;
    private advertisementsPage: Page;
    private iterations: Iteration;

    constructor(browser: Browser, advertisementsPage: Page, iteration: Iteration) {
        this.browser = browser;
        this.advertisementsPage = advertisementsPage;
        this.iterations = iteration;
    }
    
    static build = async (browser: Browser) => {
        const advertisementsPage = await browser.newPage();
        await advertisementsPage.goto(filterUrl, {waitUntil: 'domcontentloaded'});

        const advertisementsTable = await advertisementsPage.$$(websiteSelectors.tableOffers);
        const theLatestAdvertisement: ElementHandle = (await advertisementsTable[1].$$(websiteSelectors.advertisements))[0];
        const advertisement = await Advertisement.build(theLatestAdvertisement);
        if (advertisement) {
            // TODO: fix representation of time
            advertisement.time.minutes++;
            const previousIterationTime = new Iteration(advertisement.time);
            return new OLXNotifier(browser, advertisementsPage, previousIterationTime);
        }
        return undefined;
    };

    public examineAdvertisements = async () => {
        const theLatestAdvertisements: Advertisement[] = await this.getTheLatestAdvertisements();
        for (const advertisement of theLatestAdvertisements) {
            this.examineAdvertisement(advertisement);

            // artificial retarder to avoid detection by the OLX service
            await delay(1000);
        }
    };

    private getTheLatestAdvertisements = async (): Promise<Advertisement[]> => {
        this.iterations.startNewIteration();

        await this.advertisementsPage.goto(filterUrl, {waitUntil: 'domcontentloaded'});
        await this.advertisementsPage.click(websiteSelectors.closeCookie);

        const otherAdvertisementsTable = await this.advertisementsPage.$$(websiteSelectors.tableOffers);
        const advertisementElements: ElementHandle[] = await otherAdvertisementsTable[1].$$(websiteSelectors.advertisements);
        const advertisements = advertisementElements.map(async (advertisementElement) => {
            const advertisement = await Advertisement.build(advertisementElement);
            return advertisement;
        });
        const theLatestAdvertisements = await Promise.all(advertisements).then((advertisements) => {
             return advertisements.filter((advertisement) => advertisement && this.iterations.isNewerThanPreviousIteration(advertisement.time, advertisement.title));
        }) as Advertisement[];

        return theLatestAdvertisements;
    };

    private examineAdvertisement = async (advertisement: Advertisement) => {
        console.log('Open advertisement: ' + advertisement.title + '\nWith address: ' + advertisement.href + '\n\n');

        await advertisement.openAdvertisement(this.browser);

        const foundPosition = findLocationOfFlatInDescription(advertisement.title + ', ' + advertisement.description);
        let emailDescription = '';
        let transportTimeInfo = '';
        if (foundPosition === 1)
            transportTimeInfo = '[DOBRA POZYCJA] ';
        else if (foundPosition !== -1) {
            const informationAboutTransport: TransportInformation | undefined = await checkTransportTime(foundPosition);
            if (informationAboutTransport)
                if (informationAboutTransport.timeInSeconds < 2761) { // TODO: move to config as property to set, less than 45 min.
                    transportTimeInfo = '[' + informationAboutTransport.textTime + '] ';
                    emailDescription = ' Location: ' + foundPosition + '\n' + informationAboutTransport.transportSteps.map((step) => step.html_instructions);
                } else
                    return;
        }
        // TODO: should we send advertisement, which has not found localization ?

        const screenshotPath = await advertisement.takeScreenshot();

        sendEmail(screenshotPath || '', advertisement.href, transportTimeInfo + advertisement.title, emailDescription);

        await advertisement.closeAdvertisement();
    };

}

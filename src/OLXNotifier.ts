import { Browser, Page } from 'puppeteer';
import delay from "delay";
import { EmailService } from "./email/emailService";
import { findLocationOfFlatInDescription, Location } from "./positionChecker/positionFinder";
import { checkTransportTime, TransportInformation } from "./positionChecker/transportConnection";
import { websiteSelectors } from "../config/websiteSelectors";
import { Advertisement } from "./advertisement/Advertisement";
import { Iteration } from "./iteration/Iteration";

const appConfig =  require("../config/config.json");

export class OLXNotifier {

    private readonly browser: Browser;
    private readonly emailService: EmailService;
    private readonly filterUrl: string;
    private advertisementsPage: Page;
    private iterations: Iteration;

    constructor(emailService: EmailService, browser: Browser, advertisementsPage: Page, iteration: Iteration, filterUrl: string) {
        this.emailService = emailService;
        this.browser = browser;
        this.advertisementsPage = advertisementsPage;
        this.iterations = iteration;
        this.filterUrl = filterUrl;
    }
    
    static build = async (browser: Browser, filterUrl: string) => {
        const emailService = await EmailService.build(appConfig);

        const advertisementsPage = await browser.newPage();
        await advertisementsPage.goto(filterUrl, {waitUntil: 'domcontentloaded'});

        const advertisementsTable = await advertisementsPage.$(websiteSelectors.tableOffers);
        if (advertisementsTable) {
            const advertisement = await Advertisement.build(advertisementsTable);
            if (advertisement) {
                // TODO: fix representation of time
                advertisement.time.minutes++;
                const previousIterationTime = new Iteration(advertisement.time);
                return new OLXNotifier(emailService, browser, advertisementsPage, previousIterationTime, filterUrl);
            }
        }
        return undefined;
    };

    public examineAdvertisements = async () => {
        const theLatestAdvertisements: Advertisement[] = await this.getTheLatestAdvertisements();
        for (const advertisement of theLatestAdvertisements) {
            await this.examineAdvertisement(advertisement);

            // artificial retarder to avoid detection by the OLX service
            await delay(1000);
        }
        this.emailService.sendEmails();
    };

    private getTheLatestAdvertisements = async (): Promise<Advertisement[]> => {
        this.iterations.startNewIteration();

        await this.advertisementsPage.goto(this.filterUrl, {waitUntil: 'domcontentloaded'});
        await this.advertisementsPage.click(websiteSelectors.closeCookie);

        const advertisementsTable = await this.advertisementsPage.$$(websiteSelectors.tableOffers);
        const advertisements = advertisementsTable.map((advertisementElement) => {
            return Advertisement.build(advertisementElement);
        });

        return await Promise.all(advertisements).then((advertisements) => {
            return advertisements.filter((advertisement) => advertisement && this.iterations.isNewerThanPreviousIteration(advertisement.time, advertisement.title));
        }) as Advertisement[];
    };

    private examineAdvertisement = async (advertisement: Advertisement) => {
        console.log('Open advertisement: ' + advertisement.title + '\nWith address: ' + advertisement.href + '\n\n');

        await advertisement.openAdvertisement(this.browser);

        const foundLocation = findLocationOfFlatInDescription(advertisement.title + ', ' + advertisement.description);
        let emailDescription = '';
        let transportTimeInfo = '';
        if (foundLocation === Location.PERFECT_LOCATION)
            transportTimeInfo = '[GOOD LOCATION] ';
        else if (foundLocation !== Location.NOT_FOUND) {
            const informationAboutTransport: TransportInformation | undefined = await checkTransportTime(foundLocation);
            if (informationAboutTransport) {
                if (informationAboutTransport.timeInSeconds < appConfig.maxTransportTime * 60) {
                    transportTimeInfo = '[' + informationAboutTransport.textTime + '] ';
                    emailDescription = ' Location: ' + foundLocation + '\n' + informationAboutTransport.transportSteps.map((step) => step.html_instructions);
                } else
                    return;
            }
        }
        // TODO: should we send advertisement, which has not found localization ?

        const screenshotPath = await advertisement.takeScreenshot();

        this.emailService.prepareEmail(screenshotPath || '', advertisement.href, transportTimeInfo + advertisement.title, emailDescription);

        await advertisement.closeAdvertisement();
    };

}

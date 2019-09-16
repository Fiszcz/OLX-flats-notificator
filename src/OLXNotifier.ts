import { Browser, Page } from 'puppeteer';
import delay from 'delay';
import { EmailService } from './email/emailService';
import { websiteSelectors } from '../config/websiteSelectors';
import { Advertisement } from './advertisement/Advertisement';

export interface Config {
    emailService: string;
    emailAddress: string;
    emailPassword?: string;
    emailsReceiver: string;
    composeIteration?: boolean;
    maxTransportTime: number;
    sendWorseAdvertisements?: boolean;
    checkInterval: number;
}

export class OLXNotifier {
    private readonly browser: Browser;
    private readonly emailService: EmailService;
    private readonly filterUrl: string;
    private readonly maxTransportTime: number;
    private readonly emailServiceForWorseAdvertisements?: EmailService;
    private advertisementsPage: Page;

    private checkedAdvertisements: Set<string> = new Set();

    constructor(
        emailService: EmailService,
        browser: Browser,
        advertisementsPage: Page,
        filterUrl: string,
        maxTransportTime: number,
        emailServiceForWorseAdvertisements?: EmailService,
    ) {
        this.emailService = emailService;
        this.browser = browser;
        this.advertisementsPage = advertisementsPage;
        this.filterUrl = filterUrl;
        this.maxTransportTime = maxTransportTime;
        this.emailServiceForWorseAdvertisements = emailServiceForWorseAdvertisements;
    }

    static build = async (browser: Browser, filterUrl: string, appConfig: Config) => {
        const emailService = new EmailService(appConfig);
        const emailServiceForWorseAdvertisements = appConfig.sendWorseAdvertisements ? new EmailService(appConfig) : undefined;

        const advertisementsPage = await browser.newPage();
        await advertisementsPage.goto(filterUrl, { waitUntil: 'domcontentloaded' });

        const advertisementsTable = await advertisementsPage.$(websiteSelectors.tableOffers);
        if (advertisementsTable) {
            const advertisement = await Advertisement.build(advertisementsTable);
            if (advertisement) {
                // TODO: fix representation of time
                advertisement.time.minutes++;
                return new OLXNotifier(
                    emailService,
                    browser,
                    advertisementsPage,
                    filterUrl,
                    appConfig.maxTransportTime,
                    emailServiceForWorseAdvertisements,
                );
            }
        }
        return undefined;
    };

    public examineAdvertisements = async () => {
        const theLatestAdvertisements: Advertisement[] = await this.getTheLatestAdvertisements();
        for (const advertisement of theLatestAdvertisements) {
            await this.examineAdvertisement(advertisement);
            await advertisement.closeAdvertisement();

            // artificial retarder to avoid detection by the OLX service
            await delay(1000);
        }
        this.emailService.sendEmails();
        if (this.emailServiceForWorseAdvertisements) this.emailServiceForWorseAdvertisements.sendEmails('[WORSE]');
    };

    private getTheLatestAdvertisements = async (): Promise<Advertisement[]> => {
        await this.advertisementsPage.goto(this.filterUrl, { waitUntil: 'domcontentloaded' });
        await this.advertisementsPage.click(websiteSelectors.closeCookie);

        const advertisementsTable = await this.advertisementsPage.$$(websiteSelectors.tableOffers);
        const advertisements = advertisementsTable.map(advertisementElement => {
            return Advertisement.build(advertisementElement);
        });

        return (await Promise.all(advertisements).then(advertisements => {
            const newAdvertisements = advertisements.filter(
                advertisement => advertisement && this.checkedAdvertisements.has(advertisement.href) === false,
            );
            newAdvertisements.forEach(advertisement => this.checkedAdvertisements.add(advertisement!.href));
            return newAdvertisements;
        })) as Advertisement[];
    };

    // TODO: should we send advertisement, which has not found location ?
    private examineAdvertisement = async (advertisement: Advertisement) => {
        console.log('Open advertisement: ' + advertisement.title + '\nWith address: ' + advertisement.href + '\n\n');

        await advertisement.openAdvertisement(this.browser);

        let emailDescription = '';
        let transportTimeInfo = '';
        let isWorseAdvertisement = false;
        if (advertisement.isPerfectLocated) transportTimeInfo = '[PERFECT LOCATION] ';
        if (advertisement.location !== undefined) {
            emailDescription = ' Location: ' + advertisement.location;
            if (advertisement.transportInformation !== undefined) {
                if (advertisement.transportInformation.timeInSeconds > this.maxTransportTime * 60) {
                    if (this.emailServiceForWorseAdvertisements) isWorseAdvertisement = true;
                    else return;
                }
                transportTimeInfo += '[' + advertisement.transportInformation.textTime + '] ';
                emailDescription +=
                    'Transport Information' + advertisement.transportInformation.transportSteps.map(step => step.html_instructions);
            }
        }

        const screenshotPath = (await advertisement.takeScreenshot()) || '';
        (isWorseAdvertisement ? this.emailServiceForWorseAdvertisements! : this.emailService).prepareEmail(
            screenshotPath,
            advertisement.href,
            transportTimeInfo + advertisement.title,
            emailDescription,
        );
    };
}

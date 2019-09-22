import { Browser, Page } from 'puppeteer';
import delay from 'delay';
import { EmailService } from './EmailService/EmailService';
import { websiteSelectors } from '../config/websiteSelectors';
import { Advertisement } from './Advertisement/Advertisement';
import { EmailMessage } from './EmailMessage/EmailMessage';
import { composeEmailMessages } from './EmailMessage/composeEmailMessages';

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
    private readonly isWorseAdvertisementsAcceptable: boolean;
    private readonly shouldComposeIteration: boolean;
    private advertisementsPage: Page;

    private checkedAdvertisements: Set<string> = new Set();
    private emailMessages: EmailMessage[] = [];
    private emailMessagesForWorseAdvertisements: EmailMessage[] = [];

    constructor(
        emailService: EmailService,
        browser: Browser,
        advertisementsPage: Page,
        filterUrl: string,
        isWorseAdvertisementsAcceptable?: boolean,
        shouldComposeIteration?: boolean,
    ) {
        this.emailService = emailService;
        this.browser = browser;
        this.advertisementsPage = advertisementsPage;
        this.filterUrl = filterUrl;
        this.isWorseAdvertisementsAcceptable = isWorseAdvertisementsAcceptable || false;
        this.shouldComposeIteration = shouldComposeIteration || false;
    }

    static build = async (browser: Browser, filterUrl: string, appConfig: Config) => {
        const emailService = new EmailService(appConfig);

        const advertisementsPage = await browser.newPage();
        await advertisementsPage.goto(filterUrl, { waitUntil: 'domcontentloaded' });

        const advertisementsTable = await advertisementsPage.$(websiteSelectors.tableOffers);
        if (advertisementsTable) {
            const advertisement = await Advertisement.build(advertisementsTable);
            if (advertisement) {
                return new OLXNotifier(
                    emailService,
                    browser,
                    advertisementsPage,
                    filterUrl,
                    appConfig.sendWorseAdvertisements,
                    appConfig.composeIteration,
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

        this.sendEmails();
        this.emailMessages = [];
        this.emailMessagesForWorseAdvertisements = [];
    };

    private sendEmails = () => {
        if (this.isWorseAdvertisementsAcceptable && this.emailMessagesForWorseAdvertisements.length) {
            const title = `💩 Worse advertisements - (${this.emailMessagesForWorseAdvertisements.length} ads)`;
            this.emailService.sendEmails([composeEmailMessages([...this.emailMessagesForWorseAdvertisements], title)]);
        }

        if (this.emailMessages.length) {
            if (this.shouldComposeIteration) {
                const title = `😃 Good advertisements - (${this.emailMessages.length} ads)`;
                this.emailService.sendEmails([composeEmailMessages([...this.emailMessages], title)]);
            } else {
                this.emailService.sendEmails([...this.emailMessages]);
            }
        }
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

        if (advertisement.isWorse && this.isWorseAdvertisementsAcceptable === false) return;

        await advertisement.takeScreenshot();

        if (advertisement.isWorse) this.emailMessagesForWorseAdvertisements.push(new EmailMessage(advertisement));
        else this.emailMessages.push(new EmailMessage(advertisement));
    };
}

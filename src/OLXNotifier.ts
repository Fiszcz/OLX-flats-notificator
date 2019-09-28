import { Browser, Page } from 'puppeteer';
import delay from 'delay';
import { EmailService } from './EmailService/EmailService';
import { websiteSelectors } from '../config/websiteSelectors';
import { Advertisement } from './Advertisement/Advertisement';
import { EmailMessage } from './EmailMessage/EmailMessage';
import { composeEmailMessages } from './EmailMessage/composeEmailMessages';
import { getAttributeValue } from './utils/puppeteer';
import AsyncLock from 'async-lock';

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
    private readonly browserPage: Page;

    private readonly operationsLock: AsyncLock;

    private checkedAdvertisements: Set<string> = new Set();
    private emailMessages: EmailMessage[] = [];
    private emailMessagesForWorseAdvertisements: EmailMessage[] = [];

    constructor(browser: Browser, browserPage: Page, filterUrl: string, appConfig: Config) {
        this.emailService = new EmailService(appConfig);
        this.browser = browser;
        this.browserPage = browserPage;
        this.filterUrl = filterUrl;
        this.isWorseAdvertisementsAcceptable = appConfig.sendWorseAdvertisements || false;
        this.shouldComposeIteration = appConfig.composeIteration || false;

        this.operationsLock = new AsyncLock();

        this.operationsLock.acquire('getting new advertisements', async () => {
            const advertisements = await this.getAdvertisementsFromPage(filterUrl);
            advertisements.forEach(advertisement => advertisement && this.checkedAdvertisements.add(advertisement.href));
        });
    }

    public examineAdvertisements = async () => {
        await this.operationsLock.acquire('getting new advertisements', async () => {
            for (const advertisement of await this.getNewAdvertisements()) {
                this.checkedAdvertisements.add(advertisement.href);

                await this.examineAdvertisement(advertisement);
                await advertisement.closeAdvertisement();

                // artificial retarder to avoid detection by the OLX service
                await delay(1000);
            }

            this.sendEmails();
            this.emailMessages = [];
            this.emailMessagesForWorseAdvertisements = [];
        });
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

    private getAdvertisementsFromPage = async (pageAddress: string) => {
        await this.browserPage.goto(pageAddress, { waitUntil: 'domcontentloaded' });

        const advertisementsTable = await this.browserPage.$$(websiteSelectors.advertisements);

        return Promise.all(
            advertisementsTable.map(advertisementElement => {
                return Advertisement.build(advertisementElement);
            }),
        );
    };

    private getNewAdvertisements = async (): Promise<Advertisement[]> => {
        let pageAddress: string | undefined | null = this.filterUrl;
        const newAdvertisements = [];
        while (pageAddress) {
            const advertisements = await this.getAdvertisementsFromPage(pageAddress);
            const newAdvertisementsFromCurrentPage = advertisements.filter(
                advertisement => advertisement && this.checkedAdvertisements.has(advertisement.href) === false,
            ) as Advertisement[];
            newAdvertisements.push(...newAdvertisementsFromCurrentPage);

            if (newAdvertisementsFromCurrentPage.length !== advertisements.length) break;
            pageAddress = await getAttributeValue(this.browserPage, websiteSelectors.nextPage, 'href');
            if (!pageAddress) console.warn('Cannot find link to the next page of advertisements');
        }

        return newAdvertisements;
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

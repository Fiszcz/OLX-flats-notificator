import { Browser, ElementHandle, Page } from 'puppeteer';
import { websiteSelectors } from '../../config/websiteSelectors';
import { getAttributeValue, getTextContent, openPageOnURL } from '../utils/puppeteer';
import { findLocationOfFlatInDescription, isPerfectLocation } from '../LocationFinder/LocationFinder';
import { checkTransportTime, TransportInformation } from '../TransportConnection/TransportConnection';

export class Advertisement {
    public time: string;
    public href: string;
    public title: string = '';
    public description?: string;
    public location?: string;
    public isPerfectLocated: boolean = false;
    public transportInformation?: TransportInformation[];
    public screenshotPath?: string;
    public isWorse?: boolean;

    private advertisementPage?: Page;

    constructor(href: string, time: string, title: string) {
        this.href = href;
        this.time = time;
        this.title = title;
    }

    static build = async (advertisementElement: ElementHandle) => {
        const advertisementHref = await getAttributeValue(advertisementElement, websiteSelectors.advertisementLink, 'href');
        if (!advertisementHref) {
            console.error('Cannot find advertisement href!');
            return undefined;
        }

        const innerHTMLOfTimeElement = await getTextContent(advertisementElement, websiteSelectors.advertisementTimePublication);
        if (!innerHTMLOfTimeElement) {
            console.error('Cannot find time of advertisement!');
            return undefined;
        }
        const timePart = innerHTMLOfTimeElement.split(' ')[1];

        const title = await getTextContent(advertisementElement, websiteSelectors.advertisementTitle);

        return new Advertisement(advertisementHref, timePart, title!);
    };

    public openAdvertisement = async (browser: Browser) => {
        this.advertisementPage = await openPageOnURL(browser, this.href);

        if (this.href.startsWith('https://www.otodom.pl')) await this.getDataFromOtodomAdvertisement();
        else await this.getDataFromOLXAdvertisement();

        this.isPerfectLocated = isPerfectLocation(`${this.title}, ${this.description}`);
        if (this.location) {
            this.transportInformation = await checkTransportTime(this.location);
            this.isWorse = this.transportInformation.some(transportInformation => transportInformation.hasSatisfiedTime === false);
        }

        if (this.description === undefined)
            console.warn('Cannot find description of open advertisement: ' + this.title + '\nWith address: ' + this.href + '\n');
        if (this.location === undefined)
            console.warn('Cannot find location of flat in open advertisement: ' + this.title + '\nWith address: ' + this.href + '\n');
        if (this.location && this.transportInformation && this.transportInformation.length === 0)
            console.warn('Cannot calculate of transport connection for location: ' + this.location);
    };

    private getDataFromOLXAdvertisement = async () => {
        this.description = (await getTextContent(this.advertisementPage!, websiteSelectors.olx.advertisementDescription)) || undefined;
        const basicLocationOfFlat = await getTextContent(this.advertisementPage!, websiteSelectors.olx.basicLocationOfFlat);
        const locationOfFlat = findLocationOfFlatInDescription(this.title + ', ' + this.description);
        this.location = basicLocationOfFlat || '' + locationOfFlat || '' || undefined;
    };

    private getDataFromOtodomAdvertisement = async () => {
        this.description = (await getTextContent(this.advertisementPage!, websiteSelectors.otoDom.advertisementDescription)) || undefined;
        this.location = (await getTextContent(this.advertisementPage!, websiteSelectors.otoDom.locationOfFlat)) || undefined;
    };

    public takeScreenshot = async () => {
        if (this.advertisementPage) {
            this.screenshotPath =
                '../screenshots/' +
                this.time.replace(':', '-') +
                '_' +
                this.title +
                '_' +
                (Math.floor(Math.random() * 100) + 1).toString() +
                '.png';
            await this.advertisementPage.screenshot({ path: this.screenshotPath, fullPage: true });
            console.log('Screenshot has been taken - file: ' + this.screenshotPath + ' from: ' + this.href);
            return this.screenshotPath;
        } else console.log('Cannot take screenshot');
    };

    public closeAdvertisement = async () => {
        if (this.advertisementPage) await this.advertisementPage.close();
    };
}

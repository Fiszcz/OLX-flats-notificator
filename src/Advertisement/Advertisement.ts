import { Browser, ElementHandle, Page } from 'puppeteer';
import { websiteSelectors } from '../../config/websiteSelectors';
import { click, getAttributeValue, getTextContent, openPageOnURL } from '../utils/puppeteer';
import { findLocationOfFlatInDescription, isPerfectLocation } from '../LocationFinder/LocationFinder';
import { checkTransportTime, TransportInformation } from '../TransportConnection/TransportConnection';

export class Advertisement {
    public time: string;
    public href: string;
    public title: string = '';
    public description?: string;
    public isPerfectLocated: boolean = false;
    public transportInformation?: TransportInformation[];
    public screenshotPath?: string;
    public isWorse?: boolean;

    private advertisementPage?: Page;
    private readonly maxRentCosts?: number;
    private readonly maxPriceWithRent?: number;

    private _rentCosts?: number;
    public get rentCosts() {
        return this._rentCosts;
    }

    private _price?: number;
    public get price() {
        return this._price;
    }

    private _location?: string;
    public get location() {
        return this._location;
    }

    constructor(href: string, time: string, title: string, maxRent?: number, maxPriceWithRent?: number) {
        this.href = href;
        this.time = time;
        this.title = title;
        this.maxRentCosts = maxRent;
        this.maxPriceWithRent = maxPriceWithRent;
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

        let selectors;
        if (this.href.startsWith('https://www.otodom.pl')) {
            await this.getLocationFromOtodomAdvertisement();
            selectors = websiteSelectors.otoDom;
        } else {
            await this.getLocationFromOLXAdvertisement();
            selectors = websiteSelectors.olx;
        }
        await this.getDataFromAdvertisement(selectors);
        await click(this.advertisementPage, selectors.closeCookie);

        this.isPerfectLocated = isPerfectLocation(`${this.title}, ${this.description}`);
        if (this._location) {
            this.transportInformation = await checkTransportTime(this._location);
        }
        this.isWorse = this.isWorseAdvertisement();

        if (this.description === undefined)
            console.warn('Cannot find description of open advertisement: ' + this.title + '\nWith address: ' + this.href + '\n');
        if (this._location === undefined)
            console.warn('Cannot find location of flat in open advertisement: ' + this.title + '\nWith address: ' + this.href + '\n');
        if (this._location && this.transportInformation && this.transportInformation.length === 0)
            console.warn('Cannot calculate of transport connection for location: ' + this._location);
    };

    private isWorseAdvertisement = (): boolean => {
        if (
            this.transportInformation &&
            this.transportInformation.some(transportInformation => transportInformation.hasSatisfiedTime === false)
        )
            return true;
        if (this.maxRentCosts !== undefined && this.rentCosts && this.rentCosts > this.maxRentCosts) return true;
        if (this.maxPriceWithRent && this.price && this.price + (this.rentCosts || 0) > this.maxPriceWithRent) return true;
        return false;
    };

    private getDataFromAdvertisement = async (selectors: Record<'advertisementDescription' | 'rentCosts' | 'price', string>) => {
        this.description = await getTextContent(this.advertisementPage!, selectors.advertisementDescription);
        const rentCostsString = await getTextContent(this.advertisementPage!, selectors.rentCosts);
        if (rentCostsString) {
            const rentCosts = Number(rentCostsString.replace(/\D/g, ''));
            if (rentCosts === 1) this._rentCosts = 0;
            else this._rentCosts = rentCosts;
        }
        const price = await getTextContent(this.advertisementPage!, selectors.price);
        if (price) this._price = Number(price.replace(/\D/g, ''));
    };

    private getLocationFromOLXAdvertisement = async () => {
        const basicLocationOfFlat = await getTextContent(this.advertisementPage!, websiteSelectors.olx.basicLocationOfFlat);
        const locationOfFlat = findLocationOfFlatInDescription(this.title + ', ' + this.description);
        this._location = basicLocationOfFlat || '' + locationOfFlat || '' || undefined;
    };

    private getLocationFromOtodomAdvertisement = async () => {
        this._location = await getTextContent(this.advertisementPage!, websiteSelectors.otoDom.locationOfFlat);
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

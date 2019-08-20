import { Browser, ElementHandle, Page } from "puppeteer";
import { websiteSelectors } from "../../config/websiteSelectors";
import { getAttributeValue, getInnerHTML, openPageOnURL } from "../utils/puppeteer";

interface Time {
    hour: number;
    minutes: number;
}

export class Advertisement {

    public time: Time;
    public href: string;
    public title: string = '';
    public description: string = '';

    private advertisementPage?: Page;

    constructor(href: string, time: Time, title: string) {
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

        const innerHTMLOfTimeElement = await getInnerHTML(advertisementElement, websiteSelectors.advertisementTimePublication);
        if (!innerHTMLOfTimeElement) {
            console.error('Cannot find time of advertisement!');
            return undefined;
        }
        const partsOfTime = innerHTMLOfTimeElement.split(':');
        const time = {hour: Number(partsOfTime[0].slice(-2)), minutes: Number(partsOfTime[1].slice(0, 2))};

        const title = await getInnerHTML(advertisementElement, websiteSelectors.advertisementTitle);

        return new Advertisement(advertisementHref, time, title!);
    };

    public openAdvertisement = async (browser: Browser) => {
        this.advertisementPage = await openPageOnURL(browser, this.href);

        let advertisementDescription: string | undefined;
        if (this.href.startsWith('https://www.otodom.pl'))
            advertisementDescription = await getInnerHTML(this.advertisementPage, websiteSelectors.otoDom.advertisementDescription);
        else
            advertisementDescription = await getInnerHTML(this.advertisementPage, websiteSelectors.olx.advertisementDescription);

        if (advertisementDescription === undefined)
            console.log('Cannot find description of open advertisement: ' + this.title + '\nWith address: ' + this.href + '\n\n');
        else
            this.description = advertisementDescription;
    };

    public takeScreenshot = async () => {
        if (this.advertisementPage) {
            const screenshotPath = '../screenshots/' + this.time.hour + ':' + this.time.minutes + '_' + this.title + '_' + (Math.floor(Math.random() * 100) + 1).toString() + '.png';
            await this.advertisementPage.screenshot({path: screenshotPath, fullPage: true});
            console.log('Screenshot has been taken - file: ' + screenshotPath + ' from: ' + this.href);
            return screenshotPath;
        } else
            console.log('Cannot take screenshot');
    };

    public closeAdvertisement = async () => {
        if (this.advertisementPage)
            await this.advertisementPage.close();
    };

}

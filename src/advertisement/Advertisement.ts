import { Browser, ElementHandle, Page } from "puppeteer";
import { websiteSelectors } from "../../config/websiteSelectors";

interface Time {
    hour: number;
    minutes: number;
}

export class Advertisement {

    public time: Time;
    public href: string;
    public title?: string;
    public description: string = '';

    private advertisementPage?: Page;

    constructor(href: string, time: Time, title: string) {
        this.href = href;
        this.time = time;
        this.title = title;
    }

    static build = async (advertisementElement: ElementHandle) => {
        const advertisementHref = await advertisementElement.$eval(websiteSelectors.advertisementLink, (linkElement) => {
            return linkElement.getAttribute('href');
        });
        if (!advertisementHref) {
            console.error('Cannot find advertisement href!');
            return undefined;
        }

        const innerHTMLOfTimeElement = await advertisementElement.$eval(websiteSelectors.advertisementTimePublication, (element) => {
            return element.innerHTML;
        });
        const partsOfTime = innerHTMLOfTimeElement.split(':');
        const time = {hour: Number(partsOfTime[0].slice(-2)), minutes: Number(partsOfTime[1].slice(0, 2))};

        const title = await advertisementElement.$eval(websiteSelectors.advertisementTitle, (titleElement) => {
            return titleElement.innerHTML;
        });

        return new Advertisement(advertisementHref, time, title);
    };

    public openAdvertisement = async (browser: Browser) => {
        this.advertisementPage = await browser.newPage();
        await this.advertisementPage.goto(this.href);

        let advertisementDescriptionElement: ElementHandle | undefined;
        if (this.href.startsWith('https://www.otodom.pl'))
            advertisementDescriptionElement = await this.advertisementPage.$(websiteSelectors.otoDom.advertisementDescription) || undefined;
        else
            advertisementDescriptionElement = await this.advertisementPage.$(websiteSelectors.olx.advertisementDescription) || undefined;

        if (advertisementDescriptionElement === undefined)
            console.log('Cannot find description of open advertisement: ' + this.title + '\nWith address: ' + this.href + '\n\n');
        else
            this.description = await this.advertisementPage!.evaluate((element: HTMLElement) => element.innerHTML, advertisementDescriptionElement);
    };

    public takeScreenshot = async () => {
        if (this.time && this.title && this.advertisementPage) {
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

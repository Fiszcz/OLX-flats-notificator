import { Browser, ElementHandle, Page } from 'puppeteer';

export const getAttributeValue = async (rootElement: ElementHandle | Page, selector: string, attribute: string) => {
    try {
        return await rootElement.$eval(selector, element => {
            return element.getAttribute(attribute);
        });
    } catch (e) {
        return undefined;
    }
};

export const getTextContent = async (rootElement: ElementHandle | Page, selector: string) => {
    try {
        return await rootElement.$eval(selector, element => {
            return element.textContent;
        });
    } catch (e) {
        return undefined;
    }
};

export const openPageOnURL = async (browser: Browser, url: string) => {
    const newPage = await browser.newPage();
    await newPage.goto(url);
    return newPage;
};

export const click = async (page: Page, selector: string) => {
    try {
        await page.click(selector);
    } catch (e) {
        return undefined;
    }
};

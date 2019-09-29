import { Browser, ElementHandle, Page } from 'puppeteer';

const getElementForSelector = async (element: ElementHandle | Page, selector: string) => {
    let elementForSelector: ElementHandle | null;
    if (selector.startsWith('//')) elementForSelector = (await element.$x(selector))[0];
    else elementForSelector = await element.$(selector);

    if (elementForSelector) return elementForSelector;
    else throw new Error();
};

export const getAttributeValue = async (rootElement: ElementHandle | Page, selector: string, attribute: string) => {
    try {
        const elementForSelector = await getElementForSelector(rootElement, selector);
        return (
            (await elementForSelector.$eval('*', element => {
                return element.getAttribute(attribute);
            })) || undefined
        );
    } catch (e) {
        return undefined;
    }
};

export const getTextContent = async (rootElement: ElementHandle | Page, selector: string) => {
    try {
        const elementForSelector = await getElementForSelector(rootElement, selector);
        return (
            (await elementForSelector.$eval('*', element => {
                return element.textContent;
            })) || undefined
        );
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
        const elementForSelector = await getElementForSelector(page, selector);
        await elementForSelector.click();
    } catch (e) {
        return undefined;
    }
};

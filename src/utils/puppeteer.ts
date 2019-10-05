import { Browser, ElementHandle, Page } from 'puppeteer';

const getElementForSelector = async (element: ElementHandle | Page, selector: string) => {
    let elementForSelector: ElementHandle | null;
    if (selector.startsWith('//')) elementForSelector = (await element.$x(selector))[0];
    else elementForSelector = await element.$(selector);

    return elementForSelector || undefined;
};

export const getElements = async (rootElement: ElementHandle | Page, selector: string) => {
    let elementsForSelector: ElementHandle[] | null;
    if (selector.startsWith('//')) elementsForSelector = await rootElement.$x(selector);
    else elementsForSelector = await rootElement.$$(selector);

    return elementsForSelector;
};

export const getAttributeValue = async (rootElement: ElementHandle | Page, selector: string, attribute: string) => {
    const elementForSelector = await getElementForSelector(rootElement, selector);
    try {
        if (elementForSelector)
            return (
                (await elementForSelector.$eval('*', element => {
                    return element.getAttribute(attribute);
                })) || undefined
            );
    } catch {
        return undefined;
    }
};

export const getTextContent = async (rootElement: ElementHandle | Page, selector: string) => {
    const elementForSelector = await getElementForSelector(rootElement, selector);
    try {
        if (elementForSelector)
            return (
                (await elementForSelector.$eval('*', element => {
                    return element.textContent;
                })) || undefined
            );
    } catch {
        return undefined;
    }
};

export const openPageOnURL = async (browser: Browser, url: string) => {
    const newPage = await browser.newPage();
    await newPage.goto(url);
    return newPage;
};

export const click = async (page: Page, selector: string) => {
    const elementForSelector = await getElementForSelector(page, selector);
    try {
        if (elementForSelector) await elementForSelector.click();
    } catch {
        return;
    }
};

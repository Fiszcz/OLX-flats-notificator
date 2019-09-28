import { click, getAttributeValue, getTextContent } from '../../src/utils/puppeteer';
import { ElementHandle, Page } from 'puppeteer';

describe('puppeteer utils', () => {
    test('getTextContent return undefined if there cannot get text content for specific selector', async () => {
        const element = {
            $eval: jest.fn().mockImplementation(() => {
                throw new Error();
            }),
        } as Record<keyof ElementHandle, any>;

        expect(await getTextContent(element, 'some selector')).toBeUndefined();
    });

    test('getAttributeValue return undefined if there cannot find element for specific selector', async () => {
        const element = {
            $eval: jest.fn().mockImplementation(() => {
                throw new Error();
            }),
        } as Record<keyof ElementHandle, any>;

        expect(await getAttributeValue(element, 'some attribute', 'some attribute')).toBeUndefined();
    });

    test('click util function return undefined if there cannot click on element for specific selector', async () => {
        const page = {
            click: jest.fn().mockImplementation(() => {
                throw new Error();
            }),
        } as Record<keyof Page, any>;

        expect(await click(page, 'some selector')).toBeUndefined();
    });
});

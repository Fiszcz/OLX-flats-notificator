import { click, getAttributeValue, getElements, getTextContent } from '../../src/utils/puppeteer';
import { ElementHandle, Page } from 'puppeteer';

describe('puppeteer utils', () => {
    describe('getTextContent', () => {
        test('get text content of element for specific XPath selector', async () => {
            const element = {
                $x: () => [{ $eval: () => 'text content' }, {}],
            } as Record<keyof ElementHandle, any>;

            expect(await getTextContent(element, '//XPath')).toBe('text content');
        });

        test('get text content of element for specific selector', async () => {
            const element = {
                $: () => ({ $eval: () => 'text content' }),
            } as Record<keyof ElementHandle, any>;

            expect(await getTextContent(element, 'selector')).toBe('text content');
        });

        test('return undefined if there cannot get text content for specific selector', async () => {
            const element = {
                $: () => ({
                    $eval: jest.fn().mockImplementation(() => {
                        throw new Error();
                    }),
                }),
            } as Record<keyof ElementHandle, any>;

            expect(await getTextContent(element, 'some selector')).toBeUndefined();
        });
    });

    describe('getAttributeValue', () => {
        test('get attribute value of element for specific XPath selector', async () => {
            const element = {
                $x: () => [{ $eval: () => 'attribute value' }, {}],
            } as Record<keyof ElementHandle, any>;

            expect(await getAttributeValue(element, '//XPath', 'attribute')).toBe('attribute value');
        });

        test('get attribute value of element for specific selector', async () => {
            const element = {
                $: () => ({ $eval: () => 'attribute value' }),
            } as Record<keyof ElementHandle, any>;

            expect(await getAttributeValue(element, 'selector', 'attribute')).toBe('attribute value');
        });

        test('return undefined if there cannot find element for specific selector', async () => {
            const element = {
                $: () => ({
                    $eval: jest.fn().mockImplementation(() => {
                        throw new Error();
                    }),
                }),
            } as Record<keyof ElementHandle, any>;

            expect(await getAttributeValue(element, 'selector', 'some attribute')).toBeUndefined();
        });
    });

    test('click util function return undefined if there cannot click on element for specific selector', async () => {
        const page = {
            $: () => ({
                click: jest.fn().mockImplementation(() => {
                    throw new Error();
                }),
            }),
        } as Record<keyof Page, any>;

        expect(await click(page, 'some selector')).toBeUndefined();
    });

    describe('getElements', () => {
        test('getElements should search elements by XPath if selector string is XPath and starts with "//"', async () => {
            const page = {
                $x: jest.fn(),
            } as Record<keyof Page, any>;

            await getElements(page, '//XPath');

            expect(page.$x).toHaveBeenCalled();
        });

        test('getElements should search elements by querySelector for non-XPath selector', async () => {
            const page = {
                $$: jest.fn(),
            } as Record<keyof Page, any>;

            await getElements(page, 'selector');

            expect(page.$$).toHaveBeenCalled();
        });
    });
});

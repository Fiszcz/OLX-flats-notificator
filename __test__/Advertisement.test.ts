import { Advertisement } from '../src/advertisement/Advertisement';
import { mocked } from 'ts-jest/utils';
import { getAttributeValue, getInnerHTML, openPageOnURL } from '../src/utils/puppeteer';
import { Browser, ElementHandle, Page } from 'puppeteer';
import { websiteSelectors } from '../config/websiteSelectors';

jest.mock('../src/utils/puppeteer');
jest.mock('../config/websiteSelectors');

describe('Advertisement', () => {
    describe('build', () => {
        test('should return undefined if do not find href address to advertisement', async () => {
            mocked(getAttributeValue).mockResolvedValue(undefined);
            expect(await Advertisement.build({} as ElementHandle)).toBeUndefined();
        });

        test('should return undefined if do not find time of advertisement', async () => {
            mocked(getInnerHTML).mockResolvedValue(undefined);
            expect(await Advertisement.build({} as ElementHandle)).toBeUndefined();
        });

        test('should return Advertisement with title, time and href with url address', async () => {
            mocked(getAttributeValue).mockResolvedValue('http://olx.com/advertisement/1000');
            mocked(getInnerHTML)
                .mockResolvedValueOnce('yesterday 10:50')
                .mockResolvedValueOnce('Title of Advertisement');

            const advertisement = await Advertisement.build({} as ElementHandle);
            expect(advertisement).toMatchObject({
                title: 'Title of Advertisement',
                time: { hour: 10, minutes: 50 },
                href: 'http://olx.com/advertisement/1000',
            });
        });
    });

    describe('openAdvertisement', () => {
        test('should set description of advertisement for otodom website', async () => {
            websiteSelectors.otoDom.advertisementDescription = 'otoDom';
            websiteSelectors.olx.advertisementDescription = 'olx';
            mocked(getInnerHTML).mockImplementation((element, selector) => Promise.resolve(selector));
            mocked(openPageOnURL).mockResolvedValue({} as Page);

            const otodomAdvertisement = new Advertisement('https://www.otodom.pl', { hour: 1, minutes: 1 }, '');
            await otodomAdvertisement.openAdvertisement({} as Browser);
            expect(otodomAdvertisement.description).toBe('otoDom');

            const olxAdvertisement = new Advertisement('https://www.olx.pl', { hour: 1, minutes: 1 }, '');
            await olxAdvertisement.openAdvertisement({} as Browser);
            expect(olxAdvertisement.description).toBe('olx');
        });
    });

    describe('takeScreenshot', () => {
        test('if there is open page with advertisement should take screenshot', async () => {
            websiteSelectors.olx.advertisementDescription = 'olx';
            mocked(getInnerHTML).mockImplementation((element, selector) => Promise.resolve(selector));
            mocked(openPageOnURL).mockResolvedValue({ screenshot: () => {} } as Page);

            const otodomAdvertisement = new Advertisement('https://www.otodom.pl', { hour: 1, minutes: 2 }, 'advertisement title');
            await otodomAdvertisement.openAdvertisement({} as Browser);

            expect(await otodomAdvertisement.takeScreenshot()).toMatch(/..\/screenshots\/1:2_advertisement title_\d?\d?\d\.png/);
        });
    });
});

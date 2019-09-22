import { Advertisement } from '../../src/Advertisement/Advertisement';
import { mocked } from 'ts-jest/utils';
import { getAttributeValue, getTextContent, openPageOnURL } from '../../src/utils/puppeteer';
import { Browser, ElementHandle, Page } from 'puppeteer';
import { websiteSelectors } from '../../config/websiteSelectors';
import { checkTransportTime, TransportInformation } from '../../src/TransportConnection/TransportConnection';

jest.mock('../../src/utils/puppeteer');
jest.mock('../../config/websiteSelectors');
jest.mock('../../src/TransportConnection/TransportConnection');

describe('Advertisement', () => {
    describe('build', () => {
        test('should return undefined if do not find href address to advertisement', async () => {
            mocked(getAttributeValue).mockResolvedValue(undefined);
            expect(await Advertisement.build({} as ElementHandle)).toBeUndefined();
        });

        test('should return undefined if do not find time of advertisement', async () => {
            mocked(getTextContent).mockResolvedValue(undefined);
            expect(await Advertisement.build({} as ElementHandle)).toBeUndefined();
        });

        test('should return Advertisement with subject, time and href with url address', async () => {
            mocked(getAttributeValue).mockResolvedValue('http://olx.com/advertisement/1000');
            mocked(getTextContent)
                .mockResolvedValueOnce('wczoraj 10:50')
                .mockResolvedValueOnce('Title of Advertisement');

            const advertisement = await Advertisement.build({} as ElementHandle);
            expect(advertisement).toMatchObject({
                title: 'Title of Advertisement',
                time: '10:50',
                href: 'http://olx.com/advertisement/1000',
            });
        });
    });

    describe('openAdvertisement', () => {
        describe('should set description and flat location of advertisement for', () => {
            beforeAll(() => {
                websiteSelectors.otoDom.advertisementDescription = 'otoDom';
                websiteSelectors.otoDom.locationOfFlat = 'otoDom location';
                websiteSelectors.olx.advertisementDescription = 'olx';
                websiteSelectors.olx.basicLocationOfFlat = 'olx basic location';

                mocked(getTextContent).mockImplementation((element, selector) => Promise.resolve(selector));
                mocked(openPageOnURL).mockResolvedValue({} as Page);
                mocked(checkTransportTime).mockResolvedValue([]);
            });

            test('otodom website', async () => {
                const otodomAdvertisement = new Advertisement('https://www.otodom.pl', 'dzisiaj 01:01', '');

                await otodomAdvertisement.openAdvertisement({} as Browser);

                expect(otodomAdvertisement.description).toBe('otoDom');
                expect(otodomAdvertisement.location).toBe('otoDom location');
            });

            test('olx website', async () => {
                const olxAdvertisement = new Advertisement('https://www.olx.pl', 'dzisiaj 01:01', '');

                await olxAdvertisement.openAdvertisement({} as Browser);

                expect(olxAdvertisement.description).toBe('olx');
                expect(olxAdvertisement.location).toBe('olx basic location');
            });

            test('should mark that advertisement has worse transport time', async () => {
                const advertisement = new Advertisement('https://www.olx.pl', 'dzisiaj 01:01', '');
                advertisement.location = 'Location of flat';
                mocked(checkTransportTime).mockResolvedValue([{ hasSatisfiedTime: false }] as TransportInformation[]);

                await advertisement.openAdvertisement({} as Browser);

                expect(advertisement.isWorse).toBe(true);

                mocked(checkTransportTime).mockResolvedValue([{ hasSatisfiedTime: true }] as TransportInformation[]);

                await advertisement.openAdvertisement({} as Browser);

                expect(advertisement.isWorse).toBe(false);
            });
        });
    });

    describe('takeScreenshot', () => {
        test('if there is open page with advertisement should take screenshot', async () => {
            websiteSelectors.olx.advertisementDescription = 'olx';
            mocked(getTextContent).mockImplementation((element, selector) => Promise.resolve(selector));
            mocked(openPageOnURL).mockResolvedValue({ screenshot: () => {} } as Page);
            mocked(checkTransportTime).mockResolvedValue([]);

            const otodomAdvertisement = new Advertisement('https://www.otodom.pl', '01:02', 'Advertisement subject');
            await otodomAdvertisement.openAdvertisement({} as Browser);

            expect(await otodomAdvertisement.takeScreenshot()).toMatch(/..\/screenshots\/01-02_Advertisement subject_\d?\d?\d\.png/);
        });
    });
});

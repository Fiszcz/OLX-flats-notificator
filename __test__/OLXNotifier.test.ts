import { Config, OLXNotifier } from '../src/OLXNotifier';
import { Browser, Page } from 'puppeteer';
import { Advertisement } from '../src/Advertisement/Advertisement';
import { TransportInformation } from '../src/TransportConnection/TransportConnection';
import { mocked } from 'ts-jest/utils';
import * as puppeteerUtils from '../src/utils/puppeteer';

const mockEmailService = {
    sendEmails: jest.fn(),
};

jest.mock('../src/Advertisement/Advertisement', () => {
    return {
        Advertisement: jest.fn().mockImplementation(
            (href, time, title) =>
                ({
                    href,
                    time,
                    title,
                    isPerfectLocated: false,
                    transportInformation: [
                        {
                            timeInMinutes: 0,
                            transportSteps: [],
                            textTime: '',
                            hasSatisfiedTime: true,
                            location: '',
                        } as TransportInformation,
                    ],
                    openAdvertisement: () => {},
                    takeScreenshot: () => {},
                    closeAdvertisement: () => {},
                } as Record<keyof Advertisement, any>),
        ),
    };
});
jest.mock('../src/EmailService/EmailService', () => {
    return {
        EmailService: jest.fn().mockImplementation(() => ({
            sendEmails: mockEmailService.sendEmails,
        })),
    };
});
jest.mock('delay');

describe('OLXNotifier', () => {
    beforeAll(() => {
        Advertisement.build = jest.fn();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('examineAdvertisements', () => {
        const mockBrowserPage = {
            goto: jest.fn().mockResolvedValue({}),
            $$: jest.fn(),
            click: () => {},
        } as Record<keyof Page, any>;

        test('should make emails only for new not previously met advertisements', async () => {
            mockBrowserPage.$$.mockResolvedValueOnce([]);
            const olxNotifier = new OLXNotifier({} as Browser, mockBrowserPage, 'https://olx.pl/warsaw/', {} as Config);

            const advertisements = [
                new Advertisement('olx.pl/1', 'dzisiaj 11:30', 'First Advertisement'),
                new Advertisement('olx.pl/2', 'dzisiaj 11:30', 'Second Advertisement'),
                new Advertisement('olx.pl/3', 'dzisiaj 11:30', 'Third Advertisement'),
            ];
            // found 2 advertisements
            mockBrowserPage.$$.mockResolvedValueOnce([1, 2]);
            Advertisement.build = jest
                .fn()
                .mockResolvedValueOnce(advertisements[0])
                .mockResolvedValueOnce(advertisements[1]);

            await olxNotifier.examineAdvertisements();

            // found 2 advertisements
            mockBrowserPage.$$.mockResolvedValueOnce([1, 2]);
            Advertisement.build = jest
                .fn()
                .mockResolvedValueOnce(advertisements[0])
                .mockResolvedValueOnce(advertisements[2]);

            await olxNotifier.examineAdvertisements();

            expect(mockEmailService.sendEmails).toHaveBeenCalledTimes(2);
            expect(mockEmailService.sendEmails.mock.calls[0][0]).toHaveLength(2);
            expect(mockEmailService.sendEmails.mock.calls[1][0]).toHaveLength(1);
        }, 9999999);

        test('should not make emails for worse advertisement', async () => {
            mockBrowserPage.$$.mockResolvedValueOnce([]);
            const olxNotifier = new OLXNotifier({} as Browser, mockBrowserPage, 'https://olx.pl/warsaw/', {} as Config);
            // found 1 advertisements
            mockBrowserPage.$$.mockResolvedValueOnce([1]);
            const advertisement = new Advertisement('olx.pl/1', 'dzisiaj 11:00', 'First Advertisement');
            advertisement.isWorse = true;
            Advertisement.build = jest.fn().mockResolvedValue(advertisement);

            await olxNotifier.examineAdvertisements();

            expect(mockEmailService.sendEmails).not.toHaveBeenCalled();
        });

        test('should make email for worse advertisement if we set config option to send this type of worse advertisements', async () => {
            mockBrowserPage.$$.mockResolvedValueOnce([]);
            const olxNotifier = new OLXNotifier({} as Browser, mockBrowserPage, 'https://olx.pl/warsaw/', {
                sendWorseAdvertisements: true,
            } as Config);
            // found 2 advertisements
            mockBrowserPage.$$.mockResolvedValueOnce([1, 2]);
            const goodAdvertisement = new Advertisement('olx.pl/1', 'dzisiaj 11:00', 'Good Advertisement');
            goodAdvertisement.isWorse = false;
            const worseAdvertisement = new Advertisement('olx.pl/2', 'dzisiaj 11:00', 'Worse Advertisement');
            worseAdvertisement.isWorse = true;
            Advertisement.build = jest
                .fn()
                .mockResolvedValueOnce(goodAdvertisement)
                .mockResolvedValueOnce(worseAdvertisement);

            await olxNotifier.examineAdvertisements();

            expect(mockEmailService.sendEmails).toHaveBeenCalledTimes(2);
        }, 999999);

        test('should make composed email if we set config option for composing advertisements info to one email', async () => {
            mockBrowserPage.$$.mockResolvedValueOnce([]);
            const olxNotifier = new OLXNotifier({} as Browser, mockBrowserPage, 'http://olx.pl/warsaw/', {
                composeIteration: true,
            } as Config);
            // found 2 advertisements
            mockBrowserPage.$$.mockResolvedValueOnce([1, 2]);
            const firstAdvertisement = new Advertisement('olx.pl/1', 'dzisiaj 11:00', 'First Advertisement');
            const secondAdvertisement = new Advertisement('olx.pl/2', 'dzisiaj 11:00', 'Second Advertisement');
            Advertisement.build = jest
                .fn()
                .mockResolvedValueOnce(firstAdvertisement)
                .mockResolvedValueOnce(secondAdvertisement);

            await olxNotifier.examineAdvertisements();

            expect(mockEmailService.sendEmails.mock.calls[0][0]).toHaveLength(1);
        }, 9999999);

        test('should clear sent emails between iterations', async () => {
            mockBrowserPage.$$.mockResolvedValueOnce([]);
            const olxNotifier = new OLXNotifier({} as Browser, mockBrowserPage, 'http://olx.pl/warsaw/', {
                sendWorseAdvertisements: true,
            } as Config);
            // found 2 advertisement
            mockBrowserPage.$$.mockResolvedValueOnce([1, 2]);
            const goodAdvertisement = new Advertisement('olx.pl/1', 'dzisiaj 11:00', 'Good Advertisement');
            const worseAdvertisement = new Advertisement('olx.pl/1', 'dzisiaj 11:00', 'Worst Advertisement');
            worseAdvertisement.isWorse = true;
            Advertisement.build = jest
                .fn()
                .mockResolvedValueOnce(goodAdvertisement)
                .mockResolvedValueOnce(worseAdvertisement);

            // found 0 advertisements
            mockBrowserPage.$$.mockResolvedValueOnce([]);
            await olxNotifier.examineAdvertisements();
            expect(mockEmailService.sendEmails).toHaveBeenCalledTimes(2);
            mockEmailService.sendEmails.mockClear();

            await olxNotifier.examineAdvertisements();

            expect(mockEmailService.sendEmails).not.toHaveBeenCalled();
        }, 999999);

        describe('get advertisements from multiple pages', () => {
            const advertisements = [
                new Advertisement('olx.pl/1', 'dzisiaj 11:00', 'Advertisement'),
                new Advertisement('olx.pl/2', 'dzisiaj 11:00', 'Advertisement'),
                new Advertisement('olx.pl/3', 'dzisiaj 11:00', 'Advertisement'),
                new Advertisement('olx.pl/4', 'dzisiaj 11:00', 'Advertisement'),
                new Advertisement('olx.pl/5', 'dzisiaj 11:00', 'Advertisement'),
                new Advertisement('olx.pl/6', 'dzisiaj 11:00', 'Advertisement'),
            ];

            const spyGetHrefAttributeOfNextPage = jest.spyOn(puppeteerUtils, 'getAttributeValue');

            let olxNotifier: OLXNotifier;
            beforeEach(() => {
                mockBrowserPage.$$.mockResolvedValueOnce([1]);
                mocked(Advertisement.build).mockResolvedValueOnce(advertisements[0]);
                olxNotifier = new OLXNotifier({} as Browser, mockBrowserPage, 'http://olx.pl/warsaw/', {
                    sendWorseAdvertisements: true,
                } as Config);
            });

            test('until we met advertisements from previous iterations', async () => {
                // first page
                mockBrowserPage.$$.mockResolvedValueOnce([1, 2]);
                mocked(Advertisement.build)
                    .mockResolvedValueOnce(advertisements[5])
                    .mockResolvedValueOnce(advertisements[4]);
                // second page
                jest.spyOn(puppeteerUtils, 'getAttributeValue').mockResolvedValueOnce('http://olx.pl/warsaw/second_page');
                mockBrowserPage.$$.mockResolvedValueOnce([1, 2]);
                mocked(Advertisement.build)
                    .mockResolvedValueOnce(advertisements[3])
                    .mockResolvedValueOnce(advertisements[2]);
                // third page
                jest.spyOn(puppeteerUtils, 'getAttributeValue').mockResolvedValueOnce('http://olx.pl/warsaw/third_page');
                mockBrowserPage.$$.mockResolvedValueOnce([1, 2]);
                mocked(Advertisement.build)
                    .mockResolvedValueOnce(advertisements[1])
                    .mockResolvedValueOnce(advertisements[0]);

                await olxNotifier!.examineAdvertisements();
                expect(mockEmailService.sendEmails).toHaveBeenCalledTimes(1);
                expect(mockEmailService.sendEmails.mock.calls[0][0]).toHaveLength(5);
                expect(spyGetHrefAttributeOfNextPage).toHaveBeenCalledTimes(2);
            });

            test('until we do not get address of next page', async () => {
                // first page
                mockBrowserPage.$$.mockResolvedValueOnce([1, 2]);
                mocked(Advertisement.build)
                    .mockResolvedValueOnce(advertisements[5])
                    .mockResolvedValueOnce(advertisements[4]);

                await olxNotifier!.examineAdvertisements();
                expect(mockEmailService.sendEmails).toHaveBeenCalledTimes(1);
                expect(spyGetHrefAttributeOfNextPage).toHaveBeenCalledTimes(1);
                expect(mockBrowserPage.goto).toHaveBeenCalledTimes(2);
            });
        });
    });
});

import { Config, OLXNotifier } from '../src/OLXNotifier';
import { Browser } from 'puppeteer';
import { Advertisement } from '../src/Advertisement/Advertisement';
import { EmailService } from '../src/EmailService/EmailService';
import { TransportInformation } from '../src/TransportConnection/TransportConnection';

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

describe('OLXNotifier', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('build', () => {
        let browser: any;
        beforeAll(() => {
            browser = {
                newPage: jest.fn().mockResolvedValue({
                    goto: () => {},
                    $: jest.fn().mockReturnValue(true),
                }),
            };
        });

        test('should return instance of OLXNotifier', async () => {
            Advertisement.build = jest.fn().mockResolvedValue({});

            expect(await OLXNotifier.build(browser, '', {} as Config)).toBeInstanceOf(OLXNotifier);
        });

        test('return undefined if cannot find advertisements table', async () => {
            browser = {
                newPage: jest.fn().mockResolvedValue({
                    goto: () => {},
                    $: jest.fn().mockReturnValue(null),
                }),
            };

            expect(await OLXNotifier.build(browser, '', {} as Config)).toBeUndefined();
        });

        test('return undefined if cannot create Advertisement object', async () => {
            Advertisement.build = jest.fn().mockResolvedValue(undefined);

            expect(await OLXNotifier.build(browser, '', {} as Config)).toBeUndefined();
        });
    });

    describe('examineAdvertisements', () => {
        const mockAdvertisementsPage = {
            goto: () => {},
            $$: jest.fn(),
            click: () => {},
        };

        let olxNotifier: OLXNotifier;
        beforeEach(() => {
            olxNotifier = new OLXNotifier(new EmailService({} as Config), {} as Browser, mockAdvertisementsPage as any, '', false);
        });

        test('should make emails only for new not previously met advertisements', async () => {
            const advertisements = [
                new Advertisement('olx.pl/1', 'dzisiaj 11:30', 'First Advertisement'),
                new Advertisement('olx.pl/2', 'dzisiaj 11:30', 'Second Advertisement'),
                new Advertisement('olx.pl/3', 'dzisiaj 11:30', 'Third Advertisement'),
            ];
            advertisements.forEach(advertisement => (advertisement.isPerfectLocated = true));
            // found 3 advertisements
            mockAdvertisementsPage.$$.mockResolvedValue([1, 2]);
            Advertisement.build = jest
                .fn()
                .mockResolvedValueOnce(advertisements[0])
                .mockResolvedValueOnce(advertisements[1]);

            await olxNotifier.examineAdvertisements();

            // found 2 advertisements
            mockAdvertisementsPage.$$.mockResolvedValue([1, 2]);
            Advertisement.build = jest
                .fn()
                .mockResolvedValueOnce(advertisements[0])
                .mockResolvedValueOnce(advertisements[2]);

            await olxNotifier.examineAdvertisements();

            expect(mockEmailService.sendEmails).toHaveBeenCalledTimes(2);
            expect(mockEmailService.sendEmails.mock.calls[0][0]).toHaveLength(2);
            expect(mockEmailService.sendEmails.mock.calls[1][0]).toHaveLength(1);
        });

        test('should not make emails for worse advertisement', async () => {
            // found 1 Advertisement
            mockAdvertisementsPage.$$.mockResolvedValue([1]);
            const advertisement = new Advertisement('olx.pl/1', 'dzisiaj 11:00', 'First Advertisement');
            advertisement.isWorse = true;
            Advertisement.build = jest.fn().mockResolvedValue(advertisement);

            await olxNotifier.examineAdvertisements();

            expect(mockEmailService.sendEmails).not.toHaveBeenCalled();
        });

        test('should make email for worse advertisement if we set config option to send this type of worse advertisements', async () => {
            olxNotifier = new OLXNotifier(new EmailService({} as Config), {} as Browser, mockAdvertisementsPage as any, '', true);
            // found 2 advertisement
            mockAdvertisementsPage.$$.mockResolvedValue([1, 2]);
            const firstAdvertisement = new Advertisement('olx.pl/1', 'dzisiaj 11:00', 'Good Advertisement');
            firstAdvertisement.isWorse = false;
            const secondAdvertisement = new Advertisement('olx.pl/2', 'dzisiaj 11:00', 'Worse Advertisement');
            secondAdvertisement.isWorse = true;
            Advertisement.build = jest
                .fn()
                .mockResolvedValueOnce(firstAdvertisement)
                .mockResolvedValueOnce(secondAdvertisement);

            await olxNotifier.examineAdvertisements();

            expect(mockEmailService.sendEmails).toHaveBeenCalledTimes(2);
        });

        test('should make composed email if we set config option for composing advertisements info to one email', async () => {
            olxNotifier = new OLXNotifier(new EmailService({} as Config), {} as Browser, mockAdvertisementsPage as any, '', false, true);
            // found 2 Advertisement
            mockAdvertisementsPage.$$.mockResolvedValue([1, 2]);
            const firstAdvertisement = new Advertisement('olx.pl/1', 'dzisiaj 11:00', 'First Advertisement');
            const secondAdvertisement = new Advertisement('olx.pl/2', 'dzisiaj 11:00', 'Second Advertisement');
            Advertisement.build = jest
                .fn()
                .mockResolvedValueOnce(firstAdvertisement)
                .mockResolvedValueOnce(secondAdvertisement);

            await olxNotifier.examineAdvertisements();

            expect(mockEmailService.sendEmails.mock.calls[0][0]).toHaveLength(1);
        });

        test('should clear sent emails between iterations', async () => {
            olxNotifier = new OLXNotifier(new EmailService({} as Config), {} as Browser, mockAdvertisementsPage as any, '', true, true);
            // found 2 Advertisement
            mockAdvertisementsPage.$$.mockResolvedValue([1, 2]);
            const goodAdvertisement = new Advertisement('olx.pl/1', 'dzisiaj 11:00', 'Good Advertisement');
            const worseAdvertisement = new Advertisement('olx.pl/1', 'dzisiaj 11:00', 'Worst Advertisement');
            worseAdvertisement.isWorse = true;
            Advertisement.build = jest
                .fn()
                .mockResolvedValueOnce(goodAdvertisement)
                .mockResolvedValueOnce(worseAdvertisement);

            await olxNotifier.examineAdvertisements();
            expect(mockEmailService.sendEmails).toHaveBeenCalledTimes(2);
            mockEmailService.sendEmails.mockClear();

            await olxNotifier.examineAdvertisements();

            expect(mockEmailService.sendEmails).not.toHaveBeenCalled();
        });
    });
});

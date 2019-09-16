import { Config, OLXNotifier } from '../src/OLXNotifier';
import { Browser } from 'puppeteer';
import { Advertisement } from '../src/advertisement/Advertisement';
import { EmailService } from '../src/email/emailService';
import { Time } from '../src/Time/Time';
import { TransportInformation } from '../src/locationChecker/transportConnection';

const mockEmailService = {
    prepareEmail: jest.fn(),
};

jest.mock('../src/advertisement/Advertisement', () => {
    return {
        Advertisement: jest.fn().mockImplementation((href, time, title) => ({
            href,
            time,
            title,
            isPerfectLocated: false,
            transportInformation: { timeInSeconds: 0, transportSteps: [], textTime: '' } as TransportInformation,
            openAdvertisement: () => {},
            takeScreenshot: () => {},
            closeAdvertisement: () => {},
        })),
    };
});
jest.mock('../src/email/emailService', () => {
    return {
        EmailService: jest.fn().mockImplementation(() => ({
            prepareEmail: mockEmailService.prepareEmail,
            sendEmails: () => {},
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
            Advertisement.build = jest.fn().mockResolvedValue({
                time: new Time('dzisiaj 01:30'),
            });

            expect(await OLXNotifier.build(browser, '', {} as Config)).toBeInstanceOf(OLXNotifier);
        });

        test('return undefined if cannot find advertisements table', async () => {
            browser.mockPage.$.mockReturnValue(null);

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
            olxNotifier = new OLXNotifier(new EmailService({} as any), {} as Browser, mockAdvertisementsPage as any, '', 10);
        });

        test('should make emails only for new not met advertisements', async () => {
            const advertisements = [
                new Advertisement('olx.pl/1', new Time('dzisiaj 11:30'), 'First Advertisement'),
                new Advertisement('olx.pl/2', new Time('dzisiaj 11:30'), 'Second Advertisement'),
                new Advertisement('olx.pl/3', new Time('dzisiaj 11:30'), 'Third Advertisement'),
            ];
            advertisements.forEach(advertisement => (advertisement.isPerfectLocated = true));
            // found 3 advertisements
            mockAdvertisementsPage.$$.mockResolvedValue([1, 2, 3]);
            Advertisement.build = jest
                .fn()
                .mockResolvedValueOnce(advertisements[0])
                .mockResolvedValueOnce(advertisements[1])
                .mockResolvedValueOnce(advertisements[2]);

            await olxNotifier.examineAdvertisements();

            // found 2 advertisements
            mockAdvertisementsPage.$$.mockResolvedValue([1, 2]);
            Advertisement.build = jest
                .fn()
                .mockResolvedValueOnce(new Advertisement('olx.pl/3', new Time('dzisiaj 11:30'), 'First Advertisement'))
                .mockResolvedValueOnce(new Advertisement('olx.pl/4', new Time('dzisiaj 11:30'), 'Forth Advertisement'));

            await olxNotifier.examineAdvertisements();

            expect(mockEmailService.prepareEmail).toHaveBeenCalledTimes(4);
            expect(mockEmailService.prepareEmail.mock.calls[0][1]).toBe('olx.pl/1');
            expect(mockEmailService.prepareEmail.mock.calls[1][1]).toBe('olx.pl/2');
            expect(mockEmailService.prepareEmail.mock.calls[2][1]).toBe('olx.pl/3');
            expect(mockEmailService.prepareEmail.mock.calls[3][1]).toBe('olx.pl/4');
        });

        test('should make email for advertisement with perfect location', async () => {
            const advertisementWithPerfectLocation = new Advertisement('olx.pl/1', new Time('dzisiaj 11:30'), 'First Advertisement');
            advertisementWithPerfectLocation.isPerfectLocated = true;
            // found 1 advertisement
            mockAdvertisementsPage.$$.mockResolvedValue([1]);
            Advertisement.build = jest.fn().mockResolvedValue(advertisementWithPerfectLocation);

            await olxNotifier.examineAdvertisements();

            expect(mockEmailService.prepareEmail).toHaveBeenCalled();
        });

        test('should make email for advertisement with location with short transport time', async () => {
            olxNotifier = new OLXNotifier(new EmailService({} as any), {} as Browser, mockAdvertisementsPage as any, '', 10, undefined);
            const advertisement = new Advertisement('olx.pl/1', new Time('dzisiaj 11:00'), 'First Advertisement');
            advertisement.transportInformation!.timeInSeconds = 5;
            // found 1 advertisement
            mockAdvertisementsPage.$$.mockResolvedValue([1]);
            Advertisement.build = jest.fn().mockResolvedValue(advertisement);

            await olxNotifier.examineAdvertisements();

            expect(mockEmailService.prepareEmail).toHaveBeenCalled();
        });

        test('should not make email for advertisement with location with long transport time', async () => {
            olxNotifier = new OLXNotifier(new EmailService({} as any), {} as Browser, mockAdvertisementsPage as any, '', 10, undefined);
            // found 1 advertisement
            mockAdvertisementsPage.$$.mockResolvedValue([1]);
            const advertisement = new Advertisement('olx.pl/1', new Time('dzisiaj 11:00'), 'First Advertisement');
            advertisement.transportInformation = { timeInSeconds: 1200 } as TransportInformation;
            advertisement.location = 'some location';
            Advertisement.build = jest.fn().mockResolvedValue(advertisement);

            await olxNotifier.examineAdvertisements();

            expect(mockEmailService.prepareEmail).not.toHaveBeenCalled();
        });

        test('should make email for advertisement with location with long transport time if we set config option to send this type of worse advertisements', async () => {
            const mockEmailServiceForWorseAdvertisements = {
                prepareEmail: jest.fn(),
                sendEmails: jest.fn(),
            };
            olxNotifier = new OLXNotifier(
                new EmailService({} as any),
                {} as Browser,
                mockAdvertisementsPage as any,
                '',
                10,
                mockEmailServiceForWorseAdvertisements as any,
            );
            // found 2 advertisement
            mockAdvertisementsPage.$$.mockResolvedValue([1, 2]);
            const firstAdvertisement = new Advertisement('olx.pl/1', new Time('dzisiaj 11:00'), 'Good Advertisement');
            firstAdvertisement.transportInformation = {
                timeInSeconds: 5,
                transportSteps: [],
                textTime: '5 seconds',
            } as TransportInformation;
            firstAdvertisement.location = 'Some Good Location';
            const secondAdvertisement = new Advertisement('olx.pl/2', new Time('dzisiaj 11:00'), 'Worse Advertisement');
            secondAdvertisement.transportInformation = {
                timeInSeconds: 1200,
                textTime: '1200 seconds',
                transportSteps: [],
            } as TransportInformation;
            secondAdvertisement.location = 'Some worse location';
            Advertisement.build = jest
                .fn()
                .mockResolvedValueOnce(firstAdvertisement)
                .mockResolvedValueOnce(secondAdvertisement);

            await olxNotifier.examineAdvertisements();

            expect(mockEmailService.prepareEmail).toHaveBeenCalledTimes(1);
            expect(mockEmailServiceForWorseAdvertisements.prepareEmail).toHaveBeenCalledTimes(1);
        });

        test('should make email for advertisement if there are not possibility to check location', async () => {
            // found 1 advertisement
            mockAdvertisementsPage.$$.mockResolvedValue([1]);
            const firstAdvertisement = new Advertisement('olx.pl/1', new Time('dzisiaj 11:00'), 'First Advertisement');
            firstAdvertisement.location = 'some location';
            firstAdvertisement.isPerfectLocated = false;
            firstAdvertisement.transportInformation = { timeInSeconds: 3600 } as TransportInformation;
            Advertisement.build = jest.fn().mockResolvedValue(firstAdvertisement);
            await olxNotifier.examineAdvertisements();

            expect(mockEmailService.prepareEmail).not.toHaveBeenCalled();

            const secondAdvertisement = new Advertisement('olx.pl/2', new Time('dzisiaj 11:00'), 'Second Advertisement');
            secondAdvertisement.location = undefined;
            Advertisement.build = jest.fn().mockResolvedValue(secondAdvertisement);
            await olxNotifier.examineAdvertisements();

            expect(mockEmailService.prepareEmail).toHaveBeenCalled();
        });
    });
});

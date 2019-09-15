import { Config, OLXNotifier } from '../src/OLXNotifier';
import { Browser } from 'puppeteer';
import { Advertisement } from '../src/advertisement/Advertisement';
import { mocked } from 'ts-jest/utils';
import { findLocationOfFlatInDescription, Location } from '../src/locationChecker/locationFinder';
import { EmailService } from '../src/email/emailService';
import { checkTransportTime } from '../src/locationChecker/transportConnection';
import { Time } from '../src/Time/Time';

const config = require('../config/config.json');

const mockEmailService = {
    prepareEmail: jest.fn(),
};

jest.mock('../src/advertisement/Advertisement', () => {
    return {
        Advertisement: jest.fn().mockImplementation((href, time, title) => ({
            href,
            time,
            title,
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
jest.mock('../src/locationChecker/transportConnection');
jest.mock('../src/locationChecker/positionFinder');

describe('OLXNotifier', () => {
    beforeEach(() => {
        mockEmailService.prepareEmail.mockClear();
    });

    describe('build', () => {
        const mockPage = {
            $: jest.fn(),
        };

        const browser: any = {
            newPage: jest.fn().mockResolvedValue({
                goto: () => {},
                $: mockPage.$,
            }),
        };

        beforeEach(() => {
            mockPage.$.mockReturnValue(true);
        });

        test('should return instance of OLXNotifier', async () => {
            Advertisement.build = jest.fn().mockResolvedValue({
                time: new Time('dzisiaj 01:30'),
            });

            expect(await OLXNotifier.build(browser, '', {} as Config)).toBeInstanceOf(OLXNotifier);
        });

        test('return undefined if cannot find advertisements table', async () => {
            mockPage.$.mockReturnValue(null);

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
        const mockEmailServiceForWorseAdvertisements = {
            prepareEmail: jest.fn(),
            sendEmails: jest.fn(),
        };

        let olxNotifier: OLXNotifier;
        beforeEach(() => {
            mockEmailServiceForWorseAdvertisements.prepareEmail.mockClear();
            mockEmailServiceForWorseAdvertisements.sendEmails.mockClear();

            olxNotifier = new OLXNotifier(
                new EmailService({} as any),
                {} as Browser,
                mockAdvertisementsPage as any,
                '',
                10,
                mockEmailServiceForWorseAdvertisements as any,
            );
        });

        test('should make emails only for new not met advertisements', async () => {
            mocked(findLocationOfFlatInDescription).mockReturnValue(Location.PERFECT_LOCATION);
            // found 3 advertisements
            mockAdvertisementsPage.$$.mockResolvedValue([1, 2, 3]);
            Advertisement.build = jest
                .fn()
                .mockResolvedValueOnce(new Advertisement('olx.pl/1', new Time('dzisiaj 11:30'), 'First Advertisement'))
                .mockResolvedValueOnce(new Advertisement('olx.pl/2', new Time('dzisiaj 11:30'), 'Second Advertisement'))
                .mockResolvedValueOnce(new Advertisement('olx.pl/3', new Time('dzisiaj 11:30'), 'Third Advertisement'));

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
            // found 1 advertisement
            mockAdvertisementsPage.$$.mockResolvedValue([1]);
            Advertisement.build = jest
                .fn()
                .mockResolvedValue(new Advertisement('olx.pl/1', new Time('dzisiaj 11:30'), 'First Advertisement'));
            mocked(findLocationOfFlatInDescription).mockReturnValue(Location.PERFECT_LOCATION);

            await olxNotifier.examineAdvertisements();

            expect(mockEmailService.prepareEmail).toHaveBeenCalled();
        });

        test('should make email for advertisement with location with short transport time', async () => {
            config.maxTransportTime = 10;
            // found 1 advertisement
            mockAdvertisementsPage.$$.mockResolvedValue([1]);
            Advertisement.build = jest
                .fn()
                .mockResolvedValue(new Advertisement('olx.pl/1', new Time('dzisiaj 11:00'), 'First Advertisement'));
            mocked(findLocationOfFlatInDescription).mockReturnValue('some good location');
            mocked(checkTransportTime).mockResolvedValue({ timeInSeconds: 590, textTime: '9 minutes 50 seconds', transportSteps: [] });

            await olxNotifier.examineAdvertisements();

            expect(mockEmailService.prepareEmail).toHaveBeenCalled();
        });

        test('should make email for advertisement if there are not possibility to check location', async () => {
            // found 2 advertisement
            mockAdvertisementsPage.$$.mockResolvedValue([1, 2]);
            Advertisement.build = jest
                .fn()
                .mockResolvedValueOnce(new Advertisement('olx.pl/1', new Time('dzisiaj 11:00'), 'First Advertisement'))
                .mockResolvedValueOnce(new Advertisement('olx.pl/2', new Time('dzisiaj 11:00'), 'Second Advertisement'));
            mocked(findLocationOfFlatInDescription)
                .mockReturnValueOnce(Location.NOT_FOUND)
                .mockReturnValueOnce('some location');
            mocked(checkTransportTime).mockResolvedValue(undefined);

            await olxNotifier.examineAdvertisements();

            expect(mockEmailService.prepareEmail).toHaveBeenCalledTimes(2);
        });

        test('should not make email for advertisement with location with long transport time', async () => {
            config.maxTransportTime = 10;
            // found 1 advertisement
            mockAdvertisementsPage.$$.mockResolvedValue([1]);
            Advertisement.build = jest
                .fn()
                .mockResolvedValue(new Advertisement('olx.pl/1', new Time('dzisiaj 11:00'), 'First Advertisement'));
            mocked(findLocationOfFlatInDescription).mockReturnValue('some bad location');
            mocked(checkTransportTime).mockResolvedValue({ timeInSeconds: 610, textTime: '10 minutes 10 seconds', transportSteps: [] });

            await olxNotifier.examineAdvertisements();

            expect(mockEmailService.prepareEmail).not.toHaveBeenCalled();
        });

        test('should make email for advertisement with location with long transport time if we set config option to send this type of advertisements', async () => {
            config.maxTransportTime = 10;
            // found 2 advertisement
            mockAdvertisementsPage.$$.mockResolvedValue([1, 2]);
            Advertisement.build = jest
                .fn()
                .mockResolvedValueOnce(new Advertisement('olx.pl/1', new Time('dzisiaj 11:00'), 'Good Advertisement'))
                .mockResolvedValueOnce(new Advertisement('olx.pl/2', new Time('dzisiaj 11:00'), 'Worse Advertisement'));
            mocked(findLocationOfFlatInDescription)
                .mockReturnValueOnce(Location.PERFECT_LOCATION)
                .mockReturnValueOnce('some bad location');
            mocked(checkTransportTime).mockResolvedValue({ timeInSeconds: 610, textTime: '10 minutes 10 seconds', transportSteps: [] });

            await olxNotifier.examineAdvertisements();

            expect(mockEmailServiceForWorseAdvertisements.prepareEmail).toHaveBeenCalledTimes(1);
            expect(mockEmailServiceForWorseAdvertisements.prepareEmail).toHaveBeenCalledTimes(1);
        });
    });
});

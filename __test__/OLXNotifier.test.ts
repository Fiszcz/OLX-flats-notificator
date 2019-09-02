import { Config, OLXNotifier } from "../src/OLXNotifier";
import { Browser } from "puppeteer";
import { Advertisement } from "../src/advertisement/Advertisement";
import { mocked } from "ts-jest/utils";
import { findLocationOfFlatInDescription, Location } from "../src/positionChecker/positionFinder";
import { EmailService } from "../src/email/emailService";
import { Iteration } from "../src/iteration/Iteration";
import { checkTransportTime } from "../src/positionChecker/transportConnection";

const config = require('../config/config.json');

const mockEmailService = {
    prepareEmail: jest.fn(),
};

jest.mock('../src/advertisement/Advertisement', () => {
    return {
        Advertisement: jest.fn().mockImplementation(
            (href, time, title) => ({
                href,
                time,
                title,
                openAdvertisement: () => {},
                takeScreenshot: () => {},
                closeAdvertisement: () => {},
            }),
        ),
    };
});
jest.mock('../src/email/emailService', () => {
    return {
        EmailService: jest.fn().mockImplementation(
            () => ({
                prepareEmail: mockEmailService.prepareEmail,
                sendEmails: () => {},
            }),
        ),
    };
});
jest.mock('../src/positionChecker/transportConnection');
jest.mock('../src/positionChecker/positionFinder');

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
                time: {minutes: 30, hour: 1}
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

        const mockPage = {
            $$: jest.fn(),
        };

        let olxNotifier: OLXNotifier;
        beforeEach(() => {
            const advertisementsPage = {
                goto: () => {},
                $$: mockPage.$$,
                click: () => {},
            };
            const iteration = new Iteration({hour: 10, minutes: 0});
            olxNotifier = new OLXNotifier(new EmailService({} as any), {} as Browser, advertisementsPage as any, iteration, '', 10);
        });

        test('should make email for advertisement with perfect location', async () => {
            // found 1 advertisement
            mockPage.$$.mockResolvedValue([1]);
            Advertisement.build = jest.fn().mockResolvedValue(new Advertisement('olx.pl/1', {hour: 11, minutes: 0}, 'First Advertisement'));
            mocked(findLocationOfFlatInDescription).mockReturnValue(Location.PERFECT_LOCATION);

            await olxNotifier.examineAdvertisements();

            expect(mockEmailService.prepareEmail).toHaveBeenCalled();
        });

        test('should make email for advertisement with location with short transport time', async () => {
            config.maxTransportTime = 10;
            // found 1 advertisement
            mockPage.$$.mockResolvedValue([1]);
            Advertisement.build = jest.fn().mockResolvedValue(new Advertisement('olx.pl/1', {hour: 11, minutes: 0}, 'First Advertisement'));
            mocked(findLocationOfFlatInDescription).mockReturnValue('some good location');
            mocked(checkTransportTime).mockResolvedValue({timeInSeconds: 590, textTime: '9 minutes 50 seconds', transportSteps: []});

            await olxNotifier.examineAdvertisements();

            expect(mockEmailService.prepareEmail).toHaveBeenCalled();
        });

        test('should make email for advertisement if there are not possibility to check location', async () => {
            // found 2 advertisement
            mockPage.$$.mockResolvedValue([1, 2]);
            Advertisement.build = jest.fn()
                .mockResolvedValueOnce(new Advertisement('olx.pl/1', {hour: 11, minutes: 0}, 'First Advertisement'))
                .mockResolvedValueOnce(new Advertisement('olx.pl/2', {hour: 11, minutes: 0}, 'Second Advertisement'));
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
            mockPage.$$.mockResolvedValue([1]);
            Advertisement.build = jest.fn().mockResolvedValue(new Advertisement('olx.pl/1', {hour: 11, minutes: 0}, 'First Advertisement'));
            mocked(findLocationOfFlatInDescription).mockReturnValue('some bad location');
            mocked(checkTransportTime).mockResolvedValue({timeInSeconds: 610, textTime: '10 minutes 10 seconds', transportSteps: []});

            await olxNotifier.examineAdvertisements();

            expect(mockEmailService.prepareEmail).not.toHaveBeenCalled();
        });

    });

});
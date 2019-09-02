import { mocked } from "ts-jest/utils";
import { index } from "../src";
import { OLXNotifier } from "../src/OLXNotifier";
import inquirer = require("inquirer");

const appConfig = require('../config/config.json');
appConfig.filterUrls = ['olx.pl/filter/123'];

jest.mock('inquirer');
jest.mock('../src/OLXNotifier');
jest.mock('puppeteer');

describe('index', () => {

    beforeEach(() => {
        mocked(OLXNotifier).mockClear();
        mocked(inquirer.prompt).mockClear();
    });

    test('should run OLX Notifier instances if config contain all necessary properties', async () => {
        appConfig.emailPassword = 'password123';

        await index();

        expect(mocked(OLXNotifier.build)).toHaveBeenCalled();
    });

    test('should ask user about password to email account', async () => {
        appConfig.emailPassword = undefined;
        const mockedPasswordPrompt = mocked(inquirer.prompt)
            .mockResolvedValueOnce({emailPassword: ''})
            .mockResolvedValueOnce({emailPassword: 'password123'});

        await index();

        expect(mockedPasswordPrompt).toHaveBeenCalledTimes(2);
        expect(mocked(OLXNotifier.build)).toHaveBeenCalled();
    });
});
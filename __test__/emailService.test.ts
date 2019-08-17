import { EmailService } from "../src/email/emailService";
import { mocked } from 'ts-jest/utils';
import inquirer = require("inquirer");

jest.mock('inquirer');

describe('EmailService', () => {

    afterEach(() => {
        mocked(inquirer.prompt).mockClear();
    });

    test('build should return instance of EmailService if config contain all necessary properties', async () => {
        const config = {
            emailService: 'gmail',
            emailAddress: 'email@adrress',
            emailPassword: 'password123',
            emailsReceiver: 'receiver@address',
        };
        expect(await EmailService.build(config)).toBeInstanceOf(EmailService);
    });

    test('build should ask user about password to email account', async () => {
        const mockedPasswordPrompt = mocked(inquirer.prompt)
            .mockResolvedValueOnce({emailPassword: ''})
            .mockResolvedValueOnce({emailPassword: 'password123'})
            .mockResolvedValue({emailPassword: '3lo'});

        const config = {
            emailService: 'gmail',
            emailAddress: 'email@adrress',
            emailsReceiver: 'receiver@address',
        };

        expect(await EmailService.build(config)).toBeInstanceOf(EmailService);
        expect(mockedPasswordPrompt).toHaveBeenCalledTimes(2);
    });

});

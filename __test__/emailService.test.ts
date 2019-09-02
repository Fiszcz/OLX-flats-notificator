import { EmailService } from "../src/email/emailService";
import { mocked } from 'ts-jest/utils';
import { createTransport } from "nodemailer";
import { Config } from "../src/OLXNotifier";

jest.mock('nodemailer');

const config = {
    emailService: 'gmail',
    emailAddress: 'email@adrress',
    emailsReceiver: 'receiver@address',
    emailPassword: 'password123',
} as Config;

describe('EmailService', () => {

    afterEach(() => {
        mocked(createTransport).mockClear();
    });

    test('should send all prepared emails', async () => {
        const mockedSendMail = jest.fn();
        mocked(createTransport)
            // @ts-ignore
            .mockReturnValue({sendMail: mockedSendMail});
        const emailService = new EmailService(config);

        emailService.prepareEmail('', 'olx.pl/1', 'Advertisement 1', 'description 1');
        emailService.prepareEmail('', 'olx.pl/2', 'Advertisement 2', 'description 2');
        emailService.prepareEmail('', 'olx.pl/3', 'Advertisement 3', 'description 3');
        emailService.sendEmails();

        expect(mockedSendMail).toHaveBeenCalledTimes(3);
        expect(mockedSendMail.mock.calls[0][0]).toMatchObject({subject: 'Advertisement 1'});
        expect(mockedSendMail.mock.calls[1][0]).toMatchObject({subject: 'Advertisement 2'});
        expect(mockedSendMail.mock.calls[2][0]).toMatchObject({subject: 'Advertisement 3'});
    });

    test('should send composed email if we have compose option set in config', async () => {
        const mockedSendMail = jest.fn();
        mocked(createTransport)
            // @ts-ignore
            .mockReturnValue({sendMail: mockedSendMail});
        const emailService = new EmailService({...config, composeIteration: true});

        emailService.prepareEmail('screenshot1.png', 'webaddress1', 'First title', 'first description');
        emailService.prepareEmail('', 'webaddress2', 'Second title', 'second description');
        emailService.prepareEmail('screenshot3.png', 'webaddress3', 'Third title', 'third description');
        emailService.sendEmails();

        const sentEmail = mockedSendMail.mock.calls[0][0];
        const {subject, attachments, html} = sentEmail;
        expect(subject).toMatch(/3 advertisements/);
        expect(attachments).toHaveLength(2);
        expect(html).toMatch(/First title(.|\n)*Second title(.|\n)*Third title/);
    });

});

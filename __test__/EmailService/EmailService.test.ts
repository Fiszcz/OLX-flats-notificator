import { EmailService } from '../../src/EmailService/EmailService';
import { mocked } from 'ts-jest/utils';
import { createTransport } from 'nodemailer';
import { Config } from '../../src/OLXNotifier';

jest.mock('nodemailer');

const config = {
    emailService: 'gmail',
    emailAddress: 'EmailService@adrress',
    emailsReceiver: 'receiver@address',
    emailPassword: 'password123',
} as Config;

describe('EmailService', () => {
    afterEach(() => {
        mocked(createTransport).mockClear();
    });

    test('should send all emails', async () => {
        const mockedSendMail = jest.fn();
        mocked(createTransport)
            // @ts-ignore
            .mockReturnValue({ sendMail: mockedSendMail });
        const emailService = new EmailService(config);

        emailService.sendEmails([
            { subject: 'First Advertisement', attachments: [], message: 'Message' },
            { subject: 'Second Advertisement', attachments: ['first file', 'second file'], message: 'Message' },
        ]);

        expect(mockedSendMail).toHaveBeenCalledTimes(2);
        expect(mockedSendMail.mock.calls[0][0]).toMatchObject({
            subject: 'OLXNotifier: First Advertisement',
            html: 'Message',
        });
        expect(mockedSendMail.mock.calls[1][0]).toMatchObject({
            subject: 'OLXNotifier: Second Advertisement',
            attachments: [
                { filename: 'first file', path: 'first file', cid: 'first file' },
                { filename: 'second file', path: 'second file', cid: 'second file' },
            ],
        });
    });
});

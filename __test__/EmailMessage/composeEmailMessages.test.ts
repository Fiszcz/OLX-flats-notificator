import { EmailMessageInterface } from '../../src/EmailMessage/EmailMessage';
import { composeEmailMessages } from '../../src/EmailMessage/composeEmailMessages';

describe('composeEmailMessages', () => {
    test('should compose email messages', () => {
        const emailMessages = [
            {
                subject: 'First',
                attachments: [],
                message: 'First',
            },
            {
                subject: 'Second',
                attachments: ['second'],
                message: 'Second',
            },
            {
                subject: 'Third',
                attachments: ['third'],
                message: 'Third',
            },
        ] as EmailMessageInterface[];

        expect(composeEmailMessages(emailMessages, 'Compose Email Subject')).toMatchObject({
            subject: 'Compose Email Subject',
            attachments: ['second', 'third'],
            message: 'FirstSecondThird',
        } as EmailMessageInterface);
    });
});

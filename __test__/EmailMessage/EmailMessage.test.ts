import { Advertisement } from '../../src/Advertisement/Advertisement';
import { EmailMessage } from '../../src/EmailMessage/EmailMessage';

describe('EmailMessage', () => {
    let advertisement: Advertisement;
    let emailMessage: EmailMessage;
    beforeEach(() => {
        advertisement = new Advertisement('http://olx.pl/1', 'dzisiaj 10:10', 'Advertisement');
        emailMessage = new EmailMessage(advertisement);
    });

    test('attachments fields should contain array of attachment or empty array if advertisement do not contain pathname to screenshot', () => {
        advertisement.screenshotPath = undefined;
        expect(emailMessage.attachments).toHaveLength(0);

        advertisement.screenshotPath = 'screenShot.png';
        expect(emailMessage.attachments).toMatchObject([advertisement.screenshotPath]);
    });

    test('if advertisement has perfect location, message should contain information about it', () => {
        advertisement.isPerfectLocated = true;
        expect(emailMessage.message).toMatch(/Perfect Location/);

        advertisement.isPerfectLocated = false;
        expect(emailMessage.message).not.toMatch(/Perfect Location/);
    });
});

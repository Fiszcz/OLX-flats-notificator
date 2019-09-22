import { EmailMessageInterface } from './EmailMessage';

export const composeEmailMessages = (emailMessages: EmailMessageInterface[], title: string): EmailMessageInterface => {
    const composedMessage = emailMessages.reduce((composedEmailMessage: string, emailMessage: EmailMessageInterface) => {
        return composedEmailMessage + emailMessage.message;
    }, '');
    const attachments = emailMessages.flatMap(emailMessage => emailMessage.attachments);

    return {
        subject: title,
        message: composedMessage,
        attachments,
    } as EmailMessageInterface;
};

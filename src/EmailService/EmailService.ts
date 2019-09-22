import { createTransport } from 'nodemailer';
import { Config } from '../OLXNotifier';
import { EmailMessageInterface } from '../EmailMessage/EmailMessage';
import Mail = require('nodemailer/lib/mailer');

export class EmailService {
    private readonly emailTransporter: Mail;
    private readonly emailReceiver: string;

    constructor(emailConfig: Config) {
        this.emailTransporter = createTransport({
            service: emailConfig.emailService,
            auth: {
                user: emailConfig.emailAddress,
                pass: emailConfig.emailPassword,
            },
        });
        this.emailReceiver = emailConfig.emailsReceiver;
    }

    private sendEmail = (email: Mail.Options) => {
        this.emailTransporter.sendMail(email, error => {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + email.subject);
            }
        });
    };

    public sendEmails = (emailMessages: EmailMessageInterface[]) => {
        for (const emailMessage of emailMessages) {
            const { subject, attachments, message } = emailMessage;
            const email = {
                to: this.emailReceiver,
                subject: 'OLXNotifier: ' + subject,
                attachments: attachments.map(attachment => ({
                    filename: attachment,
                    path: attachment,
                    cid: attachment,
                })),
                html: message,
            };
            this.sendEmail(email);
        }
    };
}

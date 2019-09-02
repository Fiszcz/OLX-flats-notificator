import { createTransport } from "nodemailer";
import { Config } from "../OLXNotifier";
import Mail = require("nodemailer/lib/mailer");

interface SendingAdvertisementData {
    pathToScreenshot: string;
    webAddress: string;
    title: string;
    description: string;
}

export class EmailService {

    private readonly emailTransporter: Mail;
    private readonly emailReceiver: string;
    private readonly composeMail: boolean;
    private waitingAdvertisementsToSend: SendingAdvertisementData[] = [];

    constructor(emailConfig: Config) {
        this.emailTransporter = createTransport({
            service: emailConfig.emailService,
            auth: {
                user: emailConfig.emailAddress,
                pass: emailConfig.emailPassword
            }
        });
        this.emailReceiver = emailConfig.emailsReceiver;
        this.composeMail = emailConfig.composeIteration || false;
    }

    public prepareEmail = (pathToScreenshot: string, webAddress: string, title: string, description: string) => {
        this.waitingAdvertisementsToSend.push({pathToScreenshot, webAddress, title, description});
    };

    public sendEmails = () => {
        if (this.composeMail) {
            this.sendComposedEmail();
        } else {
            this.sendSeparatedEmails();
        }
    };

    private sendEmail = (email: Mail.Options) => {
        this.emailTransporter.sendMail(email, (error) => {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + email.subject);
            }
        });
    };

    private sendSeparatedEmails = () => {
        while (this.waitingAdvertisementsToSend.length) {
            const advertisementData = this.waitingAdvertisementsToSend.shift();
            if (advertisementData) {
                const {title, pathToScreenshot, webAddress, description} = advertisementData;
                const email = {
                    to: this.emailReceiver,
                    subject: title,
                    attachments: pathToScreenshot ? [{filename: pathToScreenshot, path: pathToScreenshot, cid: 'screenshot'}] : [],
                    html: 'Website: ' + webAddress + '\n' + description + '\n' + '<img src="cid:screenshot" alt="screenshot of advertisement">',
                };
                this.sendEmail(email);
            }
        }
    };

    private sendComposedEmail = () => {
        const email: Mail.Options = {
            to: this.emailReceiver,
            // TODO: add url of filter url
            subject: this.waitingAdvertisementsToSend.length + ' advertisements',
            attachments: [],
            html: '',
        };
        while (this.waitingAdvertisementsToSend.length) {
            const advertisementData = this.waitingAdvertisementsToSend.shift();
            if (advertisementData) {
                const {title, pathToScreenshot, webAddress, description} = advertisementData;
                if (pathToScreenshot)
                    email.attachments!.push({filename: pathToScreenshot, path: pathToScreenshot, cid: pathToScreenshot});
                email.html += `<H2>Title: ${title}</H2>` + '\n'
                    + 'Website: ' + webAddress
                    + '\n' + description
                    + '\n' + `<img src="cid:${pathToScreenshot}" alt="screenshot of advertisement"/>` + '\n\n';
            }
        }
        if (email.html)
            this.sendEmail(email);
    };

}

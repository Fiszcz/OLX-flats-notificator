import inquirer from "inquirer";
import { createTransport } from "nodemailer";
import Mail = require("nodemailer/lib/mailer");

interface Config {
    emailService: string;
    emailAddress: string;
    emailPassword?: string;
    emailsReceiver: string;
}

export class EmailService {

    private readonly emailTransporter: Mail;
    private readonly emailReceiver: string;

    constructor(emailConfig: Config) {
        this.emailTransporter = createTransport({
            service: emailConfig.emailService,
            auth: {
                user: emailConfig.emailAddress,
                pass: emailConfig.emailPassword
            }
        });
        this.emailReceiver = emailConfig.emailsReceiver;
    }

    static build = async (config: Config) => {
        while (Boolean(config.emailPassword) === false) {
            config.emailPassword = await inquirer.prompt({
                type: 'password',
                name: 'emailPassword',
                message: 'Enter your email password: ',
            }).then((answer) => answer.emailPassword);
        }
        return new EmailService(config);
    };

    public sendEmail = (pathToPicture: string, webAddress: string, title: string, description: string) => {
        const mailOptions = {
            to: this.emailReceiver,
            subject: title,
            attachments: pathToPicture ? [{filename: pathToPicture, path: pathToPicture, cid: 'screenshot'}] : [],
            html: 'Website: ' + webAddress + '\n' + description + '\n' + '<img src="cid:screenshot">',
        };

        this.emailTransporter.sendMail(mailOptions, (error) => {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + title);
            }
        });
    }
}

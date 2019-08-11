import {createTransport} from "nodemailer";
const emailConfig =  require("../../config/config.json");

const emailTransporter = createTransport({
    service: emailConfig.emailService,
    auth: {
        user: emailConfig.emailAddress,
        pass: emailConfig.emailPassword
    }
});

export const sendEmail = (pathToPicture: string, webAddress: string, title: string, description: string) => {
    const mailOptions = {
        from: emailConfig.emailAddress,
        to: emailConfig.emailsReceiver,
        subject: title,
        attachments: pathToPicture ? [{filename: pathToPicture, path: pathToPicture, cid: 'screenshot'}] : [],
        html: 'Website: ' + webAddress + '\n' + description + '\n' + '<img src="cid:screenshot">',
    };

    emailTransporter.sendMail(mailOptions, (error) => {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + title);
        }
    });
};

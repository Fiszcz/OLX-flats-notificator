import { Advertisement } from '../Advertisement/Advertisement';

export interface EmailMessageInterface {
    subject: string;
    message: string;
    attachments: string[];
}

export class EmailMessage implements EmailMessageInterface {
    private readonly advertisement: Advertisement;

    constructor(advertisement: Advertisement) {
        this.advertisement = advertisement;
    }

    private transportInformation = () => {
        let transportInformation = '';
        if (this.advertisement.isPerfectLocated) return 'Perfect Location 👌🤩' + '\n';
        for (const connection of this.advertisement.transportInformation || []) {
            transportInformation += connection.hasSatisfiedTime ? '👍🕑' : '🤬🕑';
            transportInformation += ` ${connection.textTime}`;
            transportInformation += ` to ${connection.location}` + '\n';
            transportInformation += `Steps: ${connection.transportSteps.map(step => step.instructions).toString()}` + '\n';
        }
        return transportInformation;
    };

    public get subject(): string {
        // TODO: add information about transport time (for example: without location)
        // TODO: add url of filter url
        return `[${this.advertisement.time}] - ${this.advertisement.title}`;
    }

    public get message(): string {
        return (
            '<div align="center">' +
            `<H2>${this.subject}</H2>` +
            '\n' +
            `Time of Advertisement: ${this.advertisement.time}` +
            '\n' +
            `Location: ${this.advertisement.location}` +
            '\n' +
            `Website: ${this.advertisement.href}` +
            '\n' +
            '----------------------' +
            '\n' +
            `Transport ${this.transportInformation()}` +
            '\n' +
            '----------------------' +
            '\n' +
            `Description:` +
            '\n' +
            this.advertisement.description +
            '\n' +
            `<img src="cid:${this.attachments}" alt="Screenshot of page with advertisement"/>` +
            '\n' +
            '*️⃣*️⃣*️⃣*️⃣*️⃣*️⃣*️⃣*️⃣*️⃣*️⃣*️⃣*️⃣*️⃣*️⃣*️⃣*️⃣*️⃣*️⃣*️⃣*️⃣*️⃣*️⃣*️⃣*️⃣*️⃣*️⃣*️⃣' +
            '</div>' +
            '\n\n'
        );
    }

    public get attachments(): string[] {
        return this.advertisement.screenshotPath ? [this.advertisement.screenshotPath] : [];
    }
}

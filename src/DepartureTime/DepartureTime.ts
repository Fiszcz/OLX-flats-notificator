export enum Weekdays {
    sunday,
    monday,
    tuesday,
    wednesday,
    thursday,
    friday,
    saturday,
}

export class DepartureTime {
    private readonly weekDay: number;
    private readonly hour: number;
    private readonly minutes: number;

    private readonly departureTime: Date;
    private departureTimeString: string;

    constructor(departureTime?: { weekday: keyof typeof Weekdays; time: string }) {
        if (departureTime) {
            this.weekDay = Weekdays[departureTime.weekday];
            [this.hour, this.minutes] = departureTime.time.split(':').map(timePart => Number(timePart));
        } else {
            this.weekDay = 1;
            this.hour = 12;
            this.minutes = 0;
        }

        this.departureTime = new Date();
        this.departureTime.setHours(this.hour);
        this.departureTime.setMinutes(this.minutes);
        this.moveDepartureDateToTheNearestSelectedWeekday();

        this.departureTimeString = this.getDepartureTimeString();
    }

    private getDepartureTimeString = () => {
        return Math.floor(this.departureTime.getTime() / 1000).toString();
    };

    private moveDepartureDateToTheNearestSelectedWeekday = () => {
        this.departureTime.setDate(
            this.departureTime.getDate() +
                (this.weekDay > this.departureTime.getDay() ? 0 : 7) +
                this.weekDay -
                this.departureTime.getDay(),
        );
    };

    public getDepartureTime = () => {
        const currentTime = new Date().getTime();
        if (currentTime > this.departureTime.getTime()) {
            this.departureTime.setDate(this.departureTime.getDate() + 7);
            this.departureTimeString = this.getDepartureTimeString();
        }
        return this.departureTimeString;
    };
}

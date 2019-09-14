export class Time {
    public hour: number;
    public minutes: number;
    public isPreviousDay: boolean;

    constructor(timeText: string) {
        const [dayPart, timePart] = timeText.split(' ');
        const [hour, minutes] = timePart.split(':');

        this.hour = Number(hour);
        this.minutes = Number(minutes);
        this.isPreviousDay = dayPart !== 'dzisiaj';
    }
}

interface Time {
    hour: number;
    minutes: number;
}

enum TimeComparison {
    FIRST_NEWER = 1,
    THE_SAME = 0,
    SECOND_NEWER = 2,
}

export class Iteration {
    private latestAdvertisementsFromPreviousIteration: string[] = [];
    private previousIterationTime: Time;

    private latestAdvertisementsInCurrentIteration: string[] = [];
    // TODO: napisac poprawke na daty
    private currentIterationTime: Time;

    constructor(time: Time) {
        this.currentIterationTime = time;
        this.previousIterationTime = time;
    }

    public startNewIteration = () => {
        this.latestAdvertisementsFromPreviousIteration = [...this.latestAdvertisementsInCurrentIteration];
        this.previousIterationTime = { ...this.currentIterationTime };
    };

    private compareTimes = (firstTime: Time, secondTime: Time): TimeComparison => {
        const difference =
            (firstTime.hour === 0 ? 24 : firstTime.hour) * 60 + firstTime.minutes - secondTime.hour * 60 - secondTime.minutes;
        if (difference > 0) return TimeComparison.FIRST_NEWER;
        else if (difference === 0) return TimeComparison.THE_SAME;
        return TimeComparison.SECOND_NEWER;
    };

    public isNewerThanPreviousIteration = (advertisementTime?: Time, advertisement?: string) => {
        if (advertisementTime === undefined || advertisement === undefined) return false;

        const timesComparisonBetweenPreviousIterationAndAdvertisement = this.compareTimes(advertisementTime, this.previousIterationTime);

        if (timesComparisonBetweenPreviousIterationAndAdvertisement === TimeComparison.THE_SAME)
            return (
                this.latestAdvertisementsFromPreviousIteration.findIndex(
                    previousAdvertisement => previousAdvertisement === advertisement,
                ) === -1
            );

        if (timesComparisonBetweenPreviousIterationAndAdvertisement === TimeComparison.FIRST_NEWER) {
            const timesComparisonBetweenCurrentIterationAndAdvertisement = this.compareTimes(advertisementTime, this.currentIterationTime);
            if (timesComparisonBetweenCurrentIterationAndAdvertisement === TimeComparison.THE_SAME)
                if (
                    this.latestAdvertisementsInCurrentIteration.findIndex(
                        previousAdvertisement => previousAdvertisement === advertisement,
                    ) === -1
                )
                    this.latestAdvertisementsInCurrentIteration.push(advertisement);
                else return false;
            else if (timesComparisonBetweenCurrentIterationAndAdvertisement === TimeComparison.FIRST_NEWER) {
                this.currentIterationTime = { ...advertisementTime };
                this.latestAdvertisementsInCurrentIteration = [advertisement];
            }
            return true;
        } else return false;
    };
}

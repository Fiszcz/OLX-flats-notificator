import { DepartureTime } from '../../src/DepartureTime/DepartureTime';
import MockDate from 'mockdate';

// Sunday
const exampleDate = new Date(2019, 8, 22, 15, 40);
// Monday 12:00
const mondayExampleDay = new Date(2019, 8, 23, 12, 0);
// Tuesday
const tuesdayExampleDay = new Date(2019, 8, 24, 9, 0);
// Wednesday 19:30
const wednesdayExampleDay = new Date(2019, 8, 25, 19, 30);

const getTimeSecondsInString = (date: Date) => {
    return Math.floor(date.getTime() / 1000).toString();
};

describe('DepartureTime', () => {
    beforeEach(() => MockDate.set(exampleDate));

    test('should create departure time for selected weekday and time', () => {
        const departureTime = new DepartureTime({ weekday: 'wednesday', time: '19:30' });
        expect(departureTime.getDepartureTime()).toBe(getTimeSecondsInString(wednesdayExampleDay));
    });

    test('should create default departure time if we not pass time object', () => {
        expect(new DepartureTime().getDepartureTime()).toBe(getTimeSecondsInString(mondayExampleDay));
    });

    test('should update department day to the nearest next selected day if current departure time is in the past', () => {
        const departureTime = new DepartureTime();

        MockDate.set(tuesdayExampleDay);

        const copiedMondayExampleDay = new Date(mondayExampleDay.getTime());
        copiedMondayExampleDay.setDate(copiedMondayExampleDay.getDate() + 7);

        expect(departureTime.getDepartureTime()).toBe(getTimeSecondsInString(copiedMondayExampleDay));
    });
});

import { Time } from '../src/Time/Time';

describe('Time', () => {
    test('should get proper time information from text', () => {
        expect(new Time('dzisiaj 10:15')).toMatchObject({ hour: 10, minutes: 15, isPreviousDay: false });
        expect(new Time('wczoraj 22:00')).toMatchObject({ hour: 22, minutes: 0, isPreviousDay: true });
    });
});

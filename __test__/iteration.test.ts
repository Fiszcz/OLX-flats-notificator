import { Iteration } from '../src/iteration/Iteration';

describe('Iteration', () => {
    let iteration: Iteration;
    beforeEach(() => {
        iteration = new Iteration({ hour: 10, minutes: 30 });
        iteration.startNewIteration();
    });

    describe('isNewerThanPreviousIteration', () => {
        test('return false if advertisement or advertisement time are undefined', () => {
            expect(iteration.isNewerThanPreviousIteration(undefined, 'advertisement')).toBe(false);
            expect(iteration.isNewerThanPreviousIteration({ hour: 10, minutes: 30 }, undefined)).toBe(false);
        });

        test('return true if time of advertisement is newer than previous iteration', () => {
            expect(iteration.isNewerThanPreviousIteration({ hour: 20, minutes: 0 }, 'advertisement')).toBe(true);
        });

        test('return true if advertisement has the same time as previous iteration but with other description', () => {
            expect(iteration.isNewerThanPreviousIteration({ hour: 20, minutes: 0 }, 'advertisement')).toBe(true);
            iteration.startNewIteration();
            expect(iteration.isNewerThanPreviousIteration({ hour: 20, minutes: 0 }, 'other_advertisement')).toBe(true);
        });

        test('should update current iteration for advertisement with the same time as updated current iteration, but with different description', () => {
            expect(iteration.isNewerThanPreviousIteration({ hour: 20, minutes: 0 }, 'advertisement')).toBe(true);
            expect(iteration.isNewerThanPreviousIteration({ hour: 20, minutes: 0 }, 'other_advertisement')).toBe(true);

            expect(iteration.isNewerThanPreviousIteration({ hour: 20, minutes: 0 }, 'advertisement')).toBe(false);
            expect(iteration.isNewerThanPreviousIteration({ hour: 20, minutes: 0 }, 'other_advertisement')).toBe(false);
        });

        test('should update current iteration and return false for the same advertisement', () => {
            expect(iteration.isNewerThanPreviousIteration({ hour: 20, minutes: 0 }, 'advertisement1')).toBe(true);
            expect(iteration.isNewerThanPreviousIteration({ hour: 20, minutes: 0 }, 'advertisement1')).toBe(false);
        });

        test('return false if advertisement is older than previous iteration', () => {
            expect(iteration.isNewerThanPreviousIteration({ hour: 5, minutes: 0 }, 'advertisement')).toBe(false);
        });
    });
});

/**
 * @flow
 * @format
 * @lint-ignore-every XPLATJSCOPYRIGHT1
 */

import moment from 'moment';
import type { Task } from '../crossplatform-components/Home/DailyTasksPolicy';
import { MIN_HOUR, MAX_HOUR, DailyTasksPolicy } from '../crossplatform-components/Home/DailyTasksPolicy';

describe('Daily Tasks Policy', () => {

    const policyCurriedForWhateverTask = function(now: number): Task {
        // Given tasks are only available between 18:00 (inclusive) and 22:00 (exclusive).
        let minHour = MIN_HOUR;
        let maxHour = MAX_HOUR;

        // Given no tasks have yet been submitted (should not be relevant for the test).
        let hasAtLeastOneSurveyBeenSubmitted = false;
        let lastSubmittedSurveyTimestamp = undefined;
        let hasAtLeastOneRestingStateTaskBeenSubmitted = false;
        let lastSubmittedRestingStateTaskTimestamp = undefined;

        // Run policy at set time.
        return DailyTasksPolicy(
            now,
            minHour,
            maxHour,
            hasAtLeastOneSurveyBeenSubmitted,
            lastSubmittedSurveyTimestamp,
            hasAtLeastOneRestingStateTaskBeenSubmitted,
            lastSubmittedRestingStateTaskTimestamp
        );
    };

    let today17h59m, today18h00m, today21h59m, today22h00m,
        today19h10m, today19h15m,
        yesterday19h15m;

    beforeEach(() => {
        const checkDateAndReturnTimestamp = (dateStr: string) => {
            let momentObject = moment(dateStr, 'YYYY-MM-DD HH:mm');
            expect(momentObject.isValid()).toBeTruthy();
            
            let timestamp = momentObject.valueOf();
            return timestamp;
        };

        // Today 17h59.
        today17h59m = checkDateAndReturnTimestamp('2019-05-21 17:59');

        // Today 18h00.
        today18h00m = checkDateAndReturnTimestamp('2019-05-21 18:00');

        // Today 19h10.
        today19h10m = checkDateAndReturnTimestamp('2019-05-21 19:10');

        // Today 19h15.
        today19h15m = checkDateAndReturnTimestamp('2019-05-21 19:15');

        // Today 21h59.
        today21h59m = checkDateAndReturnTimestamp('2019-05-21 21:59');

        // Today 22h00.
        today22h00m = checkDateAndReturnTimestamp('2019-05-21 22:00');

        // Yesterday 19h15.
        yesterday19h15m = checkDateAndReturnTimestamp('2019-05-20 19:15');
    });

    it('should start at 18:00', () => {
        expect(MIN_HOUR).toBe(18);
    });

    it('should finish at 22:00', () => {
        expect(MAX_HOUR).toBe(22);
    });

    describe('given we\'re before 18:00', () => {

        it('should return no task', () => {
            // When it is 17:59.
            let now = today17h59m;

            // Then, task should not be available.
            let policyAnswer = policyCurriedForWhateverTask(now);
            expect(policyAnswer).toBe('NO_TASK');
        });

    });
    
    describe('given we\'re after 21:59', () => {

        it('should return no task', () => {
            // When it is 22:00.
            let now = today22h00m;

            // Then, task should not be available.
            let policyAnswer = policyCurriedForWhateverTask(now);
            expect(policyAnswer).toBe('NO_TASK');
        });

    });

    describe('given we\'re between 18:00 and 21:59', () => {

        it('should return a task from 18:00', () => {
            // When it is 18:00.
            let now = today18h00m;

            // Then, a task should be available.
            let policyAnswer = policyCurriedForWhateverTask(now);
            expect(policyAnswer).not.toBe('NO_TASK');
        });

        it('should return a task until 21:59', () => {
            // When it is 21:59.
            let now = today21h59m;

            // Then, a task should be available.
            let policyAnswer = policyCurriedForWhateverTask(now);
            expect(policyAnswer).not.toBe('NO_TASK');
        });

        describe('given the user has never completed a survey task', () => {

            const policyCurriedForSurveyTask = function (now: number): Task {
                // Given tasks are only available between 18:00 (inclusive) and 22:00 (exclusive).
                let minHour = MIN_HOUR;
                let maxHour = MAX_HOUR;

                // Given the user has never completed a survey task.
                let hasAtLeastOneSurveyBeenSubmitted = false;
                let lastSubmittedSurveyTimestamp = undefined;

                // Given no resting state tasks have yet been submitted (should not be relevant for the test).
                let hasAtLeastOneRestingStateTaskBeenSubmitted = false;
                let lastSubmittedRestingStateTaskTimestamp = undefined;

                // Run policy at set time for given survey parameters.
                return DailyTasksPolicy(
                    now,
                    minHour,
                    maxHour,
                    hasAtLeastOneSurveyBeenSubmitted,
                    lastSubmittedSurveyTimestamp,
                    hasAtLeastOneRestingStateTaskBeenSubmitted,
                    lastSubmittedRestingStateTaskTimestamp
                );
            };

            it('should return a survey task from 18:00', () => {
                // When it is 18:00.
                let now = today18h00m;

                // Then, a task should be available.
                let policyAnswer = policyCurriedForSurveyTask(now);
                expect(policyAnswer).toBe('SURVEY_TASK');
            });

            it('should return a survey task until 21:59', () => {
                // When it is 21:59.
                let now = today21h59m;

                // Then, a task should be available.
                let policyAnswer = policyCurriedForSurveyTask(now);
                expect(policyAnswer).toBe('SURVEY_TASK');
            });

        });

        describe('given the user has completed a survey task, but not today', () => {

            const policyCurriedForSurveyTask = function (now: number): Task {
                // Given tasks are only available between 18:00 (inclusive) and 22:00 (exclusive).
                let minHour = MIN_HOUR;
                let maxHour = MAX_HOUR;

                // Given no resting state task has yet been submitted (should not be relevant for the test).
                let hasAtLeastOneRestingStateTaskBeenSubmitted = false;
                let lastSubmittedRestingStateTaskTimestamp = undefined;

                // Given the user completed its previous survey task on 20st may 2019 (yesterday) at 19:15.
                let hasAtLeastOneSurveyBeenSubmitted = true;
                let lastSubmittedSurveyTimestamp = yesterday19h15m;

                // Run policy at set time.
                return DailyTasksPolicy(
                    now,
                    minHour,
                    maxHour,
                    hasAtLeastOneSurveyBeenSubmitted,
                    lastSubmittedSurveyTimestamp,
                    hasAtLeastOneRestingStateTaskBeenSubmitted,
                    lastSubmittedRestingStateTaskTimestamp
                );
            };

            it('should return a survey task from 18:00', () => {
                // When we're on the 21st may 2019 and it is 18:00.
                let now = today18h00m;

                // Then, a new survey task should be available.
                let policyAnswer = policyCurriedForSurveyTask(now);
                expect(policyAnswer).toBe('SURVEY_TASK');
            });

            it('should return a survey task until 21:59', () => {
                // When we're on the 21st may 2019 and it is 21:59.
                let now = today21h59m;

                // Then, a task should be available.
                let policyAnswer = policyCurriedForSurveyTask(now);
                expect(policyAnswer).toBe('SURVEY_TASK');
            });

        });

        describe('when the user just has completed a survey task 5 minutes ago', () => {

            const policyCurriedForRestingStateTask = function (
                hasAtLeastOneRestingStateTaskBeenSubmitted: boolean,
                lastSubmittedRestingStateTaskTimestamp?: number
            ): Task {
                // Given tasks are only available between 18:00 (inclusive) and 22:00 (exclusive).
                let minHour = MIN_HOUR;
                let maxHour = MAX_HOUR;

                // Given the user has completed its previous survey task on 21st may 2019 (today) at 19:10 (5 minutes before).
                let hasAtLeastOneSurveyBeenSubmitted = true;
                let lastSubmittedSurveyTimestamp = today19h10m;

                // When we're on the 21st may 2019 and it is 21:59.
                let now = today21h59m;

                // Run policy at set time.
                return DailyTasksPolicy(
                    now,
                    minHour,
                    maxHour,
                    hasAtLeastOneSurveyBeenSubmitted,
                    lastSubmittedSurveyTimestamp,
                    hasAtLeastOneRestingStateTaskBeenSubmitted,
                    lastSubmittedRestingStateTaskTimestamp
                );
            };

            describe('given the user has never completed a resting state task', () => {

                it('should return a resting state task', () => {
                    // Given the user has never completed a resting state task.
                    let hasAtLeastOneRestingStateTaskBeenSubmitted = false;
                    let lastSubmittedRestingStateTaskTimestamp = undefined;

                    // Then, a task should be available.
                    let policyAnswer = policyCurriedForRestingStateTask(hasAtLeastOneRestingStateTaskBeenSubmitted, lastSubmittedRestingStateTaskTimestamp);
                    expect(policyAnswer).toBe('RESTING_STATE_TASK');
                });

            });

            describe('given the user has already completed a resting state task outside the current task availability window', () => {

                it('should return a resting state task', () => {
                    // Given the user completed a resting state task yesterday at 19:15.
                    let hasAtLeastOneRestingStateTaskBeenSubmitted = true;
                    let lastSubmittedRestingStateTaskTimestamp = yesterday19h15m;

                    // Then, a new resting state task should be available.
                    let policyAnswer = policyCurriedForRestingStateTask(hasAtLeastOneRestingStateTaskBeenSubmitted, lastSubmittedRestingStateTaskTimestamp);
                    expect(policyAnswer).toBe('RESTING_STATE_TASK');
                });

            });

            describe('when the user has already completed a resting state task today at 19:15', () => {
                
                it('should not propose any task', () => {
                    // Given the user has completed a resting state task today at 19:15.
                    let hasAtLeastOneRestingStateTaskBeenSubmitted = true;
                    let lastSubmittedRestingStateTaskTimestamp = today19h15m;

                    // Then, a task should be available.
                    let policyAnswer = policyCurriedForRestingStateTask(hasAtLeastOneRestingStateTaskBeenSubmitted, lastSubmittedRestingStateTaskTimestamp);
                    expect(policyAnswer).toBe('NO_TASK');
                });

            });

        });

    });

});

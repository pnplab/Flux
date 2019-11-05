/**
 * @flow
 * @format
 * @lint-ignore-every XPLATJSCOPYRIGHT1
 */

import moment from 'moment';
import type { Task } from '../../crossplatform-components/Home/WeeklyTasksPolicy';
import { MIN_HOUR, MAX_HOUR, WEEKDAY, WeeklyTasksPolicy } from '../../crossplatform-components/Home/WeeklyTasksPolicy';

describe('task scheduling', () => {

    describe('WeeklyTasksPolicy', () => {

        const policyCurriedForWhateverTask = function (now: number): Task {
            // Given tasks are only available on sunday between 18:00 (inclusive)
            // and 22:00 (exclusive).
            let minHour = MIN_HOUR;
            let maxHour = MAX_HOUR;
            let weekday = WEEKDAY;

            // Given no tasks have yet been submitted (should not be relevant for the test).
            let hasAtLeastOneSurveyBeenSubmitted = false;
            let lastSubmittedSurveyTimestamp = undefined;
            let hasAtLeastOneRestingStateTaskBeenSubmitted = false;
            let lastSubmittedRestingStateTaskTimestamp = undefined;

            // Run policy at set time.
            return WeeklyTasksPolicy(
                now,
                minHour,
                maxHour,
                weekday,
                hasAtLeastOneSurveyBeenSubmitted,
                lastSubmittedSurveyTimestamp,
                hasAtLeastOneRestingStateTaskBeenSubmitted,
                lastSubmittedRestingStateTaskTimestamp
            );
        };

        let sunday17h59m, sunday18h00m, sunday21h59m, sunday22h00m,
            sunday19h10m, sunday19h15m,
            lastSunday19h15m,
            saturday19h15m, monday19h15m;

        beforeEach(() => {
            const checkDateAndReturnTimestamp = (dateStr: string) => {
                let momentObject = moment(dateStr, 'YYYY-MM-DD HH:mm');
                expect(momentObject.isValid()).toBeTruthy();

                let timestamp = momentObject.valueOf();
                return timestamp;
            };

            // Sunday 17h59.
            sunday17h59m = checkDateAndReturnTimestamp('2019-05-19 17:59');

            // Sunday 18h00.
            sunday18h00m = checkDateAndReturnTimestamp('2019-05-19 18:00');

            // Sunday 19h10.
            sunday19h10m = checkDateAndReturnTimestamp('2019-05-19 19:10');

            // Sunday 19h15.
            sunday19h15m = checkDateAndReturnTimestamp('2019-05-19 19:15');

            // Sunday 21h59.
            sunday21h59m = checkDateAndReturnTimestamp('2019-05-19 21:59');

            // Sunday 22h00.
            sunday22h00m = checkDateAndReturnTimestamp('2019-05-19 22:00');

            // Last sunday, 19h15.
            lastSunday19h15m = checkDateAndReturnTimestamp('2019-05-12 19:15');

            // Saturday 19h15.
            saturday19h15m = checkDateAndReturnTimestamp('2019-05-18 19:15');

            // Monday 19h15.
            monday19h15m = checkDateAndReturnTimestamp('2019-05-20 19:15');
        });

        it('should be on sunday', () => {
            expect(WEEKDAY).toBe(7);
        });

        it('should start at 18:00', () => {
            expect(MIN_HOUR).toBe(18);
        });

        it('should finish at 22:00', () => {
            expect(MAX_HOUR).toBe(22);
        });

        describe('given we\'re between 18:00 and 21:59 on saturday', () => {

            it('should return no task', () => {
                // When it is 19:15 on saturday.
                let now = saturday19h15m;

                // Then, task should not be available.
                let policyAnswer = policyCurriedForWhateverTask(now);
                expect(policyAnswer).toBe('NO_TASK');
            });

        });

        describe('given we\'re between 18:00 and 21:59 on monday', () => {

            it('should return no task', () => {
                // When it is 19:15 on monday.
                let now = monday19h15m;

                // Then, task should not be available.
                let policyAnswer = policyCurriedForWhateverTask(now);
                expect(policyAnswer).toBe('NO_TASK');
            });

        });

        describe('given we\'re before 18:00 on sunday', () => {

            it('should return no task', () => {
                // When it is 17:59 on SUNDAY.
                let now = sunday17h59m;

                // Then, task should not be available.
                let policyAnswer = policyCurriedForWhateverTask(now);
                expect(policyAnswer).toBe('NO_TASK');
            });

        });

        describe('given we\'re after 21:59 on sunday', () => {

            it('should return no task', () => {
                // When it is 22:00 on SUNDAY.
                let now = sunday22h00m;

                // Then, task should not be available.
                let policyAnswer = policyCurriedForWhateverTask(now);
                expect(policyAnswer).toBe('NO_TASK');
            });

        });

        describe('given we\'re between 18:00 on sunday and 21:59', () => {

            it('should return a task from 18:00', () => {
                // When it is 18:00.
                let now = sunday18h00m;

                // Then, a task should be available.
                let policyAnswer = policyCurriedForWhateverTask(now);
                expect(policyAnswer).not.toBe('NO_TASK');
            });

            it('should return a task until 21:59', () => {
                // When it is 21:59.
                let now = sunday21h59m;

                // Then, a task should be available.
                let policyAnswer = policyCurriedForWhateverTask(now);
                expect(policyAnswer).not.toBe('NO_TASK');
            });

            describe('given the user has never completed a survey task', () => {

                const policyCurriedForSurveyTask = function (now: number): Task {
                    // Given tasks are only available on sunday between 18:00
                    // (inclusive) and 22:00 (exclusive).
                    let minHour = MIN_HOUR;
                    let maxHour = MAX_HOUR;
                    let weekday = WEEKDAY;

                    // Given the user has never completed a survey task.
                    let hasAtLeastOneSurveyBeenSubmitted = false;
                    let lastSubmittedSurveyTimestamp = undefined;

                    // Given no resting state tasks have yet been submitted (should not be relevant for the test).
                    let hasAtLeastOneRestingStateTaskBeenSubmitted = false;
                    let lastSubmittedRestingStateTaskTimestamp = undefined;

                    // Run policy at set time for given survey parameters.
                    return WeeklyTasksPolicy(
                        now,
                        minHour,
                        maxHour,
                        weekday,
                        hasAtLeastOneSurveyBeenSubmitted,
                        lastSubmittedSurveyTimestamp,
                        hasAtLeastOneRestingStateTaskBeenSubmitted,
                        lastSubmittedRestingStateTaskTimestamp
                    );
                };
                it('should return a survey task from 18:00', () => {
                    // When it is 18:00 on sunday.
                    let now = sunday18h00m;

                    // Then, a task should be available.
                    let policyAnswer = policyCurriedForSurveyTask(now);
                    expect(policyAnswer).toBe('SURVEY_TASK');
                });

                it('should return a survey task until 21:59', () => {
                    // When it is 21:59 on sunday.
                    let now = sunday21h59m;

                    // Then, a task should be available.
                    let policyAnswer = policyCurriedForSurveyTask(now);
                    expect(policyAnswer).toBe('SURVEY_TASK');
                });

            });

            describe('given the user has completed a survey task, but not this sunday', () => {

                const policyCurriedForSurveyTask = function (now: number): Task {
                    // Given tasks are only available on sunday between 18:00
                    // (inclusive) and 22:00 (exclusive).
                    let minHour = MIN_HOUR;
                    let maxHour = MAX_HOUR;
                    let weekday = WEEKDAY;

                    // Given no resting state task has yet been submitted (should not be relevant for the test).
                    let hasAtLeastOneRestingStateTaskBeenSubmitted = false;
                    let lastSubmittedRestingStateTaskTimestamp = undefined;

                    // Given the user completed its previous survey task on 12th may 2019 (past sunday) at 19:15.
                    let hasAtLeastOneSurveyBeenSubmitted = true;
                    let lastSubmittedSurveyTimestamp = lastSunday19h15m;

                    // Run policy at set time.
                    return WeeklyTasksPolicy(
                        now,
                        minHour,
                        maxHour,
                        weekday,
                        hasAtLeastOneSurveyBeenSubmitted,
                        lastSubmittedSurveyTimestamp,
                        hasAtLeastOneRestingStateTaskBeenSubmitted,
                        lastSubmittedRestingStateTaskTimestamp
                    );
                };

                it('should return a survey task from 18:00', () => {
                    // When we're sunday and it is 18:00.
                    let now = sunday18h00m;

                    // Then, a new survey task should be available.
                    let policyAnswer = policyCurriedForSurveyTask(now);
                    expect(policyAnswer).toBe('SURVEY_TASK');
                });

                it('should return a survey task until 21:59', () => {
                    // When we're sunday and it is 21:59.
                    let now = sunday21h59m;

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
                    // Given tasks are only available on sunday between 18:00
                    // (inclusive) and 22:00 (exclusive).
                    let minHour = MIN_HOUR;
                    let maxHour = MAX_HOUR;
                    let weekday = WEEKDAY;

                    // Given the user has completed its previous survey task on 19th may 2019 (today/sunday) at 19:10 (5 minutes before).
                    let hasAtLeastOneSurveyBeenSubmitted = true;
                    let lastSubmittedSurveyTimestamp = sunday19h10m;

                    // When we're on the 19th may 2019 and it is 21:59.
                    let now = sunday21h59m;

                    // Run policy at set time.
                    return WeeklyTasksPolicy(
                        now,
                        minHour,
                        maxHour,
                        weekday,
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
                        // Given the user completed a resting state task last sunday at 19:15.
                        let hasAtLeastOneRestingStateTaskBeenSubmitted = true;
                        let lastSubmittedRestingStateTaskTimestamp = lastSunday19h15m;

                        // Then, a new resting state task should be available.
                        let policyAnswer = policyCurriedForRestingStateTask(hasAtLeastOneRestingStateTaskBeenSubmitted, lastSubmittedRestingStateTaskTimestamp);
                        expect(policyAnswer).toBe('RESTING_STATE_TASK');
                    });

                });

                describe('when the user has already completed a resting state task today at 19:15', () => {

                    it('should not propose any task', () => {
                        // Given the user has completed a resting state task today at 19:15.
                        let hasAtLeastOneRestingStateTaskBeenSubmitted = true;
                        let lastSubmittedRestingStateTaskTimestamp = sunday19h15m;

                        // Then, a task should be available.
                        let policyAnswer = policyCurriedForRestingStateTask(hasAtLeastOneRestingStateTaskBeenSubmitted, lastSubmittedRestingStateTaskTimestamp);
                        expect(policyAnswer).toBe('NO_TASK');
                    });

                });

            });

        });

    });

});
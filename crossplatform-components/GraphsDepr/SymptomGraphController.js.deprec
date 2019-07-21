/*
 * @flow
 *
 * @description
 * Startup screen, showing the button to access the survey depending on the
 * time.
 */

import type { Question } from '../../crossplatform-model/immutable-db/QuestionType';
import type { State as AppState } from '../../crossplatform-model/memory-db/types';

import React, { Component } from 'react';
import { View } from 'react-native';
import { connect } from 'react-redux';
import styled from 'styled-components';

import QuestionData from '../../crossplatform-model/immutable-db/QuestionData';
import SymptomGraphView from './SymptomGraphView';
import Layout from '../Layout';

// Configure types.
type Props = {
    +symptomIds: Array<string>,
    +symptomRecords: $PropertyType<$PropertyType<AppState, 'symptomGraph'>, 'symptomRecords'>,
};
type State = {
    width: number,
    height: number,
};

// Configure component logic.
class SymptomGraphController extends Component<Props, State> {

    static defaultProps = {

    };

    constructor(props) {
        super(props);

        this.state = {
            width: 0,
            height: 0
        };
    }

    surveyQuestions: Array<Question> = QuestionData.toJS();

    onLayout = evt => {
        // Retrieve layout dimensions so to be able to set required
        // SurveyTaskView dimensions in pixel.
        let { width, height } = evt.nativeEvent.layout;
           
        // @note We do not use Component here, therefore react-native
        //     peTasks deep state comparisons, not shallow ones.
        this.setState({
            width,
            height
        });
    }

    // @todo memoize based on symptomRecords update
    processDomain(records_: $PropertyType<$PropertyType<AppState, 'symptomGraph'>, 'symptomRecords'>): {| x: [number, number], y: [number, number] |} {
        // @todo change filter depending on month's values

        const records = records_;
        const symptomIds = Object.keys(records);

        const nowDate = new Date();
        const nowTimestamp = nowDate.getTime();
        let minTimestamp, maxTimestamp, minTimestampDate, maxTimestampDate, minDay, maxDay;

        minTimestamp = symptomIds
            .map(
                (symptomId) => Object
                    .keys(records[symptomId] || [])
                    .reduce(
                        (prevTimestamp, currTimestamp=0) =>
                            +currTimestamp > +prevTimestamp ? +prevTimestamp : +currTimestamp
                        , nowTimestamp
                    )
            )
            .reduce(
                (prevTimestamp, currTimestamp=nowTimestamp) =>
                    +currTimestamp > +prevTimestamp ? +prevTimestamp : +currTimestamp
                , nowTimestamp
            ); //le min de records[symptoms.qd]

        maxTimestamp = symptomIds
            .map(
                (symptomId) => Object
                    .keys(records[symptomId] || [])
                    .reduce(
                        (prevTimestamp, currTimestamp = 0) =>
                            +currTimestamp > +prevTimestamp ? +currTimestamp : +prevTimestamp
                        , 0
                    )
            )
            .reduce(
                (prevTimestamp, currTimestamp = nowTimestamp) => 
                    +currTimestamp > +prevTimestamp ? +currTimestamp : +prevTimestamp
                , 0
            );

        minTimestampDate = new Date(+minTimestamp);
        maxTimestampDate = new Date(+maxTimestamp);

        // Ranges from negative (previous month) to positive (for ~30 day in total range).
        minDay = 
            minTimestampDate.getMonth() === nowDate.getMonth() 
                ? 1
                : minTimestampDate.getUTCDate()
                    - new Date(minTimestampDate.getFullYear(), minTimestampDate.getMonth()+1, 0).getDate() // number of day in month
                    - 1;

        maxDay =
            minTimestampDate.getMonth() === maxTimestampDate.getMonth() 
                ? new Date(maxTimestampDate.getFullYear(), maxTimestampDate.getMonth()+1, 0).getDate()
                : new Date(maxTimestampDate.getFullYear(), maxTimestampDate.getMonth()+1, 0).getDate()
                    + minDay;

        return {
            x: [ minDay, maxDay ],
            y: [ 0, 100 ]
        };
    }

    processHeaders(symptomIds: Array<string>): Array<Question> {
        return symptomIds.map(id => this.surveyQuestions.filter(q => q.id === id)[0]);
    }

    processData(records_: $PropertyType<$PropertyType<AppState, 'symptomGraph'>, 'symptomRecords'>): Array<{| +symptomId: string, +label: string, +values: Array<{| +x: number, +y: number |}> |}> {
        const records = records_;
        const symptomIds = Object.keys(records);

        // Parse records into graph-like data structure.
        return symptomIds.map(
            (symptomId) => (
                {
                    symptomId: symptomId,
                    label: this.surveyQuestions.filter(q => q.id === symptomId)[0].label,
                    values: Object
                        .keys(records[symptomId]) // @note will never be undefined
                        .map((timestamp) => {
                            const currMonth = new Date().getMonth(); // 0->11

                            const date = new Date(+timestamp);
                            const dateMonth = date.getMonth(); // 0->11
                            const dateDayInMonth = date.getDate();
                            const dateNumberOfDayInMonth = new Date(date.getFullYear(), dateMonth+1, 0).getDate();

                            return {
                                x: dateMonth === currMonth
                                    ? dateDayInMonth
                                    : dateDayInMonth
                                        - dateNumberOfDayInMonth // number of day in month
                                        - 1,
                                y: records[symptomId][timestamp]*100
                            };
                        })
                }
            )
        );
    }

    render() {
        return (
            <Layout>
                <OnLayoutWrapper onLayout={this.onLayout}>
                    {
                        this.state.width && this.state.height &&
                        <SymptomGraphView 
                            width={this.state.width}
                            height={this.state.height}

                            filter={'month'}
                            onFilterButtonPressed={(filter) => console.warn(`@todo implement onFilterButtonPressed! [${filter}]`)}

                            colors={[
                                '#3D7668', // green
                                '#395676', // navy
                                '#9CCBD9', // light blue
                                '#FEBD3C', // orange
                                '#A43134', // red
                            ]}
                            headers={this.processHeaders(this.props.symptomIds)}
                            domain={this.processDomain(this.props.symptomRecords)}
                            data={this.processData(this.props.symptomRecords)}
                        /> || <></>
                    }
                </OnLayoutWrapper>
            </Layout>
        );
    }

}

const OnLayoutWrapper = styled(View)`
        /* 100% height */
        flex: 1;

        /* Position placeholder for carousel pagination's view. */
        position: relative;
    `;

// Bind comoponent to redux.
const mapStateToProps = (state: AppState /*, ownProps*/) => ({
    symptomIds: state.symptomGraph.symptomIds,
    symptomRecords: state.symptomGraph.symptomRecords
});

const mapDispatchToProps = {

};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(SymptomGraphController);

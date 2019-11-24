/*
 * @flow
 *
 * @note
 * Optimization tips to read: `https://github.com/archriss/react-native-snap-carousel/blob/master/doc/TIPS_AND_TRICKS.md#optimizing-perTaskance`
 */

import React, { PureComponent } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import memoize from 'memoize-one';

import type { Question } from '../../crossplatform-model/immutable-db/QuestionType';

import styled from 'styled-components';
import { Text, Button, Icon } from '../../crossplatform-theme/pnplab-components';
import Slider from 'react-native-slider';

// import Card from './SurveyTaskLeanCardView';
// import styled from 'styled-components';

type State = {
    +questionValues: { [questionId: string]: number }
};
type Props = {
    +data: Array<Question>,
    +missingQuestionIds: Array<string>,
    +onValue: (questionId: string, value: number) => void,
    +onSubmit: () => void,
};

const sliderIosStyle = StyleSheet.create({
    track: {
        height: 2,
        borderRadius: 1,
    },
    thumb: {
        width: 30,
        height: 30,
        borderRadius: 30 / 2,
        backgroundColor: 'white',
        shadowColor: 'black',
        shadowOffset: {width: 0, height: 2},
        shadowRadius: 2,
        shadowOpacity: 0.35,
    }
});

class SurveyTaskLeanView extends PureComponent<Props, State> {

    static defaultProps = {

    };

    constructor(props: Props) {
        super(props);

        this.state = {
            questionValues: {}
        };
    }

    onSlidingCompleted = (questionId: string, value: number) => {
        // Store slider value.
        this.props.onValue(questionId, value);
    }
    onValueChanged = (value) => {
        // @todo?
    }

    onSubmit = () => {
        this.props.onSubmit();
    }

    keyExtractor = (item: 'notice' | Question | 'submit', index: number) => typeof item.id !== 'undefined' ? item.id : item;

    renderItem = ({ item, separators, index }: { item: 'notice' | Question | 'submit', separators: any }) => (
        item === 'notice' &&
            <NoticeCard />
        || item === 'submit' &&
            <SubmitCard onSubmit={this.onSubmit} hasError={this.props.missingQuestionIds.length !== 0} />
        || true &&
            <QuestionCard
                value={typeof this.state.questionValues[item.id] === 'undefined' ? 0.5 : this.state.questionValues[item.id]}
                showError={this.props.missingQuestionIds.includes(item.id)}
                onSlidingCompleted={this.onSlidingCompleted}
                onValueChanged={this.onValueChanged}
                item={item}

                isOdd={index % 2 === 0}
            />
    );

    // Helper function to prepend and append placeholder to be able to add
    // additional cards to carousel.
    decorateData = memoize((data: Array<Question>) => ['notice', ...data, 'submit'])

    render() {
        // Prepend and append placeholder to be able to add additional cards to
        // carousel.
        // let cards = this.decorateData(this.props.data);
        // ItemSeparatorComponent={Platform.OS !== 'android' && ({highlighted}) => (
        //   <View style={[style.separator, highlighted && {marginLeft: 0}]} />
        // )}

        // @warning missingQuestionIds reference must change to rerender.

        return (
            <>
                <FlatList
                    data={this.decorateData(this.props.data)}
                    extraData={this.props.missingQuestionIds}
                    keyExtractor={this.keyExtractor}
                    renderItem={this.renderItem}
                />
            </>
        );
    }
}

const Card = styled(View)`
        /*height: 100%;*/
        width: 100%;
        justify-content: center;
        align-content: center;

        padding: 10px;
        border-radius: 5px;
        /*background-color: white;*/
    `;

const CardTitle = styled(Text)
    .attrs({
        adjustsFontSizeToFit: true,
        numberOfLines: 4
    })`
        font-size: 15;
        text-align: center;
        
        /* for some reason padding alone doesn't work inside styled-components.. */
        padding-left: 10;
        padding-right: 10;
        
        color: #222;
    `;

const NoticeCard = () => 
    <Card>
        <CardTitle>Indiquez la sévérité de vos symptomes pour aujourd'hui uniquement.</CardTitle>
        <NoticeCardIconWrapper>
            <NoticeCardIcon type="Entypo" name="chevron-down" />
        </NoticeCardIconWrapper>
    </Card>;

const NoticeCardIconWrapper = styled(View)`
        flex: none;

        /* Align icon to center. */
        flex-direction: row;
        justify-content: center;
    `;

const NoticeCardIcon = styled(Icon).attrs(
    {
        fontSize: 35
    })`
        margin-top: 15px;
    `;

const QuestionCard = ({ value, onSlidingCompleted, onValueChanged, item, isOdd, showError }) =>
    <View style={{
        flex: 1,
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        backgroundColor: isOdd ? 'transparent' : '#EFEFEF',
        padding: 15,
        paddingTop: 10,
        paddingBottom: 10,
        borderLeftWidth: showError ? 5 : 0,
        borderColor: 'red'
    }}>
        <Text style={{textAlign: 'left', fontSize: 13, color: '#333'}}>{item.text}</Text>
        <Slider
            value={value}
            onSlidingComplete={v => onSlidingCompleted(item.id, v)}
            onValueChange={onValueChanged}

            style={{width: '100%', height: 60, marginTop: -10, marginBottom: -10}}
            trackStyle={sliderIosStyle.track}
            thumbStyle={sliderIosStyle.thumb}
            minimumTrackTintColor="#1073ff"
            maximumTrackTintColor="#b7b7b7"

            thumbTouchSize={{width: 60, height: 60}}
        />
        {/* <Slider value={typeof this.state.questionValues[item.id] === 'undefined' ? 0.5 : this.state.questionValues[item.id]} style={{flex: 1, transform: [{ scaleX: 3 }, { scaleY: 3 }], marginLeft: '30%', marginRight: '30%'}} onSlidingComplete={this.onSlidingCompleted} /> --> */}
        <View style={{width: '100%', flexDirection: 'row', backgroundColor: 'transparent', justifyContent: 'space-between', marginTop: -15, zIndex: -1}}>
            <Text style={{fontVariant: ['small-caps'], fontSize: 11, color: '#333'}}>{item.guideline.left}</Text>
            <Text style={{fontVariant: ['small-caps'], fontSize: 11, color: '#333'}}>{item.guideline.right}</Text>
        </View>
    </View>;

const SubmitCard = ({ onSubmit, hasError }) =>
    // @todo icon="checkmark-circle"
    <Card style={{paddingLeft: '20%', paddingRight: '20%', paddingTop: 20, paddingBottom: 30}}>
        <Button onPress={onSubmit} disabled={hasError}>
            VALIDER
        </Button>
    </Card>;


export default SurveyTaskLeanView;
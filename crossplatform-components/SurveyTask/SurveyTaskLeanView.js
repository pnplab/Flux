/*
 * @flow
 *
 * @note
 * Optimization tips to read: `https://github.com/archriss/react-native-snap-carousel/blob/master/doc/TIPS_AND_TRICKS.md#optimizing-perTaskance`
 */

import React, { PureComponent } from 'react';
import { FlatList, View, Slider } from 'react-native';
import memoize from 'memoize-one';

import type { Question } from '../../crossplatform-model/immutable-db/QuestionType';

import styled from 'styled-components';
import { Text, Button, Icon } from '../../crossplatform-theme/pnplab-components';

// import Card from './SurveyTaskLeanCardView';


// import styled from 'styled-components';

type State = {
    questionValues: { [questionId: string]: number }
};
type Props = {
    +data: Array<Question>,
    +onValue: (questionId: string, value: number) => void,
    +onSubmit: () => void,
};

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
    }
    )`
        margin-top: 15px;
    `;

const SubmitCard = ({ onSubmit }) => 
// @todo icon="checkmark-circle"
    <Button onPress={onSubmit} disabled={false}>
        VALIDER
    </Button>;

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

    onSubmit = () => {
        this.props.onSubmit();
    }

    keyExtractor = (item: 'notice' | Question | 'submit', index: number) => typeof item.id !== 'undefined' ? item.id : item;

    renderItem = ({ item, separators }: { item: 'notice' | Question | 'submit', separators: any }) => (
        // <Card
        //     item={item}
        //     onSlidingCompleted={this.onSlidingCompleted}
        //     onSubmit={this.onSubmit}
        // ></Card>
        item === 'notice' && 
            <NoticeCard />
        || item === 'submit' &&
            <SubmitCard onSubmit={this.onSubmit} />
        || true &&
            <View style={{flex: 1, alignItems: 'flex-start', justifyContent: 'flex-start', backgroundColor: 'transparent', padding: 15}}>
                <Text italic style={{textAlign: 'left'}}>{item.text}</Text>
                <View style={{flexDirection: 'row', justifyContent: 'center', backgroundColor: 'transparent'}}>
                    <Text style={{padding: 5, justifyContent: 'center'}}>-</Text>
                    <Slider value={typeof this.state.questionValues[item.id] === 'undefined' ? 0.5 : this.state.questionValues[item.id]} style={{flex: 1}} onSlidingComplete={this.onSlidingCompleted} />
                    <Text style={{padding: 5, justifyContent: 'center'}}>+</Text>
                </View>
            </View>
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

        return (
            <>
                <FlatList
                    data={this.decorateData(this.props.data)}
                    keyExtractor={this.keyExtractor}
                    renderItem={this.renderItem}
                />
            </>
        );
    }
}

export default SurveyTaskLeanView;
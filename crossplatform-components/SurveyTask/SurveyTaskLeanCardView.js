import React from 'react';
import { View } from 'react-native';
import { RNFluidicSlider } from 'react-native-fluidic-slider';

import type { Question } from '../../crossplatform-model/immutable-db/QuestionType';

import styled from 'styled-components';
import { Text, Button, Icon } from '../../crossplatform-theme/pnplab-components';

// // renderItem API is defined as a function with `{ item, index }` args in the 
// // react-native-snap-carousel's doc. We've curried this function with 
// // `currentCardIndex`, `onSlidingCompleted` & `onSubmit`.
// const renderItem = (
//     currentCardIndex: number,
//     onSlidingCompleted: (id: string, value: number, cardIndex?: number) => void,
//     onSubmit: () => void,
//     { item, index }: { item: Question | 'notice' | 'submit', index: number }
// ) => 


export default ({ item, onSlidingCompleted, onSubmit}) => 
    <CardWrapper>
        {item === 'notice' && 
            <NoticeCard />
        || item === 'submit' &&
            <SubmitCard
                onSubmit={() => onSubmit()}
            />
        || true &&
            <QuestionCard
                id={item.id}
                text={item.text}
                onSlidingCompleted={onSlidingCompleted}
            />
        }
    </CardWrapper>;

// // Wrap card rendering in a React.memo to avoid useless rerendeing.
// // @note The optimization benefice seems quite important!
// // @warning Be careful, it renders all the question only once.
// const OptimizedRendering = ({ item, index, onSlidingCompleted, onSubmit } ) => 
//     <CardWrapper>
//         {item === 'notice' && 
//             <NoticeCard />
//         || item === 'submit' &&
//             <SubmitCard
//                 onSubmit={() => onSubmit()}
//             />
//         || true &&
//             <QuestionCard
//                 id={item.id}
//                 text={item.text}
//                 onSlidingCompleted={(id, value) => onSlidingCompleted(id, value, index)}
//             />
//         }
//     </CardWrapper>;

const CardWrapper = styled(View)`
        padding: 30px;
        justify-content: flex-start;
        align-content: flex-start;
        background-color: transparent;
        flex: 1;
        position: relative;
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

        /* Prevent the icon from changing text alignment. */
        height: 36px;
        margin-bottom: -36px;
    `;

const NoticeCardIcon = styled(Icon).attrs(
    {
        fontSize: 35
    }
    )`
        margin-top: 15px;
    `;

const SubmitCard = ({ onSubmit }) => 
    <Card>
        <View style={{marginTop: 15, paddingLeft: 25, paddingRight: 25}}>
            <Button onPress={onSubmit} icon="checkmark-circle">
                VALIDER
            </Button>
        </View>
    </Card>;

const QuestionCard = ({ id, text, onSlidingCompleted }) =>
    <Card>
        <View style={{flex: 1, alignItems: 'flex-start', justifyContent: 'flex-start', backgroundColor: 'transparent', padding: 15}}>
            <Text italic style={{textAlign: 'left'}}>{text}</Text>
            <View style={{flexDirection: 'row', justifyContent: 'center', backgroundColor: 'transparent'}}>
                <Text style={{padding: 5, justifyContent: 'center'}}>-</Text>
                <Slider value={typeof this.state.questionValues[item.id] === 'undefined' ? 0.5 : this.state.questionValues[item.id]} style={{flex: 1}} onSlidingComplete={this.onSlidingComplete} />
                <Text style={{padding: 5, justifyContent: 'center'}}>+</Text>
            </View>
        </View>;

        {/*
        <CardTitle>{text}</CardTitle>
        <SliderWrapper>
            <RNFluidicSlider
                barColor="#F8F8F8"
                barTextColor="#555555"
                bubbleColor="#333333"
                bubbleTextColor="#333333"
            />
                endTracking={ value => onSlidingCompleted(id, value) }
        </SliderWrapper>
        */}
    </Card>;

const SliderWrapper = styled(View)`
        flex-direction: row;
        justify-content: center;
        background-color: transparent;
        margin-top: -45px;
        margin-bottom: -20px;
        margin-left: -30px;
        margin-right: -30px;
    `;

const Card = styled(View)`
        height: 100%;
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

// export default renderItem;
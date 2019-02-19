/*
 * @flow
 *
 * @note
 * Optimization tips to read: `https://github.com/archriss/react-native-snap-carousel/blob/master/doc/TIPS_AND_TRICKS.md#optimizing-perTaskance`
 */

import React, { PureComponent } from 'react';
import { View } from 'react-native';
import Carousel, { Pagination } from 'react-native-snap-carousel';
import memoize from 'memoize-one';

import type { LayoutEvent } from 'react-native/Libraries/Types/CoreEventTypes';
import type { Question } from '../../crossplatform-model/immutable-db/QuestionType';

import styled from 'styled-components';
import SurveyTaskCardView from './SurveyTaskCardView';

type State = {
    dimensions: {
        width?: number,
        height?: number
    },
    itemIndex: number
};
type Props = {
    +data: Array<Question>,
    +onValue: (questionId: string, value: number) => void,
    +onSubmit: () => void,
};

class SurveyTaskView extends PureComponent<Props, State> {

    static defaultProps = {
        
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            // Store view dimensions, as SurveyTaskView requires manual 
            // width/height set in pixels.
            dimensions: {
                width: undefined,
                height: undefined
            },
            // Store itemIndex to be able to update the pagination.
            itemIndex: 1,
        };
    }

    // Store carouselRef, as having access to the carousel's object
    // reference is mandatory to automatically snap to next item when
    // the user sets the slider's value.
    // @note We do not store this value in state as it should never
    //     trigger rerendering of the current components or childrens'
    //     and should always be as up to date as possible (`react#setState` 
    //     could cause asynchronicity issues).
    // @warning Relying on carouselRef can make us step out of react's
    //     unidirectional data flow.
    carouselRef: any;

    onLayout = (evt: LayoutEvent) => {
        // Retrieve layout dimensions so to be able to set required
        // SurveyTaskView dimensions in pixel.
        let { width, height } = evt.nativeEvent.layout;
           
        // @note We do not use PureComponent here, therefore react-native
        //     peTasks deep state comparisons, not shallow ones.
        this.setState({
            dimensions: {
                width,
                height
            }
        });
    }

    onCarouselRef = (current: *) => {
        // Retrieve carousel ref so to be able to automatically snap to next
        // item when user sets slider's value.
        this.carouselRef = current;
    }

    onBeforeSnapToItem = (index: number) => {
        // Keep track of current index when it changes, to be able to update
        // pagination.
        // @note We use `onBeforeSnapToItem` instead of `onSnapToItem` to 
        //      increase enabled/disabled interaction's responsivity on card
        //      views.
        this.setState({
            itemIndex: index
        });
    }

    onSlidingCompleted = (questionId: string, value: number, cardIndex: number) => {
        // Switch to next card!
        // @note We don't need  to worry about depassing the card index count, 
        //     as the last card doesn't contain a slider but a button.
        this.carouselRef.snapToItem(cardIndex + 1, true, true);

        // Store slider value.
        this.props.onValue(questionId, value);
    }

    onSubmit = () => {
        this.props.onSubmit();
    }

    // Helper function to prepend and append placeholder to be able to add
    // additional cards to carousel.
    decorateData = memoize((data: Array<Question>) => ['notice', ...data, 'submit'])

    render() {
        // Prepend and append placeholder to be able to add additional cards to
        // carousel.
        let cards = this.decorateData(this.props.data);

        // Curry renderItem function with `currentCardIndex`,
        // `onSlidingCompleted` & `onSubmit` callbacks.
        let renderItem = SurveyTaskCardView.bind(undefined, this.state.itemIndex, this.onSlidingCompleted, this.onSubmit);

        return (
            <OnLayoutWrapper onLayout={this.onLayout}>
                {this.state.dimensions.width && this.state.dimensions.height && <>
                    <Carousel_
                        data={cards}

                        ref={this.onCarouselRef}
                        onBeforeSnapToItem={this.onBeforeSnapToItem}
                        
                        sliderWidth={this.state.dimensions.width}
                        itemWidth={this.state.dimensions.width}
                        sliderHeight={this.state.dimensions.height}
                        itemHeight={this.state.dimensions.height / 3}

                        renderItem={renderItem}
                    />
                    <PaginationWrapper>
                        <Pagination_
                            dotsLength={cards.length}
                            activeDotIndex={this.state.itemIndex}
                        />
                    </PaginationWrapper>
                </>}
            </OnLayoutWrapper>
        );
    }
}

const OnLayoutWrapper = styled(View)`
        /* 100% height */
        flex: 1;

        /* Position placeholder for carousel pagination's view. */
        position: relative;
    `;

const PaginationWrapper = styled(View)`
        position: absolute;
        right: -15px;
        top: 20px;
        bottom: 0px;
        justify-content: center;
    `;

const Carousel_ = styled(Carousel).attrs({
        firstItem: 1,
        enableMomentum: false,
        enableSnap: true,
        vertical: true,
        inactiveSlideOpacity: 0.7,
        inactiveSlideScale: 0.9
    }
    )`
    `;

const Pagination_ = styled(Pagination).attrs({
        vertical: true,
        dotStyle: {
            width: 10,
            height: 10,
            borderRadius: 5,
            marginHorizontal: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.92)',
        }, 
        inactiveDotStyle: {
            // Define styles for inactive dots here
        },
        inactiveDotOpacity: 0.4,
        inactiveDotScale: 0.6,
        containerStyle: {
            backgroundColor: 'transparent'
        }
    }
    )`
    `;

export default SurveyTaskView;
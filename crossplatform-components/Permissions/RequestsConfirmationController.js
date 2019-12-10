/*
 * @flow
 *
 * @pre
 * This screen should only be shown if app has not been authorized yet !
 *
 * @description
 * Setup screen. User set a password that sets up & activates the study.
 */

import React, { PureComponent } from 'react';

import RequestsConfirmationView from './RequestsConfirmationView';

// Configure types.
type Props = {
    +onStepFinished: () => void
};
type State = {
};

// Configure component logic.
export default class RequestsConfirmation extends PureComponent<Props, State> {

    // Set displayName for debug and bugreport navigation tracing.
    static displayName = 'RequestsConfirmation';

    constructor(props: Props) {
        super(props);

        this.state = {

        };
    }

    async componentDidMount() {

    }

    // Go to next step when the user pushes the submit button!
    onSubmit = () => {
        this.props.onStepFinished();
    }

    render() {
        return (
            <RequestsConfirmationView
                onSubmit={this.onSubmit}
            />
        );
    }

}

/**
 * @flow
 */

import type { Element } from 'react';
import RequestPermissionsNoticeView from './RequestPermissionsNoticeView';

// The controller is simply the view w/ displayName in this case.
type RequestPermissionsControllerType = {
    // Functional react render functor call w/ props as arg.
    ({ +onStepFinished: () => void }): Element<any>,
    // Display name static property.
    displayName: string
};
const RequestPermissionsController: RequestPermissionsControllerType = RequestPermissionsNoticeView;

// Set displayName for debug and bugreport navigation tracing.
RequestPermissionsController.displayName = 'RequestPermissionsNotice';

export default RequestPermissionsController;

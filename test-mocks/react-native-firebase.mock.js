/**
 * @flow
 */

jest.mock('react-native-firebase', () => {
    // // Recursively mock the object. Too much chained stuffs and I
    // // couldn't find any complete mock on the internet.
    //
    // // @note For some reason doesn't work with jest: `TypeError: Cannot
    // // read property 'Importance' of undefined .notifications.Android
    // // .Importance`. I guess it's babel not being able to transpile
    // // the Proxy.
    // // Tried different implementation and got `RangeError: Maximum call stack
    // // size exceeded` albeit no infinite recursion found.
    //
    // function Tree() {
    //     const functor = jest.fn(() => { return Tree(); });
    //     return new Proxy(functor, {
    //         get: function(target, key, receiver) {
    //             if (!(key in target)) {
    //                 target[key] = Tree();  // auto-create a sub-Tree
    //             }
    //             return Reflect.get(target, key, receiver);
    //         },
    //         apply: function(target, thisArg, argumentsList) {
    //             return Reflect.apply(target, thisArg, argumentsList);
    //         }
    //     });
    // }
    //
    // return Tree();

    return {
        messaging: jest.fn(() => {
            return {
                hasPermission: jest.fn(() => Promise.resolve(true)),
                subscribeToTopic: jest.fn(),
                unsubscribeFromTopic: jest.fn(),
                requestPermission: jest.fn(() => Promise.resolve(true)),
                getToken: jest.fn(() => Promise.resolve('myMockToken'))
            };
        }),

        // Hard to mock notifications: Saw the following usage from the same
        // official doc page, and need them all. Also, they rely on a builder
        // pattern which makes this timely to mock. We'll rely on e2e testing.
        // - `new firebase.notifications.Android...`
        // - `firebase.notifications.Android...`
        // - `firebase.notifications().android...`
        notifications: jest.fn(() => {
            return {
                onNotification: jest.fn(),
                onNotificationDisplayed: jest.fn()
            };
        })
    };
});

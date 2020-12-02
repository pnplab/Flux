const Koa = require('koa');
const Router = require('koa-router');
const koaProtect = require('koa-protect').koa;
const koaHelmet = require('koa-helmet');
const app = module.exports = new Koa();
const server = require('http').createServer(app.callback());
const router = new Router();
const request = require('request');
const koaBody = require('koa-body');
const uuidv4 = require('uuid').v4;

const dataExchangeName = 'data';

// @warning non-idempotent REST PUT. @todo use POST instead - more scalable
router.put('/users/:id', koaBody(), async (ctx, next) => {
    const userId = ctx.params.id;
    const password = ctx.request.body.password;

    // check userId: min 6 chars, [a-zA-Z0-9_], in order to prevent url str
    // interpolation security issues.
    if (typeof userId === 'undefined' || !/[\w]{6,}/.test(userId)) {
        ctx.body = {
            status: 'error',
            message: 'userId has bad format. min 6 chars, [a-zA-Z0-9_].'
        };
        ctx.status = 400;
        await next();
    }

    // check password: min 6 chars, any char.
    else if (typeof password === 'undefined' || !/.{6,}/.test(password)) {
        ctx.body = {
            status: 'error',
            message: 'password has bad format. min 6 chars.'
        };
        ctx.status = 400;
        await next();
    }

    // if parameters are valid.
    else {
        // Ensure user does not already exist (would allow to change any user
        // password through API).
        // Returns user exist
        let doesUserExist = await new Promise((resolve, reject) => {
            request.get(
                // api doc: http://rabbitmq:15672/api/index.html
                `http://rabbitmq:15672/api/users/${userId}`,
                {
                    // rmq admin user credentials
                    'auth': {
                        'user': 'guest',
                        'pass': 'guest'
                    },
                    'json': true
                },
                async (error, response, body) => {
                    // user exist if http req. is successful 2xx.
                    if (response && response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
                        resolve(true);
                    }
                    // user doesn't exist if 404
                    else if (response && response.statusCode && response.statusCode == 404) {
                        resolve(false);
                    }
                    // unexpected response
                    else {
                        // Throw error.
                        throw new Error(
                            'unexpected response while trying to ensure rmq user doesn\'t exist yet' + '\n' +
                            (response && response.statusCode) + ' ' + (response && response.statusMessage) + '\n' +
                            (body && body.error) + ' ' + (body && body.response) + '\n'
                        );
                    }
                }
            );
        });

        // Return error if user already exists.
        if (doesUserExist) {
            ctx.body = {
                status: 'error',
                message: 'user already exists.'
            };
            ctx.status = 400;
            return await next();
        }

        // Create new user.
        await new Promise((resolve, reject) => {
            request.put(
                // api doc: http://rabbitmq:15672/api/index.html
                `http://rabbitmq:15672/api/users/${userId}`,
                {
                    // rmq admin user credentials
                    'auth': {
                        'user': 'guest',
                        'pass': 'guest'
                    },
                    // new rmq user's password
                    'body': {
                        password: password,
                        tags: ''
                    },
                    'json': true
                },
                async (error, response, body) => {
                    if (response && response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
                        ctx.body = {
                            status: 'success'
                        };
                        ctx.status = response.statusCode;
                        resolve();
                    }
                    else {
                        ctx.body = {
                            status: 'error',
                            message: 'user couldn\'t be created.',
                            reasonCode: response && response.statusCode,
                            reason: response && response.statusMessage,
                            reasonMessage: body && body.reason
                        };
                        ctx.status = 500;
                        resolve();
                    }
                }
            );
        });

        // Write permission for message key name starting with
        // userId/ only.
        //write: `^${userId}\\..*`

        // Allow user only to write on vhost data exchange.
        await new Promise((resolve, reject) => {
            // @note we don't create single vhost per user as this implies a
            // several-second blocking transaction accross rabbitmq nodes. It
            // thus doesn't scale.
            // @note we don't use topic permissions, seems they don't work with
            // amqp (no sure anymore).
            const vhostNameEncoded = '%2f'; // %2f is '/', cf. root vhost.
            request.put(
                // api doc: http://rabbitmq:15672/api/index.html
                `http://rabbitmq:15672/api/permissions/${vhostNameEncoded}/${userId}`,
                {
                    // rmq admin user credentials
                    'auth': {
                        'user': 'guest',
                        'pass': 'guest'
                    },
                    // new rmq user's root vhost permissions
                    // @note Permissions are defined with regexp.
                    'body': {
                        // No configure queue/exchange permission in the vhost.
                        configure: '^$',
                        // No queue/exchange permission in the vhost.
                        read: '^$',
                        // Write permission for the data exchange only.
                        write: `^${dataExchangeName}$`
                    },
                    'json': true
                },
                async (error, response, body) => {
                    if (response && response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
                        ctx.body = {
                            status: 'success'
                        };
                        ctx.status = response.statusCode;
                        resolve();
                    }
                    else {
                        ctx.body = {
                            status: 'error',
                            message: 'user couldn\'t be created.',
                            reasonCode: response && response.statusCode,
                            reason: response && response.statusMessage,
                            reasonMessage: body && body.reason
                        };
                        ctx.status = 500;
                        resolve();
                    }
                }
            );
        });

        // Allow user only to write to its routing keys.
        await new Promise((resolve, reject) => {
            // @note we don't create single vhost per user as this implies a
            // several-second blocking transaction accross rabbitmq nodes. It
            // thus doesn't scale.
            // @note we don't use topic permissions, seems they don't work with
            // amqp (no sure anymore).
            const vhostNameEncoded = '%2f'; // %2f is '/', cf. root vhost.
            request.put(
                // api doc: http://rabbitmq:15672/api/index.html
                `http://rabbitmq:15672/api/topic-permissions/${vhostNameEncoded}/${userId}`,
                {
                    // rmq admin user credentials
                    'auth': {
                        'user': 'guest',
                        'pass': 'guest'
                    },
                    // new rmq user's root vhost permissions
                    // @note Permissions are defined with regexp.
                    'body': {
                        // Permissions specific to the 'data' exchange.
                        exchange: `^${dataExchangeName}$`,
                        // No read permission in the 'data' exchange at all.
                        read: '^$',
                        // Write permission only for routing keys starting with
                        // the username.
                        write: `^${userId}\\..*$`
                    },
                    'json': true
                },
                async (error, response, body) => {
                    if (response && response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
                        ctx.body = {
                            status: 'success'
                        };
                        ctx.status = response.statusCode;
                        resolve();
                    }
                    else {
                        ctx.body = {
                            status: 'error',
                            message: 'user couldn\'t be created.',
                            reasonCode: response && response.statusCode,
                            reason: response && response.statusMessage,
                            reasonMessage: body && body.reason
                        };
                        ctx.status = 500;
                        resolve();
                    }
                }
            );
        });

        await next();
    }
});

// Configure koa http server.
app
    .use(koaHelmet())
    .use(koaProtect.sqlInjection({
        body: true,
        loggerFunction: console.error
    }))
    .use(koaProtect.xss({
        body: true,
        loggerFunction: console.error
    }))
    .use(router.routes())
    .use(router.allowedMethods());

server.listen(3001);

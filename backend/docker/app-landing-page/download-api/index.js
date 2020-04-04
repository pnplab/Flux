const Koa = require('koa');
const Router = require('koa-router');
const koaProtect = require('koa-protect').koa;
const koaHelmet = require('koa-helmet');
const app = module.exports = new Koa();
const server = require('http').createServer(app.callback());
const io = require('socket.io')(server);
const router = new Router();
const request = require('request');

// @warning route are proxied one-by-one in nginx config. Thus, any change in
// routes here must be changed back in all underlying nginx config (
// app-landing-page dev, main proxy dev and main proxy prod)!
// @todo auto generate nginx config from env variables.

// @todo cache the github downloaded app - @warning take potential cache
// mismatch issue in consideration when change - ie. if whe somehow rerelease
// a version (shouldn't ever happen due to semvers though, but who knows).

// @note This has been tested for backpressure. Thus this effectively provides
// the effective download progress from the user perspective (which maps the
// github download one due to stream backpressure).

// We do not setup socketio on same server as nextjs to avoid having
// to reproxy nextjs. Better do it through nginx, although both solutions are
// fine, ssl proxying will be necessary anyway and websocket http upgrade may
// prevent this, making the second solution redundant.
// cf. https://developer.mozilla.org/en-US/docs/Web/HTTP/Protocol_upgrade_mechanism.
// cf. https://www.nginx.com/blog/websocket-nginx/
const APK_DOWNLOAD_URL = 'https://github.com/pnplab/Flux/releases/download/v1.8.0/Flux.apk';

// Map HTTP download status/updates callbacks to client browser w/ socketio
// API. Store pending status if socketio connection is late for some reason.
let _callbacksByDownloadId = {};
let _pendingEventsByDownloadId = {};
let _downloadIds = [];

// Socket interface, to track information about a proxied download in realtime
// from the browser.
io.on('connection', socket => {
    // ...on real-time browser connection.

    // Wait for client to tell us what download event he want to listen to.
    // We could instead generate a download id from the server and send it to
    // the client, but that would require the client to wait for the socketio
    // connection to be established before letting him generate the file
    // download link (slower).
    socket.on('download.listen', data => {
        const downloadId = data.downloadId;

        // Ensure downloadId is not already used. Could cause issues when
        // disconnect clean a duplicate downloadId too early for another socket
        // eg. on dynamic js page reload through nextjs framework's route
        // change.
        if (typeof _callbacksByDownloadId[downloadId] !== 'undefined') {
            console.error('downloadId ' + downloadId + ' is already being used');
            return;
        }

        // Generate callbacks to be called when new download info are received.
        // @warning callback may not be called if download starts after
        //     socketio connection (might very rarely happen on very slow
        //     clients).
        _callbacksByDownloadId[downloadId] = {
            started: fileMOSize =>
                socket.emit('download.started', {
                    fileMOSize
                }),

            chunkReceived: (downloadedPercentage, downloadedMO) =>
                // @note volatile means event may be dropped due to lag or
                // other reason.
                socket.volatile.emit('download.chunkReceived', {
                    downloadedPercentage,
                    downloadedMO
                }),

            end: () =>
                // Forward end as succeeded to client's browser, considering
                // having an error will override this callback.
                socket.emit('download.succeeded'),

            error: exc => {
                // Prevent end callback from sending succeeded to client after
                // error.
                _callbacksByDownloadId[downloadId].end = () => { /* noop */ };

                // Forward error as failure to client's browser.
                socket.emit('download.failed', {
                    error: exc
                });
            }
        };

        // If callback triggers where queued before socketio connection
        // started, send them now (very unlikely to happen, but who knows...).
        if (typeof _pendingEventsByDownloadId[downloadId] !== 'undefined') {
            const { response, data, end, error } = _pendingEventsByDownloadId[downloadId];

            // @warning order matters!
            if (response) {
                const fileMOSize = _pendingEventsByDownloadId[downloadId].fileMOSize;
                _callbacksByDownloadId[downloadId].started(fileMOSize);
            }
            if (data) {
                const downloadedPercentage = _pendingEventsByDownloadId[downloadId].downloadedPercentage;
                const downloadedMO = _pendingEventsByDownloadId[downloadId].downloadedMO;
                _callbacksByDownloadId[downloadId].chunkReceived(downloadedPercentage, downloadedMO);
            }
            if (end) {
                _callbacksByDownloadId[downloadId].end();
            }
            if (!end && error) {
                const err = _pendingEventsByDownloadId[downloadId].errorExc;
                _callbacksByDownloadId[downloadId].error(err);
            }

            // Remove sent events from pending queue.
            delete _pendingEventsByDownloadId[downloadId];
        }

        // Cleanup callbacks when client as disconnected.
        socket.once('disconnect', () => {
            delete _callbacksByDownloadId[downloadId];
        });
    });
});

// REST interface, to download the android application apk through HTTP and
// forward downloading status in real-time through socketio.
// @warning route are proxied one-by-one in nginx config. Thus, any change in
// routes here must be changed back in all underlying nginx config (
// app-landing-page dev, main proxy dev and main proxy prod)!
// @todo auto generate nginx config from env variables.
//
// @warning route gets called multiple time by chrome android for a single
//     click on download button. Perhaps prefetching headers first before
//     waiting for user to decide whether to continue download or not.
// download-api_1    | download.response 5923a446-8ae7-4ee8-b1fd-a7910036e148
// download-api_1    | download.response 5923a446-8ae7-4ee8-b1fd-a7910036e148
// download-api_1    | download.response 5923a446-8ae7-4ee8-b1fd-a7910036e148
// web_1             | 172.23.0.1 - - [10/Feb/2020:03:43:11 +0000] "GET /flux/Flux.apk?downloadId=5923a446-8ae7-4ee8-b1fd-a7910036e148 HTTP/1.1" 200 173618 "-" "Mozilla/5.0 (Linux; Android 8.0.0; HTC U11) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36" "204.48.94.36"
// download-api_1    |
// download-api_1    |   Error: write EPIPE
// download-api_1    |       at afterWriteDispatched (internal/stream_base_commons.js:154:25)
// download-api_1    |       at writeGeneric (internal/stream_base_commons.js:145:3)
// download-api_1    |       at Socket._writeGeneric (net.js:780:11)
// download-api_1    |       at Socket._write (net.js:792:8)
// download-api_1    |       at doWrite (_stream_writable.js:454:12)
// download-api_1    |       at clearBuffer (_stream_writable.js:582:7)
// web_1             | 172.23.0.1 - - [10/Feb/2020:03:43:11 +0000] "GET /flux/Flux.apk?downloadId=5923a446-8ae7-4ee8-b1fd-a7910036e148 HTTP/1.1" 200 189978 "-" "Mozilla/5.0 (Linux; Android 8.0.0; HTC U11) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36" "204.48.94.36"
// download-api_1    |       at Socket.Writable.uncork (_stream_writable.js:347:7)
// download-api_1    |       at connectionCorkNT (_http_outgoing.js:707:8)
// download-api_1    |       at processTicksAndRejections (internal/process/task_queues.js:83:21)
// download-api_1    |
// download-api_1    | req.close 5923a446-8ae7-4ee8-b1fd-a7910036e148
// download-api_1    | req.close 5923a446-8ae7-4ee8-b1fd-a7910036e148
// ---- Then user cancel.
// download-api_1    | req.close 5923a446-8ae7-4ee8-b1fd-a7910036e148
router.get('/Flux.apk', async (ctx, next) => {
    // Retrieve ?downloadId=[xxxxx] parameter.
    const { downloadId } = ctx.query;

    // Check parameter.
    let downloadStream = request({
        url: APK_DOWNLOAD_URL,
        // Ensure an error is triggered if github download gets disconnected
        // for some reason.
        // @warning 1000 ms was too short and caused timeout while testing
        //     locally through docker w/ nginx config. Changed to 15 000 ms.
        //     We needed short timeout to find out request cancelation but we
        //     now use request.close - request.end events to detect them.
        timeout: 15000 // in ms.
    });

    // Forward important headers from downloaded github request to provided koa
    // response. Not sure it's necessary since we forward the entire stream
    // (although through body). Advised on stackoverflow.
    downloadStream
        .on('response', downloadResponse => {
            // @warning HTTP headers case may change between clients. Different
            //     api (nodejs, koa, request) have different way to cope with
            //     this issue.
            ctx.response.set('content-disposition', downloadResponse.caseless.get('content-disposition'));
            ctx.response.set('content-type', downloadResponse.caseless.get('content-type'));
        });

    // If there is multiple download ongoing with the same id at the moment,
    // only send info about the first one. This may occurs on multiple click
    // on the download button or due to user sharing the link.
    let wasAlreadyDownloadingWithThisId = _downloadIds.includes(downloadId);
    if (!wasAlreadyDownloadingWithThisId) {
        _downloadIds.push(downloadId);
    }

    // Queue events if downloadId is not listened to yet through socketio.
    if (typeof _callbacksByDownloadId[downloadId] === 'undefined') {
        _pendingEventsByDownloadId[downloadId] = {
            response: false,
            data: false,
            end: false,
            error: false,

            fileMOSize: null,
            downloadedPercentage: null,
            downloadedMO: null,
            errorExc: null
        };
    }

    // Forward download-related callbacks to the end-user's browser.
    // @warning callback may not be called if download starts after socketio
    //      connection (might very rarely happen on very slow clients).
    let _contentLength = 0, _contentIndex = 0;
    downloadStream
        .on('response', downloadResponse => {
            console.info('download.start ' + downloadId);

            // Store the downloaded file length so we can later informs the
            // percentage of what's uploaded.
            _contentLength = downloadResponse.headers['content-length'];

            // Only forward event if this is triggered from the first of all
            // the ongoing shared-id downloads.
            if (wasAlreadyDownloadingWithThisId) {
                return;
            }

            // Forward download started callback.
            const contentLengthMo = _contentLength / 1024 / 1024;
            if (typeof _callbacksByDownloadId[downloadId] !== 'undefined') {
                _callbacksByDownloadId[downloadId].started(contentLengthMo);
            }
            else if (typeof _pendingEventsByDownloadId[downloadId] !== 'undefined') {
                _pendingEventsByDownloadId[downloadId].response = true;
                _pendingEventsByDownloadId[downloadId].fileMOSize = contentLengthMo;
            }
        });

    // Unfortunately there is no node API for chunk, thus we have to use
    // requestjs one. We rely on backpressure to consider this to be accurate
    // result of what the user has downloaded (as this equals the state of
    // what we've downloaded from github).
    downloadStream.on('data', chunk => {
        // Upgrade downloaded chunk index.
        _contentIndex += chunk.length;

        // Calculate the download progress.
        let downloadedMO = _contentIndex / 1024 / 1024;
        let downloadedPercentage = _contentIndex / _contentLength;

        // Only forward event if this is triggered from the first of all
        // the ongoing shared-id downloads.
        if (wasAlreadyDownloadingWithThisId) {
            return;
        }

        // Forward the chunk received event callback w/ additional download
        // progress info.
        if (typeof _callbacksByDownloadId[downloadId] !== 'undefined') {
            _callbacksByDownloadId[downloadId].chunkReceived(downloadedPercentage, downloadedMO);
        }
        else if (typeof _pendingEventsByDownloadId[downloadId] !== 'undefined') {
            _pendingEventsByDownloadId[downloadId].data = true;
            _pendingEventsByDownloadId[downloadId].downloadedPercentage = downloadedPercentage;
            _pendingEventsByDownloadId[downloadId].downloadedMO = downloadedMO;
        }
    });

    // ServerResponseStream end event. Like #end but wait for data flushing as
    // well.
    // cf. https://nodejs.org/api/http.html#http_class_http_serverresponse
    let _hasSuccesfullyFinished = false;
    ctx.res.once('finish', () => { // nodejs stream
        console.info('res.finish ' + downloadId);

        // Only forward event if this is triggered from the first of all
        // the ongoing shared-id downloads.
        if (wasAlreadyDownloadingWithThisId) {
            return;
        }

        // Ignore next close event so we don't send failure callback.
        _hasSuccesfullyFinished = true;

        // Cleanup is-downloading flag for the current download id since
        // download is finished.
        _downloadIds = _downloadIds.filter(id => id !== downloadId);

        // Forward download succeeded callback.
        if (typeof _callbacksByDownloadId[downloadId] !== 'undefined') {
            _callbacksByDownloadId[downloadId].end();
        }
        else if (typeof _pendingEventsByDownloadId[downloadId] !== 'undefined') {
            _pendingEventsByDownloadId[downloadId].end = true;
        }
    });

    // ServerResponseStream close event to capture request cancelation.
    // cf. https://nodejs.org/api/http.html#http_class_http_serverresponse
    // @note We use response close event as this is the only way to capture
    //     request cancelation by the user. End + error events don't do.
    // @note We use response close event instead of request close one to ensure
    //     it is triggered afetr the finish event.
    ctx.res.once('close', () => {
        console.info('res.close ' + downloadId);

        // Abort github apk download request if client closes the connection.
        downloadStream.abort();

        // Only forward event if this is triggered from the first of all
        // the ongoing shared-id downloads.
        if (wasAlreadyDownloadingWithThisId) {
            return;
        }

        // Ignore callback if stream has closed after successful finish event.
        if (_hasSuccesfullyFinished) {
            return;
        }

        // Cleanup is-downloading flag for the current download id since
        // download is finished.
        _downloadIds = _downloadIds.filter(id => id !== downloadId);

        // Forward download succeeded callback.
        let errorExc = new Error('download canceled');
        if (typeof _callbacksByDownloadId[downloadId] !== 'undefined') {
            _callbacksByDownloadId[downloadId].error(errorExc);
        }
        else if (typeof _pendingEventsByDownloadId[downloadId] !== 'undefined') {
            _pendingEventsByDownloadId[downloadId].error = true;
            _pendingEventsByDownloadId[downloadId].errorExc = errorExc;
        }
    });
    ctx.req.once('error', err => {
        console.info('req.error ' + downloadId, err);
    });
    ctx.res.once('error', err => {
        console.info('res.error ' + downloadId, err);
    });
    ctx.res.once('end', () => {
        console.info('res.end ' + downloadId);
    });

    // @note ctx.body.on('error') is not called when github connection is
    // closed. ctx.onerror throws.
    // @note Failed chunk uploads should not happen because this kind of issue
    //     should be handled at tcp level and thus not forwarded at this level
    //     of error report. Thus we rely on `once` instead of `on` to avoid
    //     dual callback trigger (for safety). @todo test this.
    downloadStream.once('error', err => {
        console.info('download.error ' + downloadId, err);

        // Fail response on download request failure. Without this line,
        // download request continue from client perspective although stuck.
        ctx.onerror(err);
        ctx.throw(500, err);

        // Only forward event if this is triggered from the first of all
        // the ongoing shared-id downloads.
        if (wasAlreadyDownloadingWithThisId) {
            return;
        }

        // Forward download failed callback to client's browser.
        if (typeof _callbacksByDownloadId[downloadId] !== 'undefined') {
            _callbacksByDownloadId[downloadId].error(err);
        }
        else if (typeof _pendingEventsByDownloadId[downloadId] !== 'undefined') {
            _pendingEventsByDownloadId[downloadId].error = true;
            _pendingEventsByDownloadId[downloadId].errorExc = err;
        }
    });

    // Forward download request's stream as koa response so the user download
    // the file.
    // @note notice ctx.body is set to downloadStream after we set the
    //     callbacks so we can get the callbacks
    ctx.body = downloadStream;
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

// Use server's #listen instead of koa's app#listen in order to be able to use
// both koa and socketio on same port.
server.listen(3001);

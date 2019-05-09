// Http script to check if user data have been received!
// 
// Requires following env:
// - MYSQL_HOST
// - MYSQL_USER
// - MYSQL_PASSWORD
// - MYSQL_DATABASE
//
// @warning This scripts doesn't scale well!
// @todo Use permanent connection pool connection instead of db
//       connect/disconnect at each HTTP request.

const Koa = require('koa');
const koaHelmet = require("koa-helmet");
const koaBody = require('koa-body');
const koaProtect = require('koa-protect').koa;
const Router = require('koa-router');
const mysql = require('promise-mysql');
// const StatsD = require('node-dogstatsd').StatsD;
// const dogstatsd = new StatsD();
const ddog = require('koa-datadog-middleware');
 
const app = module.exports = new Koa();
const router = new Router();

// Throw exception if env variable is missing!
if (typeof process.env.MYSQL_HOST === 'undefined' || 
    typeof process.env.MYSQL_USER === 'undefined' || 
    typeof process.env.MYSQL_PASSWORD === 'undefined' || 
    typeof process.env.MYSQL_DATABASE === 'undefined')
{
    throw new Error('Missing at least one mandatory MYSQL environment variable!');
}

const available_tables = [
    'accelerometer',
    'aware_device',
    'aware_log',
    'aware_studies',
    'battery',
    'battery_charges',
    'battery_discharges',
    'calls',
    'cdma',
    'gsm',
    'gsm_neighbor',
    'gyroscope',
    'light',
    'locations',
    'messages',
    'network',
    'network_traffic',
    'processor',
    'proximity',
    'rotation',
    'screen',
    'sensor_accelerometer',
    'sensor_gyroscope',
    'sensor_light',
    'sensor_proximity',
    'sensor_rotation',
    'sensor_wifi',
    'telephony',
    'touch',
    'wifi',
];

// @returns The number of row by table for deviceId.
router.get('/check-sync/android/:deviceId', async (ctx, next) => {
    // Retrieve params.
    const body = ctx.request.body;
    const params = ctx.params;

    // Verify parameters format, mostly to prevent sql injection!
    const deviceId = params.deviceId;
    if (!/^[a-zA-Z0-9]{3,}$/.test(deviceId)) {
        console.error('check sync - wrong device id!', deviceId);
        ctx.body = {
           error: 'bad device id format'
        };
        ctx.status = 400;
        return;
    }
    else {
        console.log('check sync - device id:', deviceId);
    }

    // Connect to host!
    const db = await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE
    });

    // Retrieve results from db!
    const [ results ] = await db.query(`
        SELECT 
        ${
            available_tables
                .map(table => `(SELECT COUNT(device_id) from ${table} WHERE device_id="${deviceId}") as ${table}`)
                .join(',')
        }
    `);

    // Close db.
    db.end();

    // Return result.
    ctx.body = results;

    // Track page view
    // dogstatsd.increment('page.views');
});

// @returns The number of row for deviceId in table.
router.get('/check-sync/android/:table/:deviceId', async (ctx, next) => {
    // Retrieve params.
    const body = ctx.request.body;
    const params = ctx.params;

    // Verify parameters format, mostly to prevent sql injection!
    const deviceId = params.deviceId;
    if (!/^[a-zA-Z0-9]{3,}$/.test(deviceId)) {
        console.error('check sync - wrong device id!', deviceId);
        ctx.body = {
           error: 'bad device id format'
        };
        ctx.status = 400;
        return;
    }
    else {
        console.log('check sync - device id: ', deviceId);
    }

    const table = params.table;
    if (available_tables.indexOf(table) === -1) {
        console.error('check sync - bad table name!', table);
        ctx.body = {
           error: 'bad table name',
           available_tables: available_tables
        };
        ctx.status = 400;
        return;
    }
    else {
        console.log('check sync - table: ', table);
    }

    // Connect to host!
    const db = await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE
    });

    // Retrieve results from db!
    const [ results ] = await db.query(`SELECT COUNT(device_id) as ${table} from ${table} WHERE device_id="${deviceId}"`);

    // Close db.
    db.end();

    // Return result.
    ctx.body = results;
});

app
    .use(ddog())
    .use(koaHelmet())
    .use(koaBody({
        jsonLimit: '1kb'
    }))
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

if (!module.parent) {
    console.log('Starting koa node server!');
    app.listen(7982);
}

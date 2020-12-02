var open = require('amqplib').connect('amqp://guest:guest@rabbitmq:5672');

// pg.
const { Pool } = require('pg');
const pool = new Pool({
    host: 'timescaledb',
    user: 'postgres',
    password: 'hehe',
    database: 'postgres'
});

const dataExchangeName = 'data';

async function handle(rabbitmqChannel, tableName, createTableFn, insertRowFn) {
    // Create table.
    await createTableFn();

    // Declare rabbitmq queue.
    const hasQueue = await rabbitmqChannel.assertQueue(tableName, {
        exclusive: false,
        durable: true,
        autoDelete: false
    });
    if (!hasQueue) {
        throw new Error(`Queue ${tableName} isn't and hasn't been set.`);
    }

    // Bind exchanges' messages of any user to our queue.
    const hasBound = await rabbitmqChannel.bindQueue(tableName, dataExchangeName, `#.${tableName}`); // '#' == any single word (in this case, any userId)
    if (!hasBound) {
        throw new Error(`Queue ${tableName} wasn't bound to ${dataExchangeName} exchange.`);
    }

    // Insert row from rabbitmq queue.
    rabbitmqChannel.consume(tableName, async msg => {
        // Ignore empty message.
        if (msg === null) {
            return;
        }

        try {
            // Process the message.
            await insertRowFn(msg);

            // Acknolwedge message.
            // @note This makes it easy to implement publish confirmation from
            // client. Although at the moment with don't do it as we don't
            // consider this to be critical and we wish to limit the
            // bandwidth as much as possible.
            rabbitmqChannel.ack(msg, false);
        }
        catch (e) {
            // Reject the message.
            // Quick and dirty drop of the message. Messages are not critical.
            // We probably wont be able to process it later anyway.
            rabbitmqChannel.nack(msg, false, false);

            // Rethrow exception.
            throw e;
        }
    });
}

async function main() {
    // Connect to rabbitmq.
    const rabbitmqConnection = await open;
    const rabbitmqChannel = await rabbitmqConnection.createChannel();

    // Create (if it doesn't exist yet) a topic exchange.
    // Topic exchanges allow to use regexp to route multiple
    // specific message routing keys to more general queues, in our
    // case user-specific routing keys to any-user global queues).
    //
    // Our data exchange is a topic exchange used to be able to
    // have fine-grained user permission (global any userId consume
    // permission with user specific publish permission).
    const exchangeOk = await rabbitmqChannel.assertExchange(dataExchangeName, 'topic', {
        durable: true,
        // allow to write message to the exchange.
        internal: false,
        autoDelete: false
    });

    if (!exchangeOk) {
        throw new Error(`Exchange '${dataExchangeName}' couldn't be created/asserted.`);
    }

    /* ACC */
    handle(
        rabbitmqChannel,
        'accelerometer', 
        async () => {
            // Create db table.
            await pool.query(`
                CREATE TABLE IF NOT EXISTS accelerometer (
                    timestamp TIMESTAMP NOT NULL, -- ns w/ millisec precision,
                    accuracy REAL NOT NULL,
                    x REAL NOT NULL,
                    y REAL NOT NULL,
                    z REAL NOT NULL
                );
            `); // TIMESTAMPTZ (timezoned) -> TIMESTAMP (both 64b) - but (3) gives millisecond precision
            await pool.query(`
                GRANT ALL PRIVILEGES ON TABLE accelerometer TO "postgres"
            `);
            await pool.query(`SELECT create_hypertable('accelerometer', 'timestamp', if_not_exists => TRUE);`);
        },
        async (msg) => {
            // Retrieve publisher (validated through auth / acl plugins) user-id.
            const userId = msg.properties.userId;

            // Forward to timescale.
            // const timestamp = 'now()'; // msg.content.getDouble(0); // @todo use timestamp
            const timestamp = msg.content.readBigInt64BE(8 * 0); // ns
            const accuracy = msg.content.readFloatBE(8 * 1 + 4 * 0);
            const x = msg.content.readFloatBE(8 * 1 + 4 * 1);
            const y = msg.content.readFloatBE(8 * 1 + 4 * 2);
            const z = msg.content.readFloatBE(8 * 1 + 4 * 3);

            // console.log(`${timestamp} ${x}:${y}:${z}`);

            const { rows } = await pool.query('INSERT INTO accelerometer(timestamp, accuracy, x, y, z) values(to_timestamp($1::double precision / 1000000000), $2, $3, $4, $5)', [timestamp, accuracy, x, y, z]);
        }
    );

    /* PEDOMETER */
    handle(
        rabbitmqChannel,
        'pedometer', 
        async () => {
            // Create db table.
            await pool.query(`
                CREATE TABLE IF NOT EXISTS pedometer (
                    timestamp TIMESTAMP NOT NULL, -- ns w/ millisec precision
                    countfield INTEGER NOT NULL
                );
            `); // TIMESTAMPTZ (timezoned) -> TIMESTAMP (both 64b) - but (3) gives millisecond precision
            await pool.query(`
                GRANT ALL PRIVILEGES ON TABLE pedometer TO "postgres"
            `);
            await pool.query(`SELECT create_hypertable('pedometer', 'timestamp', if_not_exists => TRUE);`);
        },
        async (msg) => {
            // Retrieve publisher (validated through auth / acl plugins) user-id.
            const userId = msg.properties.userId;

            // Forward to timescale.
            // const timestamp = 'now()'; // msg.content.getDouble(0); // @todo use timestamp
            const timestamp = msg.content.readBigInt64BE(8 * 0 + 4 * 0); // nanosec
            const count = msg.content.readInt32BE(8 * 1 + 4 * 0);

            console.log(`pedometer: ${timestamp} ${count}`);

            const { rows } = await pool.query('INSERT INTO pedometer(timestamp, countfield) values(to_timestamp($1::double precision / 1000000000), $2)', [timestamp, count]);
        }
    );

    /* WIFI_STATUS */
    handle(
        rabbitmqChannel,
        'wifi_status',
        async () => {
            // Create db table.
            await pool.query(`
                CREATE TABLE IF NOT EXISTS wifi_status (
                    timestamp TIMESTAMP(3) NOT NULL, -- microsec w/ millisec precision
                    is_wifi_active INTEGER NULL
                );
            `); // TIMESTAMPTZ (timezoned) -> TIMESTAMP (both 64b) - but (3) gives millisecond precision
            await pool.query(`
                GRANT ALL PRIVILEGES ON TABLE wifi_status TO "postgres"
            `);
            await pool.query(`SELECT create_hypertable('wifi_status', 'timestamp', if_not_exists => TRUE);`);
        },
        async (msg) => {
            // Retrieve publisher (validated through auth / acl plugins) user-id.
            const userId = msg.properties.userId;

            // Forward to timescale.
            // const timestamp = 'now()'; // msg.content.getDouble(0); // @todo use timestamp
            const timestamp = msg.content.readBigInt64BE(8 * 0 + 1 * 0); // microsec
            const is_wifi_active = msg.content.readInt8(8 * 1 + 1 * 0);

            console.log(`wifi_status: ${timestamp} ${is_wifi_active}`);

            const { rows } = await pool.query('INSERT INTO wifi_status(timestamp, is_wifi_active) values(to_timestamp($1::double precision / 1000), $2)', [timestamp, is_wifi_active]);
        }
    );

    /* PING */
    handle(
        rabbitmqChannel,
        'ping',
        async () => {
            // Create db table.
            await pool.query(`
                CREATE TABLE IF NOT EXISTS ping (
                    current_time_ms TIMESTAMP(3) NOT NULL, -- microsec w / millisec precision
                    elapsed_time_ms TIMESTAMP(3) NOT NULL, -- microsec w / millisec precision
                    uptime_ms TIMESTAMP(3) NOT NULL -- microsec w / millisec precision
                );
            `); // TIMESTAMPTZ (timezoned) -> TIMESTAMP (both 64b) - but (3) gives millisecond precision
            await pool.query(`
                GRANT ALL PRIVILEGES ON TABLE ping TO "postgres"
            `);
            await pool.query(`SELECT create_hypertable('ping', 'current_time_ms', if_not_exists => TRUE);`);
        },
        async (msg) => {
            // Retrieve publisher (validated through auth / acl plugins) user-id.
            const userId = msg.properties.userId;

            // Forward to timescale.
            // const timestamp = 'now()'; // msg.content.getDouble(0); // @todo use timestamp
            const current_time_ms = msg.content.readBigInt64BE(8 * 0); // microsec
            const elapsed_time_ms = msg.content.readBigInt64BE(8 * 1); // microsec
            const uptime_ms = msg.content.readBigInt64BE(8 * 2); // microsec

            const { rows } = await pool.query('INSERT INTO ping(current_time_ms, elapsed_time_ms, uptime_ms) values(to_timestamp($1::double precision / 1000), to_timestamp($2::double precision / 1000), to_timestamp($3::double precision / 1000))', [current_time_ms, elapsed_time_ms, uptime_ms]);
        }
    );

    /* GPS */
    handle(
        rabbitmqChannel,
        'gps',
        async () => {
            // Create db table.
            await pool.query(`
                CREATE TABLE IF NOT EXISTS gps (
                    timestamp TIMESTAMP NOT NULL, -- ns w/ microsec precision
                    accuracy REAL NOT NULL,
                    latitude DOUBLE PRECISION NOT NULL,
                    longitude DOUBLE PRECISION NOT NULL,
                    altitude DOUBLE PRECISION NOT NULL,
                    bearing REAL NOT NULL,
                    speed REAL NOT NULL
                );
            `); // TIMESTAMPTZ (timezoned) -> TIMESTAMP (both 64b) - but (3) gives millisecond precision
            await pool.query(`
                GRANT ALL PRIVILEGES ON TABLE gps TO "postgres"
            `);
            await pool.query(`SELECT create_hypertable('gps', 'timestamp', if_not_exists => TRUE);`);
        },
        async (msg) => {
            // Forward to timescale.
            const timestamp = msg.content.readBigInt64BE( // nanosec
                8 * 0 +
                4 * 0 +
                8 * 0 +
                4 * 0 
                // 0 - 8
            );
            const accuracy = msg.content.readFloatBE(
                8 * 1 +
                4 * 0 +
                8 * 0 +
                4 * 0
                // 8 - 12
            );
            const latitude = msg.content.readDoubleBE(
                8 * 1 +
                4 * 1 +
                8 * 0 +
                4 * 0
                // 12 - 20
            );
            const longitude = msg.content.readDoubleBE(
                8 * 1 +
                4 * 1 +
                8 * 1 +
                4 * 0
                // 20 - 28
            );
            const altitude = msg.content.readDoubleBE(
                8 * 1 +
                4 * 1 +
                8 * 2 +
                4 * 0
                // 28 - 36
            );
            const bearing = msg.content.readFloatBE(
                8 * 1 +
                4 * 1 +
                8 * 3 +
                4 * 0
                // 36 - 40
            );
            const speed = msg.content.readFloatBE(
                8 * 1 +
                4 * 1 +
                8 * 3 +
                4 * 1
                // 40 - 44
            );

            const { rows } = await pool.query('INSERT INTO gps(timestamp, accuracy, latitude, longitude, altitude, bearing, speed) values(to_timestamp($1::double precision / 1000000000), $2, $3, $4, $5, $6, $7)', [timestamp, accuracy, latitude, longitude, altitude, bearing, speed]);
        }
    );

    /* GPS */
    handle(
        rabbitmqChannel,
        'significant_motion',
        async () => {
            // Create db table.
            await pool.query(`
                CREATE TABLE IF NOT EXISTS significant_motion (
                    timestamp TIMESTAMP NOT NULL -- ns w/ microsec precision
                );
            `); // TIMESTAMPTZ (timezoned) -> TIMESTAMP (both 64b) - but (3) gives millisecond precision
            await pool.query(`
                GRANT ALL PRIVILEGES ON TABLE significant_motion TO "postgres"
            `);
            await pool.query(`SELECT create_hypertable('significant_motion', 'timestamp', if_not_exists => TRUE);`);
        },
        async (msg) => {
            // Retrieve publisher (validated through auth / acl plugins) user-id.
            const userId = msg.properties.userId;

            // Forward to timescale.
            const timestamp = msg.content.readBigInt64BE(8 * 0); // nanosec

            const { rows } = await pool.query('INSERT INTO significant_motion(timestamp) values(to_timestamp($1::double precision / 1000000000))', [timestamp]);
        }
    );

    /* Battery percentage */
    handle(
        rabbitmqChannel,
        'battery_percentage',
        async () => {
            // Create db table.
            await pool.query(`
                CREATE TABLE IF NOT EXISTS battery_percentage (
                    timestamp TIMESTAMP(3) NOT NULL, -- ms w/ microsec precision
                    battery_percentage REAL NOT NULL
                );
            `); // TIMESTAMPTZ (timezoned) -> TIMESTAMP (both 64b) - but (3) gives millisecond precision
            await pool.query(`
                GRANT ALL PRIVILEGES ON TABLE battery_percentage TO "postgres"
            `);
            await pool.query(`SELECT create_hypertable('battery_percentage', 'timestamp', if_not_exists => TRUE);`);
        },
        async (msg) => {
            // Retrieve publisher (validated through auth / acl plugins) user-id.
            const userId = msg.properties.userId;

            // Forward to timescale.
            const timestamp = msg.content.readBigInt64BE(8 * 0); // ms
            const battery_percentage = msg.content.readFloatBE(8 * 1);

            const { rows } = await pool.query('INSERT INTO battery_percentage(timestamp, battery_percentage) values(to_timestamp($1::double precision / 1000), $2)', [timestamp, battery_percentage]);
        }
    );

    /* Log */
    handle(
        rabbitmqChannel,
        'log',
        async () => {
            // Create db table.
            await pool.query(`
                CREATE TABLE IF NOT EXISTS log (
                    timestamp TIMESTAMP(3) NOT NULL, -- ms w/ microsec precision
                    level TEXT NOT NULL,
                    log TEXT NOT NULL -- postgresql TEXT == 1go upper limit, as VARCHAR - no perf diff according to doc
                );
            `); // TIMESTAMPTZ (timezoned) -> TIMESTAMP (both 64b) - but (3) gives millisecond precision
            await pool.query(`
                GRANT ALL PRIVILEGES ON TABLE log TO "postgres"
            `);
            await pool.query(`SELECT create_hypertable('log', 'timestamp', if_not_exists => TRUE);`);
        },
        async (msg) => {
            // Retrieve publisher (validated through auth / acl plugins) user-id.
            const userId = msg.properties.userId;

            // Forward to timescale.
            const timestamp = msg.content.readBigInt64BE(
                8 * 0 +
                4 * 0
            ); // ms
            const levelStrByteLength = msg.content.readInt32BE(
                8 * 1 +
                4 * 0
            );
            const levelStr = msg.content.toString(
                // encoding format
                'utf8',

                // string starting byte index.
                8 * 1 +
                4 * 1,

                // string ending byte index.
                8 * 1 +
                4 * 1 +
                levelStrByteLength,
            )
            const logStrByteLength = msg.content.readInt32BE(
                8 * 1 +
                4 * 1 +
                levelStrByteLength
            );
            const logStr = msg.content.toString(
                // encoding format
                'utf8',

                // string starting byte index.
                8 * 1 +
                4 * 1 +
                levelStrByteLength +
                4 * 1,

                // string ending byte index.
                8 * 1 +
                4 * 1 +
                levelStrByteLength +
                4 * 1 +
                logStrByteLength,
            );

            const { rows } = await pool.query('INSERT INTO log(timestamp, level, log) values(to_timestamp($1::double precision / 1000), $2, $3)', [timestamp, levelStr, logStr]);
        }
    );}

main()
    .catch(e => console.error(e));

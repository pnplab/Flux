var open = require('amqplib').connect('amqp://guest:guest@rabbitmq:5672');

// pg.
const { Pool } = require('pg');
const pool = new Pool({
    host: 'timescaledb',
    user: 'postgres',
    password: 'hehe',
    database: 'postgres'
});

async function main() {
    /* ACC */
    // Create db table.
    await pool.query(`
        CREATE TABLE IF NOT EXISTS accelerometer (
            timestamp TIMESTAMP(3) NOT NULL,
            x REAL NULL,
            y REAL NULL,
            z REAL NULL
        );
    `); // TIMESTAMPTZ (timezoned) -> TIMESTAMP (both 64b) - but (3) gives millisecond precision
    await pool.query(`
        GRANT ALL PRIVILEGES ON TABLE accelerometer TO "postgres"
    `);
    await pool.query(`SELECT create_hypertable('accelerometer', 'timestamp');`);

    // Create db table.
    await pool.query(`
            DROP TABLE IF EXISTS pedometer
            `);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS pedometer (
            timestamp TIMESTAMP(3) NOT NULL,
            countfield INTEGER NULL
        );
    `); // TIMESTAMPTZ (timezoned) -> TIMESTAMP (both 64b) - but (3) gives millisecond precision
    await pool.query(`
        GRANT ALL PRIVILEGES ON TABLE pedometer TO "postgres"
    `);
    await pool.query(`SELECT create_hypertable('pedometer', 'timestamp');`);

    // Connect to rabbitmq.
    const rabbitmqConnection = await open;
    const rabbitmqChannel = await rabbitmqConnection.createChannel();

    const ok = await rabbitmqChannel.assertQueue('accelerometer');
    if (!ok) {
        throw new Error('not ok');
    }

    const ok2 = await rabbitmqChannel.assertQueue('pedometer');
    if (!ok2) {
        throw new Error('not ok');
    }

    // Consume accelerometer.
    rabbitmqChannel.consume('accelerometer', async msg => {
        if (msg !== null) {
            rabbitmqChannel.ack(msg); // @todo put at end of block would prevent backpressure ?

            // Forward to timescale.
            // const timestamp = 'now()'; // msg.content.getDouble(0); // @todo use timestamp
            const timestamp =  msg.content.readBigInt64BE(8 * 0);
            const x = msg.content.readFloatBE(8 * 1 + 4 * 0);
            const y = msg.content.readFloatBE(8 * 1 + 4 * 1);
            const z = msg.content.readFloatBE(8 * 1 + 4 * 2);

            // console.log(`${timestamp} ${x}:${y}:${z}`);

            const { rows } = await pool.query('INSERT INTO accelerometer(timestamp, x, y, z) values(to_timestamp($1::double precision / 1000), $2, $3, $4)', [timestamp, x, y, z]);
        }
    });

    // Consume pedometer.
    rabbitmqChannel.consume('pedometer', async msg => {
        if (msg !== null) {
            rabbitmqChannel.ack(msg); // @todo put at end of block would prevent backpressure ?

            // Forward to timescale.
            // const timestamp = 'now()'; // msg.content.getDouble(0); // @todo use timestamp
            const timestamp = msg.content.readBigInt64BE(8 * 0 + 4 * 0);
            const count = msg.content.readInt32BE(8 * 1 + 4 * 0);

            console.log(`${timestamp} ${count}`);

            const { rows } = await pool.query('INSERT INTO pedometer(timestamp, countfield) values(to_timestamp($1::double precision / 1000), $2)', [timestamp, count]);
        }
    });
}

main()
    .catch(e => console.error(e));

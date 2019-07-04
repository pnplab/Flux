#!/usr/bin/env node

const mysql = require('promise-mysql');

// Throw exception if env variable is missing!
if (typeof process.env.MYSQL_HOST === 'undefined' || 
    typeof process.env.MYSQL_USER === 'undefined' || 
    typeof process.env.MYSQL_PASSWORD === 'undefined' || 
    typeof process.env.MYSQL_DATABASE === 'undefined')
{
    throw new Error('Missing at least one mandatory MYSQL environment variable!');
}

if (typeof process.env.MYSQL_ENCRYPTION_KEY === 'undefined') {
    throw new Error('MYSQL_ENCRYPTION_KEY environment variable is missing!');
}
// Do not encrypt the following tables.
const unencryptedTables = [
    'aware_log',
    'aware_studies',
    'aware_device'
];

// Do not encrypt the following fields as they are used by aware
// to retrieve the last synced row so we client only sync unsynced
// rows.
const unencryptedColumns = [
    '_id',
    'id',
    'device_id',
    'double_end_timestamp',
    'double_esm_user_answer_timestamp',
    'timestamp'
];

(async () => {
    // Connect to host!
    const db = await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE
    });

    // Retrieve all fields in db.
    const results = await db.query(`
        SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.columns
        WHERE table_schema = '${process.env.MYSQL_DATABASE}'
        ORDER BY table_name,ordinal_position
    `);

    // List tables
    const encryptedTables = results
        // Table name
        .map(res => res.TABLE_NAME)
        // Distinct values only
        .filter((table, index, self) => self.indexOf(table) === index)
        // Do not encrypt some of the tables
        .filter(table => unencryptedTables.indexOf(table) === -1)
        ;

    // Create triggers by tables
    for (let i = 0; i < encryptedTables.length; ++i) {
        let table = encryptedTables[i];
        let columns = results
            .filter(res => res.TABLE_NAME === table)
            .map(res => res.COLUMN_NAME);

        let encryptedColumns = columns
            .filter(c => unencryptedColumns.indexOf(c) === -1);

        // Ignore table with no encrypted field.
        if (encryptedColumns.length === 0) {
            continue;
        }

        // Log encrypted fields.
        console.info(table, encryptedColumns);

        // Drop trigger if exists.
        await db.query(`DROP TRIGGER IF EXISTS encrypt_${table}_data`);

        // Create new encryption trigger.
        let results2 = await db.query(`            
            CREATE TRIGGER encrypt_${table}_data
            BEFORE INSERT ON ${table}
            FOR EACH ROW
            BEGIN
                ${'SET ' + encryptedColumns
                    .map(
                        column => 
                       `NEW.${column}=AES_ENCRYPT(NEW.${column}, '${process.env.MYSQL_ENCRYPTION_KEY}')`
                    )
                    .join(",\n                    ") + ';'
                }
            END
        `);
    }

    // Close db.
    db.end();
})();
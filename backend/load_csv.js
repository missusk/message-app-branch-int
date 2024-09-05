const fs = require('fs');
const csv = require('csv-parser');
const pool = require('./db');
const bcrypt = require('bcrypt');

async function insertMessage(generated_user_id, message_body, timestamp) {
  try {
    await pool.query(
      'INSERT INTO messages (user_id, message_body, status, timestamp) VALUES ($1, $2, $3, $4)',
      [generated_user_id, message_body, 'unassigned', timestamp]
    );
  } catch (err) {
    console.error('Error inserting message:', err.message);
  }
}

async function insertUserIfNotExists(usernameFromCSV) {
  try {
    const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [usernameFromCSV]);

    let generated_user_id;
    if (userResult.rows.length === 0) {
      const hashedPassword = await bcrypt.hash(usernameFromCSV, 10);
      
      const insertUserResult = await pool.query(
        'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING user_id',
        [usernameFromCSV, hashedPassword]
      );
      
      generated_user_id = insertUserResult.rows[0].user_id;
      console.log(`Inserted user with username: ${usernameFromCSV}, generated user_id: ${generated_user_id}`);
    } else {
      generated_user_id = userResult.rows[0].user_id;
      console.log(`User ${usernameFromCSV} already exists with user_id: ${generated_user_id}`);
    }

    return generated_user_id;
  } catch (err) {
    console.error('Error inserting or fetching user:', err.message);
    throw err; 
  }
}

async function loadCSV() {
  const csvFilePath = './GeneralistRails_Project_MessageData.csv'; 

  const rows = [];
  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on('data', (row) => {
      rows.push(row);
    })
    .on('end', async () => {
      for (const row of rows) {
        const { user_id: usernameFromCSV, timestamp, message_body } = row;

        const generated_user_id = await insertUserIfNotExists(usernameFromCSV);

        await insertMessage(generated_user_id, message_body, timestamp);
      }

      console.log('CSV file successfully processed and data inserted.');
    });
}

loadCSV();

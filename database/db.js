'use strict';
const mysql = require('mysql');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'bn_serv',
  password: '123454321',
  database: 'blocknote'
});

db.connect((error) => {
  if (error) {
    console.warn(error);
  } else {
    console.log('MySQL connection to blocknote database granted');
  }
});

module.exports = db;

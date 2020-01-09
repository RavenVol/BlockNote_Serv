'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database/db');


const app = express();
const encodeBody = bodyParser.text({ extended: false });
const port = process.env.PORT || 5123;


app.post('/api/signin', encodeBody, (req, res) => {
  const { name, passwd } = JSON.parse(req.body);

  if (name && passwd && typeof(name) === 'string' && typeof(passwd) === 'string' 
  && name.length > 2 && name.length < 33 && passwd.length > 2 && passwd.length < 33) {
    db.query(`SELECT name FROM users WHERE name="${name}"`, (error, result) => {
      if (error) throw error;
      if (!result[0]) {
        db.query(`INSERT INTO users (name, passwd) VALUES ("${name}", "${passwd}")`);
        res.set('Access-Control-Allow-Origin', '*');
        res.json({message: `User ${name} was added`, code: '200'});
      } else {
        res.set('Access-Control-Allow-Origin', '*');
        res.json({message: `User ${name} already exist`, code: '400'});
      }
    });
  } else {
    res.set('Access-Control-Allow-Origin', '*');
    res.json({message: `Data missmatch: Name and/or Password must have from 3 to 32 chars`, code: '410'});
  }
});


app.post('/api/login', encodeBody, (req, res) => {
  const { name, passwd } = JSON.parse(req.body);

  if (name && passwd && typeof(name) === 'string' && typeof(passwd) === 'string' 
  && name.length > 2 && name.length < 33 && passwd.length > 2 && passwd.length < 33) {
    db.query(`SELECT * FROM users WHERE name="${name}"`, (error, result) => {
      if (error) throw error;
      if (!result[0]) {
        res.set('Access-Control-Allow-Origin', '*');
        res.json({message: `No such user ${name}`, code: '401'});
      } else if (result[0].passwd === passwd ) {
        db.query(`DELETE FROM sessions WHERE user_id=${result[0].id}`);
        let session_key = Math.ceil(Math.random() * 1000000000);
        db.query(`INSERT INTO sessions (user_id, session_key) VALUES (${result[0].id}, ${session_key})`, (error, result) => {
          if (error) throw error;
          res.set('Access-Control-Allow-Origin', '*');
          res.json({message: `OK`, code: '200', session_key: session_key});
        })
      } else {
        res.set('Access-Control-Allow-Origin', '*');
        res.json({message: `Password incorrect`, code: '402'});
      }
    });
  } else {
    res.set('Access-Control-Allow-Origin', '*');
    res.json({message: `Data missmatch: Name and/or Password must have from 3 to 32 chars`, code: '410'});
  }
});


app.post('/api/addbn', encodeBody, (req, res) => {
  const {id, session_key, title, color} = JSON.parse(req.body);
  
  db.query(`SELECT user_id FROM sessions WHERE session_key=${session_key}`, (error, result) => {
    if (error) throw error;
    if (!result[0]) {
      res.set('Access-Control-Allow-Origin', '*');
      res.json({message: `Denied for guest`, code: '403'});
    } else {
      if (!id) {
        db.query(`INSERT INTO blocknotes (user_id, title, bgColor) VALUES (${result[0].user_id}, "${title}", "${color}")`, (error, result) => {
          if (error) throw error;
          res.set('Access-Control-Allow-Origin', '*');
          res.json({message: `BlockNote was added`, code: '200'});
        });
      } else {
        db.query(`UPDATE blocknotes SET title="${title}", bgColor="${color}" WHERE id=${id} AND user_id=${result[0].user_id}`, (error, result) => {
          if (error) throw error;
          res.set('Access-Control-Allow-Origin', '*');
          res.json({message: `BlockNote was added`, code: '200'});
        });
      }
    }
  });
});


app.post('/api/delbn', encodeBody, (req, res) => {
  const {session_key, id} = JSON.parse(req.body);
  
  db.query(`SELECT user_id FROM sessions WHERE session_key=${session_key}`, (error, result) => {
    if (error) throw error;
    if (!result[0]) {
      res.set('Access-Control-Allow-Origin', '*');
      res.json({message: `Denied for guest`, code: '403'});
    } else {
      db.query(`DELETE FROM notes WHERE bn_id=${id} AND user_id=${result[0].user_id}`, (error, result1) => {
        if (error) throw error;

        db.query(`DELETE FROM blocknotes WHERE id=${id} AND user_id=${result[0].user_id}`, (error, result2) => {
          if (error) throw error;

          res.set('Access-Control-Allow-Origin', '*');
          res.json({message: `BlockNote and notes deleted`, code: '200'});
        });
      });
    }
  });
});


app.post('/api/ch_note', encodeBody, (req, res) => {
  const {session_key, id, bn_id, date, title, text, bgColor} = JSON.parse(req.body);
  const userDate = new Date(date);
  const dateStr = `${userDate.getFullYear()}-${userDate.getMonth()+1}-${userDate.getDate()}`;
  
  db.query(`SELECT user_id FROM sessions WHERE session_key=${session_key}`, (error, result) => {
    if (error) throw error;
    if (!result[0]) {
      res.set('Access-Control-Allow-Origin', '*');
      res.json({message: `Denied for guest`, code: '403'});
    } else {
      if (id === 0) {
        db.query(`INSERT INTO notes (user_id, bn_id, date, title, text, bgColor) VALUES (${result[0].user_id}, ${bn_id}, "${dateStr}", "${title}", "${text}", "${bgColor}")`, (error, result) => {
          if (error) throw error;
          res.set('Access-Control-Allow-Origin', '*');
          res.json({message: `Note was added`, code: '200'});
        });
      }
      if (id > 0) {
        db.query(`UPDATE notes SET date = "${dateStr}", title = "${title}", text = "${text}", bgColor = "${bgColor}" WHERE id = ${id} AND user_id=${result[0].user_id}`, (error, result) => {
          if (error) throw error;
          res.set('Access-Control-Allow-Origin', '*');
          res.json({message: `Note was added`, code: '200'});
        });
      }
    }
  });
});


app.post('/api/del_note', encodeBody, (req, res) => {
  const { session_key, id } = JSON.parse(req.body);

  db.query(`SELECT user_id FROM sessions WHERE session_key=${session_key}`, (error, result) => {
    if (error) throw error;
    if (!result[0]) {
      res.set('Access-Control-Allow-Origin', '*');
      res.json({message: `Denied for guest`, code: '403'});
    } else {
      db.query(`DELETE FROM notes WHERE id = ${id} AND user_id=${result[0].user_id}`, (error, result) => {
        if (error) throw error;
        res.set('Access-Control-Allow-Origin', '*');
        res.json({message: `Note was deleted`, code: '200'});
      });
    }
  });
});

app.post('/api/logout', encodeBody, (req, res) => {
  const { session_key } = JSON.parse(req.body);
  
  db.query(`SELECT user_id FROM sessions WHERE session_key=${session_key}`, (error, result) => {
    if (error) throw error;
    if (!result[0]) {
      res.set('Access-Control-Allow-Origin', '*');
      res.json({message: `Denied for guest`, code: '403'});
    } else {
      db.query(`DELETE FROM sessions WHERE session_key=${session_key} AND user_id=${result[0].user_id}`, (error, result) => {
        if (error) throw error;
        res.set('Access-Control-Allow-Origin', '*');
        res.json({message: `Logout done`, code: '200'});
      });
    }
  });
});


app.post('/api/data', encodeBody, (req, res) => {
  const { session_key, get } = JSON.parse(req.body);
  
  db.query(`SELECT user_id FROM sessions WHERE session_key=${session_key}`, (error, result) => {
    if (error) throw error;
    if (!result[0]) {
      res.set('Access-Control-Allow-Origin', '*');
      res.json({message: `Denied for guest`, code: '403'});
    } else {
      db.query(`SELECT * FROM ${get} WHERE user_id=${result[0].user_id}`, (error, result) => {
        if (error) throw error;
        res.set('Access-Control-Allow-Origin', '*');
        res.json({message: `OK`, code: '200', data: result});
      });
    }
  });
});

//app.use(express.static('../build'));

app.listen(port, () => {
  console.log(`Listening port ${port}`);
});


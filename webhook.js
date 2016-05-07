'use strict';
const mongo = require('then-mongo');
const express = require('express');
const db = mongo('mongodb://127.0.0.1/botshop', ['user', 'application']);
const app = module.exports = express();

app.all('/:app', (req, res, next)=>{
    res.status(200).end();
    req.body.entry.forEach(entry=>entry.messaging.forEach(message=>{
        const user_id = message.sender.id;
        if (message.message)
        {
            const text = message.message.text;
        }
        if (message.postback)
        {
            const payload = message.postback.payload;
        }
    }))
});

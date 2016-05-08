'use strict';
const assert = require('assert');
const path = require('path');
const express = require('express');
const body_parser = require('body-parser');
const app = express();

assert(process.env.APP_TOKEN);

app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.use(body_parser.json());
app.use(body_parser.urlencoded({extended: true}));
app.use((req, res, next)=>{
    console.log(req.method, req.url, JSON.stringify(req.body, null, 4));
    next();
});
app.use('/webhook', (req, res, next)=>{
    if (req.query['hub.challenge'])
    {
        console.log('challenge', req.query['hub.challenge']);
        return res.send(req.query['hub.challenge']);
    }
    next();
}, require('./webhook.js'));
app.get('/health', (req, res)=>res.send('ok'));
app.use(express.static(path.join(__dirname, 'bower_components')));
app.use(express.static(path.join(__dirname, 'public')));
app.listen(8080, ()=>console.log('server is up'));

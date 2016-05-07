'use strict';
const mongo = require('then-mongo');
const express = require('express');
const request = require('request');
const db = mongo('mongodb://127.0.0.1/botshop', ['user', 'item']);
const app = module.exports = express();

app.all('/:app_id', (req, res, next)=>{
    res.status(200).end();
    req.body.entry.forEach(entry=>entry.messaging.forEach(message=>{
        const user_id = message.sender.id;
        const send = (opt)=>{
            let body = {recipient: {id: user_id}, message: {}};
            if (opt.elements)
            {
                body.message.attachment = {
                    type: 'template',
                    payload: {
                        template_type: 'generic',
                        elements: opt.elements.map(el=>{
                            return {
                                title: el.title,
                                subtitle: el.subtitle,
                                item_url: el.url,
                                image_url: el.image,
                                buttons: el.buttons.map(btn=>{
                                    return {
                                        type: 'postback',
                                        title: btn.title,
                                        payload: btn.payload,
                                    };
                                }),
                            };
                        }),
                    },
                };
            }
            else if (opt.text)
            {
                if (opt.buttons)
                {
                    body.message.attachment = {
                        type: 'template',
                        payload: {
                            template_type: 'button',
                            text: opt.text,
                            buttons: el.buttons.map(btn=>{
                                return {
                                    type: 'postback',
                                    title: btn.title,
                                    payload: btn.payload,
                                };
                            }),
                        }};
                }
                else
                    body.message.text = opt.text;
            }
            else
                return;
            request({
                method: 'POST',
                url: '',
                json: body,
            }, (err, res)=>{
                if (err)
                    return console.log(err);
                console.log(res.body);
            });
        };
        db.user.findAndModify({
            query: {user_id: user_id, app_id: req.params.app_id},
            update: {$setOnInsert: {cart: {}}},
            new: true,
            upsert: true,
        }).then(user=>{
            if (message.message)
            {
                const text = message.message.text;
            }
            if (message.postback)
            {
                const payload = message.postback.payload.split('.');
                switch (payload[0])
                {
                case 'category':
                    break;
                case 'add':
                    break;
                case 'cart':
                    break;
                case 'remove':
                    break;
                case 'checkout':
                    break;
                }
            }
        });
    }))
});

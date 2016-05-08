'use strict';
const mongo = require('then-mongo');
const express = require('express');
const request = require('request');
const db = mongo('mongodb://127.0.0.1/botshop', ['user', 'item']);
const app = module.exports = express();

db.user.ensureIndex({user_id: 1, app_id: 1}, {unique: true});
db.item.ensureIndex({category: 1});

function price(user){
    return user.cart && user.cart.reduce((price, item)=>price+item.price*item.quantity, 0) || 0;
}

app.get('/checkout/:user_id', (req, res, next)=>{
    db.user.findOne({_id: req.params.user_id}).then(user=>{
        if (!user && 0)
            return res.send('session expired');
        res.render('checkout');
    }).catch(next);
});

app.post('/checkout/:user_id', (req, res, next)=>{
});

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
                            buttons: opt.buttons.map(btn=>{
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
                return console.log('unknown options');
            return new Promise((resolve, reject)=>{
                request({
                    method: 'POST',
                    url: `https://graph.facebook.com/me/messages?access_token=${process.env.APP_TOKEN}`,
                    json: JSON.parse(JSON.stringify(body)),
                }, (err, res)=>{
                    if (err)
                        return reject(err);
                    resolve();
                });
            });
        };
        db.user.findAndModify({
            query: {user_id: user_id, app_id: req.params.app_id},
            update: {$setOnInsert: {timestamp: new Date()}},
            new: true,
            upsert: true,
        }).then(user=>{
            if (message.message)
            {
                const text = message.message.text;
                if (!user.cart)
                {
                    return db.user.findAndModify({
                        query: {_id: user._id},
                        update: {$set: {cart: []}},
                        new: true,
                    }).then(user=>{
                        send({text: 'Welome to our delivery system, please enter your address to continue...'});
                    });
                }
                return db.user.findAndModify({
                    query: {_id: user._id},
                    update: {$set: {address: text}},
                    new: true,
                }).then(user=>{
                    return db.item.distinct('category', {}).then(categories=>{
                        send({
                            text: 'Please choose one of the following categories',
                            buttons: categories.sort().map(category=>{
                                return {
                                    title: category,
                                    payload: `category.${category}`,
                                };
                            }),
                        });
                    }).catch(err=>console.log(err));
                });
            }
            if (message.postback)
            {
                const payload = message.postback.payload.split('.');
                switch (payload[0])
                {
                case 'category':
                    return db.item.find({category: payload[1]}).sort({title: 1}).then(items=>{
                        send({elements: items.map(item=>{
                            return {
                                title: item.title,
                                subtitle: item.description,
                                image: item.image,
                                buttons: [{
                                    title: 'Add To Cart',
                                    payload: `add.${item._id}`,
                                }],
                            };
                        })});
                    });
                case 'add':
                    return db.item.findOne({_id: payload[1]}).then(item=>{
                        if (!item)
                            return console.log(`item ${payload[1]} not found`);
                        return db.user.findAndModify({
                            query: {_id: user._id, 'cart._id': payload[1]},
                            update: {$inc: {'cart.$.quantity': 1}},
                            new: true,
                        }).then(_user=>{
                            return _user || db.user.findAndModify({
                                query: {_id: user._id},
                                update: {$push: {cart: Object.assign({quantity: 1}, item)}},
                                new: true,
                            });
                        }).then(()=>{
                            send({
                                text: `${item.title} was added to your cart`,
                                buttons: [{
                                    title: 'View Cart',
                                    payload: 'cart',
                                }],
                            });
                        });
                    }).catch(err=>console.log(err));
                    break;
                case 'cart':
                    if (!user.cart.length)
                        return send({text: 'You have no items in your cart'});
                    return send({elements: user.cart.map(item=>{
                        return {
                            title: `${item.title} (${item.quantity})`,
                            subtitle: item.description,
                            image: item.image,
                            buttons: [{
                                title: '+1',
                                payload: `add.${item._id}`,
                            }, {
                                title: 'remove',
                                payload: `remove.${item._id}`,
                            }],
                        };
                    })}).then(()=>{
                        send({
                            text: `Total: $${price(user)}\nAddress: ${user.address}`,
                            buttons: [{
                                title: 'Checkout',
                                payload: 'checkout',
                            }],
                        });
                    });
                case 'remove':
                    return db.item.findOne({_id: payload[1]}).then(item=>{
                        if (!item)
                            return console.log(`item ${payload[1]} not found`);
                        return db.user.findAndModify({
                            query: {_id: user._id},
                            update: {$pull: {cart: {_id: item._id}}},
                            new: true,
                        }).then(user=>{
                            send({
                                text: `${item.title} was removed from your cart`,
                                buttons: [{
                                    title: 'View Cart',
                                    payload: 'cart',
                                }],
                            });
                        });
                    });
                    break;
                case 'checkout':
                    return db.user.remove({_id: user._id}).then(()=>send({text: 'Thank you for your order!'}));
                }
            }
        }).catch(err=>console.log(err));
    }))
});

db.item.insert([
    {_id: 'coke', title: 'Coke', category: 'Drinks', price: 2},
    {_id: 'pepsi', title: 'Pepsi', category: 'Drinks', price: 1},
    {_id: 'burger', title: 'Burger', category: 'Meals', price: 5},
]);


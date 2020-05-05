'use strict';
const express = require('express');
const app = express();
const expressWs = require('express-ws')(app);
const morgan = require('morgan');
const line = require("@line/bot-sdk");

app.set('port', process.env.PORT || 3000);
app.use(morgan('combined'));
app.use(express.static('static'));

let connects = [];

const wsToken = process.env.wsToken || 'jfkdls';

const config = {
    channelSecret:      process.env.CHANNEL_SECRET,
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
};

const client = new line.Client(config);

app.post('/hook', line.middleware(config), (req, res) => {
    console.log(req.body);
    res.status(200).end();

    const events = req.body.events;

    events.forEach(async ev => {
        const prof = await client.getProfile(ev.source.userId);
        console.log(prof, ev.message, `>>> ws clients : (${connects.length})`),
        connects.forEach(conn => {
            conn.send({
                rptoken: ev.replyToken,
                sender:  prof.displayName,
                message: ev.message.text
            });
        });
    });
});

app.ws('/ws', (ws, req) => {
    if (req.query.token !== wsToken) {
        ws.close();
        console.log('****** reject connection: invalid token');
        return;
    }

    connects.push(ws);

    const ipaddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log(`****** connect new client: ${ipaddr}`);

    ws.on('message', message => {
        console.log('Received -', message);
        if (message.rptoken.length) {
            client.replyMessage(message.rptoken, {
                type: "text",
                text: `${message.sender}さん、${message.message}`
            });
        }
    });

    ws.on('close', () => {
        connects = connects.filter(conn => {
            return (conn === ws) ? false : true;
        });
    });
});

app.listen(app.get('port'), () => {
    console.log('Server listening on port %s', app.get('port'));
});

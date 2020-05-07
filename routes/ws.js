'use strict';

const line = require("@line/bot-sdk");

module.exports = (g) => {
    const express = require('express');
    const router = express.Router();

    const lineClient = new line.Client(g.lineConfig);

    router.ws('/ws', (ws, req) => {
        const appToken = req.query.token;
        if (! appToken) {
            ws.close();
            console.log('****** reject connection: invalid token');
            return;
        }

        g.connects[appToken] = ws;

        const ipaddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        console.log(`****** connect new client: ${ipaddr}`);

        ws.on('message', message => {
            const messageData = JSON.parse(message);
            console.log('Received -', messageData);

            if (messageData.rptoken) {
                lineClient.replyMessage(messageData.rptoken, {
                    type: "text",
                    text: `${messageData.sender}さん、${messageData.message}`
                });
            }
        });

        ws.on('close', () => {
            delete g.connects[appToken];
        });
    });

    return router;
};
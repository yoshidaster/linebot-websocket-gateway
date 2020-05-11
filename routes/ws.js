'use strict';

const line = require("@line/bot-sdk");

module.exports = (g) => {
    const express = require('express');
    const router = express.Router();

    const lineClient = new line.Client(g.lineConfig);

    router.ws('/ws', async (ws, req) => {
        const appToken = req.query.token;
        if (! appToken) {
            ws.close();
            console.log('****** reject connection: invalid token');
            return;
        }

        g.connects[appToken] = ws;

        const userId = await g.redis.get(`user-id:${appToken}`);
        if (userId) {
            lineClient.pushMessage(userId, {
                type: "text",
                text: "応答アプリケーションが接続しました"
            });
        }

        const ipaddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        console.log(`****** connect new client: ${ipaddr}`);

        ws.on('message', async message => {
            const replyMessage = JSON.parse(message);
            console.log('Received -', replyMessage);

            const replyToken = await g.redis.get(`reply-token:${appToken}:${replyMessage.id}`);
            if (replyToken) {
                lineClient.replyMessage(replyToken, {
                    type: "text",
                    text: replyMessage.text
                });
            }
        });

        ws.on('close', async () => {
            delete g.connects[appToken];
            const userId = await g.redis.get(`user-id:${appToken}`);
            if (userId) {
                lineClient.pushMessage(userId, {
                    type: "text",
                    text: "応答アプリケーションの接続が切れました"
                });
                g.redis.delete(`user-id:${appToken}`);
            }
        });
    });

    return router;
};
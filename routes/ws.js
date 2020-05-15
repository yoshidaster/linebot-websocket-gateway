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

        const userId = await g.redis.get(`user-id:${appToken}`);
        if (! userId) {
            ws.close();
            console.log('****** reject connection: user not exist');
            return;
        }

        lineClient.pushMessage(userId, {
            type: "text",
            text: "応答アプリケーションが接続しました"
        });

        g.connects[appToken] = ws;

        const ipaddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        console.log(`****** connect new client: ${ipaddr}`);

        ws.on('message', async message => {
            const receivedMessage = JSON.parse(message);
            console.log('Received -', receivedMessage);

            if (receivedMessage.mode === "reply") {
                const replyToken = await g.redis.get(`reply-token:${appToken}:${replyMessage.id}`);
                if (replyToken) {
                    lineClient.replyMessage(replyToken, {
                        type: "text",
                        text: receivedMessage.text
                    });
                }
            }
            else if (receivedMessage.mode === "push") {
                lineClient.pushMessage(userId, {
                    type: "text",
                    text: receivedMessage.text
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
'use strict';

module.exports = (g) => {
    const express = require('express');
    const router = express.Router();

    const line = require("@line/bot-sdk");
    const lineClient = new line.Client(g.lineConfig);

    router.post('/hook', line.middleware(g.lineConfig), (req, res) => {
        res.status(200).end();

        const events = req.body.events;

        events.forEach(async ev => {
            const userId = ev.source.userId;
            const appToken = await g.redis.get(`app-token:${userId}`);
            const wsClients = g.connects[appToken];

            if (! wsClients) {
                lineClient.replyMessage(ev.replyToken, {
                    type: "text",
                    text: '応答するアプリケーションがありません'
                });
            } else if (ev.message.type !== "text") {
                lineClient.replyMessage(ev.replyToken, {
                    type: "text",
                    text: 'text メッセージ以外は受け付けられません'
                });
            } else {
                const prof = await lineClient.getProfile(ev.source.userId);
                wsClients.send(JSON.stringify({
                    rptoken: ev.replyToken,
                    sender:  prof.displayName,
                    message: ev.message.text
                }));
            }
        });
    });

    return router;
};

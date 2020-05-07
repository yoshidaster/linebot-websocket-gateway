'use strict';

const line = require("@line/bot-sdk");

module.exports = (g) => {
    const lineClient = new line.Client(g.lineConfig);

    return {
        hook: (req, res) => {
            res.status(200).end();
        
            const events = req.body.events;
        
            events.forEach(async ev => {
                console.log(ev.message.type);

                const ws_clients = g.connects[ev.source.userId];

                if (! ws_clients) {
                    lineClient.replyMessage(message_data.rptoken, {
                        type: "text",
                        text: '応答するアプリケーションがありません'
                    });
                } else if (ev.message.type !== "text") {
                    lineClient.replyMessage(message_data.rptoken, {
                        type: "text",
                        text: 'text メッセージ以外は受け付けられません'
                    });
                } else {
                    const prof = await lineClient.getProfile(ev.source.userId);
                    ws_clients.send(JSON.stringify({
                        rptoken: ev.replyToken,
                        sender:  prof.displayName,
                        message: ev.message.text
                    }));
                }
            });
        }
    }
};

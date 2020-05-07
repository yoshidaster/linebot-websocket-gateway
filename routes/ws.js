'use strict';

const line = require("@line/bot-sdk");

module.exports = (g) => {
    const lineClient = new line.Client(g.lineConfig);

    return {
        ws: (ws, req) => {
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
                const message_data = JSON.parse(message);
                console.log('Received -', message_data);

                if (message_data.rptoken) {
                    lineClient.replyMessage(message_data.rptoken, {
                        type: "text",
                        text: `${message_data.sender}さん、${message_data.message}`
                    });
                }
            });

            ws.on('close', () => {
                delete g.connects[appToken];
            });
        }
    };
};
'use strict';

const express = require('express');
const app = express();
const expressWs = require('express-ws')(app);
const morgan = require('morgan');
const redis = require('ioredis').createClient();
const line = require("@line/bot-sdk");

app.use(morgan('combined'));
app.use(express.static('static'));
app.set("view engine", "ejs");
app.set('port', process.env.PORT || 3000);

let connects = {};

const lineConfig = {
    channelSecret:      process.env.CHANNEL_SECRET,
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
};

const linkController = require('./routes/link')({
    liff_id:   process.env.LIFF_ID,
    client_id: process.env.CLIENT_ID,
    redis: redis
});
app.get('/link', linkController.link);
app.post('/issueToken', express.json(), linkController.issueToken);

const hookController = require('./routes/hook')({
    connects:   connects,
    lineConfig: lineConfig,
    redis: redis
});
app.post('/hook', line.middleware(lineConfig), hookController.hook);

const wsController = require('./routes/ws')({
    connects:   connects,
    lineConfig: lineConfig,
    redis: redis
});
app.ws('/ws', wsController.ws);

app.listen(app.get('port'), () => {
    console.log('Server listening on port %s', app.get('port'));
});

'use strict';

const express = require('express');
const app = express();
const expressWs = require('express-ws')(app);
const morgan = require('morgan');
const redis = require('ioredis').createClient(process.env.REDIS_URL || '127.0.0.1');

app.use(morgan('combined'));
app.use('/static/', express.static('static'));
app.set("view engine", "ejs");
app.set('port', process.env.PORT || 3000);

let connects = {};

const lineConfig = {
    channelSecret:      process.env.CHANNEL_SECRET,
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
};

const linkController = require('./routes/link')({
    liffId: process.env.LIFF_ID,
    clientId: process.env.CLIENT_ID,
    redis: redis
});
app.use(linkController);

const hookController = require('./routes/hook')({
    connects: connects,
    lineConfig: lineConfig,
    redis: redis
});
app.use(hookController);

const wsController = require('./routes/ws')({
    connects: connects,
    lineConfig: lineConfig
});
app.use(wsController);

app.listen(app.get('port'), () => {
    console.log('Server listening on port %s', app.get('port'));
});

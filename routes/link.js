'use strict';

const VERIFY_URL = 'https://api.line.me/oauth2/v2.1/verify';
const TOKEN_EXPIRES = 60 * 60 * 3;

const request = require('request-promise');
const crypto = require('crypto');

module.exports = (g) => {
    const express = require('express');
    const router = express.Router();

    router.get('/link', async (req, res) => {
        res.render('index', {
            liffId : g.liffId,
        });
    });

    router.post('/issueToken', express.json(), async (req, res) => {
        request({
            url: VERIFY_URL,
            method: 'post',
            json: true,
            form: {
                id_token: req.body.idToken,
                client_id: g.clientId
            }
        })
        .then(async body => {
            const userId = body.sub;

            let appToken;
            if (! req.body.refresh) {
                appToken = await g.redis.get(`app-token:${userId}`);
            }
            if (! appToken) {
                appToken = crypto.randomBytes(3).toString('hex');
                g.redis.setex(`app-token:${userId}`, TOKEN_EXPIRES, appToken);
            }

            res.json({
                "appToken": appToken
            });
        })
        .catch(err => {
            console.log("***********", err.message);
            res.status(400).json({
                "error": "error"
            });
        });
    });

    return router;
};

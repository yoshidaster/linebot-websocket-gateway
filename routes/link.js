'use strict';

const VERIFY_URL = 'https://api.line.me/oauth2/v2.1/verify';
const TOKEN_EXPIRES = 60 * 60 * 3;

const request = require('request-promise');
const crypto = require('crypto');

module.exports = (g) => {
    return {
        link: async (req, res) => {
            res.render('index', { 
                liffId : g.liff_id,
            });
        },

        issueToken: async (req, res) => {
            const redis = g.redis;
            request({
                url: VERIFY_URL,
                method: 'post',
                json: true,
                form: {
                    id_token: req.body.idToken,
                    client_id: g.client_id
                }
            })
            .then(async body => {
                const userId = body.sub;
            
                let appToken;
                if (! req.body.refresh) {
                    appToken = await redis.get(`app-token:${userId}`);
                }
                if (! appToken) {
                    appToken = crypto.randomBytes(4).toString('hex');
                    redis.setex(`app-token:${userId}`, TOKEN_EXPIRES, appToken);
                }
          
                res.json({
                    "appToken": appToken
                });
            })
            .catch(err => {
                console.log("***********", err);
                res.status(400).json({
                    "error": "error"
                });
            });
        }
    }
};

'use strict';

const app = new Vue({
    el: '#app',
    data: {
        appToken: '',
        userId: '',
    },

    methods: {
        issueAppToken: async function(refresh){
            var self = this;
            const idToken = liff.getIDToken();
            fetch('./issueToken', {
                method: 'post',
                cache: 'no-cache',
                headers: {
                    "Content-Type": "application/json; charset=utf-8"
                },
                body: JSON.stringify({
                    idToken: idToken,
                    refresh: (refresh ? true : false)
                })
            })
            .then(res => res.json())
            .then(json => {
                this.appToken = json.appToken;
            })
            .catch(err => {
                this.appToken = '';
                alert('エラーがおきました');
            });
        },

        refreshToken: async function(){
            alert('appTokenをリセットします');
            this.issueAppToken(true);
        },

        logout: async function(){
            if (liff.isLoggedIn()){
                alert('ログアウトします');
                liff.logout();
                window.location.reload();
            }
        }
    },

    mounted: function(){
        liff.init({
            liffId: liffId
        })
        .then(() => {
            if (liff.isInClient() || liff.isLoggedIn()) {
                this.issueAppToken(false);
            } else {
                liff.login();
            }
        });
    }
});

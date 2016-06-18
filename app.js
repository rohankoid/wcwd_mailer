require('dotenv').load();
var express = require('express'),
    app = express(),
    giphy = require('giphy')('dc6zaTOxFJmzC'),
    nodemailer = require("nodemailer"),
    CronJob = require('cron').CronJob;


app.set('port', (process.env.PORT || 5000));app.get('/', function(request, response) {
    var result = 'App is running'
    response.send(result);
}).listen(function() {
    console.log('App is running');
    //the rest of our app lives here, wrapped inside this function
     });

new CronJob('28 16 * * *', function () {
    giphy.search({
        q: 'giraffes',
        limit: 100,
        rating: 'g'
    }, function (err, res) {
        var gifs = res.data;
        var gif = gifs[Math.floor(Math.random() * gifs.length)];
        smtpTransport.sendMail({
            from: process.env.MY_EMAIL, // sender address
            to: "rohanmaleku@gmail.com", // receiver address
            subject: "DAILY GIF ✔", // subject
            text: gif.images.downsized_large.url // body
        }, function (error, response) {
            if (error) {
                console.log(error);
            } else {
                console.log("Message sent: " + response.message);
            }
        });
    });
}, null, true, 'America/New_York');

var smtpTransport = nodemailer.createTransport("SMTP", {
    service: "Gmail",
    auth: {
        XOAuth2: {
            user: process.env.MY_EMAIL, // Your gmail address.
            // Not @developer.gserviceaccount.com
            clientId: process.env.MY_CLIENT_ID,
            clientSecret: process.env.MY_CLIENT_SECRET,
            refreshToken: process.env.MY_REFRESH_TOKEN
        }
    }
});


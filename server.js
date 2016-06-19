require('dotenv').load();
var express = require('express'),
    app = express(),
    giphy = require('giphy')('dc6zaTOxFJmzC'),
    nodemailer = require("nodemailer"),
    CronJob = require('cron').CronJob,
    firebase = require('firebase'),
    config = require('./config'),
    moment = require('moment');

var port = (process.env.PORT || 5000);
app.set('port', port);
app.get('/', function (request, response) {
    var result = 'App is running'
    response.send(result);
}).listen(port, function () {
    console.log('App is running on port: ' + port);
    //the rest of our app lives here, wrapped inside this function
});

firebase.initializeApp(config.config());
var now = moment.now();
var seven_days = moment().add(7, "days");
console.log(moment().subtract(7, "days").valueOf());
var unix_seven_days = seven_days.valueOf();
var db = firebase.database();
var user_ref = db.ref("/users");
var event_ref = db.ref("/events");


new CronJob('45 18 * * *', function () {
    console.log('Job Started');
    var filtered_events = [];
// get list of events which starts this week
// (7 days is the maximum time for which notifications are sent)
    event_ref.orderByChild("start_date").startAt(now).endAt(unix_seven_days).once("value", function (events_snapshot) {
        var events = events_snapshot.val();
        console.log('Events Fetched');
        user_ref.once("value", function (users_snapshot) {
            var users = users_snapshot.val();
            for (var u in users) {
                var notify = false;
                var user_events = [];
                var user = users[u];
                var preferences = user.preferences ? user.preferences : {};
                if (Object.keys(preferences).length > 0 && preferences.notify) {
                    var notify_in = parseInt(preferences.notify);
                    var last_notified_on = new Date(user.notified_on);
                    var next_notify_on = moment(last_notified_on).add(notify_in, "days").valueOf();
                    if (!isNaN(next_notify_on) && (now > next_notify_on)) // check if user needs to be notified or not
                    {
                        notify = true;
                        Object.prototype.getKeyByValue = function (value) {
                            var result = [];
                            for (var prop in this) {
                                if (this.hasOwnProperty(prop)) {
                                    if (this[prop] === value)
                                        result.push(prop);
                                }
                            }
                            return result;
                        }
                        var event_types = preferences.event_types;
                        var week_days = preferences.week_days;
                        var check_days = week_days.getKeyByValue(true);
                        var check_types = event_types.getKeyByValue(true);
                        for (var e in events) {
                            var event = events[e];
                            if (event.type != undefined) {
                                var in_type = check_types.indexOf(event.type);
                                var in_day = check_days.indexOf(event.week_day);
                                if ((in_day > -1) && (in_type > -1)) {
                                    // this user should get an email
                                    user_events.push(event);
                                }
                            }
                        }
                    }
                }
                if (notify) {
                    filtered_events.push({user_id: u, user: user, events: user_events, next_notify_on: next_notify_on});
                }
            }
        }).then(function () {
            for (var e in filtered_events) {
                var user_details = filtered_events[e];
                var user_id = user_details.user_id;
                var email = user_details.user.email;
                var text = "";
                var id = 1;
                // build email
                for (var ue in user_details.events) {
                    var event = user_details.events[ue];
                    if (event.type != undefined) {
                        if (id == 1) {
                            text += "Greetings " + user_details.user.name + ", <br><br>";
                            text += "Here are some of the events happening this week, that you might be interested in. <br><br><br>";
                        }
                        text += id + ". <strong>" + event.venue + "</strong>, " + "<div>" + event.type + " - " + event.style + "</div></br></br>";
                        id++;
                    }

                }

                if (id > 1) {
                    smtpTransport.sendMail({
                        from: process.env.MY_EMAIL, // sender address
                        to: email, // receiver address
                        subject: "Where can we dance this week??", // subject
                        html: text // body
                    }, function (error, response) {
                        if (error) {
                            console.log(error);
                        } else {
                            console.log("Message sent: " + response.message);
                        }
                    });
                    console.log("notified_on: " + now);
                    //update user has been notified
                    var u_ref = user_ref.child(user_id);
                    u_ref.update({notified_on: now});
                }
            }
        });
    });
}, null, true, 'Europe/Berlin');

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



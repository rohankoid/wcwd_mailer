require('dotenv').load();
var express = require('express'),
    app = express(),
    giphy = require( 'giphy' )( 'dc6zaTOxFJmzC' ),
    nodemailer = require("nodemailer"),
    CronJob = require('cron').CronJob;
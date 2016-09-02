"use strict";

var Botkit = require('botkit');
var controller = Botkit.slackbot();
var secretToken = require('./secret');


var bot = controller.spawn({ token: secretToken().token });
var currentMessage; // this should probably be an array in case a second link is shared before metadata comes back for the first one

var http = require('http'),
    options = {};

bot.startRTM(function(err,bot,payload) {
  if (err) {
    throw new Error('Could not connect to Slack');
  }
  else {
      console.log("connected");
  }
});

function callback(response) {

    var str = '';
    response.on('data', function (chunk) {
        str += chunk;
    });

    response.on('end', function() {

        if(str.indexOf('not found') == -1) { // add the video id to this in case the text "not found" is in the metadata

            var metadata = JSON.parse(str)[0],
                url = metadata.url,
                title = metadata.title,
                description = metadata.description.substring(0,100).replace(/<br\s*[\/]?>/gi, "\n") + '...',
                thumbnail = metadata.thumbnail_large,
                message = {
                    "attachments" : [
                        {
                            "title" : title,
                            "title_link" : url,
                            "text" : description,
                            "image_url" : thumbnail
                        }
                    ]
                };

            console.log("found metadata", message);
            bot.reply(currentMessage, message);
        }
        else {
            console.log("no metadata found");
        }
    });
}

controller.hears('vimeo.com/',['direct_message','direct_mention','mention','ambient'], (bot,message) => {

    var pattern = /\d{9}/g,
        videoID = message.text.match(pattern);

    if(videoID) {
        options.host = `vimeo.com`;
        options.path = `/api/v2/video/${videoID}.json`;
        http.request(options, callback).end();
        currentMessage = message;
    }
    else {
        console.log("couldn't find a 9 digit video id");
    }
});

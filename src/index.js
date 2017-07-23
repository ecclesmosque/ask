'use strict';
var Alexa = require('alexa-sdk');
var request = require('request');
var moment = require('moment');

var API_BASE = 'https://api.ecclesmosque.org.uk';
var API_PATH_PRAYER_TIMES = '/prayer-times';

//=========================================================================================================================================
//TODO: The items below this comment need your attention.
//=========================================================================================================================================

//Replace with your app ID (OPTIONAL).  You can find this value at the top of your skill's page on http://developer.amazon.com.  
//Make sure to enclose your value in quotes, like this: var APP_ID = "amzn1.ask.skill.bb4045e6-b3e8-4133-b650-72923c5980f1";
var APP_ID = process.env.APP_ID || 'amzn1.ask.skill.8310f69c-65b5-4e51-a9e4-ee80d7f82210';

var SKILL_NAME = "Eccles Mosque";
var GET_FACT_MESSAGE = "Here's your fact: ";
var NEXT_PRAYER_MESSAGE = "Next prayer is ";
var TODAYS_PRAYER_MESSAGE = "Today's Prayer times are: ";
var LOCATION_MESSAGE = "The Eccles Mosque is located at: ";
var HELP_MESSAGE = "You can say when is the next prayer? or Todays Prayer time. or tell me a fact, or, you can say exit... What can I help you with?";
var HELP_REPROMPT = "What can I help you with?";
var STOP_MESSAGE = "Goodbye!";

//=========================================================================================================================================
//TODO: Replace this data with your own.  You can find translations of this data at http://github.com/alexa/skill-sample-node-js-fact/data
//=========================================================================================================================================
var data = [
  'The first Yemeni restaurant in Eccles was in 1970s.',
  'Yemenis arrived in Eccles in the 1940s, they have made an important contribution to the region’s economy, working in steel, cotton manufacturing, engineering and other industries.',
  'There are currently up to 800 Yemeni families in Greater Manchester, with the Eccles community at its heart.',
  'Abdo Hizam  - the first Yemeni to arrive in Eccles - and his son Ahmed, who died two years ago in his 80s.',
  'Mohamed Kasseum, known in Eccles as Abba. His wife, Atteager Kasseum, the daughter of, one of the original wave of 1875 migrants. They were Gadri’s grandparents.'
];

var info = {
  address: '5 Liverpool Road, Eccles, Salford M30 0WB',
  telephone: '161 789 2609',
  email: 'info@ecclesmosque.org.uk',
  charityNo: 'Charity no. 516270',
  activities: 'Aims & activities: Education, religious activities.',
  helps: 'Children/young people, Elderly/old people, People with disabilities, People of a particular ethnic or racial origin, The general public/mankind',
  works: 'Provides buildings/facilities/open space, Provides services',
  governing: 'Constitution adopted 28 November 1984. Constitution was later amended 31 October 1993 and 1 July 2008.'
}

//=========================================================================================================================================
//Editing anything below this line might break your skill.  
//=========================================================================================================================================
exports.handler = function (event, context, callback) {
  var alexa = Alexa.handler(event, context);
  alexa.appId = APP_ID;
  alexa.registerHandlers(handlers);
  alexa.execute();
};

var PrayerTimes = {
  'today': function (callback) {
    var DATA_FILE = moment().format('YYYY/MM/DD');

    var url = API_BASE + API_PATH_PRAYER_TIMES + '/' + DATA_FILE + '.json';

    request(url, function (error, response, body) {

      if (error || !response || response.statusCode !== 200) {
        console.log('Error fetching todays prayer times:', error); // Print the error if one occurred
        callback(new Error());
      }

      if (response && response.statusCode === 200) {
        var PRAYER_TIMES = JSON.parse(body);
        var todaysPrayerTimes = [
          'Fajr at ' + moment(PRAYER_TIMES.FAJR.JAMAAT).format('hh:mm a'),
          'Zuhr at ' + moment(PRAYER_TIMES.DHUHUR.JAMAAT).format('hh:mm a'),
          'Asr at ' + moment(PRAYER_TIMES.ASR.JAMAAT).format('hh:mm a'),
          'Maghrib at ' + moment(PRAYER_TIMES.MAGHRIB.JAMAAT).format('hh:mm a'),
          'Isha at ' + moment(PRAYER_TIMES.ISHA.JAMAAT).format('hh:mm a')
        ];
        callback(null, todaysPrayerTimes.join('. '));
      }

    });

  },
  'next': function (callback) {
    var DATA_FILE = moment().format('YYYY/MM/DD');
    var url = API_BASE + API_PATH_PRAYER_TIMES + '/' + DATA_FILE + '.json';

    request(url, function (error, response, body) {
      if (error || response && response.statusCode !== 200) {
        console.log('Error fetching next prayer time:', error); // Print the error if one occurred
        callback(new Error());
      }

      if (response && response.statusCode === 200) {
        var PRAYER_TIMES_DATA = JSON.parse(body);

        var PRAYER_TIMES = [
          { name: 'Fajr', time: PRAYER_TIMES_DATA.FAJR.JAMAAT },
          { name: 'Zuhr', time: PRAYER_TIMES_DATA.DHUHUR.JAMAAT },
          { name: 'Asr', time: PRAYER_TIMES_DATA.ASR.JAMAAT },
          { name: 'Maghrib', time: PRAYER_TIMES_DATA.MAGHRIB.JAMAAT },
          { name: 'Isha', time: PRAYER_TIMES_DATA.ISHA.JAMAAT },
        ];

        PRAYER_TIMES.every(function (schedule) {
          if (moment(schedule.time).isAfter()) {
            var responseMessage = schedule.name + ' at ' + moment(schedule.time).format('hh:mm a') + '.';
            return callback(null, responseMessage);
          }
        }, this);
      }

    });

  }

};


var handlers = {
  'LaunchRequest': function () {
    this.emit('GetNewFactIntent');
  },

  'GetNewFactIntent': function () {
    var factArr = data;
    var factIndex = Math.floor(Math.random() * factArr.length);
    var randomFact = factArr[factIndex];
    var speechOutput = GET_FACT_MESSAGE + randomFact;
    this.emit(':tellWithCard', speechOutput, SKILL_NAME, randomFact)
  },

  'NextPrayerAtIntent': function () {
    var thisIntent = this;
    PrayerTimes.next(function (error, nextPrayerTime) {
      if (error) {
        thisIntent.emit(':tell', 'Sorry I am unable to get next prayer times. Please try again later.');
      } else {
        var speechOutput = NEXT_PRAYER_MESSAGE + nextPrayerTime;
        thisIntent.emit(':tellWithCard', speechOutput, SKILL_NAME, nextPrayerTime);
      }
    });
  },

  'TodaysPrayerTimesIntent': function () {
    var thisIntent = this;

    PrayerTimes.today(function (error, todaysPrayerTimes) {
      if (error) {
        thisIntent.emit(':tell', 'Sorry I am unable to get todays prayer times. Please try again later.');
      } else {
        var speechOutput = TODAYS_PRAYER_MESSAGE + todaysPrayerTimes;
        thisIntent.emit(':tellWithCard', speechOutput, SKILL_NAME, todaysPrayerTimes);
      }
    });

  },

  'LocationIntent': function () {
    var speechOutput = LOCATION_MESSAGE + info.address;
    this.emit(':tellWithCard', speechOutput, SKILL_NAME, location)
  },
  // 'InfoIntent': function () {
  //   var info = info.address;
  //   var speechOutput = LOCATION_MESSAGE + info;
  //   this.emit(':tellWithCard', speechOutput, SKILL_NAME, info)
  // },
  'AMAZON.HelpIntent': function () {
    var speechOutput = HELP_MESSAGE;
    var reprompt = HELP_REPROMPT;
    this.emit(':ask', speechOutput, reprompt);
  },
  'AMAZON.CancelIntent': function () {
    this.emit(':tell', STOP_MESSAGE);
  },
  'AMAZON.StopIntent': function () {
    this.emit(':tell', STOP_MESSAGE);
  },
  'Unhandled': function () {
    this.emit(':ask', HELP_MESSAGE, HELP_MESSAGE);
  }
};

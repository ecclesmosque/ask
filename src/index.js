var Alexa = require('alexa-sdk');
var request = require('request');
var moment = require('moment-timezone');

moment.tz('Europe/London');
moment.locale('en-gb');

var API_BASE = 'https://api.ecclesmosque.org.uk/prayer-times/';
var DATA_FILE = moment().format('YYYY/MM/DD');
var API_URL = API_BASE + DATA_FILE + '.json';

var APP_ID = process.env.APP_ID || 'amzn1.ask.skill.8310f69c-65b5-4e51-a9e4-ee80d7f82210';

var SKILL_NAME = 'Eccles Mosque';
var GET_FACT_MESSAGE = 'Here\'s your fact:';
var NEXT_PRAYER_MESSAGE = 'Next prayer is';
var TODAYS_PRAYER_MESSAGE = 'Today\'s Prayer times are:';
var LOCATION_MESSAGE = 'The Eccles Mosque is located at:';
var HELP_MESSAGE = 'You can say when is the next prayer? or Today\'s Prayer time. or tell me a fact, or, you can say exit... What can I help you with?';
var HELP_REPROMPT = 'What can I help you with?';
var STOP_MESSAGE = 'Goodbye!';

var data = [
  'The first Yemeni restaurant in Eccles was in 1970s.',
  'Yemenis arrived in Eccles in the 1940s, they have made an important contribution to the region’s economy, working in steel, cotton manufacturing, engineering and other industries.',
  'There are currently up to 800 Yemeni families in Greater Manchester, with the Eccles community at its heart.',
  'Abdo Hizam  - the first Yemeni to arrive in Eccles - and his son Ahmed, who died two years ago in his 80s.',
  'Mohamed Kasseum, known in Eccles as Abba. His wife, Atteager Kasseum, the daughter of, one of the original wave of 1875 migrants. They were Gadri\'s grandparents.',
];

var phoneme = {
  salam: '<phoneme alphabet="ipa" ph="[asːaˈlaːmu ʕaˈlaikum]">As-salāmu ʿalaykum</phoneme>',
  fajr: '<phoneme alphabet="ipa" ph="[sˤalaːt a l fadʒaː r]">Fajr</phoneme>',
  dhuhr: '<phoneme alphabet="ipa" ph="[sˤalaːt a l ðˤðˤuhu r]">Dhuhr</phoneme>',
  asr: '<phoneme alphabet="ipa" ph="[sˤalaːt a l aːsˤ r]">Asr</phoneme>',
  maghrib: '<phoneme alphabet="ipa" ph="[sˤalaːt a l maːɣrib]">Maghrib</phoneme>',
  isha: '<phoneme alphabet="ipa" ph="[sˤalaːt a l iʃaːʔ]">Isha</phoneme>',
};

var info = {
  address: '5 Liverpool Road, Eccles, Salford M30 0WB',
  telephone: '161 789 2609',
  email: 'info@ecclesmosque.org.uk',
  charityNo: 'Charity no. 516270',
  activities: 'Aims & activities: Education, religious activities.',
  helps: 'Children/young people, Elderly/old people, People with disabilities, People of a particular ethnic or racial origin, The general public/mankind',
  works: 'Provides buildings/facilities/open space, Provides services',
  governing: 'Constitution adopted 28 November 1984. Constitution was later amended 31 October 1993 and 1 July 2008.',
};

var PrayerTimes = {
  today: function (callback) {

    console.log('calling', API_URL);

    request(API_URL, function (error, response, body) {
      // console.log('response body', body);
      if (error) {
        //  || (response && response.statusCode !== 200)
        // Print the error if one occurred
        console.log('Error fetching today\'s prayer times:', error);
        callback(new Error());
      }

      if (response && response.statusCode === 200) {
        var PRAYER_TIMES = JSON.parse(body);

        var fajrTimeFromatted = moment(PRAYER_TIMES.FAJR.JAMAAT).tz('Europe/London').format('hh:mm a');
        var dhuhrTimeFromatted = moment(PRAYER_TIMES.DHUHUR.JAMAAT).tz('Europe/London').format('hh:mm a');
        var asrTimeFromatted = moment(PRAYER_TIMES.ASR.JAMAAT).tz('Europe/London').format('hh:mm a');
        var maghribTimeFromatted = moment(PRAYER_TIMES.MAGHRIB.JAMAAT).tz('Europe/London').format('hh:mm a');
        var ishaTimeFromatted = moment(PRAYER_TIMES.ISHA.JAMAAT).tz('Europe/London').format('hh:mm a');

        var todaysPrayerTimes = [
          phoneme.fajr + ' at ' + fajrTimeFromatted,
          phoneme.dhuhr + ' at ' + dhuhrTimeFromatted,
          phoneme.asr + ' at ' + asrTimeFromatted,
          phoneme.maghrib + ' at ' + maghribTimeFromatted,
          phoneme.isha + ' at ' + ishaTimeFromatted,
        ];
        callback(null, todaysPrayerTimes.join('. '));
      }
    });
  },
  next: function (callback) {
    console.log('calling', API_URL);

    request(API_URL, function (error, response, body) {

      // console.log('response body', body);

      if (error) {
        // Print the error if one occurred
        console.log('Error fetching next prayer time:', error);
        callback(new Error());
      }

      if (response && response.statusCode === 200) {

        // console.log('response body', body);

        var PRAYER_TIMES_DATA = JSON.parse(body);

        console.log('PRAYER_TIMES_DATA', PRAYER_TIMES_DATA);

        var PRAYER_TIMES = [
          { name: phoneme.fajr, time: PRAYER_TIMES_DATA.FAJR.JAMAAT },
          { name: phoneme.dhuhr, time: PRAYER_TIMES_DATA.DHUHUR.JAMAAT },
          { name: phoneme.asr, time: PRAYER_TIMES_DATA.ASR.JAMAAT },
          { name: phoneme.maghrib, time: PRAYER_TIMES_DATA.MAGHRIB.JAMAAT },
          { name: phoneme.isha, time: PRAYER_TIMES_DATA.ISHA.JAMAAT },
        ];

        for (var i = 0; i < PRAYER_TIMES.length; i++) {
          var schedule = PRAYER_TIMES[i];
          var responseMessage = '';

          if (moment(schedule.time).isAfter()) {
            var scheduledTimeFormatted = moment(schedule.time).tz('Europe/London').format('hh:mm a');
            responseMessage = schedule.name + ' at ' + scheduledTimeFormatted;
            return callback(null, responseMessage);
          }
        }
      }
    });
  },
};

var handlers = {
  LaunchRequest: function () {
    var speechOutput = phoneme.salam + ' '+ HELP_MESSAGE;
    var reprompt = HELP_REPROMPT;
    this.emit(':ask', speechOutput, reprompt);
  },

  GetNewFactIntent: function () {
    var factArr = data;
    var factIndex = Math.floor(Math.random() * factArr.length);
    var randomFact = factArr[factIndex];
    var speechOutput = GET_FACT_MESSAGE +' '+ randomFact;
    this.emit(':tell', speechOutput);
  },

  NextPrayerAtIntent: function () {
    var thisIntent = this;
    PrayerTimes.next(function (error, nextPrayerTime) {
      if (error) {
        console.log(error);
        thisIntent.emit(':tell', 'Sorry I am unable to get next prayer time. Please try again later.');
      } else {
        var speechOutput = NEXT_PRAYER_MESSAGE +' '+ nextPrayerTime;
        thisIntent.emit(':tell', speechOutput);
      }
    });
  },
  TodaysPrayerTimesIntent: function () {
    var thisIntent = this;

    PrayerTimes.today(function (error, todaysPrayerTimes) {
      if (error) {
        console.log(error);
        thisIntent.emit(':tell', 'Sorry I am unable to get today\'s prayer times. Please try again later.');
      } else {
        var speechOutput = TODAYS_PRAYER_MESSAGE + ' ' + todaysPrayerTimes;
        thisIntent.emit(':tell', speechOutput);
      }
    });
  },
  LocationIntent: function () {
    var speechOutput = LOCATION_MESSAGE + info.address;
    this.emit(':tellWithCard', speechOutput, SKILL_NAME, info.address);
  },
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
  Unhandled: function () {
    this.emit(':ask', HELP_MESSAGE, HELP_MESSAGE);
  },
};

exports.handler = function (event, context, callback) {
  var alexa = Alexa.handler(event, context);
  // alexa.appId = APP_ID;
  alexa.registerHandlers(handlers);
  alexa.execute();
};

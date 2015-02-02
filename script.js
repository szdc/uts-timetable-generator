// ==UserScript==
// @name         UTS Timetable Generator
// @author       szdc
// @namespace    http://github.com/szdc
// @version      0.1
// @description  Timetable generator for UTS students
// @match        https://mysubjects.uts.edu.au/aplus2015/aptimetable*
// @require      http://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js
// @copyright    2015+, szdc
// ==/UserScript==

$(document).ready(function () {
  'use strict';
  
  var subjects = [];

  init();

  function init() {
    var table = $('table[cellspacing="1"] tr');
    table.each(function (index) {
      var isSubjectHeader = $(this).find('td > a').length > 0,
          isActivityRow   = $(this).attr('bgcolor') === '#eeeeee';
      
      if (isSubjectHeader) {
        // New subject
        subjects.push(Subject.fromTableRow($(this)));
      } else if (isActivityRow) {
        // New activity for the most recent subject
        var subject = subjects[subjects.length - 1];
        subject.addActivity(Activity.fromTableRow($(this)));
      }
    });
    console.log('Subjects found: ' + subjects.length);
  }
});


/**
 * Represents a UTS subject.
 */
function Subject(name, code, semester) {
  if (arguments.length < 3) {
    throw new Error('Too few arguments supplied to create the Subject object.');
  }
  
  var activities = {};
  
  /**
   * Adds an activity.
   */
  function addActivity(activity) {
    var type = activity.getType();
    if (typeof activities[type] === 'undefined') {
      activities[type] = [];
    }
    activities[type].push(activity);
  }
  
  return {
    addActivity: addActivity,
    getActivities: function () { return activities; }
  };
}

/**
 * Creates a new Subject object from a table row.
 */
Subject.fromTableRow = function (row) {
  var content = row.find('b:first');
  
  var name     = content.text().substr(content.text().indexOf(':') + 1).trim(),
      code     = content.children('a').attr('href').match(/\d+/)[0],
      semester = /AUT/.test(content.text()) ? 'autumn' : 'spring';
  
  return new Subject(name, code, semester);
};

/**
 * Represents a UTS subject activity.
 */
function Activity(type, number, day, startTime, duration, finishTime) {
  if (arguments.length < 5) {
    throw new Error('Too few arguments supplied to create the Activity object.');
  }
  
  function hasTimeClashWith(activity) {
    var timeClashExists = startTime >= activity.getFinishTime() && finishTime >= activity.getStartTime();
    return timeClashExists;
  }
  
  return {
    hasTimeClashWith: hasTimeClashWith,
    getStartTime: function () { return startTime; },
    getFinishTime: function () { return finishTime; },
    getType: function () { return type; }
  };
}

/**
 * Creates a new Activity object from a table row.
 */
Activity.fromTableRow = function (row) {
  var cells = row.children().map(function() {return this.innerHTML;});
  
  var type       = cells[0],
      number     = cells[1],
      day        = cells[2],
      startTime  = cells[3],
      duration   = cells[4],
      finishTime = new Date('1/1/2015 ' + startTime).addMinutes(90).get24hrTime();
  
  return new Activity(type, number, day, startTime, duration, finishTime);
};

/**
 * Adds minutes to the date object.
 */
Date.prototype.addMinutes = function (minutes) {
  return new Date(this.getTime() + parseInt(minutes) * 60000);
};

/**
 * Returns the 24hr-formatted time.
 */
Date.prototype.get24hrTime = function () {
  return this.getHours() * 100 + this.getMinutes();
};
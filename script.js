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
  
  var subjects   = [],
      activities = [];

  init();
  
  function init() {
    // Find the table rows that hold the timetable data
    var table = $('table[cellspacing="1"] tr');
    
    // Process each row
    table.each(processRow);
    console.log('Subjects found: ' + subjects.length);
    
    // Get all activity groups.
    var activityGroups = getAllActivityGroups();
    console.log('Total activity groups: ' + activityGroups.length);
    
    // Get all timetable combinations
    var timetableCombinations = cartesianProductOf(activityGroups);
    console.log('Timetable combinations: ' + timetableCombinations.length);
    
    // Get all valid timetable combinations
    var validTimetables = timetableCombinations.filter(Timetable.isValid);
    console.log('Valid timetables: ' + validTimetables.length);
  }
  
  /**
   * Processes a timetable row.
   */
  function processRow() {
    var isSubjectHeader = $(this).find('td > a').length > 0,
        isActivityRow   = $(this).attr('bgcolor') === '#eeeeee';

    if (isSubjectHeader) {
      // New subject
      subjects.push(Subject.fromTableRow($(this)));
    } else if (isActivityRow) {
      // New activity under the latest subject
      var subject = subjects[subjects.length - 1];
      subject.addActivity(Activity.fromTableRow($(this), subject));
    }
  }
  
  /**
   * Gets an array of all activity groups.
   */
  function getAllActivityGroups() {
    return subjects.reduce(function (activityGroups, subject) {
      var groups = subject.getActivityGroups(),
          keys = Object.keys(groups);
      
      keys.forEach(function (key) {
        activityGroups.push(groups[key]);
      });
      
      return activityGroups;
    }, []);
  }
  
  /**
   * Returns the cartesian product of N arrays.
   */
  function cartesianProductOf(arr) {
    return arr.reduce(function(a, b) {
      var ret = [];
      a.forEach(function(a) {
        b.forEach(function(b) {
          ret.push(a.concat([b]));
        });
      });
      return ret;
    }, [[]]);
  }
});

/**
 * Represents a UTS subject.
 */
function Subject(name, code, semester) {
  if (arguments.length < 3) {
    throw new Error('Too few arguments supplied to create the Subject object.');
  }
  
  var activityGroups = {};
  
  /**
   * Adds an activity.
   */
  function addActivity(activity) {
    var type = activity.getType();
    if (typeof activityGroups[type] === 'undefined') {
      activityGroups[type] = [];
    }
    activityGroups[type].push(activity);
  }
  
  return {
    addActivity: addActivity,
    getActivityGroups: function () { return activityGroups; },
    getCode: function () { return code; }
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
function Activity(type, number, day, startTime, duration, finishTime, subject) {
  if (arguments.length < 5) {
    throw new Error('Too few arguments supplied to create the Activity object.');
  }
  
  function hasTimeClashWith(activity) {
    var timeClashExists = startTime <= activity.getFinishTime() && finishTime >= activity.getStartTime();
    return timeClashExists;
  }
  
  return {
    hasTimeClashWith: hasTimeClashWith,
    getStartTime: function () { return startTime; },
    getFinishTime: function () { return finishTime; },
    getType: function () { return type; },
    getNumber: function () { return number; },
    getDay: function () { return day; },
    getSubject: function () { return subject; }
  };
}

/**
 * Creates a new Activity object from a table row.
 */
Activity.fromTableRow = function (row, subject) {
  var cells = row.children().map(function() {return this.innerHTML;});
  
  var type       = cells[0],
      number     = cells[1],
      day        = cells[2],
      startTime  = cells[3],
      duration   = cells[4],
      finishTime = new Date('1/1/2015 ' + startTime).addMinutes(duration).get24hrTime(),
      startTime = parseInt(startTime.replace(':', ''));
  
  return new Activity(type, number, day, startTime, duration, finishTime, subject);
};


function Timetable() {}

/**
 * Determines if an array of activities forms a valid timetable.
 */
Timetable.isValid = function (activities) {
  var invalidTimes = {
    "Mon": [], "Tue": [], "Wed": [], "Thu": [], "Fri": [], "Sat": [], "Sun": []
  };

  var valid = activities.every(function (activity) {
    var conflicts = invalidTimes[activity.getDay()];

    if (conflicts.length === 0) {
      conflicts.push(activity);
      return true;
    }

    for (var i = 0; i < conflicts.length; i++) {
      var existingActivity = conflicts[i];
      if (activity.hasTimeClashWith(existingActivity)) {
        return false;
      }
    }
    conflicts.push(activity);
    return true;
  });

  return valid;
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


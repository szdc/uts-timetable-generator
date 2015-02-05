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
    timetableCombinations = timetableCombinations.map(function (timetable) {
      return new Timetable(timetable);
    });
    console.log('Timetable combinations: ' + timetableCombinations.length);
    
    var timetableList = new TimetableList(timetableCombinations);
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
    var type = activity.getType(),
        activities = activityGroups[type];
    if (typeof activityGroups[type] === 'undefined') {
      activityGroups[type] = [];
    }
    
    var existingActivity = getExistingActivity(activityGroups[type], activity);
    if (existingActivity) {
      existingActivity.addNumbers(activity.getNumbers());
    } else {
      activityGroups[type].push(activity);
    }
  }
  
  /**
   * Retrieves an activity from the array if it matches the
   * activity given.
   */
  function getExistingActivity(existingActivities, activity) {
    for (var i = 0; i < existingActivities.length; i++) {
      var existingActivity = existingActivities[i];
      if (existingActivity.matches(activity)) {
        return existingActivity;
      }
    }
    return null;
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
function Activity(type, numbers, day, startTime, duration, finishTime, subject) {
  if (arguments.length < 5) {
    throw new Error('Too few arguments supplied to create the Activity object.');
  }
  
  /**
   * Determines if two activities clash.
   */
  function hasTimeClashWith(activity) {
    var timeClashExists = startTime < activity.getFinishTime() && finishTime > activity.getStartTime();
    return timeClashExists;
  }
  
  /**
   * Determines if two activities are essentially identical.
   */
  function matches(activity) {
    return type === activity.getType() && day === activity.getDay() && 
      startTime === activity.getStartTime() && finishTime === activity.getFinishTime() && 
      subject === activity.getSubject();
  }
  
  /**
   * Appends activity numbers to the numbers array.
   */
  function addNumbers(numbersArray) {
    numbers = numbers.concat(numbersArray);
  }
  
  function toString() {
    return day + ' ' + startTime + '-' + finishTime + ': ' + subject.getCode() + ' ' + type + ' ' + numbers.join(',') + ' (' + duration + ')';
  }
  
  return {
    hasTimeClashWith: hasTimeClashWith,
    getStartTime: function () { return startTime; },
    getFinishTime: function () { return finishTime; },
    getType: function () { return type; },
    getNumbers: function () { return numbers; },
    getDay: function () { return day; },
    getSubject: function () { return subject; },
    matches: matches,
    addNumbers: addNumbers,
    toString: toString
  };
}

/**
 * Creates a new Activity object from a table row.
 */
Activity.fromTableRow = function (row, subject) {
  var cells = row.children().map(function() {return this.innerHTML;});
  
  var type       = cells[0],
      numbers    = [cells[1]],
      day        = cells[2],
      startTime  = cells[3],
      duration   = cells[4],
      finishTime = new Date('1/1/2015 ' + startTime).addMinutes(duration).get24hrTime(),
      startTime = parseInt(startTime.replace(':', ''));
  
  return new Activity(type, numbers, day, startTime, duration, finishTime, subject);
};

/**
 * Compares two activities.
 */
Activity.compare = function (a, b) {
  var days = { "Mon": 0, "Tue": 1, "Wed": 2, "Thu": 3, "Fri": 4, "Sat": 5, "Sun": 6 };
  
  if (a.getDay() === b.getDay()) {
    return a.getStartTime() - b.getStartTime();
  } else {
    return days[a.getDay()] - days[b.getDay()];
  }
};


function TimetableList(timetables) {
  if (arguments.length < 1) {
    throw new Error('Too few arguments supplied to create the TimetableList object.');
  }
  
  // Filter the list to only valid timetable combinations
  timetables = timetables.filter(function (timetable) {
    return timetable.isValid();
  });
  console.log('Valid timetables: ' + timetables.length);
  
  /**
   * Filters the timetable list to those that span
   * the specified number of days (or less).
   */
  function filterByDays(numberOfdays, exact) {
    exact = exact || false;
    
    return timetables.filter(function (timetable) {
      var days = timetable.getDays();
      
      if (exact) {
        return days.length === numberOfdays;
      } else {
        return days.length <= numberOfdays;
      }
    });
  }
  
  /**
   * Sorts the timetables by the total number of hours.
   */
  function sortByTotalHours() {
    timetables.sort(function (a, b) {
      return a.getHours() - b.getHours();
    });
  }
  
  return {
    getTimetables: function () { return timetables; },
    filterByDays: filterByDays,
    sortByTotalHours: sortByTotalHours
  };
}


function Timetable(activities) {
  /**
   * Returns an array of days that the timetable spans.
   */
  function getDays() {
    return activities.reduce(function (days, activity) {
      var day = activity.getDay();
      
      if (days.indexOf(day) === -1) {
        days.push(day);
      }
      
      return days;
    }, []);
  }
  
  function isValid() {
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
  }
  
  /**
   * Calculates the total number of hours spent at uni.
   */
  function getHours() {
    var hoursByDay = activities.reduce(function (days, activity) {
      var day = activity.getDay(),
          start  = activity.getStartTime() / 100,
          finish = activity.getFinishTime() / 100;
      
      if (typeof days[day] === 'undefined') {
        days[day] = { start: start, finish: finish };
      } else {
        if (start < days[day].start) days[day].start = start;
        if (finish > days[day].finish) days[day].finish = finish;
      }
      
      return days;
    }, {});
    
    var hours = Object.keys(hoursByDay).reduce(function (totalHours, day) {
      totalHours += (hoursByDay[day].finish - hoursByDay[day].start);
      return totalHours;
    }, 0);
    
    return hours;
  }
  
  /**
   * Sorts the timetable.
   */
  function sort(compareFn) {
    activities.sort(compareFn);
  }
  
  return {
    getActvities: function () { return activities; },
    getDays: getDays,
    getHours: getHours,
    isValid: isValid,
    sort: sort
  };
}

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


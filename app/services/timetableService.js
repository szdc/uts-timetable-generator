app.service('timetabler', function () {
  /**
   * Repesents a list of Timetable objects.
   */
  this.TimetableList = function (timetables) {
    if (arguments.length < 1) {
      throw new Error('Too few arguments to create a TimetableList object.');
    }
    
    console.log('All timetables: ' + timetables.length);
    
    // Filter to only valid timetables.
    timetables = timetables.filter(function (timetable) {
      return timetable.isValid();
    });
    console.log('Valid timetables: ' + timetables.length);
    
    /**
     * Returns a filtered array of timetables.
     */
    function filter(filterMethod, args) {
      return timetables.filter(filterMethod, args);
    }

    /**
     * Returns an array of timetables that match multiple filters.
     *
     * @param {Array<FilterInfo>} filters
     * An array of FilterInfo objects
     */
    function filterMany(filters) {
      return timetables.filter(function (timetable) {
        for (var i = 0; i < filters.length; i++) {
          var filter = filters[i];
          var result = filter.method.call(filter.options, timetable);
          if (!filter.method.call(filter.options, timetable)) {
            return false;
          }
        }
        return true;
      });
    }

    /**
     * Sorts the timetables.
     */
    function sort(compareMethod) {
      timetables.sort(compareMethod);
    }

    return {
      filter: filter,
      filterMany: filterMany,
      getTimetables: function () { return timetables; },
      sort: sort
    };
  }
  
  /**
   * A static object of common filtering methods.
   */
  this.TimetableList.FilterBy = {
    /**
     * Filters by the number of days the timetable spans.
     *
     * Required: The 2nd parameter of the filter method must
     * contain an object with the following properties:
     *  {Number}  count The maximum allowable number of days
     *  {Boolean} exact Whether or not to also include timetables
     *                  with less days in the results.
     */
    NumberOfDays: function (timetable) {
      if (typeof this.count === 'undefined') {
        throw new Error('Days property missing for filter.');
      }

      var numberOfDays = Object.keys(timetable.getDays()).length;
      return this.exact ? numberOfDays === this.count : numberOfDays <= this.count;
    },

    /**
     * Filters to only timetables that always start later or finish 
     * earlier than the specified time.
     *
     * Required: The 2nd parameter of the filter method must
     * contain an object with the following properties:
     *  {Number} time       The earliest time an activity can start
     *  {String} constraint 'start' for later than; 'finish' for earlier than
     */ 
    TimeConstraint: function (timetable) {
      if (typeof this.time === 'undefined' || typeof this.constraint === 'undefined') {
        throw new Error('Time or Constraint property missing for filter.');
      }

      return timetable.getActivities().every(function (activity) {
        var info = activity.getDetails();
        if (this.constraint === 'start') {
          return info.startTime >= this.time;
        } else {
          return info.finishTime <= this.time;
        }
      }, this);
    },

    /**
     * Filters to only timetables that have classes on the days
     * specified.
     *
     * Required: The 2nd parameter of the filter method must
     * contain an object with the following properties:
     *  {Array} days An array of 3-letter day names with the 
     *               first letter capitalised
     */ 
    Days: function (timetable) {
      if (typeof this.days === 'undefined') {
        throw new Error('Days property missing for filter.');
      }

      var timetableDays = Object.keys(timetable.getDays());
      for (var i = 0; i < timetableDays.length; i++) {
        if (this.days.indexOf(timetableDays[i]) === -1) {
          return false;
        }
      }
      return true;
    }
  };
  
  /**
   * A static object of common sorting methods.
   */
  this.TimetableList.SortBy = {
    /**
     * Sorts by the total number of hours spent on campus.
     * Hours spent each day = end of last class - start of first class
     */
    HoursOnCampus: function (a, b) {
      return a.getHours() - b.getHours();
    }
  };

  /**
   * Represents a list of Activity objects that
   * form a valid timetable.
   */
  this.Timetable = function (activities) {
    /**
     * Determines if a timetable is valid.
     * There must be no activity clashes to return true.
     */
    function isValid() {
      var invalidTimes = {
        "Mon": [], "Tue": [], "Wed": [], "Thu": [], "Fri": [], "Sat": [], "Sun": []
      };
      
      var isValid = activities.every(function (activity) {
        var conflicts = invalidTimes[activity.getDetails().day];
        
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
      
      return isValid;
    }
    
    /**
     * Returns an object of days and times that the timetable spans.
     */
    function getDays() {
      var dayInfo = activities.reduce(function (days, activity) {
        var info = activity.getDetails(),
            day = info.day,
            start = info.start,
            finish = info.finish;
        
        if (typeof days[day] === 'undefined') {
          days[day] = { start: start, finish: finish };
        } else {
          if (start < days[day].start) days[day].start = start;
          if (finish > days[day].finish) days[day].finish = finish;
        }

        return days;
      }, {});

      return dayInfo;
    };
    
    /**
     * Calculates the total number of hours spent at uni.
     */
    function getHours() {
      var dayInfo = getDays();

      var hours = Object.keys(dayInfo).reduce(function (totalHours, day) {
        totalHours += getTimeDiffInHours(dayInfo[day].finish, dayInfo[day].start);
        return totalHours;
      }, 0);

      return hours;
    }
    
    /**
     * Gets the difference between two times in hours.
     */
    function getTimeDiffInHours(startTime, finishTime) {
      startTime = getHoursSinceMidnight(startTime);
      finishTime = getHoursSinceMidnight(finishTime);
      return startTime - finishTime;
    }
    
    /**
     * Gets the number of hours passed since midnight.
     */
    function getHoursSinceMidnight(time) {
      var time    = time / 100,
          hours   = Math.floor(time),
          minutes = (time - hours) / 0.6;

      return (hours + minutes).toFixed(1);
    }
    
    /**
     * Sorts the timetable.
     */
    function sort(compareFn) {
      activities.sort(compareFn);
    }
    
    return {
      getActivities:  function () { return activities; },
      getDays:        getDays,
      getHours:       getHours,
      isValid:        isValid,
      sort:           sort
    };
  }
  
  /**
   * Represents a single subject activity.
   */
  this.Activity = function (details) {
    var requiredKeys = ['type', 'numbers', 'day', 'startTime', 
                        'duration', 'finishTime', 'subject'],
        actualKeys = Object.keys(details);
    var isValidDetails = requiredKeys.every(function (key) {
      return actualKeys.indexOf(key) !== -1;
    });
    
    if (!isValidDetails) {
      throw new Error('Missing information required to create an Activity object.');
    }
    
    /**
     * Determines if two activities clash.
     */
    function hasTimeClashWith(activity) {
      var detailsOther = activity.getDetails();
      var timeClashExists = details.startTime < detailsOther.finishTime &&
                            details.finishTime > detailsOther.startTime;
      return timeClashExists;
    }
    
    /**
     * Determines if two activities are essentially identical.
     */
    function matches(activity) {
      var detailsOther = activity.getDetails();
      return details.type === detailsOther.type && 
             details.day === detailsOther.day && 
             details.startTime === detailsOther.startTime && 
             details.finishTime === detailsOther.finishTime && 
             details.subject === detailsOther.subject;
    }
    
    /**
     * Appends activity numbers to the numbers array.
     */
    function addNumbers(numbersArray) {
      details.numbers = details.numbers.concat(numbersArray);
    }
    
    function toString() {
      return details.day + ' ' + details.startTime + '-' + details.finishTime + ': ' + 
             details.subject.getCode() + ' ' + details.type + ' ' + 
             details.numbers.join(',') + ' (' + details.duration + ')';
    }
    
    return {
      addNumbers:       addNumbers,
      getDetails:       function () { return details; },
      hasTimeClashWith: hasTimeClashWith,
      matches:          matches,
      toString:         toString
    };
  }
  
  /**
   * Compares two activities.
   */
  this.Activity.compare = function (a, b) {
    var days = { "Mon": 0, "Tue": 1, "Wed": 2, "Thu": 3, "Fri": 4, "Sat": 5, "Sun": 6 },
        a = a.getDetails(),
        b = b.getDetails();

    if (a.day === b.day) {
      return a.startTime - b.startTime;
    } else {
      return days[a.day] - days[b.day];
    }
  };
  
  /**
   * Represents a UTS subject.
   */
  this.Subject = function(name, code, semester) {
    if (arguments.length < 3) {
      throw new Error('Too few arguments supplied to create the Subject object.');
    }
    
    var activityGroups = {};
    
    /**
     * Adds an activity.
     */
    function addActivity(activity) {
      var details = activity.getDetails(),
          type = details.type,
          activities = activityGroups[type];
      
      if (typeof activityGroups[type] === 'undefined') {
        activityGroups[type] = [];
      }

      var existingActivity = getExistingActivity(activityGroups[type], activity);
      if (existingActivity) {
        existingActivity.addNumbers(details.numbers);
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
      addActivity:        addActivity,
      getActivityGroups:  function () { return activityGroups; },
      getCode:            function () { return code; }
    };
  }
  
  /**
   * Contains the method and options for a filter.
   */
  this.FilterInfo = function(method, options) {
    this.method = method;
    this.options = options;
  }
});

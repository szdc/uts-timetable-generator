'use strict';

app.controller('homeController', function ($scope, $http, timetabler, utsYqlService) {
  var TimetableList = timetabler.TimetableList,
      FilterInfo    = timetabler.FilterInfo;
  
  $scope.selectedSubject  = undefined;
  $scope.selectedSubjects = [];
  $scope.semester = 'AUT';
  $scope.filters = {
    numberOfDays: {
      count: 2,
      exact: false,
      options: [1, 2, 3, 4, 5]
    },
    times: {
      start:  '09:00',
      finish: '18:00'
    },
    days: {
      available: [true, true, true, true, true, false, false],
      options: ['M', 'T', 'W', 'T', 'F', 'S', 'S']
    }
  };
  $scope.timetables = [];
  
  $scope.timetableLayout = {
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    times: {
      start: '09:00',
      finish: '18:00'
    },
    interval: 15
  };
  
  // Download the subject list.
  $http.get('subjects.json')
    .then(function (res) {
      $scope.subjects = res.data;
    }, function (err) {
      $scope.subjects = [];
      console.log(err);
    }
  );
  
  /**
   * Filters the subject array to only subjects that
   * match ALL of the following criteria:
   * - Name contains the input string
   * - Value contains the selected semester
   * - Value is a standard (S) subject
   */
  $scope.subjectFilter = function (input) {
    return function (subject) {
      return subject.name.indexOf(input) !== -1 && 
             subject.value.indexOf($scope.semester) !== -1 &&
             subject.value.indexOf('_S') !== -1;
    };
  };
  
  /**
   * Adds the selected subject to the list.
   */
  $scope.addSubject = function () {
    var subList = $scope.selectedSubjects,
        subNew  = $scope.selectedSubject;
    
    if (typeof subNew === 'undefined') {
      console.log('No subject selected');
    } else if (subList.indexOf(subNew) !== -1) {
      console.log('Duplicate subject');
    } else if (isSubject(subNew)) {
      $scope.selectedSubjects.push($scope.selectedSubject);
      console.log('Subjects: ' + $scope.selectedSubjects.length);
    }
    
    $scope.selectedSubject = undefined;
    
    /**
     * Determines if an object qualifies as
     * a subject.
     */
    function isSubject(subject) {
      var requiredKeys = ['name', 'value'],
          actualKeys   = Object.keys(subject);

      return requiredKeys.every(function (key) {
        return actualKeys.indexOf(key) !== -1;
      });
    }
  };
  
  /**
   * Removes a subject from the list.
   */
  $scope.removeSubject = function (listItem) {
    var index = $scope.selectedSubjects.indexOf(listItem);
    if (index !== -1) {
      $scope.selectedSubjects.splice(index, 1);
    }
  };
  
  /**
   * Downloads a list of timetables for the
   * selected subjects.
   */
  $scope.loadTimetables = function ($event) {
    var subjects = $scope.selectedSubjects;
    utsYqlService.getTimetableList(subjects, onTimetablesLoaded);
  };
  
  /**
   * Manipulates the timetable list after downloading.
   */
  function onTimetablesLoaded(timetableList) {
    timetableList.sort(TimetableList.SortBy.HoursOnCampus);
    
    var filters = getPreferenceFilters();
    var filteredTimetables = timetableList.filterMany(filters);
    $scope.timetables = filteredTimetables;
    
    console.log(getFilterString(filteredTimetables.length));
  }
  
  /**
   * Gets a string representation of the filters set
   * by the user.
   */
  function getFilterString(count) {
    return 'There are ' + count + ' timetables only on ' + getDaysString() + 
      ' that span ' + getNumberOfDaysString() + ' day(s) or less' +
      ' between ' + getTimeConstraintsString() + '.';
    
    function getDaysString() {
      var days       = $scope.filters.days.available,
          dayNames   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      
      var daysOutput = dayNames.filter(function (day, i) {
        return days[i];
      }).join('/');
      
      return daysOutput;
    }
    
    function getNumberOfDaysString() {
      return $scope.filters.numberOfDays.count;
    }
    
    function getTimeConstraintsString() {
      var times = $scope.filters.times;
      return times.start + ' and ' + times.finish;
    }
  }
  
  /**
   * Sets up filters based on the user's 
   * selection.
   */
  function getPreferenceFilters() {
    return [
      getDays(), 
      getNumberOfDays(), 
      getStartConstraint(),
      getFinishConstraint()
    ];
    
    /**
     * Gets the days selected.
     */
    function getDays() {
      var days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      var filterInfo = days.filter(function (day, i) {
        return $scope.filters.days.available[i];
      });
      return new FilterInfo(TimetableList.FilterBy.Days, {days: filterInfo});
    }
    
    /**
     * Gets the maximum number of days selected.
     */
    function getNumberOfDays() {
      var filterInfo = $scope.filters.numberOfDays;
      return new FilterInfo(TimetableList.FilterBy.NumberOfDays, filterInfo);
    }
    
    /**
     * Gets the earliest start time selected.
     */
    function getStartConstraint() {
      var startTime = $scope.filters.times.start.replace(':', '');
      startTime = parseInt(startTime);
      return getTimeConstraint(startTime, 'start');
    }
    
    /**
     * Gets the latest finish time selected.
     */
    function getFinishConstraint() {
      var finishTime = $scope.filters.times.finish.replace(':', '');
      finishTime = parseInt(finishTime);
      return getTimeConstraint(finishTime, 'finish');
    }
    
    /**
     * Gets a FilterInfo object for a time constraint.
     */
    function getTimeConstraint(time, constraint) {
      var filterInfo = {time: time, constraint: constraint};
      return new FilterInfo(TimetableList.FilterBy.TimeConstraint,
                           filterInfo);
    }
  }
});
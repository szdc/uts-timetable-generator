'use strict';

app.controller('homeController', function ($scope, $http, timetabler, utsYqlService) {
  var TimetableList = timetabler.TimetableList,
      FilterInfo    = timetabler.FilterInfo;
  
  $scope.selectedSubject  = undefined;
  $scope.selectedSubjects = [];
  $scope.semester = 'AUT';
  $scope.prefs = {
    days: {
      count: 2,
      exact: false,
      options: [1, 2, 3, 4, 5]
    }
  };
  
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
  };
  
  function isSubject(subject) {
    var requiredKeys = ['name', 'value'],
        actualKeys   = Object.keys(subject);
    
    return requiredKeys.every(function (key) {
      return actualKeys.indexOf(key) !== -1;
    });
  }
  
  $scope.removeSubject = function (listItem) {
    var index = $scope.selectedSubjects.indexOf(listItem);
    if (index > -1) {
      $scope.selectedSubjects.splice(index, 1);
    }
  };
  
  $scope.loadTimetables = function ($event) {
    var subjects = $scope.selectedSubjects;
    utsYqlService.getTimetableList(subjects, onTimetablesLoaded);
  };
  
  function onTimetablesLoaded(timetableList) {
    timetableList.sort(TimetableList.SortBy.HoursOnCampus);
    
    var filters = getPreferenceFilters();
    
    var filteredByDays = timetableList.filterMany(filters);
    console.log('Timetables spanning ' + 
                $scope.prefs.days.count + 
                ' days' +
                ($scope.prefs.days.exact ? ' exactly: ' : ' or less: ') +
                filteredByDays.length
    );
  }
  
  function getPreferenceFilters() {
    return [getDays()];
    
    function getDays() {
      var pref = $scope.prefs.days;
      return new FilterInfo(TimetableList.FilterBy.NumberOfDays,
                            $scope.prefs.days);
    }
  }
  
  $http.get('subjects.json')
    .then(function (res) {
      $scope.subjects = res.data;
    }, function (err) {
      console.log(err);
    }
  );
});
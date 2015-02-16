'use strict';

app.controller('homeController', function homeController($scope, $http) {
  $scope.selectedSubject  = undefined;
  $scope.selectedSubjects = [];
  $scope.prefs = {
    days: {
      count: 2,
      exact: false,
      options: [1, 2, 3, 4, 5]
    }
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
    var index = $scope.selectedSubjects.indexOf(listItem.subject);
    if (index > -1) {
      $scope.selectedSubjects.splice(index, 1);
    }
  };
  
  $scope.loadTimetables = function ($event) {
    var yql =   'https://query.yahooapis.com/v1/public/yql?format=json&' +
                'q={query}&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys',
        query = 'select * from htmlpost where ' + 
                'url="https://mysubjects.uts.edu.au/aplus2015/aptimetable?' +
                'fun=unit_select&flat_timetable=yes" ' +
                'and postdata="student_set={subjects}" ' +
                'and xpath="//table[@cellspacing=\'1\']/tr"',
        subjects = $scope.selectedSubjects,
        subjectQueryString = subjects.reduce(function (queryString, subject) {
          return queryString + '&assigned=' + subject.value;
        }, '');
    
    query = query.replace('{subjects}', subjectQueryString);
    var url = yql.replace('{query}', encodeURIComponent(query));
    
    $http.get(url)
      .then(function (res) {
        console.log(res.data);
      }, function (err) {
        console.log(err);
      }
    );
  };
  
  $http.get('subjects.json')
    .then(function (res) {
      $scope.subjects = res.data;
    }, function (err) {
      console.log(err);
    }
  );
});
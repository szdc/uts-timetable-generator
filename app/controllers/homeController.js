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
  }
  
  $http.get('subjects.json')
    .then(function (res) {
      $scope.subjects = res.data;
    }, function (err) {
      console.log(err);
    }
  );
});
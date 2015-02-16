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
    
    if (subList.indexOf(subNew) !== -1) {
      console.log('Duplicate subject');
    } else {
      $scope.selectedSubjects.push($scope.selectedSubject);
      console.log('Subjects: ' + $scope.selectedSubjects.length);
    }
    
    $scope.selectedSubject = undefined;
  };
  
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
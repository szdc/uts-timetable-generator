'use strict';

app.controller('homeController', function homeController($scope, $http) {
  $scope.selectedSubject  = undefined;
  $scope.selectedSubjects = [];
  
  $scope.addSubject = function () {
    var subList = $scope.selectedSubjects,
        subNew  = $scope.selectedSubject;
    
    if (subList.indexOf(subNew) !== -1) {
      console.log('Duplicate subject');
      return;
    }
    
    $scope.selectedSubjects.push($scope.selectedSubject);
    console.log('Subjects: ' + $scope.selectedSubjects.length);
  };
  
  $http.get('subjects.json')
    .then(function (res) {
      $scope.subjects = res.data;
    }, function (err) {
      console.log(err);
    }
  );
});
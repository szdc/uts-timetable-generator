app.directive('timetable', function() {
  var directiveDefinitionObject = {
    restrict: 'E',
    scope: { model: '=', options:'='},
    templateUrl: 'app/directives/timetable.html',
    controller: function ($scope) {
      $scope.intervals = [];
      $scope.intervalsPerHour = parseInt(60 / $scope.model.interval);
      getIntervals();
      
      function getIntervals() {
        var start = $scope.model.times.start,
            finish = new Date('1/1/2015 ' + $scope.model.times.finish).get24hrTime(),
            interval = $scope.model.interval,
            startDate = new Date('1/1/2015 ' + start);
        
        do {
          $scope.intervals.push(startDate);
        } while((startDate = startDate.addMinutes(interval)).get24hrTime() < finish);
        
      }
      
      function getIntervalCount() {
        var times   = $scope.model.times,
            hours   = getHourFromTime(times.finish) - getHourFromTime(times.start);
        return hours;
      }
      
      function getHourFromTime(time) {
        return new Date('1/1/2015 ' + time).getHours();
      }
    }
  };
  return directiveDefinitionObject;
});
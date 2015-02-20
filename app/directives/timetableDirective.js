app.directive('timetable', function() {
  var directiveDefinitionObject = {
    restrict: 'E',
    scope: { layout: '=', timetables: '='},
    templateUrl: 'app/directives/timetable.html',
    controller: function ($scope) {
      $scope.intervals = getIntervals();
      $scope.intervalsPerHour = parseInt(60 / $scope.layout.interval);

      /**
       * Adds a timetable to the UI when the timetables array
       * is modified.
       */
      $scope.$watch('timetables', function (newTimetables) {
        if (newTimetables.length === 0) return;
        
        var timetable = newTimetables[0];
        
        var activities = timetable.getActivities();
        activities.forEach(addActivity);
      });
      
      /**
       * Adds an activity to the timetable.
       */
      function addActivity(activity) {
        activity = activity.getDetails();
        var rowspan  = parseInt(activity.duration / $scope.layout.interval),
            td = angular.element('#' + activity.day + activity.startTime);
          
        td.parent().nextAll().slice(0, rowspan - 1).each(function (i) {
          $(this).children('td:last').remove();
        });
        td.attr('rowspan', rowspan);
      }
      
      /**
       * Gets the intervals between each hour.
       */
      function getIntervals() {
        var layout      = $scope.layout,
            startDate   = dateFromTime(layout.times.start),
            finishTime  = dateFromTime(layout.times.finish).get24hrTime(),
            interval    = layout.interval,
            intervals   = [];
      
        do {
          intervals.push(startDate);
        } while((startDate = startDate.addMinutes(interval)).get24hrTime() < finishTime);
        
        return intervals;
      }
      
      /**
       * Gets a date object from a time, e.g. 08:30
       */
      function dateFromTime(time) {
        return new Date('1/1/2015 ' + time);
      }
    }
  };
  return directiveDefinitionObject;
});
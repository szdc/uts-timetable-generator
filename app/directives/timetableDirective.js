app.directive('timetable', function() {
  var directiveDefinitionObject = {
    restrict: 'E',
    scope: { layout: '=', timetable: '=', id: '@' },
    templateUrl: 'app/directives/timetable.html',
    controller: function ($scope, $timeout) {
      $scope.intervals = getIntervals();
      $scope.intervalsPerHour = parseInt(60 / $scope.layout.interval);
      
      $scope.$on('ngRepeatFinished', function () {
        var activities = $scope.timetable.getActivities();
        activities.forEach(addActivity);
      });
      

      /**
       * Adds an activity to the timetable.
       */
      function addActivity(activity) {
        activity = activity.getDetails();

        var rowspan  = parseInt(activity.duration / $scope.layout.interval),
            selector = '#' + $scope.id + ' ' + 
                       '.' + activity.day + 
                       '.' + activity.startTime,
            td = angular.element(selector);
          
        td.parent().nextAll().slice(0, rowspan - 1).each(function (i) {
          $(this).children('td.' + activity.day).hide();
        });
        td.attr('rowspan', rowspan);
        
        td.append(getActivityHTML(activity));
      }
      
      /**
       * Gets the activity information in HTML format.
       */
      function getActivityHTML(activity) {
        return getParagraphs([
          activity.subject.getCode(),
          activity.type
        ]);
      }
      
      function getParagraphs(textArr) {
        return textArr.reduce(function (output, text) {
          return output + '<p>' + text + '</p>';
        }, '');
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

app.directive('onFinishRender', function ($timeout) {
  return {
    restrict: 'A',
    link: function (scope, element, attr) {
      if (scope.$last === true) {
        $timeout(function () {
          scope.$emit('ngRepeatFinished');
        });
      }
    }
  }
});
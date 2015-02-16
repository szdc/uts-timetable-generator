app.directive('buttonsRadio', function() {
  var directiveDefinitionObject = {
    restrict: 'E',
    scope: { model: '=', options:'='},
    controller: function ($scope){
      $scope.activate = function (option){
        $scope.model = option;
      };      
    },
    template: '<div class="btn-group" data-toggle="buttons">' +
                '<label class="btn btn-primary btn-sm" ' +
                  'ng-class="{active: option === model}" ' +
                  'ng-repeat="option in options" ' +
                  'ng-click="activate(option)">' +
                    '<input type="radio">{{option}}' +
                '</label>' +
              '</div>'
  };
  return directiveDefinitionObject;
});
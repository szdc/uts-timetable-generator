app.directive('buttonsRadio', function() {
  var directiveDefinitionObject = {
    restrict: 'E',
    scope: { model: '=', options:'='},
    template: '<div class="btn-group">' +
                '<label class="btn btn-primary btn-sm" ' +
                  'ng-repeat="option in options" ' +
                  'ng-model="$parent.model" ' +
                  'btn-radio="{{option}}">' +
                    '{{option}}' +
                '</label>' +
              '</div>'
  };
  return directiveDefinitionObject;
});
app.directive('buttonsCheckbox', function() {
  var directiveDefinitionObject = {
    restrict: 'E',
    scope: { model: '=', options:'='},
    template: '<div class="btn-group">' +
                '<label class="btn btn-primary btn-sm" ' +
                  'ng-repeat="option in options track by $index" ' +
                  'ng-model="$parent.model[$index]" ' +
                  'btn-checkbox>' +
                    '{{option}}' +
                '</label>' +
              '</div>'
  };
  return directiveDefinitionObject;
});
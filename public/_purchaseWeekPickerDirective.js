/*
The default time is project time, in case of utc time the variable name will inculde UTC
*/
/* global define, $ */
/* eslint no-extend-native:0 */
/* eslint-disable max-statements */
define(['require'], function(require) {
    var module = require('ui/modules').get('dailyPurchaseKibanaPlugin');
    var config = require('plugins/dailyPurchasePlugin/config.js');
    var utils = require('plugins/dailyPurchasePlugin/utils.js');
    var moment = require('moment-timezone');
    require('plugins/dailyPurchasePlugin/lib/jquery-ui/themes/smoothness/jquery-ui.min.css');
    require('plugins/dailyPurchasePlugin/lib/jquery.min.js');
    require('plugins/dailyPurchasePlugin/lib/jquery-ui/ui/widget.js');
    require('plugins/dailyPurchasePlugin/lib/jquery-ui/ui/widgets/datepicker.js');

    var vodDailyPurchaseWeekPickerDirective = ['$parse', '$timeout', '$http', '$sce', function ($parse, $timeout, $http, $sce) {
        return {
            restrict: 'A',  // A: atributte, E: element, C: class, M: comment
            scope: false,
            // DOM manipulation, setup the datepicker
            link: function (scope, element, attrs) {    // The scope, the element that the directive is associated with, and the attributes of the target element
                var modelAccessor = $parse(attrs.ngModel);
                $(function() {
                    var selectCurrentWeek = function() {
                        var select = function() {
                            // Week selection
                            var widget = $(this).datepicker('widget');
                            var currentDay = widget.find('.ui-datepicker-current-day a');
                            currentDay.addClass('ui-state-active');
                        };
                        $timeout(select, 1);
                    };
                    /*
                    JQuery-UI Date Picker
                    timezone: browser local time
                    */
                    // Convert the element to date picker
                    element.datepicker({
                        showOn: "both",
                        showOtherMonths: true,
                        selectOtherMonths: true,
                        dateFormat: 'yy-mm-dd',
                        showTimezone: true,
                        firstDay: 1,
                        onSelect: function (dateStr) {
                            /* eslint-disable */
                            debugger;
                            /* eslint-enable */
                            var selectedDay = moment.tz(dateStr, config.TIMEZONE).startOf('day');
                            utils.startWeek = moment(selectedDay).startOf('isoweek');
                            utils.endWeek = moment(selectedDay).endOf('isoweek');
                            scope.$apply(function(scope_){
                                // Change binded variable
                                // workaround to refresh the values if is selected the same range
                                modelAccessor.assign(scope_, '');
                            });

                            scope.$apply(function(scope_){
                                // Change binded variable
                                modelAccessor.assign(scope_, utils.datePickerTextRange());
                            });
                            utils.buildTable(scope, scope.vis.indexPattern.id, selectedDay, $http, $sce);
                        },
                        beforeShow: function() {
                            selectCurrentWeek();
                        },
                        beforeShowDay: function(browserDate) {
                            var cssClass = '';
                            var browserDateStr = browserDate.getFullYear() + '-' + ("0" + (browserDate.getMonth() + 1)).slice(-2) + '-' + ("0" + browserDate.getDate()).slice(-2);
                            var date = moment.tz(browserDateStr, 'America/Sao_Paulo');
                            if (date >= utils.startWeek && date <= utils.endWeek) {
                                cssClass = 'ui-datepicker-current-day';
                            }
                            return [true, cssClass];
                        },
                        onChangeMonthYear: function() {
                            selectCurrentWeek();
                        }
                    });
                });
            }
        };
    }];

    // Add the directive to this module
    // The camelCase name of the directive in the js is referred to dash-delimited in the html
    module.directive('vodDailyPurchaseWeekPicker', vodDailyPurchaseWeekPickerDirective);
});

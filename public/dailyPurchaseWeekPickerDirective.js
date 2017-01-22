/*
The default time is project time, in case of utc time the variable name will inculde UTC
*/
/* global define, $ */
/* eslint no-extend-native:0 */
/* eslint-disable max-statements */
define(['require'], function(require) {
    var module = require('ui/modules').get('dailyPurchaseKibanaPlugin');
    var moment = require('moment-timezone');
    require('plugins/dailyPurchasePlugin/lib/jquery-ui/themes/smoothness/jquery-ui.min.css');
    require('plugins/dailyPurchasePlugin/lib/jquery.min.js');
    require('plugins/dailyPurchasePlugin/lib/jquery-ui/ui/widget.js');
    require('plugins/dailyPurchasePlugin/lib/jquery-ui/ui/widgets/datepicker.js');

    var vodDailyPurchaseWeekPickerDirective = ['$parse', '$timeout', 'TIMEZONE', function ($parse, $timeout, TIMEZONE) {
        return {
            restrict: 'A',  // A: atributte, E: element, C: class, M: comment
            scope: false,
            // DOM manipulation, setup the datepicker
            link: function (scope, element, attrs) {    // The scope, the element that the directive is associated with, and the attributes of the target element
                var datePickerTextRange = function(start, end) {
                    var range = moment(start).format('ddd DD-MMM-YY') + ' : ' + moment(end).format('ddd DD-MMM-YY');
                    return range;
                };
                var ngModelController = $parse(attrs.ngModel);
                var rangeWeek = $parse(attrs.rangeWeek);
                var startWeek;
                var endWeek;
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
                            scope.$apply(function(scope_){
                                // Change binded variable
                                // workaround to refresh the values if is selected the same range
                                ngModelController.assign(scope_, '');
                            });

                            scope.$apply(function(scope_){
                                // Change binded variable
                                //debugger;
                                var selectedDay = moment.tz(dateStr, TIMEZONE).startOf('day');
                                startWeek = moment(selectedDay).startOf('isoweek');
                                endWeek = moment(selectedDay).endOf('isoweek');
                                rangeWeek.assign(scope_, {startWeek: startWeek, endWeek: endWeek});
                                ngModelController.assign(scope_, datePickerTextRange(startWeek, endWeek));
                            });
                        },
                        beforeShow: function() {
                            selectCurrentWeek();
                        },
                        beforeShowDay: function(browserDate) {
                            var cssClass = '';
                            var browserDateStr = browserDate.getFullYear() + '-' + ("0" + (browserDate.getMonth() + 1)).slice(-2) + '-' + ("0" + browserDate.getDate()).slice(-2);
                            var date = moment.tz(browserDateStr, TIMEZONE);
                            if (date >= startWeek && date <= endWeek) {
                                cssClass = 'ui-datepicker-current-day';
                            }
                            return [true, cssClass];
                        },
                        onChangeMonthYear: function() {
                            selectCurrentWeek();
                        }
                    });
                });
                var day = moment.tz(moment.utc(), TIMEZONE).startOf('day');
                startWeek = moment(day).startOf('isoweek');
                endWeek = moment(day).endOf('isoweek');
                rangeWeek.assign(scope, {'startWeek': startWeek, 'endWeek': endWeek});
                ngModelController.assign(scope, datePickerTextRange(startWeek, endWeek));
            }
        };
    }];

    // Add the directive to this module
    // The camelCase name of the directive in the js is referred to dash-delimited in the html
    module.directive('vodDailyPurchaseWeekPicker', vodDailyPurchaseWeekPickerDirective);
});

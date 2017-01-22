/*
The default time is project time, in case of utc time the variable name will inculde UTC
*/
/* global define */
/* eslint no-extend-native:0 */
/* eslint-disable max-statements */
define(['require'], function(require) {
    var module = require('ui/modules').get('dailyPurchaseKibanaPlugin');
    var moment_with_locales = require('moment/min/moment-with-locales');
    var vodDailyPurchaseTableDirective = ['LANGUAGE', function (LANGUAGE) {
        return {
            restrict: 'A',
            scope: {
                data: '='
            },
            // DOM manipulation, setup the datepicker
            link: function (scope, element) {    // The scope, the element that the directive is associated with, and the attributes of the target element
                scope.$watch('data', function() {
                    if (scope.data) {
                        var dates_value = Object.keys(scope.data).sort(); // by string
                        var row_title = ["<td>Dias da semana</td>"];
                        var row_day_name = ["<td>Vendas TVOD</td>"];
                        var rows_device = scope.data[dates_value[0]].map(function (item) {
                            return [String.format("<td>{0}</td>", item.deviceType)];
                        });

                        // Fill the rows
                        dates_value.forEach(function (item, idx) {
                            // Last month column title
                            if (idx === 0) {
                                row_title.push(String.format("<th>{0}</th>", moment_with_locales(item).locale(LANGUAGE).format('MMM/YYYY')));
                                row_day_name.push("<th></th>");
                                // daily columns title (date and day)
                            } else {
                                var value = moment_with_locales(item).locale(LANGUAGE).format('ddd DD-MMM');
                                row_title.push(String.format("<th>{0}</th>", value.split(' ')[1]));
                                row_day_name.push(String.format("<th>{0}</th>", value.split(' ')[0]));
                            }
                            // Data itself - daily per device type and total
                            for (var j = 0; j < scope.data[item].length; j++) {
                                rows_device[j].push(String.format("<td>{0}</td>", scope.data[item][j].count));
                            }
                        });
                        var rows_devices = [];
                        rows_device.forEach(function (item) {
                            rows_devices.push(String.format("<tr>{0}</tr>", item.join('')));
                        });
                        var result = "<table id='purchaseTable'><tr>" + row_day_name.join('') + "</tr><tr>" + row_title.join('') + "</tr>" + rows_devices.join('') + "</table>";
                        element[0].innerHTML = result;
                    }
                });
            }
        };
    }];

    // Add the directive to this module
    // The camelCase name of the directive in the js is referred to dash-delimited in the html
    module.directive('vodDailyPurchaseTableDirective', vodDailyPurchaseTableDirective);
});

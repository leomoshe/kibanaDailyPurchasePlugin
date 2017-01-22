/* global define, $*/
/* eslint no-extend-native:0 */
define(function(require) {
	// Create an Angular module for this plugin
    //debugger;
    var module = require('ui/modules').get('dailyPurchaseKibanaPlugin');
    
    var utils = require('plugins/dailyPurchasePlugin/utils.js');
    require('plugins/dailyPurchasePlugin/dailyPurchase.css');
    require('plugins/dailyPurchasePlugin/lib/jquery-ui/themes/smoothness/jquery-ui.min.css');
    require('plugins/dailyPurchasePlugin/lib/jquery.min.js');
    require('plugins/dailyPurchasePlugin/lib/jquery-ui/ui/widget.js');
    require('plugins/dailyPurchasePlugin/lib/jquery-ui/ui/widgets/datepicker.js');

    var startDate;
    var endDate;
    var datePickerTextRange = function(date) {
        startDate = utils.getStartWeek(date);
        var formatedStartDate = utils.datePickerTextDate(startDate);
        endDate = utils.getEndWeek(date);
        var formatedEndDate = utils.datePickerTextDate(endDate);
        var range = formatedStartDate + ' - ' + formatedEndDate;
        return range;
    };

	// Add a controller to this module
    module.controller('dailyPurchaseController', function($scope, $sce, $http) {
        var self = this; 
        self._saveAs = require('@spalger/filesaver').saveAs; 
        debugger;
        $scope.date = new Date();
        $scope.date.setHours(12);
        $scope.info = {
            mDate: datePickerTextRange($scope.date)
        };
        $scope.exportAsCsv = function (formatted) {
            debugger;
            var table = $(this)[0].table.$$unwrapTrustedValue();
            var div = document.createElement('div');
            div.innerHTML = table;
            var trs = div.getElementsByTagName('tr');
            var result = [];
            for (var i = 0; i < trs.length; i++) {
                var cells = trs[i].children;
                var row = [];
                for (var j = 0; j < cells.length; j++) {
                    row[row.length] = cells[j].innerText;
                }
                result[result.length] = row.join(',');
            };
            var csv = new Blob([result.join("\r\n")], { type: 'text/plain' });
            self._saveAs(csv, 'PurchaseTable.csv');
        }; 
        var index = $scope.vis.indexPattern.id;
        var start_date = utils.toISODateTimeString(utils.getStartWeek($scope.date));
        var end_date = utils.toISODateTimeString(utils.getEndWeek($scope.date));
        var start_month = utils.toISODateTimeString(utils.getStartLastMonth($scope.date));
        $scope.end_month = utils.toISODateTimeString(utils.getEndLastMonth($scope.date));
        var url = String.format('../api/vod_purchase/{0}?start_date={1}&end_date={2}&start_month={3}&end_month={4}', index, start_date, end_date, start_month, $scope.end_month);
        $http.get(url).then((resp) => {
            var dayDevicesDataSet = utils.indexValuesToModel(resp.data.hits.hits, $scope.end_month);
            $scope.table = $sce.trustAsHtml(utils.modelToHtml(dayDevicesDataSet, $scope.date));
        });
    });

    module.directive('purchaseWeekPickerWidget', function ($parse, $timeout, $http, $sce) {
        //debugger;
        return function (scope, element, attrs) {
            var ngModel = $parse(attrs.ngModel);
            $(function() {
                
                var selectCurrentWeek = function() {
                    var select = function() {
                        var widget = $(this).datepicker('widget');
                        var current_day = widget.find('.ui-datepicker-current-day a');
                        current_day.addClass('ui-state-active');
                    };
                    $timeout(select, 1);
                };
                element.datepicker({
                    showOn: "both",
                    showOtherMonths: true,
                    selectOtherMonths: true,
                    onSelect: function () {
                        debugger;
                        scope.date = $(this).datepicker('getDate');
                        scope.date.setHours(12);
                        scope.$apply(function(scope_){
                            // Change binded variable
                            // workaround to refresh the values if is selected the same range
                            ngModel.assign(scope_, '');
                        });

                        scope.$apply(function(scope_){
                            // Change binded variable
                            ngModel.assign(scope_, datePickerTextRange(scope.date));
                        });
                        var index = scope.vis.indexPattern.id;
                        var start_date = utils.toISODateTimeString(utils.getStartWeek(scope.date));
                        var end_date = utils.toISODateTimeString(utils.getEndWeek(scope.date));
                        var start_month = utils.toISODateTimeString(utils.getStartLastMonth(scope.date));
                        scope.end_month = utils.toISODateTimeString(utils.getEndLastMonth(scope.date));
                        var url = String.format('../api/vod_purchase/{0}?start_date={1}&end_date={2}&start_month={3}&end_month={4}', index, start_date, end_date, start_month, scope.end_month);
                        $http.get(url).then((resp) => {
                            var dayDevicesDataSet = utils.indexValuesToModel(resp.data.hits.hits, scope.end_month);
                            scope.table = $sce.trustAsHtml(utils.modelToHtml(dayDevicesDataSet, scope.date));
                        });
                    },
                    beforeShow: function() {
                        selectCurrentWeek();
                    },
                    beforeShowDay: function(date) {
                        date.setHours(12);
                        var cssClass = '';
                        if (date >= startDate && date <= endDate) {
                            cssClass = 'ui-datepicker-current-day';
                        }
                        return [true, cssClass];
                    },
                    onChangeMonthYear: function() {
                        selectCurrentWeek();
                    }
                });
            });
        };
    });
});

/*
The default time is project time, in case of utc time the variable name will inculde UTC
*/
/* global Blob, define, document */
/* eslint no-extend-native:0 */
/* eslint-disable max-statements */
define(['require'], function(require) {
    var module = require('ui/modules').get('dailyPurchaseKibanaPlugin');
    var _saveAs = require('@spalger/filesaver').saveAs;

    var DailyPurchaseController = ['$scope', 'DailyPurchaseService', function($scope, DailyPurchaseService) {
        var _self = this;
        /* eslint-disable */
        debugger;
        /* eslint-enable */
        $scope.$watch(function() {
            return _self.rangeWeek;
        }, function(newValue) {
            //debugger;
            if (newValue) {
                //debugger;
                DailyPurchaseService.getVodsByDate(newValue.startWeek, newValue.endWeek).then(function(data){
                    _self.tvods_by_date = data.dates_data;
                    _self.tvods_week_total = data.week_total;
                    _self.tvods_week_devices = data.week_devices;
                }, function(err){
                    console.error(err);
                });
            }
        });
        $scope.exportDivTableAsCsv = function (divTableId) {
            var divTable = document.getElementById(divTableId);
            // Assume children[0] is the table to be exported
            var trs = divTable.children[0].getElementsByTagName('tr');
            var result = [];
            for (var i = 0; i < trs.length; i++) {
                var cells = trs[i].children;
                var row = [];
                for (var j = 0; j < cells.length; j++) {
                    row[row.length] = cells[j].innerText;
                }
                result[result.length] = row.join(',');
            }
            var csv = new Blob([result.join("\r\n")], { type: 'text/plain' });
            _saveAs(csv, 'PurchaseTable.csv');
        };
        _self.ready = function ready() {
            _self.tvods_week_total_info = {
                'labelsDiv': 'divPurchaseGraphTotalsLabels',
                'title': 'Vod daily total'
            };
            _self.tvods_week_devices_info = {
                'labelsDiv': 'divPurchaseGraphDevicesLabels',
                'title': 'Vod daily by device type'
            };
        }; 
    }];

    // Add the controller to this module
    module.controller('DailyPurchaseController', DailyPurchaseController);
});

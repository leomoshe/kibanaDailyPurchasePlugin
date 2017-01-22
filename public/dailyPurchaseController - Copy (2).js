/* global define, $, document, Blob */
/* eslint no-extend-native:0 */
define(['require', $], function(require, $) {
    // Create an Angular module for this plugin
    var module = require('ui/modules').get('dailyPurchaseKibanaPlugin');
    var utils = require('plugins/dailyPurchasePlugin/utils.js');
    require('plugins/dailyPurchasePlugin/dailyPurchase.css');
    //require('plugins/dailyPurchasePlugin/lib/moment-timezone-with-data.js');
    //require('plugins/dailyPurchasePlugin/lib/moment-timezone-with-data.min.js');
    debugger;
    //var moment = require('moment');
    //require('moment/locale/fr.js');
    //require('moment/min/moment-with-locales.min.js');
    //require('moment-with-locales.min.js');
    /*
    var moment = require('moment/min/moment-with-locales');
    var a = moment().locale('pt-br').format("dddd, MMMM Do YYYY, hh:mm:ss a");
    var moment = require('moment-timezone');
    */
    //require('moment/min/moment-with-locales');
    var moment_with_locales = require('moment/min/moment-with-locales');
    var moment = require('moment-timezone');
    //moment.tz.setDefault("America/Sao_Paulo");
    //moment.tz.add('America/Los_Angeles|PST PDT|80 70|0101|1Lzm0 1zb0 Op0');
    require('plugins/dailyPurchasePlugin/lib/jquery-ui/themes/smoothness/jquery-ui.min.css');
    require('plugins/dailyPurchasePlugin/lib/jquery.min.js');
    require('plugins/dailyPurchasePlugin/lib/jquery-ui/ui/widget.js');
    require('plugins/dailyPurchasePlugin/lib/jquery-ui/ui/widgets/datepicker.js');

    var startDate;
    var endDate;
    var datePickerTextRange = function(date) {
        startDate = moment(date).startOf('week');
        endDate = moment(date).endOf('week');
        var range = moment_with_locales(startDate).locale('pt-br').format('ddd DD-MMM-YY') + ' : ' + moment_with_locales(endDate).locale('pt-br').format('ddd DD-MMM-YY')
        //var range = startDate.format('ddd DD-MMM-YY') + ' : ' + endDate.format('ddd DD-MMM-YY');
        return range;
    };
	// Add a controller to this module
    module.controller('dailyPurchaseController', function($scope, $sce, $http) {
        var self = this;
        self._saveAs = require('@spalger/filesaver').saveAs;
        /* eslint-disable */
        debugger;
        /* eslint-enable */
        //var date = new Date();
        //var date = momen
        //var tz_date = date.getFullYear() + '-' + ("0" + (date.getMonth() + 1)).slice(-2) + '-' + ("0" + date.getDate()).slice(-2);
        var a = moment().locale('pt').format("dddd, MMMM Do YYYY, hh:mm:ss a");
        $scope.sao_paulo_date = moment.tz(moment.utc(), "America/Sao_Paulo").startOf('day');
        //$scope.local_date = moment().startOf('day');
        $scope.info = {
            //mDate: datePickerTextRange($scope.local_date)
            mDate: datePickerTextRange($scope.sao_paulo_date)
        };
        $scope.exportAsCsv = function () {
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
            }
            var csv = new Blob([result.join("\r\n")], { type: 'text/plain' });
            self._saveAs(csv, 'PurchaseTable.csv');
        };
        var index = $scope.vis.indexPattern.id;
        /*
        var start_date = moment($scope.date).startOf('week').format('YYYY-MM-DDTHH:mm:ss')+'Z';
        var end_date = moment($scope.date).endOf('week').format('YYYY-MM-DDTHH:mm:ss')+'Z';
        var start_month = moment($scope.date).subtract(1,'months').startOf('month').format('YYYY-MM-DDTHH:mm:ss')+'Z';
        $scope.end_month = moment($scope.date).subtract(1,'months').endOf('month').format('YYYY-MM-DDTHH:mm:ss')+'Z';
        */
        //var sao_apulo_date = moment.tz(moment($scope.local_date).format('YYYY-MM-DD HH:mm:ss'), "America/Sao_Paulo");
        var sao_apulo_date = $scope.sao_paulo_date;        
        var utc_start_date = moment(sao_apulo_date).startOf('week');
        var utc_end_date = moment(sao_apulo_date).endOf('week');
        var utc_start_month = moment(sao_apulo_date).subtract(1,'months').startOf('month');
        $scope.utc_end_month = moment(sao_apulo_date).subtract(1,'months').endOf('month');
        var url = String.format('../api/vod_purchase/{0}?start_date={1}&end_date={2}&start_month={3}&end_month={4}', index, 
            utc_start_date.toISOString(), moment(utc_end_date).add(1, 'millisecond').toISOString(), utc_start_month.toISOString(), moment($scope.utc_end_month).add(1, 'millisecond').toISOString());
        /*
        var utc_start_date = moment(sao_apulo_date).startOf('week').toISOString();
        var utc_end_date = moment(sao_apulo_date).endOf('week').add(1, 'millisecond').toISOString();
        var utc_start_month = moment(sao_apulo_date).subtract(1,'months').startOf('month').toISOString();
        $scope.utc_end_month = moment(sao_apulo_date).subtract(1,'months').endOf('month').add(1, 'millisecond').toISOString();
        var url = String.format('../api/vod_purchase/{0}?start_date={1}&end_date={2}&start_month={3}&end_month={4}', index, utc_start_date, utc_end_date, utc_start_month, $scope.utc_end_month);
        */
        /* eslint-disable */
        $http.get(url).then(function(resp) {
            var dayDevicesDataSet = utils.indexValuesToModel(resp.data.hits.hits, $scope.utc_end_month);
            //$scope.table = $sce.trustAsHtml(utils.modelToHtml(dayDevicesDataSet, $scope.local_date));
            $scope.table = $sce.trustAsHtml(utils.modelToHtml(dayDevicesDataSet, $scope.sao_paulo_date));
        });
        /* eslint-enable */
    });

    module.directive('purchaseWeekPickerWidget', function ($parse, $timeout, $http, $sce) {
        //debugger;
        // As scope isn't defined 
        return {
            link: function (scope, element, attrs) {
                var ngModel = $parse(attrs.ngModel);
                $(function() {
                    var selectCurrentWeek = function() {
                        var select = function() {
                            //$.datepicker
                            var widget = $(this).datepicker('widget');
                            //widget.regional[ "fr" ];
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
                            /* eslint-disable */
                            debugger;
                            /* eslint-enable */
                            //scope.date = $(this).datepicker('getDate');
                            var date = $(this).datepicker('getDate');
                            var tmp_date = date.getFullYear() + '-' + ("0" + (date.getMonth() + 1)).slice(-2) + '-' + ("0" + date.getDate()).slice(-2);
                            //scope.date = moment.tz(tz_date + " 00:00:00", "America/Sao_Paulo");
                            //scope.local_date = moment(tmp_date + " 00:00:00");
                            scope.sao_paulo_date = moment.tz(moment.utc(tmp_date), "America/Sao_Paulo").startOf('day');
                            //scope.date = moment().tz('America/Sao_Paulo').startOf('day');
                            //scope.date.setHours(2,0,0,0);  // UTC start day related jer
                            //scope.date.setHours(4);  // Sao Paulo start day related jer
                            scope.$apply(function(scope_){
                                // Change binded variable
                                // workaround to refresh the values if is selected the same range
                                ngModel.assign(scope_, '');
                            });

                            scope.$apply(function(scope_){
                                // Change binded variable
                                //ngModel.assign(scope_, datePickerTextRange(scope.local_date));
                                ngModel.assign(scope_, datePickerTextRange(scope.sao_paulo_date));
                            });
                            var index = scope.vis.indexPattern.id;
                            //var sao_apulo_date = moment.tz(moment(scope.local_date).format('YYYY-MM-DD HH:mm:ss'), "America/Sao_Paulo");
                            var sao_apulo_date = scope.sao_paulo_date;
                            var utc_start_date = moment(sao_apulo_date).startOf('week');
                            var utc_end_date = moment(sao_apulo_date).endOf('week');
                            var utc_start_month = moment(sao_apulo_date).subtract(1,'months').startOf('month');
                            scope.utc_end_month = moment(sao_apulo_date).subtract(1,'months').endOf('month');
                            var url = String.format('../api/vod_purchase/{0}?start_date={1}&end_date={2}&start_month={3}&end_month={4}', index, 
                                utc_start_date.toISOString(), moment(utc_end_date).add(1, 'millisecond').toISOString(), utc_start_month.toISOString(), moment(scope.utc_end_month).add(1, 'millisecond').toISOString());
                            $http.get(url).then(function(resp) {
                                var dayDevicesDataSet = utils.indexValuesToModel(resp.data.hits.hits, scope.utc_end_month);
                                //scope.table = $sce.trustAsHtml(utils.modelToHtml(dayDevicesDataSet, scope.local_date));
                                scope.table = $sce.trustAsHtml(utils.modelToHtml(dayDevicesDataSet, scope.sao_paulo_date));
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
            }
        };
    });
});

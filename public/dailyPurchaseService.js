/*
The default time is project time, in case of utc time the variable name will inculde UTC
*/
/* global define, _ */
/* eslint no-extend-native:0 */
/* eslint-disable max-statements */
define(['require'], function(require) {
    var module = require('ui/modules').get('dailyPurchaseKibanaPlugin');
    var moment = require('moment-timezone');
    var dailyPurchaseFormatterService = ['TVod', 'TIMEZONE', function(TVod, TIMEZONE) {
        var _self = this;

        /*
        TBD output examples
        */
        _self.vodsByDateFormatter = function vodsByDateFormatter(recs, startWeek, endMonthUTC){
            var mapper = function(endLastMonthUTC) {
                return function(tvod) {
                    var utcDate = moment(tvod.date);
                    var value;
                    // Previous month
                    if (utcDate < endLastMonthUTC) {
                        value = moment.tz(endLastMonthUTC, TIMEZONE).format('YYYY-MM-DD');
                    // Selected week
                    } else {
                        value = moment.tz(tvod.date, TIMEZONE).format('YYYY-MM-DD');
                    }
                    return new TVod({'vod_pur_hr_count': tvod.count, 'vod_pur_hr_date': value, 'vod_pur_hr_device_type': tvod.deviceType});
                };
            };
            var tvods = recs.map(mapper(endMonthUTC));
            /*
            TVOD for each type by day
            */
            // group by date and device
            var dayDeviceGroup = _.groupBy(tvods, function(item) {
                return item.date + '+' + item.deviceType;
            });
            // reduce the dayDeviceGroup by date and device
            var tvods_day_device = [];
            /* eslint-disable no-loop-func */
            for (var key_device in dayDeviceGroup) {
                var device_date_value = dayDeviceGroup[key_device];
                var dayDeviceDataSet = device_date_value.reduce(function add(a, b) {
                    var value0 = (typeof a === "number") ? a : a.count;
                    var value1 = (typeof b === "number") ? b : b.count;
                    return new TVod({'vod_pur_hr_count': value0 + value1, 'vod_pur_hr_date': a.date, 'vod_pur_hr_device_type': a.deviceType});
                });
                tvods_day_device.push(dayDeviceDataSet);
            }
            /*
            */
            // collection of devices
            var device_types = Object.keys(_.groupBy(tvods_day_device, function(item) {
                return item.deviceType;
            })).sort();
            // collection of dates
            var dates_data = _.groupBy(tvods_day_device, function(item) {
                return item.date;
            });

            //var dates_value = Object.keys(dates_data).sort();
            // Add inexistens days , inefective !!!!
            function getRange(date) {
                var result = [];
                result.push(moment(date).subtract(1, 'months').endOf('month').format('YYYY-MM-DD'));
                for (var i = 1; i < 8; i++) {
                    result.push(moment(date).day(i).format('YYYY-MM-DD'));
                }
                return result;
            }
            //debugger;
            var range = getRange(startWeek);
            range.forEach(function(item) {
                if (!dates_data[item]) {
                    dates_data[item] = [];
                }
            });
            // Add count 0 in each day for inexistens data of devices
            var week_devices = {};
            var week_total = {};
            range.forEach(function(key, idx) {
                var date_value = dates_data[key];
                var date_device_types = date_value.map(function(item){
                    return item.deviceType;
                });
                var diff = _.difference(device_types, date_device_types);
                for (var i = 0; i < diff.length; i++) {
                    dates_data[key].push(new TVod({"vod_pur_hr_count": 0, "vod_pur_hr_date": key, "vod_pur_hr_device_type": diff[i]}));
                }
                dates_data[key].sort(function(a, b){
                    return (a.deviceType > b.deviceType) ? 1 : ((b.deviceType > a.deviceType) ? -1 : 0);
                });
                if (idx > 0) {
                    week_devices[key] = JSON.parse(JSON.stringify(dates_data[key]));
                }
                // Total
                var total = 0;
                if (dates_data[key].length === 0) {
                    total = 0;
                } else if (dates_data[key].length === 1) {
                    total = dates_data[key][0].count;
                } else {
                    total = dates_data[key].reduce(function add(a, b) {
                        var value0 = (typeof a === "number") ? a : a.count;
                        var value1 = (typeof b === "number") ? b : b.count;
                        return value0 + value1;
                    });
                }
                var data_total = new TVod({"vod_pur_hr_count": total, "vod_pur_hr_date": key, "vod_pur_hr_device_type": 'Total'});
                dates_data[key].push(data_total);
                if (idx > 0) {
                    week_total[key] = [JSON.parse(JSON.stringify(data_total))];
                }
            });
            return {'dates_data': dates_data, 'week_total': week_total, 'week_devices': week_devices};
        };
    }];

    var DailyPurchaseService = ['$http', 'TVod', 'VOD_PURCHASE_ROUTE_PATH', 'DailyPurchaseFormatterService', function($http, TVod, VOD_PURCHASE_ROUTE_PATH, DailyPurchaseFormatterService) {
        var _self = this;
        var getVods = function getVods(startWeek, endWeek){
            //debugger;
            var index = 'vod_index';
            var startWeekUTC = moment.tz(startWeek, "UTC");
            var endWeekUTC = moment.tz(endWeek, "UTC");
            var startMonthUTC = moment.tz(moment(startWeek).subtract(1, 'months').startOf('month'), "UTC");
            var endMonthUTC = moment.tz(moment(startWeek).subtract(1, 'months').endOf('month'), "UTC");
            var url = String.format('{0}{1}?start_date={2}&end_date={3}&start_month={4}&end_month={5}', VOD_PURCHASE_ROUTE_PATH, index,
                startWeekUTC.toISOString(), moment(endWeekUTC).add(1, 'millisecond').toISOString(), startMonthUTC.toISOString(), moment(endMonthUTC).add(1, 'millisecond').toISOString());
            var vods = $http({
                method: 'GET',
                url: url
            }).then(function (response) {
                return response.data;
            }, function (err) {
                console.error(err);
            });
            return vods;
        };
        _self.getVodsByDate = function getVodsByDate(startWeek, endWeek){
            var promise = getVods(startWeek, endWeek);
            return promise.then(function(data) {
                //debugger;
                var hits = data.hits.hits;
                var tvods = [];
                for (var i = 0; i < hits.length; i++) {
                    tvods.push(new TVod(hits[i]._source));
                }
                var endMonthUTC = moment.tz(moment(startWeek).subtract(1, 'months').endOf('month'), "UTC");
                return DailyPurchaseFormatterService.vodsByDateFormatter(tvods, startWeek, endMonthUTC);
            }, function (err) {
                console.error(err);
            });
        };
    }];

    module.service('DailyPurchaseFormatterService', dailyPurchaseFormatterService);
    module.service('DailyPurchaseService', DailyPurchaseService);
});

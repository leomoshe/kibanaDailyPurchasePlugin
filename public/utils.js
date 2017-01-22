/* global _ */
var moment_with_locales = require('moment/min/moment-with-locales');
var moment = require('moment-timezone');
var _saveAs = require('@spalger/filesaver').saveAs;
var config = require('plugins/dailyPurchasePlugin/config.js');
//require('plugins/dailyPurchasePlugin/dailyPurchase.css');

// Returns a formatted string using the specified format string and arguments.
if (!String.format) {
    String.format = function(format) {
        var args = Array.prototype.slice.call(arguments, 1);
        return format.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };
}

var _startWeek = moment();
var _endWeek = moment();
/**
 * Build a collection of objects with vdp_count, vdp_date and vod_pur_hr_device_type
 * @param {Object[]} recs The elastic hits
 * @param {Moment} endMonthUTC End of the previous month
 * @return {Object[]} indexValuesToModel
 */
var indexValuesToModel = function(recs, endMonthUTC) {
    var result = [];
    // data for day, hours, and minutes
    var mapper = function(endLastMonthUTC) {
        return function(hit) {
            var utc_date = moment(hit._source.vod_pur_hr_date);
            var value;
            // Previous month
            if (utc_date < endLastMonthUTC) {
                value = moment.tz(endLastMonthUTC, config.TIMEZONE).format('YYYY-MM-DD');
                return { vdp_count: hit._source.vod_pur_hr_count, vdp_date: value, vdp_device_type: hit._source.vod_pur_hr_device_type };
            // Selected week
            } else {
                value = moment.tz(hit._source.vod_pur_hr_date, config.TIMEZONE).format('YYYY-MM-DD');
                return { vdp_count: hit._source.vod_pur_hr_count, vdp_date: value, vdp_device_type: hit._source.vod_pur_hr_device_type };
            }
        };
    };

    var rawData = recs.map(mapper(endMonthUTC));
    // group by day and device type in order to calculate the total by day
    var dayDeviceGroup = _.groupBy(rawData, function(dataitem) {
        return dataitem.vdp_date + '+' + dataitem.vdp_device_type;
    });
    /* eslint-disable no-loop-func */
    for (var key in dayDeviceGroup) {
        var date_value = dayDeviceGroup[key];
        var dayDeviceDataSet = date_value.reduce(function add(a, b) {
            var value0 = (typeof a === "number") ? a : a.vdp_count;
            var value1 = (typeof b === "number") ? b : b.vdp_count;
            return {'vdp_count': value0 + value1, 'vdp_date': a.vdp_date, 'vdp_device_type': a.vdp_device_type};
        });
        result.push(dayDeviceDataSet);
    }
    // count per device and day
    return result;
};

/**
 * Build a week range collection of string dates, in format 'YYYY-MM-DD'
 * @param {String|Date|Moment} date
 * @return {String[]} getRangeWeek
 */
var getRangeWeek = function(date) {
    var result = [];
    for (var i = 1; i < 8; i++) {
        result.push(moment(date).day(i).format('YYYY-MM-DD'));
    }
    return result;
};

/* eslint-disable max-statements */
/**
 * Build a html table
 * @param {Object[]} recs Collection of objects with vdp_count, vdp_date and vod_pur_hr_device_type
  * @return {String} modelToHtml
 */
var modelToHtml = function(recs) {
    var device_types = Object.keys(_.groupBy(recs, function(item) {
        return item.vdp_device_type;
    })).sort();
    // Fill and sort the dates
    var dates_data = _.groupBy(recs, function(item) {
        return item.vdp_date;
    });
    /* eslint-disable */
    var range_week = getRangeWeek(_startWeek);
    /* eslint-enable */
    range_week.unshift(moment(_startWeek).subtract(1, 'months').endOf('month').format('YYYY-MM-DD'));
    range_week.forEach(function(item) {
        if (!dates_data[item]) {
            dates_data[item] = [];
        }
    });
    /* eslint-disable no-loop-func */
    // Add count 0 in each day for inexistens data of devices
    for (var key in dates_data) {
        var date_value = dates_data[key];
        var date_device_types = date_value.map(function(item){
            return item.vdp_device_type;
        });
        var diff = _.difference(device_types, date_device_types);
        for (var i = 0; i < diff.length; i++) {
            dates_data[key].push({"vdp_count": 0, "vdp_date": key, "vdp_device_type": diff[i]});
        }
        dates_data[key].sort(function(a, b){
            return (a.vdp_device_type > b.vdp_device_type) ? 1 : ((b.vdp_device_type > a.vdp_device_type) ? -1 : 0);
        });
    }
    // Retrieve a sorted collection of date strings
    var dates_value = Object.keys(dates_data).sort(function(a, b){
        return new Date(a) - new Date(b);
    });
    // Declare the rows
    var row_title = ["<td>Dias da semana</td>"];
    var row_day_name = ["<td>Vendas TVOD</td>"];
    var row_total = ["<td>Total</td>"];
    var rows_device = device_types.map(function(item) {
        return [String.format("<td>{0}</td>", item)];
    });
    // Fill the rows
    dates_value.forEach(function(item, idx) {
        // Last month column title
        if (idx === 0) {
            row_title.push(String.format("<th>{0}</th>", moment_with_locales(item).locale(config.LANGUAGE).format('MMM/YYYY')));
            row_day_name.push("<th></th>");
        // daily columns title (date and day)
        } else {
            var value = moment_with_locales(item).locale(config.LANGUAGE).format('ddd DD-MMM');
            row_title.push(String.format("<th>{0}</th>", value.split(' ')[1]));
            row_day_name.push(String.format("<th>{0}</th>", value.split(' ')[0]));
        }
        // Calculating total
        var total = 0;
        if (dates_data[item].length === 0) {
            total = 0;
        } else if (dates_data[item].length === 1) {
            total = dates_data[item][0].vdp_count;
        } else {
            total = dates_data[item].reduce(function add(a, b) {
                var value0 = (typeof a === "number") ? a : a.vdp_count;
                var value1 = (typeof b === "number") ? b : b.vdp_count;
                return value0 + value1;
            });
        }
        // Data itself - daily per device type and total
        for (var j = 0; j < dates_data[item].length; j++) {
            rows_device[j].push(String.format("<td>{0}</td>", dates_data[item][j].vdp_count));
        }
        row_total.push(String.format("<td>{0}</td>", total));
    });
    var rows_devices = [];
    rows_device.forEach(function(item) {
        rows_devices.push(String.format("<tr>{0}</tr>", item.join('')));
    });
    var result = "<table id='purchaseTable'><tr>" + row_day_name.join('') + "</tr><tr>" + row_title.join('') + "</tr><tr>" + row_total.join('') + "</tr>" + rows_devices.join('') + "</table>";
    return result;
};

var buildTable = function(scope, selectedDay, $http, $sce) {
    var index = 'vod_index';
    var startWeekUTC = moment.tz(_startWeek, "UTC");
    var endWeekUTC = moment.tz(_endWeek, "UTC");
    var startMonthUTC = moment.tz(moment(_startWeek).subtract(1, 'months').startOf('month'), "UTC");
    var endMonthUTC = moment.tz(moment(_startWeek).subtract(1, 'months').endOf('month'), "UTC");
    var url = String.format('{0}{1}?start_date={2}&end_date={3}&start_month={4}&end_month={5}', config.VOD_PURCHASE_ROUTE_PATH, index,
        startWeekUTC.toISOString(), moment(endWeekUTC).add(1, 'millisecond').toISOString(), startMonthUTC.toISOString(), moment(endMonthUTC).add(1, 'millisecond').toISOString());
    /* eslint-disable */
    $http.get(url).then(function(resp) {
        var dayDevicesDataSet = indexValuesToModel(resp.data.hits.hits, endMonthUTC);
        scope.vodDailyPurchaseTable = $sce.trustAsHtml(modelToHtml(dayDevicesDataSet));
    });
    /* eslint-enable */
};

var datePickerTextRange = function() {
    var range = moment(_startWeek).format('ddd DD-MMM-YY') + ' : ' + moment(_endWeek).format('ddd DD-MMM-YY');
    return range;
};

module.exports = {
    //buildTable: buildTable,
    datePickerTextRange: datePickerTextRange,
    saveAs: _saveAs
};

Object.defineProperty(module.exports, "startWeek", {
    get: function(){
        return _startWeek;
    },
    set: function(value){
        _startWeek = value;
    }
});

Object.defineProperty(module.exports, "endWeek", {
    get: function(){
        return _endWeek;
    },
    set: function(value){
        _endWeek = value;
    }
});

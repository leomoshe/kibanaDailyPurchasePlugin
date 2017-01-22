define(['require'], function(require) {
    //debugger;
    var module = require('ui/modules').get('dailyPurchaseKibanaPlugin');
    var moment = require('moment');
    module.factory('TVod', [function(){
        return function TVod(item){
            var self = this;
            var _count = item.vod_pur_hr_count || 0;
            var _date  = moment(item.vod_pur_hr_date).format('YYYY-MM-DD');
            var _deviceType = item.vod_pur_hr_device_type || '';
            self.date = _date;
            self.count = _count;
            self.deviceType = _deviceType;
            self.tVodObject = function tVodObject(){
                var result = {
                    'date': _date,
                    'count': _count,
                    'deviceType': _deviceType
                };
                return result;
            }
        }
    }]);
});


var config = require('../public/config.js');

module.exports = function (server) {
    var call = server.plugins.elasticsearch.callWithRequest;
    server.route({
        path: config.VOD_PURCHASE_ROUTE_PATH + '{index}',
        method: 'GET',
        handler: function(req, res) {
            var index = req.params.index;
            var start_date = req.query.start_date;
            var end_date = req.query.end_date;
            var start_month = req.query.start_month;
            var end_month = req.query.end_month;
            var body = {
                "size": 10000,
                "query": {
                    "match_all": {}
                },
                "sort": [
                    {"vod_pur_hr_date": {"order": "asc"}}
                ],
                "filter": {
                    "bool": {
                      "should": [
                        {
                          "range": {
                            "vod_pur_hr_date": {
                              "gte": start_date,
                              "lt": end_date
                            }
                          }
                        },
                        {
                          "range": {
                            "vod_pur_hr_date": {
                              "gte": start_month,
                              "lt": end_month
                            }
                          }
                        }
                      ]
                    }
                }
            };
            //console.log("Config: ", config);
            console.log("Request index: ", index);
            console.log("Request body: ", JSON.stringify(body, null, 2));
            call(req, 'search', {
                index: index,
                body: body
            }).then(function (response) {
                res(response);
            });
        }
    });
};

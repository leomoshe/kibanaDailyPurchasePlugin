/* global define */
define(['require'], function(require) {
    var module = require('ui/modules').get('dailyPurchaseKibanaPlugin');
    var config = require('plugins/dailyPurchasePlugin/config.js');
    module.constant('TIMEZONE', 'America/Sao_Paulo');
    module.constant('LANGUAGE', 'pt-br');
    module.constant('VOD_PURCHASE_ROUTE_PATH', config.VOD_PURCHASE_ROUTE_PATH);
});


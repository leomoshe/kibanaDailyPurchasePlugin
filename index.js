/* eslint-disable */
import api from './server/routes';
/* eslint-enable */
module.exports = function(kibana) {
    return new kibana.Plugin({
        require: ['elasticsearch'],
        uiExports: { visTypes: ['plugins/dailyPurchasePlugin/dailyPurchase']},
        init(server) {
            /* eslint-disable */
            api(server);
            /* eslint-enable */
        }
    });
};

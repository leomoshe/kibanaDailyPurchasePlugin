/* global define */
define(function(require) {
    //debugger;
    // Returns a formatted string using the specified format string and arguments.
    if (!String.format) {
        String.format = function(format) {
            var args = Array.prototype.slice.call(arguments, 1);
            return format.replace(/{(\d+)}/g, function(match, number) {
                return typeof args[number] != 'undefined' ? args[number] : match;
            });
        };
    }

    require('plugins/dailyPurchasePlugin/dailyPurchaseConfig');
    require('plugins/dailyPurchasePlugin/TVod');
    require('plugins/dailyPurchasePlugin/dailyPurchaseService');
    require('plugins/dailyPurchasePlugin/dailyPurchaseController');
    require('plugins/dailyPurchasePlugin/dailyPurchaseWeekPickerDirective');
    require('plugins/dailyPurchasePlugin/dailyPurchaseGraphDirective');
    require('plugins/dailyPurchasePlugin/dailyPurchaseTableDirective');
    function dailyPurchaseProvider(Private) {
        /* eslint-disable */
        var TemplateVisType = Private(require('ui/template_vis_type/TemplateVisType'));
        /* eslint-enable */
        return new TemplateVisType({
            name: 'dailyPurchase',
            title: 'Daily purchase',
            description: 'A daily purchase.',
            requiresSearch: false,
            template: require('plugins/dailyPurchasePlugin/dailyPurchase.html')
        });
    }
    require('ui/registry/vis_types').register(dailyPurchaseProvider);
    return dailyPurchaseProvider;
});

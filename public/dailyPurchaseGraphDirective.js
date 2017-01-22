/*
The default time is project time, in case of utc time the variable name will inculde UTC
*/
/* global define, $ */
/* eslint no-extend-native:0 */
/* eslint-disable max-statements */
define(['require'], function(require) {
    var module = require('ui/modules').get('dailyPurchaseKibanaPlugin');
    var Dygraph = require('dygraphs');
    var moment = require('moment-timezone');

    var vodDailyPurchaseGraphDirective = [function () {
        return {
            restrict: 'A',
            scope: {
                data: '=',
                options: '='
            },
            // DOM manipulation, setup the datepicker
            link: function (scope, element) {    // The scope, the element that the directive is associated with, and the attributes of the target element
                function barChartPlotter(e) {
                    var ctx = e.drawingContext;
                    var points = e.points;
                    var y_bottom = e.dygraph.toDomYCoord(0);

                    // This should really be based on the minimum gap
                    var bar_width = 2/3 * (points[1].canvasx - points[0].canvasx);
                    ctx.fillStyle = e.color;

                    // Do the actual plotting.
                    for (var i = 0; i < points.length; i++) {
                        var p = points[i];
                        var center_x = p.canvasx;  // center of the bar
                        ctx.fillRect(center_x - bar_width / 2, p.canvasy, bar_width, y_bottom - p.canvasy);
                        ctx.strokeRect(center_x - bar_width / 2, p.canvasy, bar_width, y_bottom - p.canvasy);
                    }
                }
                
                // Multiple column bar chart
                function multiColumnBarPlotter(e) {
                    function darkenColor(colorStr) {
                        // Defined in dygraph-utils.js
                        var color = Dygraph.toRGB_(colorStr);
                        color.r = Math.floor((255 + color.r) / 2);
                        color.g = Math.floor((255 + color.g) / 2);
                        color.b = Math.floor((255 + color.b) / 2);
                        return 'rgb(' + color.r + ',' + color.g + ',' + color.b + ')';
                    }
                    // We need to handle all the series simultaneously.
                    if (e.seriesIndex !== 0) {
                        return;
                    }

                    var g = e.dygraph;
                    var ctx = e.drawingContext;
                    var sets = e.allSeriesPoints;
                    var y_bottom = e.dygraph.toDomYCoord(0);

                    // Find the minimum separation between x-values.
                    // This determines the bar width.
                    var min_sep = Infinity;
                    for (var j = 0; j < sets.length; j++) {
                        var points = sets[j];
                        for (var i = 1; i < points.length; i++) {
                            var sep = points[i].canvasx - points[i - 1].canvasx;
                            if (sep < min_sep) {
                                min_sep = sep;
                            }
                        }
                    }
                    var bar_width = Math.floor(2.0 / 3 * min_sep);
                    var fillColors = [];
                    var strokeColors = g.getColors();
                    for (var i = 0; i < strokeColors.length; i++) {
                        fillColors.push(darkenColor(strokeColors[i]));
                    }

                    for (var j = 0; j < sets.length; j++) {
                        ctx.fillStyle = fillColors[j];
                        ctx.strokeStyle = strokeColors[j];
                        for (var i = 0; i < sets[j].length; i++) {
                            var p = sets[j][i];
                            var center_x = p.canvasx;
                            var x_left;
                            if (sets.length === 1) {
                                x_left = center_x - (bar_width / 2);
                            } else {
                                x_left = center_x - (bar_width / 2) * (1 - j/(sets.length-1));
                            }
                            ctx.fillRect(x_left, p.canvasy, bar_width/sets.length, y_bottom - p.canvasy);
                            ctx.strokeRect(x_left, p.canvasy, bar_width/sets.length, y_bottom - p.canvasy);
                        }
                    }
                }

                var opts = {
                    //plotter: barChartPlotter,
                    plotter: multiColumnBarPlotter,
                    legend: 'always',
                    highlightCircleSize: 0,
                    //axisTickSize: 1,
                    //drawGrid: false,
                    //drawPoints: false,
                    gridLineColor: '#A8A8A8',
                    hideOverlayOnMouseOut: false,
                    labelsDivStyles: { 'textAlign': 'right' },
                    showRangeSelector: false,
                    rangeSelectorPlotStrokeColor: 'yellow',
                    rangeSelectorPlotFillColor: 'lightyellow',
                    labelsSeparateLines: false,
                    axes: {
                        x: {
                            axisLabelFormatter_: function (d, gran) {
                                //return d.toLocaleDateString();
                                return moment(d).format('DD MMM')                                
                            },
                            valueFormatter_: function (ms) {
                                //return new Date(ms).toLocaleDateString();
                                return '';
                            },
                            //drawAxis: false
                        },
                        y: {
                            //drawAxis: false
                        }
                    }
                };
                scope.$watch('options', function() {
                    //debugger;
                    if (scope.options) {
                        for(var key in scope.options) {
                            if (key === 'labelsDiv') {
                                opts[key] = element[0].ownerDocument.getElementById(scope.options[key]);
                            } else {
                                opts[key] = scope.options[key];
                            }
                        }
                    }
                });
                scope.$watch('data', function() {
                    if (scope.data) {
                        debugger;
                        var data = [];
                        var labels = ["x"];
                        var dates_value = Object.keys(scope.data).sort(); // by string
                        dates_value.forEach(function(item, idx) {
                            var info = [new Date(item)];
                            for (var i = 0; i < scope.data[item].length; ++i) {
                                if (idx === 0) {
                                    labels.push(scope.data[item][i].deviceType);
                                }
                                info.push(scope.data[item][i].count);
                            }
                            data.push(info);
                        });
                        opts.labels = labels;
                        opts.labelsUTC = true;
                        opts.dateWindow = [moment(dates_value[0]).subtract(12, 'hour'), moment(dates_value[dates_value.length-1]).add(12, 'hour')];
                        scope.graph = new Dygraph(element[0], data, opts);
                        var elem = $(element[0]).closest('div.visualize-chart');
                        scope.graph.resize(elem.width() - 100, 300);
                    }

                }, true);
            }
        };
    }];

    // Add the directive to this module
    // The camelCase name of the directive in the js is referred to dash-delimited in the html
    module.directive('vodDailyPurchaseGraphDirective', vodDailyPurchaseGraphDirective);
});

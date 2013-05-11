var UIK = {};
UIK.viewmodel = {};
UIK.view = {};
UIK.templates = {};

(function ($, UIK) {
    UIK.config = {};

    $.extend(UIK.config, {
        data: {
            points: {
                checked: {
                    name: 'Проверенные',
                    createIcon: function () {
                        return UIK.map.getIcon('uik-checked', 20);
                    },
                    createLayer: function () {
                        return new L.MarkerClusterGroup({
                            disableClusteringAtZoom: 17,
                            iconCreateFunction: function(cluster) {
                                return new L.DivIcon({
                                    html: '<div><span>' + cluster.getChildCount() + '</span></div>',
                                    className: 'marker-cluster marker-cluster-small',
                                    iconSize: new L.Point(40, 40)
                                });
                            }
                        });
                    },
                    searchCssClass: 'checked'
                },
                unchecked: {
                    name: 'Непроверенные',
                    createIcon: function () {
                        return UIK.map.getIcon('uik-unchecked', 20);
                    },
                    createLayer: function () {
                        return new L.MarkerClusterGroup({
                            disableClusteringAtZoom: 17,
                            iconCreateFunction: function(cluster) {
                                return new L.DivIcon({
                                    html: '<div><span>' + cluster.getChildCount() + '</span></div>',
                                    className: 'marker-cluster marker-cluster-medium',
                                    iconSize: new L.Point(40, 40)
                                });
                            }
                        });
                    },
                    searchCssClass: 'non-checked'
                },
                blocked: {
                    name: 'Заблокированные',
                    createIcon: function () {
                        return UIK.map.getIcon('uik-blocked', 20);
                    },
                    createLayer: function () {
                        return new L.MarkerClusterGroup({
                            disableClusteringAtZoom: 17,
                            iconCreateFunction: function(cluster) {
                                return new L.DivIcon({
                                    html: '<div><span>' + cluster.getChildCount() + '</span></div>',
                                    className: 'marker-cluster marker-cluster-large',
                                    iconSize: new L.Point(40, 40)
                                });
                            }
                        });
                    },
                    searchCssClass: 'blocked'
                }
            }
        }
    });
})(jQuery, UIK);
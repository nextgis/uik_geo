(function ($, UIK) {
    $.extend(UIK.viewmodel, {
        uikSelected: null,
        uikSelectedId: null,
        pointLayers: {}
    });
    $.extend(UIK.view, {

    });
    UIK.uiks = {};
    $.extend(UIK.uiks, {
        init: function () {
            this.updatePoints();
            this.bindEvents();
        },


        bindEvents: function () {
            var context = this;
            UIK.view.$document.on('/uik/uiks/updateUiks', function () {
                context.updatePoints();
            });
        },


        updatePoints: function () {
            var validateZoom = this.validateZoom();
            this.clearLayers();
            if (!validateZoom) { return; }
            UIK.view.$document.trigger('/uik/uiks/startUpdate');
            this.updateUiksByAjax();
        },

        clearLayers: function () {
            var mapLayers = UIK.viewmodel.mapLayers;
            mapLayers.points.checked.clearLayers();
            mapLayers.points.unchecked.clearLayers();
            mapLayers.points.blocked.clearLayers();
        },

        updateUiksByAjax: function () {
            var context = this,
                url = document['url_root'] + 'uik/all',
                filter = UIK.viewmodel.filter,
                filter_json = {
                    'uik' : filter.uik.json,
                    'uik_2012' : filter.uik_2012.json
                };
            $.ajax({
                type: "GET",
                url: url,
                data: {
                    'bbox' : JSON.stringify(UIK.viewmodel.map.getBounds()),
                    'center' : JSON.stringify(UIK.viewmodel.map.getCenter()),
                    'filter' : JSON.stringify(filter_json)
                },
                dataType: 'json',
                success: function (data) {
                    context.renderUiks(data);
                    UIK.view.$document.trigger('/sm/searcher/update');
                    UIK.view.$document.trigger('/sm/stops/endUpdate');
                },
                context: context
            });
        },

        renderUiks: function (data) {
            var viewmodel = UIK.viewmodel,
                pointsLayers = viewmodel.mapLayers.points,
                pointsConfig = UIK.config.data.points,
                dataPointsLayers = data.data.points.layers,
                dataPointType,
                dataPointsIterable,
                dataPointsCount,
                dataPoint,
                icon,
                marker,
                i,
                htmlPopup = UIK.templates.uikPopupTemplate({ css: 'edit' }),
                context = this;

            viewmodel.pointLayers.uiks = data.data.points.layers;

            for (dataPointType in dataPointsLayers) {
                if (dataPointsLayers.hasOwnProperty(dataPointType)) {
                    dataPointsIterable = dataPointsLayers[dataPointType].elements;
                    dataPointsCount = dataPointsLayers[dataPointType].count;
                    if (dataPointsCount > 0) { icon = pointsConfig[dataPointType].createIcon(); }
                    for (i = 0; i < dataPointsCount; i += 1) {
                        dataPoint = dataPointsIterable[i];
                        marker = L.marker([dataPoint.lat, dataPoint.lon], {icon: icon}).on('click', function (e) {
                            var marker = e.target;
                            UIK.view.$document.trigger('/uik/map/openPopup', [marker.getLatLng(), htmlPopup]);
                            context.buildUikPopup(marker.id);
                        });
                        marker.id = dataPoint.id;
                        pointsLayers[dataPointType].addLayer(marker);
                    }
                }
            }
        },

        buildUikPopup: function (uikId) {
            return $.getJSON(document['url_root'] + 'uik/' + uikId, function (data) {
                if (!UIK.viewmodel.editable) {
                    UIK.viewmodel.uikSelected = data;
                }
                var html = UIK.templates.uikPopupInfoTemplate({
                    uik: data.uik,
                    tik: data.tik,
                    region: data.region,
                    geo_precision: data.geo_precision,
                    isUserEditor: UIK.viewmodel.isAuth,
                    editDenied: UIK.viewmodel.editable || data.uik.is_blocked,
                    isBlocked: data.uik.is_blocked,
                    userBlocked: data.uik.user_blocked,
                    isUnBlocked: data.uik.is_unblocked
                });
                $('#uik-popup').removeClass('loader').empty().append(html);
                $('button#edit').off('click').on('click', function () {
                    UIK.view.$document.trigger('/uik/editor/startEdit');
                });
                if (data.uik.is_unblocked) {
                    $('#unblock').off('click').on('click', function () {
                        $.ajax({
                            type: 'GET',
                            url: document['url_root'] + 'uik/unblock/' + UIK.viewmodel.uikSelected.uik.id
                        }).done(function () {
                                UIK.viewmodel.map.closePopup();
                                UIK.view.$document.trigger('/uik/map/updateAllLayers');
                        });
                    });
                }
                UIK.uiks.versions.showVersions();
                $('#versionsUIK-link').click();
            }).error(function () {
                    $('#uik-popup').removeClass('loader').empty().append('Error connection');
                });
        },

        validateZoom: function () {
            if (UIK.viewmodel.map.getZoom() < 14) {
                UIK.alerts.showAlert('zoom');
                return false;
            }
            return true;
        }
    });
})(jQuery, UIK);


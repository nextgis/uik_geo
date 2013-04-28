(function ($, UIK) {
    $.extend(UIK.viewmodel, {
        uikSelected: null,
        uikSelectedId: null,
        uiks: null
    });
    $.extend(UIK.view, {

    });
    UIK.uiks = {};
    $.extend(UIK.uiks, {
        init: function () {
            this.setDomOptions();
            this.buildStopsLayers();
            this.updateStops();
            this.bindEvents();
        },

        bindEvents: function () {
            var context = this;
            UIK.view.$document.on('/sm/stops/updateStops', function () {
                context.updateStops();
            });
        },

        setDomOptions: function () {

        },

        buildStopsLayers: function () {
            var uiksGroup = new L.layerGroup(),
                editGroup = new L.layerGroup();
            UIK.viewmodel.map.addLayer(uiksGroup);
            UIK.viewmodel.mapLayers['uiks'] = uiksGroup;

            UIK.viewmodel.map.addLayer(editGroup);
            UIK.viewmodel.mapLayers['edit'] = editGroup;
        },

        updateStops: function () {
            var validateZoom = this.validateZoom();
            UIK.viewmodel.mapLayers.uiks.clearLayers();
            if (!validateZoom) { return; }
            UIK.view.$document.trigger('/sm/stops/startUpdate');
            this.updateUiksByAjax();
        },

        updateUiksByAjax: function () {
            var context = this,
                url = document['url_root'] + 'uik/all',
                filter = UIK.viewmodel.filter;
            $.ajax({
                type: "GET",
                url: url,
                data: {
                    'bbox' : JSON.stringify(UIK.viewmodel.map.getBounds()),
                    'filter' : JSON.stringify(filter)
                },
                dataType: 'json',
                success: function(data) {
                    context.renderUiks(data);
                    UIK.view.$document.trigger('/sm/searcher/update');
                    UIK.view.$document.trigger('/sm/stops/endUpdate');
                },
                context: context
            });
        },

        renderUiks: function (data) {
            var mp = UIK.map,
                vm = UIK.viewmodel,
                uiksLayer = vm.mapLayers.uiks,
                iconBlock = mp.getIcon('stop-block', 20),
                iconEdit = mp.getIcon('stop-edit', 20),
                iconUik = mp.getIcon('stop-check', 20),
                uiksIterable, uiksIterableLength, i,
                uik, marker, popupHtml,
                htmlPopup = UIK.templates.uikPopupTemplate({ css: 'edit' }),
                context = this;

            vm.uiks = data.uiks;

//            stopsIterable = data.stops.block.elements;
//            stopsIterableLength = data.stops.block.count;
//            for (indexStop = 0; indexStop < stopsIterableLength; indexStop += 1) {
//                stop = stopsIterable[indexStop];
//                marker = L.marker([stop.lat, stop.lon], {icon: iconBlock})
//                    .on('click', function (e) {
//                        var marker = e.target;
//                        UIK.view.$document.trigger('/sm/map/openPopup', [marker.getLatLng(), htmlPopup]);
//                        context.buildStopPopup(marker.stop_id);
//                    });
//                marker['stop_id'] = stop.id;
//                stopsLayer.addLayer(marker);
//            }
//
//            stopsIterable = data.stops.non_block.non_check.elements;
//            stopsIterableLength = data.stops.non_block.non_check.count;
//            for (indexStop = 0; indexStop < stopsIterableLength; indexStop += 1) {
//                stop = stopsIterable[indexStop];
//                marker = L.marker([stop.lat, stop.lon], {icon: iconEdit})
//                    .on('click', function (e) {
//                        var marker = e.target;
//                        UIK.view.$document.trigger('/sm/map/openPopup', [marker.getLatLng(), htmlPopup]);
//                        context.buildStopPopup(marker.stop_id);
//                    });
//                marker['stop_id'] = stop.id;
//                stopsLayer.addLayer(marker);
//            }


            uiksIterable = data.uiks.elements;
            uiksIterableLength = data.uiks.count;
            for (i = 0; i < uiksIterableLength; i += 1) {
                uik = uiksIterable[i];
                marker = L.marker([uik.lat, uik.lon], {icon: iconUik}).on('click', function (e) {
                    var marker = e.target;
                    UIK.view.$document.trigger('/sm/map/openPopup', [marker.getLatLng(), htmlPopup]);
                    context.buildStopPopup(marker.uik_id);
                });
                marker['uik_id'] = uik.id;
                uiksLayer.addLayer(marker);
            }
        },

        buildUikPopup: function (uikId) {
            return $.getJSON(document['url_root'] + 'uik/' + uikId,function (data) {
                if (!UIK.viewmodel.editable) {
                    UIK.viewmodel.uikSelected = data.uik;
                }
                var helper = UIK.helpers,
                    html = UIK.templates.stopPopupInfoTemplate({
                        id: data.stop.id,
                        name: data.stop.name,
                        is_shelter: helper.boolToString(data.stop.is_shelter),
                        is_bench: helper.boolToString(data.stop.is_bench),
                        stop_type_id: helper.valueNullToString(data.stop.stop_type_id),
                        routes: data.stop.routes,
                        types: data.stop.types,
                        check_status: helper.valueCheckToString(data.stop.check_status_type_id),
                        comment: helper.valueNullToString(data.stop.comment),
                        isUserEditor: UIK.viewmodel.isAuth,
                        editDenied: UIK.viewmodel.editable || data.stop.is_block,
                        isBlock: data.stop.is_block,
                        userBlock: data.stop.user_block,
                        isUnBlock: data.stop.is_unblock
                    });
                $('#stop-popup').removeClass('loader').empty().append(html);
                $('button#edit').off('click').on('click', function (e) {
                    UIK.view.$document.trigger('/sm/editor/startEdit');
                });
                if (data.stop.is_unblock) {
                    $('#unblock').off('click').on('click', function (e) {
                        $.ajax({
                            type: 'GET',
                            url: document['url_root'] + 'stop/unblock/' + UIK.viewmodel.stopSelected.id
                        }).done(function () {
                                UIK.viewmodel.map.closePopup();
                                UIK.view.$document.trigger('/sm/map/updateAllLayers');
                            });
                    });
                }
            }).error(function () {
                    $('#stop-popup').removeClass('loader').empty().append('Error connection');
                });
        },

        validateZoom: function () {
            if (UIK.viewmodel.map.getZoom() < 14) {
                return false;
            }
            return true;
        }
    });
})(jQuery, UIK);


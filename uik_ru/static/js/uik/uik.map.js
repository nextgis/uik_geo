(function ($, UIK) {
    $.extend(UIK.viewmodel, {
        map: null,
        mapLayers: {},
        isPopupOpened: false
    });
    $.extend(UIK.view, {
        $map: null
    });

    UIK.map = {};
    $.extend(UIK.map, {

        defaultExtent: {
            latlng: new L.LatLng(55.742, 37.658),
            zoom: 17
        },


        init: function () {
            this.buildMap();
            this.buildLayerManager();
            this.buildLayers();
            this.bindEvents();
        },

        bindEvents: function () {
            var context = this;
            UIK.viewmodel.map.on('moveend', function (e) {
                var map = e.target,
                    center = map.getCenter(),
                    zoom = map.getZoom();

                context.setLastExtentToCookie(center, zoom);
                UIK.view.$document.trigger('/uik/permalink/update', [center, zoom]);
                UIK.view.$document.trigger('/uik/map/updateAllLayers');

            });
            UIK.view.$document.on('/uik/map/updateAllLayers', function () {
                UIK.view.$document.trigger('/uik/uiks_2012/updateUiks');
                UIK.view.$document.trigger('/uik/uiks/updateUiks');

            });
            UIK.view.$document.on('/uik/map/openPopup', function (e, latlng, html) {
                var vm = UIK.viewmodel,
                    selectLayer = vm.mapLayers.select,
                    map = vm.map;
                map.panTo(latlng);
                map.openPopup(L.popup().setLatLng(latlng).setContent(html));
            });
            UIK.viewmodel.map.on('popupclose', function () {
                var vm = UIK.viewmodel;
                vm.isPopupOpened = false;
                vm.mapLayers.select.clearLayers();
            });
        },

        buildMap: function () {
            var viewmodel = UIK.viewmodel,
                extentFromUrl = this.getExtentFromUrl(),
                selectedLayer;

            UIK.view.$map = $('#map');
            viewmodel.map = new L.Map('map');

            L.control.scale().addTo(viewmodel.map);

            if (extentFromUrl) {
                viewmodel.map.setView(extentFromUrl.latlng, extentFromUrl.zoom);
                this.setLastExtentToCookie(extentFromUrl.latlng, extentFromUrl.zoom);
            } else {
                lastExtent = this.getLastExtentFromCookie();
                if (lastExtent) {
                    viewmodel.map.setView(lastExtent.latlng, lastExtent.zoom);
                } else {
                    viewmodel.map.setView(this.defaultExtent.latlng, this.defaultExtent.zoom);
                    this.setLastExtentToCookie(this.defaultExtent.latlng, this.defaultExtent.zoom);
                }
            }

            UIK.view.$document.trigger('/uik/permalink/update', [viewmodel.map.getCenter(), viewmodel.map.getZoom()]);

            selectedLayer = L.layerGroup();
            viewmodel.map.addLayer(selectedLayer);
            viewmodel.mapLayers['select'] = selectedLayer;
        },


        buildLayers: function () {
            var configPoints = UIK.config.data.points,
                layerName,
                pointLayer,
                editGroup,
                layerIndex = {},
                indexesSort = [];
            UIK.viewmodel.mapLayers.points = {};

            for (layerName in configPoints) {
                if (configPoints.hasOwnProperty(layerName)) {
                    pointLayer = configPoints[layerName].createLayer();
                    UIK.viewmodel.map.addLayer(pointLayer);
                    UIK.viewmodel.mapLayers.points[layerName] = pointLayer;
                    layerIndex[configPoints[layerName].z] = layerName;
                    indexesSort.push(configPoints[layerName].z);
                }
            }

            indexesSort.sort(function (a, b) {
                return b - a;
            });

            $.each(indexesSort, function (i, zIndex) {
                UIK.viewmodel.mapLayers.points[layerIndex[zIndex]].bringToFront();
            });

//            editGroup = new L.layerGroup();
//            UIK.viewmodel.map.addLayer(editGroup);
//            UIK.viewmodel.mapLayers['edit'] = editGroup;
        },


        getLastExtentFromCookie: function () {
            var lat = parseFloat($.cookie('map.lat'), 10),
                lng = parseFloat($.cookie('map.lng'), 10),
                zoom = parseInt($.cookie('map.zoom'), 10);
            if (lat && lng && zoom) {
                return {'latlng': new L.LatLng(lat, lng), 'zoom': zoom};
            } else {
                return null;
            }
        },

        setLastExtentToCookie: function (latLng, zoom) {
            $.cookie('map.lat', latLng.lat, { expires: 7, path: '/' });
            $.cookie('map.lng', latLng.lng, { expires: 7, path: '/' });
            $.cookie('map.zoom', zoom, { expires: 7, path: '/' });
        },


        getExtentFromUrl: function () {
            var lat = parseFloat(this.getURLParameter('lat')),
                lng = parseFloat(this.getURLParameter('lon')),
                zoom = parseFloat(this.getURLParameter('zoom'));

            if (lat && lng && zoom) {
                return {'latlng': new L.LatLng(lat, lng), 'zoom': zoom};
            }
            return null;
        },


        getURLParameter: function (name) {
            return decodeURI((RegExp(name + '=' + '(.+?)(&|$)').exec(location.search) || [, null])[1]);
        }

    });
})(jQuery, UIK);


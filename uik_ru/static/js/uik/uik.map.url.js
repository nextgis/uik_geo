(function ($, UIK) {

    $.extend(UIK.viewmodel, {
    });

    $.extend(UIK.view, {
    });

    $.extend(UIK.map, {

        defaultExtent: {
            latlng: new L.LatLng(55.742, 37.658),
            zoom: 17
        },

        initUrlModule: function () {
            var view = UIK.view,
                viewmodel = UIK.viewmodel,
                uikFromUrl = this.getUikFromUrl(),
                extentFromUrl = this.getExtentFromUrl();

            if (uikFromUrl) {

            } else if (extentFromUrl) {
//                view.$document.trigger('/uik/map/setView', [extentFromUrl.latlng, extentFromUrl.zoom]);
                viewmodel.map.setView(extentFromUrl.latlng, extentFromUrl.zoom);
                this.setLastExtentToCookie(extentFromUrl.latlng, extentFromUrl.zoom);
                view.$document.trigger('/uik/permalink/update', [viewmodel.map.getCenter(), viewmodel.map.getZoom()]);
                return false;
            } else {
                lastExtent = this.getLastExtentFromCookie();
                if (lastExtent) {
//                    view.$document.trigger('/uik/map/setView', [lastExtent.latlng, lastExtent.zoom]);
                    viewmodel.map.setView(lastExtent.latlng, lastExtent.zoom);
                    this.setLastExtentToCookie(lastExtent.latlng, lastExtent.zoom);
                    view.$document.trigger('/uik/permalink/update', [viewmodel.map.getCenter(), viewmodel.map.getZoom()]);
                    return false;
                } else {
                    view.$document.trigger('/uik/map/setView', [this.defaultExtent.latlng, this.defaultExtent.zoom]);
                    return false;
                }
            }
        },


        getExtentFromUrl: function () {
            var helpers = UIK.helpers,
                lat = parseFloat(helpers.getURLParameter('lat')),
                lng = parseFloat(helpers.getURLParameter('lon')),
                zoom = parseFloat(helpers.getURLParameter('zoom'));

            if (lat && lng && zoom) {
                return {'latlng': new L.LatLng(lat, lng), 'zoom': zoom};
            }
            return null;
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


        getUikFromUrl: function () {
            var helpers = UIK.helpers,
                uikOfficialNumber = helpers.getURLParameter('uik'),
                regionCode = helpers.getURLParameter('region'),
                editable = helpers.getURLParameter('edit');

            if (uikOfficialNumber !== 'null' && regionCode !== 'null') {
                return {
                    'uikOfficialNumber': uikOfficialNumber,
                    'regionCode': regionCode,
                    'editable': editable === 'True' || editable === 'true'
                };
            }

            return null;
        }
    });
})(jQuery, UIK);


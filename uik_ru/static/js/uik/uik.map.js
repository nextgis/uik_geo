(function ($) {
	$.extend($.viewmodel, {
		map: null,
		mapLayers: {},
		isPopupOpened: false
	});
	$.extend($.view, {
		$map: null
	});

	$.sm.map = {};
	$.extend($.sm.map, {
		init: function () {
			this.buildMap();
			this.buildLayerManager();
			this.bindEvents();
		},

		bindEvents: function () {
			var context = this;
			$.viewmodel.map.on('moveend', function (e) {
				var map = e.target;
				$.view.$document.trigger('/sm/map/updateAllLayers');
				context.setLastExtent(map.getCenter(), map.getZoom());
			});
			$.view.$document.on('/sm/map/updateAllLayers', function () {
				$.view.$document.trigger('/sm/stops/updateStops');
				$.view.$document.trigger('/sm/osm/updateOsmLayer');
			});
			$.view.$document.on('/sm/map/openPopup', function (e, latlng, html) {
				var vm = $.viewmodel,
					selectLayer = vm.mapLayers.select,
					map = vm.map;
				map.panTo(latlng);
				map.openPopup(L.popup().setLatLng(latlng).setContent(html));

			});
			$.viewmodel.map.on('popupclose', function () {
				var vm = $.viewmodel;
				vm.isPopupOpened = false;
				vm.mapLayers.select.clearLayers();
			});
		},

		buildMap: function () {
			var context = this,
				vm = $.viewmodel,
				selectLayer = L.layerGroup(),
				lastExtent = this.getLastExtent();
			$.view.$map = $('#map');
			vm.map = new L.Map('map');
			L.control.scale().addTo(vm.map);

			if (lastExtent) {
				vm.map.setView(lastExtent.latlng, lastExtent.zoom);
			} else {
				vm.map.setView(new L.LatLng(55.742, 37.658), 14);
				this.setLastExtent(new L.LatLng(55.742, 37.658), 14);
			}

			vm.map.addLayer(selectLayer);
			vm.mapLayers['select'] = selectLayer;
		},

		getLastExtent: function () {
			var lat = parseFloat($.cookie('map.lat'), 10),
				lng = parseFloat($.cookie('map.lng'), 10),
				zoom = parseInt($.cookie('map.zoom'), 10);
			if (lat && lng && zoom) {
				return {'latlng': new L.LatLng(lat, lng), 'zoom': zoom};
			} else {
				return null;
			}
		},

		setLastExtent: function (latLng, zoom) {
			$.cookie('map.lat', latLng.lat, { expires: 7, path: '/' });
			$.cookie('map.lng', latLng.lng, { expires: 7, path: '/' });
			$.cookie('map.zoom', zoom, { expires: 7, path: '/' });
		}
	});
})(jQuery);


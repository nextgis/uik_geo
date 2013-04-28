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
		init: function () {
			this.buildMap();
			this.buildLayerManager();
			this.bindEvents();
		},

		bindEvents: function () {
			var context = this;
			UIK.viewmodel.map.on('moveend', function (e) {
				var map = e.target;
				UIK.view.$document.trigger('/sm/map/updateAllLayers');
				context.setLastExtent(map.getCenter(), map.getZoom());
			});
			UIK.view.$document.on('/sm/map/updateAllLayers', function () {
				UIK.view.$document.trigger('/sm/stops/updateStops');
				UIK.view.$document.trigger('/sm/osm/updateOsmLayer');
			});
			UIK.view.$document.on('/sm/map/openPopup', function (e, latlng, html) {
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
			var context = this,
				vm = UIK.viewmodel,
				selectLayer = L.layerGroup(),
				lastExtent = this.getLastExtent();
			UIK.view.$map = $('#map');
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
})(jQuery, UIK);


(function ($) {
	$.extend($.viewmodel, {
		osmStops: {}
	});
	$.extend($.view, {

	});
	$.sm.osm = {};
	$.extend($.sm.osm, {
		osmMaxClusterRadius: 80,

		init: function () {
			this.setDomOptions();
			this.buildOsmStopsLayer();
			this.updateStopsFromXapi();
			this.bindEvents();
		},

		bindEvents: function () {
			var context = this;
			$.view.$document.on('/sm/osm/updateOsmLayer', function () {
				context.updateOsmLayer();
			});
		},

		setDomOptions: function () {

		},

		buildOsmStopsLayer: function () {
			var osmStopsLayerGroup  = new L.layerGroup();
			$.viewmodel.map.addLayer(osmStopsLayerGroup);
			$.viewmodel.mapLayers['osmStops'] = osmStopsLayerGroup;
		},

		updateOsmLayer: function () {
			var validateZoom = this.validateZoom();
			$.viewmodel.mapLayers.osmStops.clearLayers();
			if (!validateZoom) { return; }

			this.updateStopsFromXapi();
		},

		offOsmLayer: function () {
			$.viewmodel.mapLayers.osmStops.clearLayers();
		},

		onOsmLayer: function () {
			this.updateOsmLayer(false);
		},

		renderStops: function (overpassStops) {
			var stops = overpassStops.elements,
				vm = $.viewmodel,
				osmLayer = vm.mapLayers.osmStops,
				icon = $.sm.map.getIcon('osm-bus-stop', 16),
				marker;
			vm.osmStops = {};
			popupHtml = $.templates.stopPopupTemplate({
				css: 'block'
			});
			for (var i = 0, stopsCount = stops.length; i < stopsCount; i++) {
				vm.osmStops[stops[i].id] = stops[i];
				marker = L.marker([stops[i].lat, stops[i].lon], {icon:icon})
					.on('click', function (e) {
						$.view.$document.trigger('/sm/map/MarkerClick');
						var marker = e.target,
							stop = $.viewmodel.osmStops[marker.id_osm],
							html = $.templates.osmPopupTemplate({
								tags: $.sm.helpers.hashToArrayKeyValues(stop.tags),
								id: stop.id,
								link: 'http://www.openstreetmap.org/browse/node/' + stop.id
							});
							$.view.$document.trigger('/sm/map/openPopup', [marker.getLatLng(), html]);
					});
				marker['id_osm'] = stops[i].id;
				osmLayer.addLayer(marker);
			}
		},

		updateStopsFromXapi: function () {
			var context = this,
				url = context.getApiUrl($.viewmodel.map.getBounds());
			$.ajax({
					type: "GET",
					url: url,
					dataType: 'json',
					success: context.renderStops,
					context: context
				});
		},

		getApiUrl: function (boundingbox) {
			var sw = boundingbox.getSouthWest(),
				ne = boundingbox.getNorthEast(),
				overpassUrl = "http://overpass-api.de/api/interpreter?data=[out:json];(node[highway=bus_stop]("
				+ sw.lat + "," + sw.lng
				+ "," + ne.lat
				+ "," + ne.lng
				+ ");>;);out;";
			return overpassUrl;
		},

		validateZoom: function () {
			if ($.viewmodel.map.getZoom() < 14) {
				return false;
			}
			return true;
		}
	});
})(jQuery);


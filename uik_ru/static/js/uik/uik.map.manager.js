(function ($) {
	$.extend($.viewmodel, {
		currentTileLayer: null
	});
	$.extend($.view, {
		$tileLayers: null,
		$manager: null
	});

	$.extend($.sm.map, {
		_layers: {},
		_lastIndex: 0,

		buildLayerManager: function () {
			var v = $.view;
			$.view.$manager = $('#manager');
			// http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
			// http://{s}.tile.osmosnimki.ru/kosmo/{z}/{x}/{y}.png
			// http://{s}.tiles.mapbox.com/v3/karavanjo.map-opq7bhsy/{z}/{x}/{y}.png
			this.addTileLayer('osm', 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', '© OpenStreetMap contributors');
			this.addBingLayer('AujH--7B6FRTK8b81QgPhuvw_Sb3kc8hBO-Lp5OLNyhCD4ZQoGGW4cQS6zBgaeEh');
			$.view.$tileLayers = v.$map.find('div.leaflet-tile-pane div.leaflet-layer');
			this.bindLayerManagerEvents();
			this.onLayer('osm');
		},

		bindLayerManagerEvents: function () {
			var context = this;
			$.viewmodel.map.off('zoomend').on('zoomend', function () {
				context.onLayer();
			});
			$.view.$manager.find('div.tile-layers div.icon').off('click').on('click', function (e) {
				context.onLayer($(this).data('layer'));
			});
		},

		onLayer: function (nameLayer) {
			var vm = $.viewmodel,
				v = $.view,
				$tileLayers = $($.viewmodel.map.getPanes().tilePane).find('div.leaflet-layer');
			if (nameLayer) {
				v.$body.removeClass(vm.currentTileLayer).addClass(nameLayer);
				vm.currentTileLayer = nameLayer;
				$tileLayers.hide().eq(this._layers[nameLayer].index).show();
			} else {
				$tileLayers.hide().eq(this._layers[vm.currentTileLayer].index).show();
			}
		},

		addTileLayer: function (nameLayer, url, attribution) {
			var layer = new L.TileLayer(url, {minZoom: 8, maxZoom: 18, attribution: attribution});
			this._layers[nameLayer] = {
				'layer' : $.viewmodel.map.addLayer(layer, true),
				'index' : this._lastIndex
			};
			this._lastIndex =+ 1;
		},

		addBingLayer: function (key) {
			var bingLayer = new L.BingLayer(key, {minZoom: 8, maxZoom: 19});
			this._layers['bing'] = {
				'layer' : $.viewmodel.map.addLayer(bingLayer, true),
				'index' : this._lastIndex
			};
			this._lastIndex =+ 1;
		}

	});
})(jQuery);
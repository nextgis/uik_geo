(function ($, UIK) {
	$.extend(UIK.viewmodel, {
		currentTileLayer: null
	});
	$.extend(UIK.view, {
		$tileLayers: null,
		$manager: null
	});

	$.extend(UIK.map, {
		_layers: {},
		_lastIndex: 0,

		buildLayerManager: function () {
			var v = UIK.view;
			UIK.view.$manager = $('#manager');
			this.addTileLayer('osm', 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', '© OpenStreetMap contributors');
			this.addTileLayer('irs', 'http://irs.gis-lab.info/?layers=irs&request=GetTile&z={z}&x={x}&y={y}', 'Kosmosnimki.ru IRS');
			this.addBingLayer('AujH--7B6FRTK8b81QgPhuvw_Sb3kc8hBO-Lp5OLNyhCD4ZQoGGW4cQS6zBgaeEh');
			UIK.view.$tileLayers = v.$map.find('div.leaflet-tile-pane div.leaflet-layer');
			this.bindLayerManagerEvents();
			this.onLayer('osm');
		},

		bindLayerManagerEvents: function () {
			var context = this;
			UIK.viewmodel.map.off('zoomend').on('zoomend', function () {
				context.onLayer();
			});
			UIK.view.$manager.find('div.tile-layers div.icon').off('click').on('click', function (e) {
				context.onLayer($(this).data('layer'));
			});
		},

		onLayer: function (nameLayer) {
			var vm = UIK.viewmodel,
				v = UIK.view,
				$tileLayers = $(UIK.viewmodel.map.getPanes().tilePane).find('div.leaflet-layer');
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
				'layer' : UIK.viewmodel.map.addLayer(layer, true),
				'index' : this._lastIndex
			};
			this._lastIndex += 1;
		},

		addBingLayer: function (key) {
			var bingLayer = new L.BingLayer(key, {minZoom: 8, maxZoom: 18});
			this._layers['bing'] = {
				'layer' : UIK.viewmodel.map.addLayer(bingLayer, true),
				'index' : this._lastIndex
			};
			this._lastIndex += 1;
		}

	});
})(jQuery, UIK);
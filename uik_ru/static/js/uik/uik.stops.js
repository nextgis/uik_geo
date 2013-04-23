(function ($) {
	$.extend($.viewmodel, {
		stopSelected: null,
		stopSelectedId: null,
		stops: null
	});
	$.extend($.view, {

	});
	$.sm.stops = {};
	$.extend($.sm.stops, {
		init: function () {
			this.setDomOptions();
			this.buildStopsLayers();
			this.updateStops();
			this.bindEvents();
		},

		bindEvents: function () {
			var context = this;
			$.view.$document.on('/sm/stops/updateStops', function () {
				context.updateStops();
			});
		},

		setDomOptions: function () {

		},

		buildStopsLayers: function () {
			var stopsGroup = new L.layerGroup(),
				editGroup = new L.layerGroup();
			$.viewmodel.map.addLayer(stopsGroup);
			$.viewmodel.mapLayers['stops'] = stopsGroup;

			$.viewmodel.map.addLayer(editGroup);
			$.viewmodel.mapLayers['edit'] = editGroup;
		},

		updateStops: function () {
			var validateZoom = this.validateZoom();
			$.viewmodel.mapLayers.stops.clearLayers();
			if (!validateZoom) { return; }
			$.view.$document.trigger('/sm/stops/startUpdate');
			this.updateStopsByAjax();
		},

		updateStopsByAjax: function () {
			var context = this,
				url = document['url_root'] + 'stops',
				filter = $.viewmodel.filter;
			$.ajax({
				type: "GET",
				url: url,
				data: {
					'bbox' : JSON.stringify($.viewmodel.map.getBounds()),
					'filter' : JSON.stringify(filter)
				},
				dataType: 'json',
				success: function(data) {
					context.renderStops(data);
					$.view.$document.trigger('/sm/searcher/update');
					$.view.$document.trigger('/sm/stops/endUpdate');
				},
				context: context
			});
		},

		renderStops: function (data) {
			var mp = $.sm.map,
				vm = $.viewmodel,
				stopsLayer = vm.mapLayers.stops,
				iconBlock = mp.getIcon('stop-block', 20),
				iconEdit = mp.getIcon('stop-edit', 20),
				iconCheck = mp.getIcon('stop-check', 20),
				stopsIterable, stopsIterableLength, indexStop,
				stop, marker, popupHtml,
				htmlPopup = $.templates.stopPopupTemplate({ css: 'edit' }),
				context = this;

			vm.stops = data.stops;

			stopsIterable = data.stops.block.elements;
			stopsIterableLength = data.stops.block.count;
			for (indexStop = 0; indexStop < stopsIterableLength; indexStop += 1) {
				stop = stopsIterable[indexStop];
				marker = L.marker([stop.lat, stop.lon], {icon: iconBlock})
					.on('click', function (e) {
						var marker = e.target;
						$.view.$document.trigger('/sm/map/openPopup', [marker.getLatLng(), htmlPopup]);
						context.buildStopPopup(marker.stop_id);
					});
				marker['stop_id'] = stop.id;
				stopsLayer.addLayer(marker);
			}

			stopsIterable = data.stops.non_block.non_check.elements;
			stopsIterableLength = data.stops.non_block.non_check.count;
			for (indexStop = 0; indexStop < stopsIterableLength; indexStop += 1) {
				stop = stopsIterable[indexStop];
				marker = L.marker([stop.lat, stop.lon], {icon: iconEdit})
					.on('click', function (e) {
						var marker = e.target;
						$.view.$document.trigger('/sm/map/openPopup', [marker.getLatLng(), htmlPopup]);
						context.buildStopPopup(marker.stop_id);
					});
				marker['stop_id'] = stop.id;
				stopsLayer.addLayer(marker);
			}


			stopsIterable = data.stops.non_block.check.elements;
			stopsIterableLength = data.stops.non_block.check.count;
			for (indexStop = 0; indexStop < stopsIterableLength; indexStop += 1) {
				stop = stopsIterable[indexStop];
				marker = L.marker([stop.lat, stop.lon], {icon: iconCheck}).on('click', function (e) {
					var marker = e.target;
					$.view.$document.trigger('/sm/map/openPopup', [marker.getLatLng(), htmlPopup]);
					context.buildStopPopup(marker.stop_id);
				});
				marker['stop_id'] = stop.id;
				stopsLayer.addLayer(marker);
			}
		},

		buildStopPopup: function (stopId) {
			return $.getJSON(document['url_root'] + 'stop/' + stopId,function (data) {
				if (!$.viewmodel.editable) {
					$.viewmodel.stopSelected = data.stop;
				}
				var helper = $.sm.helpers,
					html = $.templates.stopPopupInfoTemplate({
						id: data.stop.id,
						name: data.stop.name,
						is_shelter: helper.boolToString(data.stop.is_shelter),
						is_bench: helper.boolToString(data.stop.is_bench),
						stop_type_id: helper.valueNullToString(data.stop.stop_type_id),
						routes: data.stop.routes,
						types: data.stop.types,
						check_status: helper.valueCheckToString(data.stop.check_status_type_id),
						comment: helper.valueNullToString(data.stop.comment),
						isUserEditor: $.viewmodel.isAuth,
						editDenied: $.viewmodel.editable || data.stop.is_block,
						isBlock: data.stop.is_block,
						userBlock: data.stop.user_block,
						isUnBlock: data.stop.is_unblock
					});
				$('#stop-popup').removeClass('loader').empty().append(html);
				$('button#edit').off('click').on('click', function (e) {
					$.view.$document.trigger('/sm/editor/startEdit');
				});
				if (data.stop.is_unblock) {
					$('#unblock').off('click').on('click', function (e) {
						$.ajax({
							type: 'GET',
							url: document['url_root'] + 'stop/unblock/' + $.viewmodel.stopSelected.id
						}).done(function () {
							$.viewmodel.map.closePopup();
							$.view.$document.trigger('/sm/map/updateAllLayers');
						});
					});
				}
			}).error(function () {
					$('#stop-popup').removeClass('loader').empty().append('Error connection');
				});
		},

		validateZoom: function () {
			if ($.viewmodel.map.getZoom() < 14) {
				return false;
			}
			return true;
		}
	});
})(jQuery);


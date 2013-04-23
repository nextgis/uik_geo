(function ($) {
	$.extend($.viewmodel, {
		editorCollapsed: false,
		editable: false,
		routeTypeSelected: null
	});

	$.extend($.view, {
		$editorContainer: null
	});

	$.sm.editor = {};
	$.extend($.sm.editor, {
		regex: { url : new RegExp("(https?)://[-A-Za-z0-9+&@#/%?=~_|!:,.;]*[-A-Za-z0-9+&@#/%=~_|]") },

		init: function () {
			this.setDomOptions();
			this.buildTags();
			this.buildEditLayer();
			this.buildRoutesSelector();
			this.bindEvents();
		},

		bindEvents: function () {
			var context = this;
			$.view.$editorContainer.find('span.icon-collapse, div.title').off('click').on('click', function () {
				$.viewmodel.editorCollapsed = !$.viewmodel.editorCollapsed;
				$.view.$body.toggleClass('editor-collapsed', context.editorCollapsed);
			});
			$('#pan_link').off('input').on('input', function () {
				context.validateLink();
			});
			$.view.$document.on('/sm/editor/startEdit', function (e) {
				context.startAjaxEdition();
			});
			$('#save').off('click').on('click', function (e) {
				e.stopPropagation();
				context.save();
			});
			$('#discard').off('click').on('click', function (e) {
				e.stopPropagation();
				context.finishAjaxEdition();
			});
			$('#route_type').off('change').on('change', function (e) {
				var newRouteType = e.target.value;
				$('#route_type_' + $.viewmodel.routeTypeSelected).hide();
				$('#route_type_' + newRouteType).show();
				$.viewmodel.routeTypeSelected = newRouteType;
			});
			$('#add-route').off('click').on('click', function (e) {
				var $selectedOption = $('#route_type_' + $.viewmodel.routeTypeSelected).find(":selected");
				context.addRoute($selectedOption.val(), $selectedOption.text());
			});
			$('#editorForm').find(':checkbox').off('click').on('click', function () {
				var checkbox = $(this),
					hidden = $('#' + checkbox.data('id'));
					if(checkbox.is(':checked')) {
						hidden.val(1);
					} else {
						hidden.val(0);
					}
			});
		},

		setDomOptions: function () {
			$.view.$editorContainer = $('#editorContainer');
		},

		buildTags: function () {
			var context = this;
			$('#routes').tagsInput({
				'defaultText': '+',
				'width': '185px',
				'maxChars' : 5,
				'interactive': false,
				'onRemoveTag': function (e) {
					context.removeRoute(e);
				}
			});
		},

		buildEditLayer: function () {
			var editedLayer = L.layerGroup();
			$.viewmodel.mapLayers['edit'] = $.viewmodel.map.addLayer(editedLayer);
		},

		buildRoutesSelector: function () {
			var route_type_selected = $('#route_type').find(":selected").val();
			$('#route_type_' + route_type_selected).show();
			$.viewmodel.routeTypeSelected = route_type_selected;
		},

		validateLink: function () {
			var pan_link_a = $('#pan_link_a'),
				val = $('#pan_link').val();
			if (this.regex.url.test(val)) {
				pan_link_a.attr('class', 'active')
					.prop('href', val);
			} else {
				pan_link_a.removeAttr('href')
					.attr('class', '');
			}
		},

		save: function () {
			var context = this,
				frm = $('#editorContainer form'),
				data_serialized = frm.serializeArray(),
				i = 0,
				ds_length = data_serialized.length,
				stop_selected = $.viewmodel.stopSelected,
				url = document['url_root'] + 'stop/' + stop_selected.id,
				stop = { 'id' :  stop_selected.id },
				name;
			for (i; i < ds_length; i += 1) {
				name = data_serialized[i].name;
				switch (name) {
					case name === 'lon':
						stop['geom']['lon'] = data_serialized[i].value;
						break;
					case name === 'lat':
						stop['geom']['lat'] = data_serialized[i].value;
						break;
					default:
						stop[data_serialized[i].name] = data_serialized[i].value;
						break;
				}
			}
			stop['routes'] = this.getRoutesToSave(stop_selected);
			stop['stop_types'] = this.getStopTypes(stop_selected);
			$.ajax({
				type: 'POST',
				url: url,
				data: { 'stop' : JSON.stringify(stop)}
			}).done(function () {
					context.finishAjaxEdition();
			});
		},

		getRoutesToSave: function (stop) {
			var routes = stop.routes.routes,
				count_routes = routes.length,
				stop_id = stop.id,
				i = 0,
				saved_routes = [];
			for (i; i < count_routes; i += 1) {
				saved_routes.push({'stop_id' : stop_id, 'route_id' : routes[i].id });
			}
			return saved_routes;
		},

		getStopTypes: function (stop) {
			var stop_id = stop.id;
			if ($('#stype_0').is(':checked')) {
				return [{'stop_id' : stop_id, 'stop_type_id' : 0 }];
			} else {
				var result = [];
				$('#types .parameter.sub input:checked').each(function () {
					result.push({'stop_id' : stop_id, 'stop_type_id' : $(this).data('id') });

				});
				return result;
			}
		},

		startAjaxEdition: function () {
			var context = this;
			$.ajax({
				type: 'GET',
				url: document['url_root'] + 'stop/block/' + $.viewmodel.stopSelected.id
			}).done(function () {
					context.startEdit();
				});
		},

		startEdit: function () {
			var icon = $.sm.helpers.getIcon('stop-editable', 25),
				vm = $.viewmodel,
				v = $.view,
				marker;
			v.$body.addClass('editable');
			v.$editorContainer.find('input, select, textarea, button').removeAttr('disabled');
			v.$editorContainer.find('form').removeClass('disabled');
			vm.editable = true;
			marker = L.marker([vm.stopSelected.geom.lat, vm.stopSelected.geom.lon], {icon: icon, draggable: true});
			marker.on('dragend', function (e) {
				var latLon = e.target.getLatLng();
				$('#lat').val(latLon.lat);
				$('#lon').val(latLon.lng);
			});
			vm.mapLayers['edit'].addLayer(marker);
			this.fillEditor(vm.stopSelected);
			this.bindEventsForTypes();
			$('#chb_is_help').off('change').on('change', function () {
				if (this.checked) {
					$('#is_help').val(1);
				} else {
					$('#is_help').val(0);
				}
			});
			vm.map.closePopup();
		},

		bindEventsForTypes: function () {
			var v = $.view;
			$('#stype_0').off('change').on('change', function () {
				if (this.checked) {
					$('#types .parameters input').not('#stype_0').prop('checked', false).not('#other_stype').prop('disabled', true);
					$('#types .parameter.sub label').addClass('disabled');
				} else {
					$('#types .parameters input').not('#stype_0').prop('disabled', false);
					$('#other_stype').prop('checked', true);
					$('#types .parameter.sub label').removeClass('disabled');
				}
			});
			$('#other_stype').off('change').on('change', function () {
				if (this.checked) {
					$('#types .parameters input').prop('disabled', false);
					$('#stype_0').prop('checked', false);
					$('#types .parameter.sub label').removeClass('disabled');
				} else {
					$('#stype_0').prop('checked', true);
					$('#types .parameters input').not('#stype_0').prop('checked', false).not('#other_stype').prop('disabled', true);
					$('#types .parameter.sub label').addClass('disabled');
				}
			});
		},

		fillEditor: function (stop) {
			var helpers = $.sm.helpers;
			$('#name').val(stop.name);
			$('#id').val(stop.id).attr('disabled', 'disabled');
			$('#lat').val(stop.geom.lat);
			$('#lon').val(stop.geom.lon);
			this.fillRoutes(stop.routes);
			for (var i = 0, tl = stop.types.length; i < tl; i += 1) {
				$('#stype_' + stop.types[i].id).prop('checked', true);
			}
			if (stop.types.length > 0 && stop.types[0].id === 0) {
				$('#types .parameters input').not('#stype_0').prop('checked', false).not('#other_stype').prop('disabled', true);
				$('#types .parameter.sub label').addClass('disabled');
			} else if (stop.types.length > 0 && stop.types[0].id !== 0) {
				$('#types .parameters input').not('#stype_0').prop('disabled', false);
				$('#other_stype').prop('checked', true);
				$('#types .parameter.sub label').removeClass('disabled');
			} else {
				$('#types .parameter.sub label').addClass('disabled');
				$('#types .parameter.sub input').prop('disabled', true);
			}
			$('#is_shelter').val(helpers.boolToString(stop.is_shelter, true));
			$('#is_bench').val(helpers.boolToString(stop.is_bench, true));
			$('#pan_link').val(helpers.valueNullToString(stop.panorama_link));
			this.validateLink();
			$('#auto_link').prop('href', this.getPanoramaAutoLink(stop.geom));
			$('#comment').val(helpers.valueNullToString(stop.comment));
			$('#is_check').val(stop.check_status_type_id);

			if (stop.is_help) {
				$('#is_help').val(1);
				$('#chb_is_help').prop('checked', true);
			} else {
				$('#is_help').val(0);
				$('#chb_is_help').prop('checked', false);
			}
		},

		getPanoramaAutoLink: function (stopGeom) {
			var coordinateCenter = stopGeom.lon + ',' + stopGeom.lat;
			// API from http://clubs.ya.ru/mapsapi/replies.xml?item_no=6331
			return 'http://maps.yandex.ru/?ll=' + coordinateCenter +
				'&spn=0.011795,0.004087&l=map,stv&ol=stv&oll=' + coordinateCenter +
				'&ost=dir:0,0~spn:90,73.739795';
		},

		fillRoutes: function (routes) {
			var helpers = $.sm.helpers,
				routes_sorted = routes.sort(helpers.sortByFields('route_type_id', 'name')),
				i = 0,
				routesCount= routes_sorted.length,
				routesEditable = {'ids' : {}, 'routes' : routes_sorted};

			for (i; i < routesCount; i += 1) {
				routesEditable.ids[routes_sorted[i].id] = true;
				$('#routes').addTag(routes_sorted[i].name, { 'css_class' : 'tag type-id-' + routes_sorted[i].route_type_id});
			}

			$.viewmodel.stopSelected['routes'] = routesEditable;
		},

		addRoute: function (id, name) {
			var vm = $.viewmodel,
				routeTypeId = vm.routeTypeSelected,
				routes = vm.stopSelected.routes;
			if (routes.ids[id]) {
				return false;
			} else {
				routes.ids[id] = true;
			}
			routes.routes.push({
				"route_type_id": routeTypeId,
				"id": id,
				"name": name
			});
			this.updateUIRoutes(routes.routes);
		},

		removeRoute: function (name) {
			var vm = $.viewmodel,
				routes = vm.stopSelected.routes,
				removedRoute,
				i = 0,
				routesCount = routes.routes.length;
			for (i; i < routesCount; i += 1) {
				if (routes.routes[i].name === name) {
					removedRoute = routes.routes[i];
					routes.ids[removedRoute.id] = false;
					routes.routes.splice(i, 1);
					break;
				}
			}
			this.updateUIRoutes(routes.routes);
		},

		updateUIRoutes: function (routes) {
			var i = 0,
				routesCount= routes.length;

			routes = routes.sort($.sm.helpers.sortByFields('route_type_id', 'name'));
			this.clearUIRoutes();

			for (i; i < routesCount; i += 1) {
				$('#routes').addTag(routes[i].name, { 'css_class' : 'tag type-id-' + routes[i].route_type_id});
			}
		},

		clearUIRoutes: function() {
			$('#routes').importTags('');
		},

		finishAjaxEdition: function () {
			var context = this;
			$.ajax({
				type: 'GET',
				url: document['url_root'] + 'stop/unblock/' + $.viewmodel.stopSelected.id
			}).done(function () {
					context.finishEditing();
				});
		},

		finishEditing: function () {
			var vd = $.view.$document,
				vm = $.viewmodel,
				v = $.view;
			vm.map.closePopup();
			vm.mapLayers['edit'].clearLayers();
			vm.editable = false;
			v.$body.addClass('editable');
			v.$editorContainer.find('input, textarea').val('');
			v.$editorContainer.find('input:checkbox').prop('checked', false);
			v.$editorContainer.find('input, select, textarea, button').attr('disabled', 'disabled');
			v.$editorContainer.find('form').addClass('disabled');
			$('#auto_link').prop('href', '');
			$('#routes').importTags('');
			$.view.$document.trigger('/sm/map/updateAllLayers');
		}
	});
})(jQuery);


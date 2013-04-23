(function ($) {
	$.extend($.viewmodel, {
		searcherCollapsed: false,
		filter: {'name' : ''},
		isFilterValidated: true
	});
	$.extend($.view, {
		$searchContainer: null,
		$filterName: null,
		$searchButton: null,
		$searchResults: null
	});
	$.sm.searcher = {};
	$.extend($.sm.searcher, {
		min_characters_name: 3,

		init: function () {
			this.setDomOptions();
			this.bindEvents();
		},

		bindEvents: function () {
			var context = this,
				v = $.view;
			v.$searchContainer.find('span.icon-collapse, div.title').off('click').on('click', function () {
				$.viewmodel.searcherCollapsed = !$.viewmodel.searcherCollapsed;
				$.view.$body.toggleClass('searcher-collapsed', context.searcherCollapsed);
			});
			v.$filterName.off('keyup').on('keyup', function (e) {
				context.keyUpHandler(e);
			});
			$('#filter_name').off('focus').on('focus', function () {
				$.view.$searchResults.prop('class', 'description');
			});
			$('#searchResults p.description').off('click').on('click', function () {
				$.view.$searchResults.prop('class', 'active');
			});
			v.$searchButton.off('click').on('click', function () {
				if ($.viewmodel.isFilterValidated) {
					context.applyFilter();
				}
			});
			v.$document.on('/sm/searcher/update', function () {
				context.updateSearch();
			});
			v.$document.on('/sm/stops/startUpdate', function () {
				var v = $.view;
				v.$searchResults.prop('class', 'update');
				v.$filterName.prop('disabled', true);
			});
			v.$document.on('/sm/stops/endUpdate', function () {
				var v = $.view;
				v.$searchResults.prop('class', 'active');
				v.$filterName.prop('disabled', false);
			});
		},

		setDomOptions: function () {
			var v = $.view;
			v.$searchContainer = $('#searchContainer');
			v.$filterName = $('#filter_name');
			v.$searchButton = $('#search');
			v.$searchResults = $('#searchResults');
		},

		keyUpHandler: function (e) {
			this.validateSearch();
			if (e.keyCode === 13) {
				this.applyFilter();
			}
		},

		validateSearch: function () {
			var min_characters_name = this.min_characters_name,
				v = $.view,
				vm = $.viewmodel,
				name = v.$filterName.val();

			if (name.length <= min_characters_name && name !== '') {
				v.$filterName.addClass('invalid');
			} else {
				v.$filterName.removeClass('invalid');
			}

			if (name.length > min_characters_name) {
				vm.isFilterValidated = true;
			} else {
				vm.isFilterValidated = false;
			}

			$.view.$searchButton.toggleClass('active', $.viewmodel.isFilterValidated);
		},

		applyFilter: function () {
			if ($.viewmodel.isFilterValidated) {
				this.updateFilter();
				this.search();
			}
		},

		updateFilter: function () {
			var $v = $.view,
				vm = $.viewmodel;
			vm.filter.name = $v.$filterName.val();
		},

		search: function () {
			$.view.$document.trigger('/sm/stops/updateStops');
		},

		updateSearch: function () {
			var stops = $.viewmodel.stops,
				$divSearchResults = $.view.$searchResults.find('div'),
				html;
			html = this.getHtmlForSearchResults('non_check', stops.non_block.non_check.elements)
			html += this.getHtmlForSearchResults('check', stops.non_block.check.elements)
			html += this.getHtmlForSearchResults('block', stops.block.elements)
			$divSearchResults.empty().append(html);
			$divSearchResults.find('a').on('click', function () {
				var $li = $(this).parent();
				$.viewmodel.map.setView(new L.LatLng($li.data('lat'), $li.data('lon')), 18);
				$('#target').show().delay(1000).fadeOut(1000);
			});
			$.view.$searchResults.prop('class', 'active');
//			$.view.$searchResults.addClass('active');
		},

		getHtmlForSearchResults: function (cssClass, stops) {
			return $.templates.searchResultsTemplate({
				cssClass: cssClass,
				stops: stops
			});
		}
	});
})(jQuery);


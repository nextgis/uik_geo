(function ($, UIK) {
	$.extend(UIK.viewmodel, {
		searcherCollapsed: false,
		filter: {'name' : ''},
		isFilterValidated: true
	});
	$.extend(UIK.view, {
		$searchContainer: null,
		$filterName: null,
		$searchButton: null,
		$searchResults: null
	});
	UIK.searcher = {};
	$.extend(UIK.searcher, {
		min_characters_name: 3,

		init: function () {
			this.setDomOptions();
			this.bindEvents();
		},

		bindEvents: function () {
			var context = this,
				v = UIK.view;
			v.$searchContainer.find('span.icon-collapse, div.title').off('click').on('click', function () {
				UIK.viewmodel.searcherCollapsed = !UIK.viewmodel.searcherCollapsed;
				UIK.view.$body.toggleClass('searcher-collapsed', context.searcherCollapsed);
			});
			v.$filterName.off('keyup').on('keyup', function (e) {
				context.keyUpHandler(e);
			});
			$('#filter_name').off('focus').on('focus', function () {
				UIK.view.$searchResults.prop('class', 'description');
			});
			$('#searchResults p.description').off('click').on('click', function () {
				UIK.view.$searchResults.prop('class', 'active');
			});
			v.$searchButton.off('click').on('click', function () {
				if (UIK.viewmodel.isFilterValidated) {
					context.applyFilter();
				}
			});
			v.$document.on('/sm/searcher/update', function () {
				context.updateSearch();
			});
			v.$document.on('/sm/stops/startUpdate', function () {
				var v = UIK.view;
				v.$searchResults.prop('class', 'update');
				v.$filterName.prop('disabled', true);
			});
			v.$document.on('/sm/stops/endUpdate', function () {
				var v = UIK.view;
				v.$searchResults.prop('class', 'active');
				v.$filterName.prop('disabled', false);
			});
		},

		setDomOptions: function () {
			var v = UIK.view;
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
				v = UIK.view,
				vm = UIK.viewmodel,
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

			UIK.view.$searchButton.toggleClass('active', UIK.viewmodel.isFilterValidated);
		},

		applyFilter: function () {
			if (UIK.viewmodel.isFilterValidated) {
				this.updateFilter();
				this.search();
			}
		},

		updateFilter: function () {
			var $v = UIK.view,
				vm = UIK.viewmodel;
			vm.filter.name = $v.$filterName.val();
		},

		search: function () {
			UIK.view.$document.trigger('/sm/stops/updateStops');
		},

		updateSearch: function () {
			var uiks = UIK.viewmodel.uiks,
				$divSearchResults = UIK.view.$searchResults.find('div'),
				html;
			html = this.getHtmlForSearchResults('non_check', uiks.elements);
			$divSearchResults.empty().append(html);
			$divSearchResults.find('a').on('click', function () {
				var $li = $(this).parent();
				UIK.viewmodel.map.setView(new L.LatLng($li.data('lat'), $li.data('lon')), 18);
				$('#target').show().delay(1000).fadeOut(1000);
			});
			UIK.view.$searchResults.prop('class', 'active');
		},

		getHtmlForSearchResults: function (cssClass, uiks) {
			return UIK.templates.searchResultsTemplate({
				cssClass: cssClass,
                uiks: uiks
			});
		}
	});
})(jQuery, UIK);


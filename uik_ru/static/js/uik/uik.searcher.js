(function ($, UIK) {
	$.extend(UIK.viewmodel, {
		searcherCollapsed: false,
		filter: {'name' : '', 'addr' : ''},
		isFilterValidated: true
	});
	$.extend(UIK.view, {
		$searchContainer: null,
		$filterName: null,
        $$filterAddr: null,
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

        setDomOptions: function () {
            var v = UIK.view;
            v.$searchContainer = $('#searchContainer');
            v.$filterName = $('#filter_name');
            v.$filterAddr = $('#filter_address');
            v.$searchButton = $('#search');
            v.$searchResults = $('#searchResults');
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
            v.$filterAddr.off('keyup').on('keyup', function (e) {
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
                v.$filterAddr.prop('disabled', true);
                context.validateSearch();
			});
			v.$document.on('/sm/stops/endUpdate', function () {
				var v = UIK.view;
				v.$searchResults.prop('class', 'active');
				v.$filterName.prop('disabled', false);
                v.$filterAddr.prop('disabled', false);
			});
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
                name = $.trim(v.$filterName.val()),
				addr = $.trim(v.$filterAddr.val()),
                isAddrValided = false;

            isAddrValided = addr.length > min_characters_name || addr === '';
            v.$filterAddr.toggleClass('invalid', !isAddrValided);

            if (!isAddrValided) {
                vm.filter.addr = '';
            }

            UIK.viewmodel.isFilterValidated = isAddrValided;
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
            vm.filter.addr = $v.$filterAddr.val();
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


(function ($, UIK) {
    $.extend(UIK.viewmodel, {
        searcherCollapsed: false,
        filter: {'name': '', 'addr': ''},
        isFilterValidated: true
    });
    $.extend(UIK.view, {
        $searchContainer: null,
        $filterName: null,
        $$filterAddr: null,
        $searchButton: null,
        $searchResults: null,
        $clearSearch: null
    });
    UIK.searcher = {};
    $.extend(UIK.searcher, {
        min_characters_name: 3,

        init: function () {
            this.setDomOptions();
            this.bindEvents();
        },

        setDomOptions: function () {
            var view = UIK.view;
            view.$searchContainer = $('#searchContainer');
            view.$filterName = $('#filter_name');
            view.$filterAddr = $('#filter_address');
            view.$searchButton = $('#search');
            view.$searchResults = $('#searchResults');
            view.$clearSearch = view.$searchContainer.find('a.clear-search');
        },

        bindEvents: function () {
            var context = this,
                view = UIK.view;

            view.$searchContainer.find('span.icon-collapse, div.title').off('click').on('click', function () {
                UIK.viewmodel.searcherCollapsed = !UIK.viewmodel.searcherCollapsed;
                UIK.view.$body.toggleClass('searcher-collapsed', context.searcherCollapsed);
            });

            UIK.view.$clearSearch.off('click').on('click', function () {
                if (!$(this).hasClass('disabled')) {
                    UIK.view.$searchContainer.find('input').val('');
                    context.applyFilter();
                }
            });

            view.$filterName.off('keyup').on('keyup', function (e) {
                context.keyUpHandler(e);
            });

            view.$filterAddr.off('keyup').on('keyup', function (e) {
                context.keyUpHandler(e);
            });

            $('#filter_name').off('focus').on('focus', function () {
                UIK.view.$searchResults.prop('class', 'description');
            });

            $('#searchResults p.description').off('click').on('click', function () {
                UIK.view.$searchResults.prop('class', 'active');
            });

            view.$searchButton.off('click').on('click', function () {
                if (UIK.viewmodel.isFilterValidated) {
                    context.applyFilter();
                }
            });

            view.$document.on('/sm/searcher/update', function () {
                context.updateSearch();
            });

            view.$document.on('/uik/uiks/startUpdate', function () {
                var v = UIK.view;
                v.$searchResults.prop('class', 'update');
                v.$filterName.prop('disabled', true);
                v.$filterAddr.prop('disabled', true);
                context.validateSearch();
            });

            view.$document.on('/sm/stops/endUpdate', function () {
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
                view = UIK.view,
                viewmodel = UIK.viewmodel,
                name = $.trim(view.$filterName.val()),
                addr = $.trim(view.$filterAddr.val()),
                isAddrValidated = addr.length > min_characters_name || addr === '';

            view.$filterAddr.toggleClass('invalid', !isAddrValidated);

            if (!isAddrValidated) {
                viewmodel.filter.addr = '';
            }

            viewmodel.isFilterValidated = isAddrValidated;
            view.$searchButton.toggleClass('active', UIK.viewmodel.isFilterValidated);
            view.$clearSearch.toggleClass('disabled', name === '' && addr === '');
        },

        applyFilter: function () {
            if (UIK.viewmodel.isFilterValidated) {
                this.updateFilter();
                this.search();
            }
        },

        updateFilter: function () {
            var view = UIK.view,
                viewmodel = UIK.viewmodel;
            viewmodel.filter.name = view.$filterName.val();
            viewmodel.filter.addr = view.$filterAddr.val();
        },

        search: function () {
            UIK.view.$document.trigger('/sm/stops/updateStops');
        },

        updateSearch: function () {
            var pointLayers = UIK.viewmodel.pointLayers,
                pointsConfig = UIK.config.data.points,
                pointsType,
                $divSearchResults = UIK.view.$searchResults.find('div'),
                html;

            $divSearchResults.empty();
            for (pointsType in pointLayers) {
                if (pointLayers.hasOwnProperty(pointsType)) {
                    html = this.getHtmlForSearchResults(pointsConfig[pointsType].searchCssClass,
                        pointLayers[pointsType].elements);
                    $divSearchResults.append(html);
                }
            }

            $divSearchResults.find('a.target').on('click', function () {
                var $li = $(this).parent();
                UIK.viewmodel.map.setView(new L.LatLng($li.data('lat'), $li.data('lon')), 18);
                $('#target').show().delay(1000).fadeOut(1000);
            });

            $divSearchResults.find('a.edit').on('click', function () {
                if (UIK.viewmodel.editable) { return false; }

                var $li = $(this).parent(), uikId;
                UIK.viewmodel.map.setView(new L.LatLng($li.data('lat'), $li.data('lon')), 18);
                $('#target').show().delay(1000).fadeOut(1000);
                uikId = $li.data('id');
                $.getJSON(document['url_root'] + 'uik/' + uikId, function (data) {
                    if (!UIK.viewmodel.editable) {
                        UIK.viewmodel.uikSelected = data;
                        UIK.view.$document.trigger('/uik/editor/startEdit');
                    }
                });
            });
            UIK.view.$searchResults.prop('class', 'active');
        },

        getHtmlForSearchResults: function (cssClass, uiks) {
            return UIK.templates.searchResultsTemplate({
                cssClass: cssClass,
                uiks: uiks,
                isAuth: UIK.viewmodel.isAuth
            });
        }
    });
})(jQuery, UIK);


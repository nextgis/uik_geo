(function ($, UIK) {
    $.extend(UIK.viewmodel, {

    });
    $.extend(UIK.view, {
        $activatedTab: null
    });

    UIK.searcher.tab = {};

    $.extend(UIK.searcher.tab, {


        init: function () {
            this.setDomOptions();
            this.bindEvents();
        },


        setDomOptions: function () {
            UIK.view.$activatedTab = UIK.view.$searchContainer.find('ul.nav li.active');
        },


        bindEvents: function () {
            var context = this,
                $tab;

            UIK.view.$searchContainer.find('ul.nav li').off('click').on('click', function (e) {
                $tab = $(this);
                if ($tab.data('id') !== UIK.view.$activatedTab.data('id')) {
                    context.activateTab($tab);
                }
            });
        },


        activateTab: function ($tab) {
            var view = UIK.view;
            view.$activatedTab.removeClass('active');
            view.$activatedTab = $tab.addClass('active');
            view.$searchContainer.attr('class', $tab.data('id'));
        }

    });
})(jQuery, UIK);


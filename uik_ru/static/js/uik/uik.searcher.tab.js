(function ($, UIK) {
    $.extend(UIK.viewmodel, {

    });
    $.extend(UIK.view, {

    });

    UIK.searcher.tab = {};

    $.extend(UIK.searcher.tab, {


        init: function () {
            this.bindEvents();
        },


        bindEvents: function () {
            UIK.view.$searchContainer.find('ul.nav a').off('click').on('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
            });
        }

    });
})(jQuery, UIK);


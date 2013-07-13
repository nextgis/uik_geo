(function ($, UIK) {

    $.extend(UIK.viewmodel, {

    });

    $.extend(UIK.view, {

    });

    UIK.josm = {};
    $.extend(UIK.josm, {

        init: function () {
            this.bindEvents();
        },

        bindEvents: function () {
            $('#josm-link-img').on('mouseover', function() {
                var bounds = UIK.viewmodel.map.getBounds();
                var link = ('http://127.0.0.1:8111/load_and_zoom?' + 
                        'left=' + bounds.getNorthWest().lng + 
                        '&top=' + bounds.getNorthWest().lat + 
                        '&right=' + bounds.getSouthEast().lng + 
                        '&bottom=' + bounds.getSouthEast().lat);
                $('#josm-link').attr('href', link);
            });
        },

        setDomOptions: function () {

        }
    });

})(jQuery, UIK);

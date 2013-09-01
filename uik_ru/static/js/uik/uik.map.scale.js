(function ($, UIK) {
    $.extend(UIK.viewmodel, {
        version: null
    });
    $.extend(UIK.view, {
        $scaleVilage: null,
        $scaleHamlet: null,
        $scaleBuilding: null
    });

    UIK.versions = {};
    $.extend(UIK.versions, {
        init: function () {
            this.setDomOptions();
            this.bindEvents();
        },


        setDomOptions: function () {
		        var view = UIK.view;
            var scalePanel = $('#scale-panel');
            view.$scaleVilage = scalePanel.find("a.vilage");
            view.$scaleHamlet = scalePanel.find("a.hamlet");
            view.$scaleBuilding = scalePanel.find("a.building");
            
        },


        bindEvents: function () {
            var view = UIK.view;
            
            view.$scaleVilage.off('click').on('click', function () {
                UIK.viewmodel.map.setView(UIK.viewmodel.map.getCenter(), 13);
            });
            view.$scaleHamlet.off('click').on('click', function () {
                UIK.viewmodel.map.setView(UIK.viewmodel.map.getCenter(), 15);
            });
            view.$scaleBuilding.off('click').on('click', function () {
                UIK.viewmodel.map.setView(UIK.viewmodel.map.getCenter(), 17);
            });

        }
    });
})(jQuery, UIK);
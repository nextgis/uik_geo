(function ($, UIK) {
    UIK.popup = {};
    $.extend(UIK.popup, {
        $popup: null,
        $header: null,
        $content: null,

        init: function () {
            this.setDomOptions();
            this.bindEvents();
        },


        setDomOptions: function () {
            this.$popup = $('#popup');
            this.$header = this.$popup.find('div.header');
            this.$content = this.$popup.find('div.content');
        },


        bindEvents: function () {
            var context = this;
            UIK.view.$document.on('/uik/common/openPopup', function (e, header, contentPopup) {
                context.openPopup(header, contentPopup);
            });
            this.$popup.find('a.close').off('click').on('click', function () {
                UIK.view.$body.removeClass('popup');
            });
        },


        openPopup: function (header, content) {
            var $popup = this.$popup,
                marginLeft, marginTop;
            this.$header.text(header);
            this.$content.html(content);
            marginLeft = $popup.width() / 2;
            marginTop = $popup.height() / 2;
            $popup.css({
                'margin-left' : -marginLeft + 'px',
                'margin-top' :  -marginTop  + 'px'
            });
            UIK.view.$body.addClass('popup');
        }
    });
})(jQuery, UIK);

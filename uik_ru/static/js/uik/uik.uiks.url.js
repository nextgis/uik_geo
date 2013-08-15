(function ($, UIK) {

    $.extend(UIK.viewmodel, {
    });

    $.extend(UIK.view, {
    });

    $.extend(UIK.uiks, {

        handleUrl: function () {
            var uikFromUrl = this.getUikFromUrl();

            if (uikFromUrl) {
                $.when(this.getAjaxUik(uikFromUrl)).then(function (uik) {

                });
            }
        },


        getUikFromUrl: function () {
            var helpers = UIK.helpers,
                uikOfficialNumber = helpers.getURLParameter('uik'),
                regionCode = helpers.getURLParameter('reg'),
                editable = helpers.getURLParameter('edit');

            if (uikOfficialNumber !== 'null' && regionCode !== 'null') {
                return {
                    'uikOfficialNumber': uikOfficialNumber,
                    'regionCode': regionCode,
                    'editable': editable === 'True' || editable === 'true'
                };
            }

            return null;
        },


        getAjaxUik: function (uikFromUrl) {
            return $.getJSON(document.url_root + 'uik/' + uikFromUrl.regionCode + '/' + uikFromUrl.uikOfficialNumber);
        }
    });
})(jQuery, UIK);
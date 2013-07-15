(function ($, UIK) {
    $.extend(UIK.viewmodel, {
        version: null
    });
    $.extend(UIK.view, {
        $document: null
    });

    UIK.uiks.versions = {};
    $.extend(UIK.uiks.versions, {
        init: function () {
            this.setDomOptions();
        },

        showVersions: function () {
            var $divVersions = $('#versionsUIK');

            $divVersions.empty();

            if (typeof UIK.viewmodel.uikSelected.versions == 'object' && UIK.viewmodel.uikSelected.versions.length > 0) {
                for (var version_id in UIK.viewmodel.uikSelected.versions) {
                    var version = UIK.viewmodel.uikSelected.versions[version_id];
                    var html = UIK.templates.versionsTemplate({
                        num: +version_id + 1,
                        name: version.display_name,
                        time: version.time
                    });
                    $divVersions.append(html);
                }
            } else {
                $divVersions.append('У этого УИКа нет сохраненных версий');
            }
        }
    });
})(jQuery, UIK);
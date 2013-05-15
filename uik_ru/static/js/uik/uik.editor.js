(function ($, UIK) {
    $.extend(UIK.viewmodel, {
        editorCollapsed: false,
        editable: false,
        routeTypeSelected: null
    });

    $.extend(UIK.view, {
        $editorContainer: null
    });

    UIK.editor = {};
    $.extend(UIK.editor, {
        regex: { url: new RegExp("(https?)://[-A-Za-z0-9+&@#/%?=~_|!:,.;]*[-A-Za-z0-9+&@#/%=~_|]") },

        init: function () {
            this.setDomOptions();
            this.buildEditLayer();
            this.bindEvents();
        },

        bindEvents: function () {
            var context = this;
            UIK.view.$editorContainer.find('span.icon-collapse, div.title').off('click').on('click', function () {
                context.toggleEditor();
            });

            UIK.view.$document.on('/sm/editor/startEdit', function (e) {
                context.startAjaxEdition();
            });

            $('#save').off('click').on('click', function (e) {
                e.stopPropagation();
                context.save();
            });

            $('#discard').off('click').on('click', function (e) {
                e.stopPropagation();
                context.finishAjaxEdition();
            });

            $('#editorForm').find(':checkbox').off('click').on('click', function () {
                var checkbox = $(this),
                    hidden = $('#' + checkbox.data('id'));
                if (checkbox.is(':checked')) {
                    hidden.val(1);
                } else {
                    hidden.val(0);
                }
            });
        },

        toggleEditor: function () {
            var editorCollapsed = !UIK.viewmodel.editorCollapsed;
            UIK.viewmodel.editorCollapsed = editorCollapsed;
            UIK.view.$body.toggleClass('editor-collapsed', editorCollapsed);
        },

        setDomOptions: function () {
            UIK.view.$editorContainer = $('#editorContainer');
        },

        buildEditLayer: function () {
            var editedLayer = L.layerGroup();
            UIK.viewmodel.mapLayers['edit'] = UIK.viewmodel.map.addLayer(editedLayer);
        },

        save: function () {
            var context = this,
                frm = $('#editorContainer form'),
                data_serialized = frm.serializeArray(),
                i = 0,
                ds_length = data_serialized.length,
                uik_selected = UIK.viewmodel.uikSelected,
                url = document['url_root'] + 'uik/' + uik_selected.id,
                saved_uik = { 'id': uik_selected.id };
            for (i; i < ds_length; i += 1) {
                saved_uik[data_serialized[i].name] = data_serialized[i].value;
            }
            saved_uik['geom'] = uik_selected.geom;
            $.ajax({
                type: 'POST',
                url: url,
                data: { 'uik': JSON.stringify(saved_uik)}
            }).done(function () {
                UIK.alerts.showAlert('saveSuccessful');
                context.finishEditing();
            }).error(function () {
                UIK.alerts.showAlert('saveError');
            });
        },

        startAjaxEdition: function () {
            var context = this;
            $.ajax({
                type: 'GET',
                url: document['url_root'] + 'uik/block/' + UIK.viewmodel.uikSelected.id
            }).done(function () {
                    context.startEdit();
                });
        },

        startEdit: function () {
            var icon = UIK.helpers.getIcon('stop-editable', 25),
                viewmodel = UIK.viewmodel,
                view = UIK.view,
                marker;
            view.$body.addClass('editable');
            if (viewmodel.editorCollapsed) { this.toggleEditor(); }
            view.$editorContainer.find('input, select, textarea, button').removeAttr('disabled');
            view.$editorContainer.find('form').removeClass('disabled');
            viewmodel.editable = true;
            marker = L.marker([viewmodel.uikSelected.geom.lat, viewmodel.uikSelected.geom.lon], {icon: icon, draggable: true});
            marker.on('dragend', function (e) {
                var latLon = e.target.getLatLng();
                UIK.viewmodel.uikSelected.geom.lat = latLon.lat;
                $('#lat').val(latLon.lat);
                UIK.viewmodel.uikSelected.geom.lon = latLon.lng;
                $('#lon').val(latLon.lng);
            });
            viewmodel.mapLayers['edit'].addLayer(marker);
            this.fillEditor(viewmodel.uikSelected);
            viewmodel.map.closePopup();
        },

        fillEditor: function (uik) {
            var helpers = UIK.helpers;
            $('#name').val(uik.name);
            $('#id').val(uik.id).attr('disabled', 'disabled');
            $('#lat').val(uik.geom.lat);
            $('#lon').val(uik.geom.lon);
            $('#address').val(helpers.valueNullToString(uik.address));
            $('#comment').val(helpers.valueNullToString(uik.comment));
            if (uik.is_checked) {
                $('#is_checked').val(1);
                $('#chb_is_checked').prop('checked', true);
            } else {
                $('#is_checked').val(0);
                $('#chb_is_checked').prop('checked', false);
            }
        },

        finishAjaxEdition: function () {
            var context = this;
            $.ajax({
                type: 'GET',
                url: document['url_root'] + 'uik/unblock/' + UIK.viewmodel.uikSelected.id
            }).done(function () {
                context.finishEditing();
            });
        },

        finishEditing: function () {
            var vm = UIK.viewmodel,
                v = UIK.view;
            vm.map.closePopup();
            vm.mapLayers['edit'].clearLayers();
            vm.editable = false;
            v.$body.addClass('editable');
            v.$editorContainer.find('input, textarea').val('');
            v.$editorContainer.find('input:checkbox').prop('checked', false);
            v.$editorContainer.find('input, select, textarea, button').attr('disabled', 'disabled');
            v.$editorContainer.find('form').addClass('disabled');
            UIK.view.$document.trigger('/sm/map/updateAllLayers');
        }
    });
})(jQuery, UIK);


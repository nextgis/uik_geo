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
                UIK.viewmodel.editorCollapsed = !UIK.viewmodel.editorCollapsed;
                UIK.view.$body.toggleClass('editor-collapsed', context.editorCollapsed);
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
                stop_selected = UIK.viewmodel.stopSelected,
                url = document['url_root'] + 'uik/' + stop_selected.id,
                stop = { 'id': stop_selected.id },
                name;
            for (i; i < ds_length; i += 1) {
                name = data_serialized[i].name;
                switch (name) {
                    case name === 'lon':
                        stop['geom']['lon'] = data_serialized[i].value;
                        break;
                    case name === 'lat':
                        stop['geom']['lat'] = data_serialized[i].value;
                        break;
                    default:
                        stop[data_serialized[i].name] = data_serialized[i].value;
                        break;
                }
            }
            $.ajax({
                type: 'POST',
                url: url,
                data: { 'stop': JSON.stringify(stop)}
            }).done(function () {
                context.finishAjaxEdition();
            });
        },

        startAjaxEdition: function () {
            var context = this;
            $.ajax({
                type: 'GET',
                url: document['url_root'] + 'uik/block/' + UIK.viewmodel.stopSelected.id
            }).done(function () {
                    context.startEdit();
                });
        },

        startEdit: function () {
            var icon = UIK.helpers.getIcon('stop-editable', 25),
                vm = UIK.viewmodel,
                v = UIK.view,
                marker;
            v.$body.addClass('editable');
            v.$editorContainer.find('input, select, textarea, button').removeAttr('disabled');
            v.$editorContainer.find('form').removeClass('disabled');
            vm.editable = true;
            marker = L.marker([vm.stopSelected.geom.lat, vm.stopSelected.geom.lon], {icon: icon, draggable: true});
            marker.on('dragend', function (e) {
                var latLon = e.target.getLatLng();
                $('#lat').val(latLon.lat);
                $('#lon').val(latLon.lng);
            });
            vm.mapLayers['edit'].addLayer(marker);
            this.fillEditor(vm.stopSelected);
            vm.map.closePopup();
        },

        fillEditor: function (stop) {
            var helpers = UIK.helpers;
            $('#name').val(stop.name);
            $('#id').val(stop.id).attr('disabled', 'disabled');
            $('#lat').val(stop.geom.lat);
            $('#lon').val(stop.geom.lon);
            $('#comment').val(helpers.valueNullToString(stop.comment));
            $('#is_check').val(stop.check_status_type_id);
        },

        finishAjaxEdition: function () {
            var context = this;
            $.ajax({
                type: 'GET',
                url: document['url_root'] + 'uik/unblock/' + UIK.viewmodel.stopSelected.id
            }).done(function () {
                    context.finishEditing();
                });
        },

        finishEditing: function () {
            var vd = UIK.view.$document,
                vm = UIK.viewmodel,
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


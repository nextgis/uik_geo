(function ($, UIK) {
    $.extend(UIK.viewmodel, {
        editorCollapsed: false,
        editable: false,
        latlngEditable: {
            lat: {validated: null, marker: null, editor: null},
            lng: {validated: null, marker: null, editor: null},
            isNeedApplied: false,
            sourceCoordinates: null
        },
        markerEditable: null
    });

    $.extend(UIK.view, {
        $editorContainer: null
    });

    UIK.editor = {};
    $.extend(UIK.editor, {
        regex: { url: new RegExp("(https?)://[-A-Za-z0-9+&@#/%?=~_|!:,.;]*[-A-Za-z0-9+&@#/%=~_|]") },
        precisionDegree: 6,

        init: function () {
            this.setDomOptions();
            this.buildEditLayer();
            this.bindEvents();
        },

        setDomOptions: function () {
            UIK.view.$editorContainer = $('#editorContainer');
            UIK.viewmodel.editorCollapsed = UIK.view.$body.hasClass('editor-collapsed');
        },

        buildEditLayer: function () {
            var editedLayer = L.layerGroup();
            UIK.viewmodel.mapLayers['edit'] = editedLayer;
            UIK.viewmodel.map.addLayer(editedLayer);
        },

        bindEvents: function () {
            var context = this;
            UIK.view.$editorContainer.find('span.icon-collapse, div.title').off('click').on('click', function () {
                context.toggleEditor();
            });

            UIK.view.$document.on('/uik/editor/startEdit', function (e) {
                context.startAjaxEdition();
            });

            $('#save').off('click').on('click', function (e) {
                e.stopPropagation();
                context.save();
            });

            $('#discard').off('click').on('click', function (e) {
                var viewmodel = UIK.viewmodel;
                e.stopPropagation();
                if (!viewmodel.latlngEditable.sourceCoordinates.equals(viewmodel.markerEditable.getLatLng())) {
                    viewmodel.map.setView(viewmodel.latlngEditable.sourceCoordinates, 18);
                    $('#target').show().delay(1000).fadeOut(1000);
                }
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

            $('#lat, #lng').off('keyup').on('keyup', function (e) {
                context.coordinatesInputHandler(e, $(this));
            });

            $('#applyCoordinates').off('click').on('click', function () {
                context.applyCoordinates(UIK.viewmodel.latlngEditable);
            });

            $('#undoCoordinates').off('click').on('click', function () {
                context.undoCoordinates();
            });

            $('#resetCenter').off('click').on('click', function () {
                context.resetCenter();
            });


        },

        toggleEditor: function () {
            var editorCollapsed = !UIK.viewmodel.editorCollapsed;
            UIK.viewmodel.editorCollapsed = editorCollapsed;
            UIK.view.$body.toggleClass('editor-collapsed', editorCollapsed);
        },

        coordinatesInputHandler: function (e, $this) {
            var id = $this.attr('id'),
                value = $this.val(),
                latlngEditable = UIK.viewmodel.latlngEditable,
                currentCoordinateState = latlngEditable[id],
                preValidated = currentCoordinateState.validated,
                preDiffCoordinateState = currentCoordinateState.editor !== currentCoordinateState.marker,
                preIsCanApplied = latlngEditable.isNeedApplied;
            if (e.keyCode === 13) {
                if (latlngEditable.isNeedApplied) { this.applyCoordinates(latlngEditable); }
            } else {
                currentCoordinateState.validated = this.verifyDecimalDegree(value);
                if (currentCoordinateState.validated) {
                    value = parseFloat(value.replace(",", ".")).toFixed(this.precisionDegree);
                    currentCoordinateState.editor = value;
                } else {
                    UIK.alerts.showAlert('validateCoordinatesError');
                }
                latlngEditable.isNeedApplied = this.getIsCanApplied(latlngEditable);
                if (preIsCanApplied !== latlngEditable.isNeedApplied) {
                    $('#applyCoordinates').prop('disabled', !latlngEditable.isNeedApplied);
                }
                if (latlngEditable.isNeedApplied) {
                    UIK.alerts.showAlert('changeCoordinates');
                }
                if (preValidated !== currentCoordinateState.validated) {
                    $this.toggleClass('invalid', !currentCoordinateState.validated);
                } else if (preDiffCoordinateState !== (currentCoordinateState.editor !== currentCoordinateState.marker)) {
                    $this.toggleClass('need-apply', currentCoordinateState.editor !== currentCoordinateState.marker);
                }
            }
        },

        getIsCanApplied: function (latLngEditable) {
            if (!latLngEditable.lat.validated || !latLngEditable.lng.validated) {
                return false;
            }
            return latLngEditable.lat.editor !== latLngEditable.lat.marker ||
                latLngEditable.lng.editor !== latLngEditable.lng.marker;
        },

        verifyDecimalDegree: function (value) {
            return !/^\s*$/.test(value) && !isNaN(value);
        },

        applyCoordinates: function (latLngEditable) {
            var viewmodel = UIK.viewmodel,
                latlng = new L.LatLng(parseFloat(latLngEditable.lat.editor), parseFloat(latLngEditable.lng.editor));

            this.updateCoordinates(latlng);
            viewmodel.markerEditable.setLatLng(latlng);
            viewmodel.map.setView(latlng, 18);
            $('#target').show().delay(1000).fadeOut(1000);
            $('#lat, #lng').removeClass('need-apply');
            
            $('#undoCoordinates').prop('disabled', false);
        },

        undoCoordinates: function () {
            var viewmodel = UIK.viewmodel,
                latlng = new L.LatLng(viewmodel.uikSelected.uik.old_geom.lat, viewmodel.uikSelected.uik.old_geom.lng);

            this.updateCoordinates(latlng);
            viewmodel.markerEditable.setLatLng(latlng);
            viewmodel.map.setView(latlng, viewmodel.map.getZoom());

            $('#undoCoordinates').prop('disabled', true);
        },

        resetCenter: function () {
            var newCenter = UIK.viewmodel.map.getCenter();

            this.updateCoordinates(newCenter);
            UIK.viewmodel.markerEditable.setLatLng(newCenter);

            $('#undoCoordinates').prop('disabled', false);
        },

        startAjaxEdition: function () {
            var context = this;
            $.ajax({
                type: 'GET',
                url: document['url_root'] + 'uik/block/' + UIK.viewmodel.uikSelected.uik.id
            }).done(function () {
                context.startEdit();
            });
        },

        startEdit: function () {
            var viewmodel = UIK.viewmodel,
                view = UIK.view;
            view.$body.addClass('editable');
            if (viewmodel.editorCollapsed) { this.toggleEditor(); }
            view.$editorContainer.find('input, select, textarea, button').removeAttr('disabled');
            view.$editorContainer.find('form').removeClass('disabled');
            viewmodel.editable = true;
            this.startEditingGeometry(viewmodel.uikSelected.uik.geom.lat, viewmodel.uikSelected.uik.geom.lng);
            this.fillEditor(viewmodel.uikSelected);
            viewmodel.uikSelected.uik.old_geom = jQuery.extend({}, viewmodel.uikSelected.uik.geom);
            UIK.uiks.versions.showVersions();
            viewmodel.map.closePopup();
            $('#editUIK-link').click();
        },

        startEditingGeometry: function (lat, lng) {
            var context = this,
                marker = L.marker([lat, lng], {
                    icon: UIK.helpers.getIcon('stop-editable', 25),
                    draggable: true
                }),
                stringLat = lat.toFixed(this.precisionDegree),
                stringLng = lng.toFixed(this.precisionDegree);

            marker.on('dragend', function (e) {
                context.updateCoordinates(e.target.getLatLng());
                $('#undoCoordinates').prop('disabled', false);
            });
            UIK.viewmodel.mapLayers['edit'].addLayer(marker);

            $('#applyCoordinates').prop('disabled', true);
            $('#undoCoordinates').prop('disabled', true);

            UIK.viewmodel.latlngEditable = {
                lat: {validated: true, marker: stringLat, editor: stringLat},
                lng: {validated: true, marker: stringLng, editor: stringLng},
                isNeedApplied: false,
                sourceCoordinates: new L.LatLng(lat, lng)
            };
            UIK.viewmodel.markerEditable = marker;
        },

        updateCoordinates: function (latLng) {
            var lat = latLng.lat.toFixed(this.precisionDegree),
                lng = latLng.lng.toFixed(this.precisionDegree),
                viewmodel = UIK.viewmodel,
                isNeedApplied = viewmodel.latlngEditable.isNeedApplied,
                sourceCoordinates = viewmodel.latlngEditable.sourceCoordinates;

            viewmodel.uikSelected.uik.geom.lat = latLng.lat;
            viewmodel.uikSelected.uik.geom.lng = latLng.lng;

            if (isNeedApplied) { $('#applyCoordinates').prop('disabled', true); }

            viewmodel.latlngEditable = {
                lat: {validated: true, marker: lat, editor: lat},
                lng: {validated: true, marker: lng, editor: lng},
                isNeedApplied: false,
                sourceCoordinates: sourceCoordinates
            };

            $('#lat').val(lat);
            $('#lng').val(lng);
        },

        fillEditor: function (uik) {
            var helpers = UIK.helpers;
            $('#id').val(uik.uik.id).attr('disabled', 'disabled');
            $('#name').val(uik.uik.number_official).attr('disabled', 'disabled');
            $('#region').val(uik.region.name).attr('disabled', 'disabled');
            $('#tik').val(uik.tik.name).attr('disabled', 'disabled');
            $('#address_voting').val(helpers.valueNullToString(uik.uik.address_voting));
            $('#place_voting').val(helpers.valueNullToString(uik.uik.place_voting));
            $('#geo_precision option:eq(' + uik.geo_precision.id + ')').prop('selected', true);
            $('#lat').val(uik.uik.geom.lat.toFixed(this.precisionDegree));
            $('#lng').val(uik.uik.geom.lng.toFixed(this.precisionDegree));
            $('#comment').val(helpers.valueNullToString(uik.uik.comment));
            if (uik.uik.is_applied) {
                $('#is_applied').val(1);
                $('#chb_is_applied').prop('checked', true);
            } else {
                $('#is_applied').val(0);
                $('#chb_is_applied').prop('checked', false);
            }
        },

        save: function () {
            if (!this.verifyEditor()) {
                return;
            }
            var context = this,
                frm = $('#editorContainer form'),
                data_serialized = frm.serializeArray(),
                data_serialized_length = data_serialized.length,
                uik_selected = UIK.viewmodel.uikSelected,
                saved_uik = { 'id': uik_selected.uik.id },
                url = document['url_root'] + 'uik/' + saved_uik.id,
                i = 0;

            for (i; i < data_serialized_length; i += 1) {
                saved_uik[data_serialized[i].name] = data_serialized[i].value;
            }

            saved_uik.geom = uik_selected.uik.geom;

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

        verifyEditor: function () {
            var verificated = true,
                latLngEditable = UIK.viewmodel.latlngEditable;
            if (latLngEditable.isNeedApplied) {
                verificated = false;
                UIK.alerts.showAlert('notAppliedCoordinates');
            }
            if (!latLngEditable.lat.validated || !latLngEditable.lng.validated) {
                verificated = false;
                UIK.alerts.showAlert('validateCoordinatesError');
            }
            return verificated;
        },

        finishAjaxEdition: function () {
            var context = this;
            $.ajax({
                type: 'GET',
                url: document['url_root'] + 'uik/unblock/' + UIK.viewmodel.uikSelected.uik.id
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
            v.$editorContainer.find('input, select, textarea, button').attr('disabled', 'disabled').removeClass('invalid');
            v.$editorContainer.find('form').addClass('disabled');
            UIK.view.$document.trigger('/uik/map/updateAllLayers');
        }
    });
})(jQuery, UIK);


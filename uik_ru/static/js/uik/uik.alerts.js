(function ($, UIK) {
    UIK.alerts = {};

    $.extend(UIK.view, {
        $alerts: null
    });

    $.extend(UIK.viewmodel, {
        alerts: {}
    });

    $.extend(UIK.alerts, {

        alerts: {
            'zoom' : {
                id: 'zoom',
                type: 'alert',
                text: 'Увеличьте масштаб для отображения УИКов',
                statusText: 'Мелкий масштаб!'
            },
            'saveSuccessful' : {
                id: 'saveSuccessful',
                type: 'info',
                text: 'УИК был успешно обновлен',
                statusText: ''
            },
            saveError: {
                id: 'saveError',
                type: 'error',
                text: 'УИК не был обновлен - произошла ошибка.',
                statusText: 'Ошибка!'
            }
        },

        init: function () {
            UIK.view.$alerts = $('#alerts');
        },


        showAlert: function (alert) {
            if (!this.alerts[alert] || UIK.viewmodel.alerts[alert]) { return false; }
            UIK.viewmodel.alerts[alert] = true;
            var html = UIK.templates.alertsTemplate(this.alerts[alert]);
            UIK.view.$alerts.append(html);
            $('#alert_' + this.alerts[alert].id).fadeIn().delay(2000).fadeOut('slow', function () {
                $(this).remove();
                UIK.viewmodel.alerts[alert] = false;
            });
        }
    });
})(jQuery, UIK);
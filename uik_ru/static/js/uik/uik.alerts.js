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
            historyShortcuts : {
                id: 'historyShortcuts',
                type: 'info',
                text: 'Используйте клавиши p и n при работе с картой',
                statusText: 'Можно перемещаться по истории экранов.'
            },
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
            },
            changeCoordinates: {
                id: 'coodrinateChanged',
                type: 'info',
                text: 'После изменения координаты должны быть применены.',
                statusText: 'Внимание! '
            },
            notAppliedCoordinates: {
                id: 'notAppliedCoordinates',
                type: 'error',
                text: 'Вы не применили координаты к редактируемому УИКу. ',
                statusText: 'Ошибка сохранения:'
            },
            validateCoordinatesError: {
                id: 'valCoordError',
                type: 'error',
                text: 'Десятичные градусы должны быть введены как 58.00000',
                statusText: 'Неправильный формат ввода координат:'
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
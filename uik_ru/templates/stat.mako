<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/html" xmlns="http://www.w3.org/1999/html">
<head>
    <meta charset="utf-8">
    <title>Статистика</title>
    <meta name="description" content="участковая избирательная комиссия выборы адрес">
    <meta name="viewport" content="width=device-width">

    <link rel="stylesheet" href="${request.static_url('uik_ru:static/css/bootstrap.min.css')}">
    <link rel="stylesheet" href="http://code.jquery.com/ui/1.10.3/themes/smoothness/jquery-ui.css">
    <link rel="stylesheet" href="${request.static_url('uik_ru:static/css/stat.css')}">
    <link rel="stylesheet" href="${request.static_url('uik_ru:static/frameworks/jtable.2.3.0/themes/lightcolor/gray/jtable.css')}">

    <script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
    <script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jqueryui/1.10.3/jquery-ui.min.js"></script>
    <script type="text/javascript" src="${request.static_url('uik_ru:static/frameworks/jtable.2.3.0/jquery.jtable.js')}"></script>

    <script type="text/javascript">

        $(document).ready(function () {

            $('#UiksTableContainer').jtable({
                title: 'Список УИКов',
                paging: true,
                sorting: true,
                pageSize: 20,
                defaultSorting: 'Name ASC',
                actions: {
                    listAction: '/uik/stat/json'
                },
                fields: {
                    number_official: {
                        title: 'Номер',
                        width: '4%'
                    },
                    tik: {
                        title: 'ТИК',
                        width: '5%'
                    },
                    region: {
                        title: 'Регион',
                        width: '5%'
                    },
                    geocoding_precision: {
                        title: 'Точность геокодирования',
                        width: '5%'
                    },
                    is_applied: {
                        title: 'Проверен'
                    }
                }
            });

            $('#LoadRecordsButton').click(function (e) {
                e.preventDefault();
                $('#UiksTableContainer').jtable('load', {
                    name: $('#name').val(),
                    cityId: $('#cityId').val()
                });
            });

            $('#LoadRecordsButton').click();
        });
    </script>
</head>
<body style="margin: 10px;">
<div class="filtering">
    <form>
<div class="width_5per">
    <label class="control-label" for="number_official">Номер</label>
    <input type="text" name="number_official" id="number_official" />
</div>


        ТИК:
        <select id="tik" name="tik">
            <option selected="selected" value="">Любой</option>
            % for tik in tiks:
                    <option value="${tik.id}">${tik.name}</option>
            % endfor
        </select>

        Регион:
        <select id="region" name="region">
            <option selected="selected" value="">Любой</option>
            % for region in regions:
                    <option value="${region.id}">${region.name}</option>
            % endfor
        </select>

        Точность геокодирования:
        <select id="geocoding_precision" name="geocoding_precision">
            <option selected="selected" value="">Любая</option>
            % for geocoding_precision in geocoding_precisions:
                    <option value="${geocoding_precision.id}">${geocoding_precision.name_ru}</option>
            % endfor
        </select>

        УИК принят:
        <select id="is_applied" name="is_applied">
            <option selected="selected" value="">Не важно</option>
            <option value="True">Да</option>
            <option value="False">Нет</option>
        </select>

        <button class="btn btn-primary" type="submit" id="LoadRecordsButton">Загрузить</button>
    </form>
</div>

<div id="UiksTableContainer" style="margin: auto;"></div>
</body>
</html>
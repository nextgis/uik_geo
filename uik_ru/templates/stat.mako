<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/html" xmlns="http://www.w3.org/1999/html">
<head>
    <meta charset="utf-8">
    <title>Регистрация</title>
    <meta name="description" content="участковая избирательная комиссия выборы адрес">
    <meta name="viewport" content="width=device-width">

    <link rel="stylesheet" href="${request.static_url('uik_ru:static/css/bootstrap.min.css')}">
    <link rel="stylesheet" href="${request.static_url('uik_ru:static/frameworks/jtable.2.3.0/themes/metro/jtable_metro_base.min.css')}">

    <script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js"></script>
    <script type="text/javascript" src="${request.static_url('uik_ru:static/frameworks/jtable.2.3.0/jquery.jtable.min.js')}"></script>

    <script type="text/javascript">

        $(document).ready(function () {

            $('#UiksTableContainer').jtable({
                title: 'Список УИКов',
                paging: true,
                sorting: true,
                defaultSorting: 'Name ASC',
                actions: {
                    listAction: '/Demo/StudentListByFiter'
                },
                fields: {
                    ID: {
                        key: true,
                        create: false,
                        edit: false,
                        list: false
                    },
                    Name: {
                        title: 'Номер',
                        width: '23%'
                    },
                    tik: {
                        title: 'ТИК',
                        list: false
                    },
                    region: {
                        title: 'Регион',
                        list: false
                    },
                    geocoding_precision: {
                        title: 'Точность геокод',
                        width: '13%'
                    },
                    is_applied: {
                        title: 'City',
                        width: '12%'
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
        ID: <input type="text" name="id" id="id" />

        Номер: <input type="text" name="number_official" id="number_official" />

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

        <button type="submit" id="LoadRecordsButton">Загрузить</button>
    </form>
</div>

<div id="UiksTableContainer"></div>
</body>
</html>
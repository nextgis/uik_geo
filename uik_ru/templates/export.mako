<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/html" xmlns="http://www.w3.org/1999/html">
<head>
    <meta charset="utf-8">
    <title>Экспорт данных</title>
    <meta name="description" content="участковая избирательная комиссия выборы адрес">
    <meta name="viewport" content="width=device-width">

    <link rel="stylesheet" href="${request.static_url('uik_ru:static/css/bootstrap.min.css')}">

    <script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>


    <script type="text/javascript">
        $(document).ready(function () {
        });
    </script>
</head>
<body style="margin: 10px;">
<h2>Выгрузки по регионам</h2>
<table class="table table-striped">
    <thead>
    <tr>
        <th>Код</th>
        <th>Регион</th>
        <th>.csv</th>
##        <th>.shp</th>
    </tr>
    </thead>
    <tbody>
            % for region in regions:
                % if region['imported'] == True:
                    <tr>
                        <td>${region['id']}</td>
                        <td>${region['name']}</td>
                        <td><a href="/export/uiks/csv/${region['id']}">${region['id']}.csv.zip</a></td>
##                        <td><a href="/export/${region['id']}.shp.zip/">${region['id']}.shp.zip</a></td>
                    </tr>
                % endif
            % endfor
    </tbody>
</table>
</body>
</html>
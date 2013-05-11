<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/html" xmlns="http://www.w3.org/1999/html">
<head>
    <meta charset="utf-8">
    <title>Отметь свой УИК</title>
    <meta name="description" content="участковая избирательная комиссия выборы адрес">
    <meta name="viewport" content="width=device-width">

    	<link rel="stylesheet" href="${request.static_url('uik_ru:static/css/bootstrap.min.css')}">
    	<link rel="stylesheet" href="${request.static_url('uik_ru:static/css/main.css')}">
##    	<link rel="stylesheet" href="${request.static_url('uik_ru:static/build/uik.min.css')}" />
    <link rel="stylesheet" href="http://cdn.leafletjs.com/leaflet-0.5/leaflet.css"/>
    <!--[if lte IE 8]>
    <link rel="stylesheet" href="http://cdn.leafletjs.com/leaflet-0.5/leaflet.ie.css"/>
    <![endif]-->

    	<link rel="stylesheet" href="${request.static_url('uik_ru:static/js/Leaflet.markercluster/MarkerCluster.css')}" />

    	<link rel="stylesheet" href="${request.static_url('uik_ru:static/js/Leaflet.markercluster/MarkerCluster.Default.css')}" />
    	<!--[if lte IE 8]><!--<link rel="stylesheet" href="${request.static_url('uik_ru:static/js/Leaflet.markercluster/MarkerCluster.Default.ie.css')}" />--><![endif]-->

    <script type="text/javascript">
        document['url_root'] = '${request.route_url('home')}';
    </script>
    <script type="text/javascript" src="http://cdnjs.cloudflare.com/ajax/libs/mustache.js/0.7.0/mustache.min.js"></script>
    <script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js"></script>
    <script type="text/javascript" src="http://cdn.leafletjs.com/leaflet-0.5/leaflet.js"></script>
    <script src="${request.static_url('uik_ru:static/js/Leaflet.markercluster/leaflet.markercluster-src.js')}"></script>

    <script type="text/javascript" src="${request.static_url('uik_ru:static/js/jquery/jquery.cookie.js')}"></script>
##    <script type="text/javascript" src="${request.static_url('uik_ru:static/build/sm.min.js')}"></script>
    <script type="text/javascript" src="${request.static_url('uik_ru:static/js/jquery.imagesloaded.js')}"></script>
    <script type="text/javascript" src="${request.static_url('uik_ru:static/js/leaflet/bing.js')}"></script>
    <script type="text/javascript" src="${request.static_url('uik_ru:static/js/mustache.js')}"></script>
##	<script type="text/javascript" src="${request.static_url('uik_ru:static/js/uik/uik.templates.js')}"></script>
    <script type="text/javascript" src="${request.static_url('uik_ru:static/js/uik/uik.config.js')}"></script>
    <script type="text/javascript" src="${request.static_url('uik_ru:static/js/uik/uik.loader.js')}"></script>
    <script type="text/javascript" src="${request.static_url('uik_ru:static/js/uik/uik.helpers.js')}"></script>
    <script type="text/javascript" src="${request.static_url('uik_ru:static/js/uik/uik.common.js')}"></script>
    <script type="text/javascript" src="${request.static_url('uik_ru:static/js/uik/uik.map.js')}"></script>
    <script type="text/javascript" src="${request.static_url('uik_ru:static/js/uik/uik.map.helpers.js')}"></script>
    <script type="text/javascript" src="${request.static_url('uik_ru:static/js/uik/uik.map.manager.js')}"></script>
    <script type="text/javascript" src="${request.static_url('uik_ru:static/js/uik/uik.searcher.js')}"></script>
    <script type="text/javascript" src="${request.static_url('uik_ru:static/js/uik/uik.editor.js')}"></script>
##    <script type="text/javascript" src="${request.static_url('uik_ru:static/js/uik/uik.osm.js')}"></script>
    <script type="text/javascript" src="${request.static_url('uik_ru:static/js/uik/uik.uiks.js')}"></script>
    <script type="text/javascript" src="${request.static_url('uik_ru:static/js/uik/uik.alerts.js')}"></script>
    <script type="text/javascript" src="${request.static_url('uik_ru:static/js/uik/uik.user.js')}"></script>
</head>
<body class="editor-collapsed loading">
<div class="loading">
    <img style="margin-top: 70px;" src="${request.static_url('uik_ru:static/img/loader-global.gif')}"/>
    <span>Запуск...</span>
</div>
<div class="popup-background"></div>
<div id="popup">
    <a class="close"></a>
    <div class="header"></div>
    <div class="content"></div>
</div>
<div class="main-loader"></div>
<!--[if lt IE 7]>
<p class="chromeframe">Вы используете <strong>устаревший</strong> браузер. Пожалуйста <a href="http://browsehappy.com/">обновите
    ваш браузер</a></p>
<![endif]-->
<div id="target"></div>
<div id="map"></div>
<div id="alerts">
</div>
<div id="userContainer"
    % if u_name:
        class="inner"
    % endif
        >
    <form id="signInForm" class="form-inline" method="post">
        <input id="em" type="email" class="input-small" name="mail" placeholder="E-mail">
        <input id="p" type="password" class="input-small" name="pass" placeholder="Пароль">
        <button type="submit" class="btn btn-primary">Войти</button>
        <div>или <a href="${request.application_url}/register">зарегистрироваться</a></div>
    </form>
    <form id="signOutForm" class="form-inline" method="post">
        <div class="log"><span></span></div>
        <fieldset>
            <label id="display-name" class="control-label">
                    % if u_name:
						${u_name}
                    % endif
            </label>
            <input type="hidden" name="sign_out" value="true" />
            <button type="submit" class="btn">Выйти</button>
        </fieldset>
    </form>
</div>
<div id="searchContainer">
    <span class="icon-collapse"></span>
    <div class="title"><span>Поиск</span></div>
    <form class="form-search">
        <fieldset>
            <input id="filter_name" type="text" class="input-name" placeholder="Номер" />
            <input id="filter_address" type="text" class="input-address" placeholder="Адрес" />
            <div id="search" class="active" title="Поиск">
                <span></span>
            </div>
        </fieldset>
        <a href="javascript:void(0)" class="clear-search">Очистить поля поиска</a>
    </form>
    <div id="searchResults" class="active">
        <p class="update">Запрос данных...</p>
        <p class="description">Для поиска введите</br>часть адреса (более 3 символов)</br>и нажмите на кнопку</br></br>
            Для отображения списка УИКов кликните на эту область
        </p>
        <div></div>
    </div>
</div>
<div id="manager">
    <div class="group tile-layers">
        <div class="icon osm" title="Слой Openstreetmap" data-layer="osm">
            <button></button>
        </div>
        <div class="icon bing" title="Слой Bing" data-layer="bing">
            <button></button>
        </div>
    </div>
</div>
<div id="editorContainer">
    <span class="icon-collapse"></span>
    <div class="title"><span>Редактор</span></div>
    <div class="form-wrap">
        <form class="form-inline disabled" id="editorForm">
            <div class="group">
                <label class="control-label middle" for="id">ID</label>
                <input type="text" id="id" name="id" class="stand" disabled="disabled"/>
            </div>
            <div class="group">
                <label class="control-label middle" for="name">Номер</label>
                <input type="text" id="name" name="name" class="stand" disabled="disabled"/>
            </div>
##            <div class="group">
##                <label class="control-label middle" for="district">Федераль-</br>ный округ</label>
##                <select id="district" name="district" class="route-type-sel" disabled="disabled">
##                </select>
##            </div>
##            <div class="group">
##                <label class="control-label middle" for="area">Регион</label>
##                <select id="area" name="area" class="route-type-sel" disabled="disabled">
##                </select>
##            </div>
##            <div class="group">
##                <label class="control-label middle" for="sub_area">Район</label>
##                <select id="sub_area" name="sub_area" class="route-type-sel" disabled="disabled">
##                </select>
##            </div>
##            <div class="group">
##                <label class="control-label middle" for="locality">Населенный пункт</label>
##                <select id="locality" name="locality" class="route-type-sel" disabled="disabled">
##                </select>
##            </div>
##            <div class="group">
##                <label class="control-label middle" for="street">Улица</label>
##                <select id="street" name="street" class="route-type-sel" disabled="disabled">
##                </select>
##            </div>
##            <div class="group-checkboxes">
##                <input id="is_committee_here" type="hidden" value="0">
##                <input id="chb_is_committee_here" name="is_committee_here" type="checkbox" class="stand"
##                       disabled="disabled" data-id="is_committee_here"/>
##                <label class="control-label top" for="is_committee_here">Также расположение комиссии</label>
##            </div>
            <div class="group">
                <label class="control-label top" for="address">Адрес</label>
                <textarea id="address" name="address" disabled="disabled"></textarea>
            </div>
            <div class="group">
                <label class="control-label top" for="comment">Коммента-</br>рий</label>
                <textarea id="comment" name="comment" disabled="disabled"></textarea>
            </div>
            <div class="group">
                <label class="control-label" for="lat">Широта</label>
                <input type="text" id="lat" name="lat" class="stand" disabled="disabled"/>
            </div>
            <div class="group">
                <label class="control-label" for="lon">Долгота</label>
                <input type="text" id="lon" name="lon" class="stand" disabled="disabled"/>
            </div>
            <div class="group-checkboxes">
                <input id="is_checked" type="hidden" name="is_checked" value="0"/>
                <input id="chb_is_checked" type="checkbox" class="stand"
                       disabled="disabled" data-id="is_checked"/>
                <label class="control-label top" for="is_checked">Проверена</label>
            </div>
            <div class="group-submit">
                <button id="discard" type="button" class="btn btn-warning" disabled="disabled">Отменить</button>
                <button id="save" type="button" class="btn btn-success" disabled="disabled">Сохранить</button>
            </div>
        </form>
    </div>
</div>
</body>
</html>
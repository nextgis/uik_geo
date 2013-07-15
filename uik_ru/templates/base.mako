<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/html" xmlns="http://www.w3.org/1999/html">
<head>
    <meta charset="utf-8">
    <title>Отметь свой УИК</title>
    <meta name="description" content="участковая избирательная комиссия выборы адрес">
    <meta name="viewport" content="width=device-width">

    <link rel="stylesheet" href="${request.static_url('uik_ru:static/css/bootstrap.min.css')}">
    <link rel="stylesheet" href="${request.static_url('uik_ru:static/css/main.css')}">

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
    <script type="text/javascript" src="${request.static_url('uik_ru:static/js/jquery.imagesloaded.js')}"></script>
    <script type="text/javascript" src="${request.static_url('uik_ru:static/js/leaflet/bing.js')}"></script>
    <script type="text/javascript" src="${request.static_url('uik_ru:static/js/mustache.js')}"></script>
    <script type="text/javascript" src="${request.static_url('uik_ru:static/js/uik/uik.config.js')}"></script>
    <script type="text/javascript" src="${request.static_url('uik_ru:static/js/uik/uik.loader.js')}"></script>
    <script type="text/javascript" src="${request.static_url('uik_ru:static/js/uik/uik.helpers.js')}"></script>
    <script type="text/javascript" src="${request.static_url('uik_ru:static/js/uik/uik.common.js')}"></script>
    <script type="text/javascript" src="${request.static_url('uik_ru:static/js/uik/uik.map.js')}"></script>
    <script type="text/javascript" src="${request.static_url('uik_ru:static/js/uik/uik.map.helpers.js')}"></script>
    <script type="text/javascript" src="${request.static_url('uik_ru:static/js/uik/uik.map.manager.js')}"></script>
    <script type="text/javascript" src="${request.static_url('uik_ru:static/js/uik/uik.searcher.js')}"></script>
    <script type="text/javascript" src="${request.static_url('uik_ru:static/js/uik/uik.searcher.tab.js')}"></script>
    <script type="text/javascript" src="${request.static_url('uik_ru:static/js/uik/uik.editor.js')}"></script>
    <script type="text/javascript" src="${request.static_url('uik_ru:static/js/uik/uik.uiks.js')}"></script>
    <script type="text/javascript" src="${request.static_url('uik_ru:static/js/uik/uik.uiks_2012.js')}"></script>
    <script type="text/javascript" src="${request.static_url('uik_ru:static/js/uik/uik.alerts.js')}"></script>
    <script type="text/javascript" src="${request.static_url('uik_ru:static/js/uik/uik.user.js')}"></script>
    <script type="text/javascript" src="${request.static_url('uik_ru:static/js/uik/uik.permalink.js')}"></script>
    <script type="text/javascript" src="${request.static_url('uik_ru:static/js/uik/uik.josm.js')}"></script>
    <script type="text/javascript" src="${request.static_url('uik_ru:static/js/uik/uik.versions.js')}"></script>
    <script type="text/javascript" src="${request.static_url('uik_ru:static/js/uik/uik.editor.tab.js')}"></script>
    <script type="text/javascript" src="${request.static_url('uik_ru:static/build/compile-templates.js')}"></script>

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
<div id="searchContainer" class="searchUIK">
    <span class="icon-collapse"></span>
    <div class="title"><span>Поиск</span></div>
    <ul class="nav nav-tabs">
        <li class="active" data-id="searchUIK"><a href="javascript:void(0)">УИК</a></li>
        <li data-id="searchUIK_2012"><a href="javascript:void(0)">УИК 2012</a></li>
        <li data-id="searchAddress"><a href="javascript:void(0)">Адреса</a></li>
    </ul>

    <div id="searchUIK" onsubmit="return false"  class="search-block" data-trigger="/uik/uiks/updateUiks" data-isMapTriggered="true" data-filter="uik">
        <form class="form-search">
            <fieldset>
                <input type="text" class="name filterable" data-filter="number" data-validate="validateNumber" placeholder="Номер" />
                <input type="text" class="address filterable" data-filter="address" data-validate="validateDefault" placeholder="Адрес" />
                <div class="search" title="Поиск">
                    <span></span>
                </div>
            </fieldset>
            <a href="javascript:void(0)" class="clear-search">Очистить поля поиска</a>
        </form>

        <div class="active searchResults" data-template="">
            <p class="update">Запрос данных...</p>
            <div></div>
        </div>
    </div>

    <div id="searchUIK_2012" onsubmit="return false"  class="search-block" data-trigger="/uik/uiks_2012/updateUiks" data-isMapTriggered="true"  data-filter="uik_2012">
        <form class="form-search">
            <fieldset>
                <input type="text" class="name filterable" data-filter="number" data-validate="validateNumber" placeholder="Номер" />
                <input type="text" class="address filterable" data-filter="address" data-validate="validateDefault" placeholder="Адрес" />
                <div class="search" title="Поиск">
                    <span></span>
                </div>
            </fieldset>
            <a href="javascript:void(0)" class="clear-search">Очистить поля поиска</a>
        </form>

        <div class="active searchResults">
            <p class="update">Запрос данных...</p>
            <div></div>
        </div>
    </div>

    <div id="searchAddress" onsubmit="return false" class="search-block"  data-trigger="search/address" data-filter="address">
        <form class="form-search">
            <fieldset>
                <input type="text" class="address filterable" data-filter="address" data-validate="validateDefault" placeholder="Адрес" />
                <div class="search" title="Поиск">
                    <span></span>
                </div>
            </fieldset>
            <a href="javascript:void(0)" class="clear-search">Очистить поле поиска</a>
        </form>

        <div class="active searchResults">
            <p class="update">Запрос данных...</p>
            <div></div>
        </div>
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
##        <div class="icon josm" title="Редактировать в JOSM">
##            <button>
##                <a href="" id="josm-link">
##                    <img id="josm-link-img" src="${request.static_url('uik_ru:static/img/josm-link-icon.png')}">
##                </a>
##            </button>
##        </div>
    </div>
</div>
<div id="editorContainer" class="versionsUIK">
    <span class="icon-collapse"></span>

    <div class="title"><span>Редактор</span></div>

    <ul class="nav nav-tabs">
        <li data-id="editUIK" id="editUIK-link"><a href="javascript:void(0)">Данные УИКа</a></li>
        <li class="active" data-id="versionsUIK" id="versionsUIK-link"><a href="javascript:void(0)">Версии</a></li>
    </ul>

    <div class="form-wrap" id="editUIK">
        <form class="form-inline disabled" id="editorForm">
            <div class="group">
                <label class="control-label middle" for="id">ID</label>
                <input type="text" id="id" class="stand" disabled="disabled"/>
            </div>
            <div class="group">
                <label class="control-label middle" for="name">Номер УИКа</label>
                <input type="text" id="name" class="stand" disabled="disabled"/>
            </div>
            <div class="group">
                <label class="control-label middle" for="region">Регион</label>
                <input type="text" id="region" class="stand" disabled="disabled"/>
            </div>
            <div class="group">
                <label class="control-label middle" for="tik">ТИК</label>
                <input type="text" id="tik" class="stand" disabled="disabled"/>
            </div>
            <div class="group">
                <label class="control-label top" for="address_voting">Адрес голосования</label>
                <textarea id="address_voting" name="address_voting" disabled="disabled"></textarea>
            </div>
            <div class="group">
                <label class="control-label top" for="place_voting">Место помещения голосования</label>
                <textarea id="place_voting" name="place_voting" disabled="disabled"></textarea>
            </div>
            <div class="group">
                <label class="control-label" for="geo_precision">Точность геокодиро-<br>вания</label>
                <select id="geo_precision" class="stand" name="geo_precision" disabled="disabled">
                    % for geocoding_precision in geocoding_precisions:
                        <option value="${geocoding_precision.id}">${geocoding_precision.name_ru}</option>
                    % endfor
                </select>
            </div>
            <div class="geographic">
                <div class="group">
                    <label class="control-label" for="lat">Широта</label>
                    <input type="text" id="lat" name="lat" class="stand" disabled="disabled"/>
                </div>
                <div class="group">
                    <label class="control-label" for="lng">Долгота</label>
                    <input type="text" id="lng" name="lng" class="stand" disabled="disabled"/>
                </div>
                <div class="wrapper-coordinates">
                    <button id="applyCoordinates" class="btn btn-small" disabled="disabled" type="button">
                        Применить координаты</button>
                    <button id="resetCenter" class="btn btn-small" disabled="disabled" type="button">
                        Перецентрировать</button>                                            
                    <button id="undoCoordinates" class="btn btn-small" disabled="disabled" type="button">
                        Отменить координаты</button>                        
                </div>
            </div>
            <div class="group">
                <label class="control-label top" for="comment">Коммента-</br>рий</label>
                <textarea id="comment" name="comment" disabled="disabled"></textarea>
            </div>
            <div class="group-checkboxes">
                <input id="is_applied" type="hidden" name="is_applied" value="0"/>
                <input id="chb_is_applied" type="checkbox" class="stand" disabled="disabled" data-id="is_applied"/>
                <label class="control-label top" for="is_applied">УИК принят</label>
            </div>
            <div class="group-submit">
                <button id="discard" type="button" class="btn btn-warning" disabled="disabled">Отменить</button>
                <button id="save" type="button" class="btn btn-success" disabled="disabled">Сохранить</button>
            </div>
        </form>
    </div>

    <div id="versionsUIK">

    </div>
</div>
<div class="permalink">
    <a id="permalink" name="Ссылка на текущую область">Ссылка на карту</a></br>
    <a id="json_link" name="Открыть в JOSM" target="_blank">Открыть в JOSM</a>
</div>
</body>
</html>
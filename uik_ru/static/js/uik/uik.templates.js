(function ($) {
	$.templates = {};
	$.extend($.templates, {
		// Mustache.compile('')
		osmPopupTemplate: Mustache.compile('<div class="osm-popup"> <div class="caption"> <span>{{id}}</span> <a href="{{link}}" target="_blank" title="Посмотреть на OpenStreetMaps" class="osm"></a> </div> <table class="table table-striped"> {{#tags}} <tr> <td>{{key}}</td> <td>{{val}}</td> </tr> {{/tags}} </table> </div>'),
		searchResultsTemplate: Mustache.compile('<ul class="{{cssClass}}">{{#stops}}<li data-lat={{lat}} data-lon={{lon}}>{{id}} {{name}} <a></a></li>{{/stops}}</ul>'),
		stopPopupInfoTemplate: Mustache.compile('<table class="table table-striped"><tr><td>Название</td><td>{{name}}</td></tr><tr><td>Id</td><td>{{id}}</td></tr><tr><td>Маршруты</td><td>{{#routes}} <span>{{name}}</span> {{/routes}}</td></tr><tr><td>Крыша</td><td>{{is_shelter}}</td></tr><tr><td>Скамейка</td><td>{{is_bench}}</td></tr><tr><td>Тип остановки</td><td>{{#types}}{{name}}</br>{{/types}}</td></tr><tr><td>Проверка на местности</td><td>{{is_check}}</td></tr><tr><td>Комментарий</td><td>{{comment}}</td></tr>{{#isBlock}}<tr class="block">{{#isUnBlock}}<td>Заблокирована вами</td><td><button class="btn btn-small btn-primary block" id="unblock" type="button">Разблокировать</button></td>{{/isUnBlock}}{{^isUnBlock}}<td>Заблокировал</td><td>{{userBlock}}</td>{{/isUnBlock}}</tr>{{/isBlock}}</table>{{#isUserEditor}}<div class="edit"><button class="btn btn-small btn-primary {{#isBlock}}block{{/isBlock}}" id="edit" type="button" {{#editDenied}}disabled="disabled"{{/editDenied}}>Редактировать</button></div>{{/isUserEditor}}'),
		stopPopupTemplate: Mustache.compile('<div id="stop-popup" class="{{css}} loader"></div>'),
		userLogsTemplate: Mustache.compile('<table class="table table-striped logs"><tr><th>Пользователь</th><th>Кол-во остановок</th></tr>{{#user_logs}}<tr><td>{{user_name}}</td><td class="stop">{{count_stops}}</td></tr>{{/user_logs}}</table>')
	});
})(jQuery);
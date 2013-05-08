var UIK = {};
UIK.viewmodel = {};
UIK.view = {};
UIK.templates = {};


(function ($, UIK) {
	$.extend(UIK.viewmodel, {
		version : null
	});
	$.extend(UIK.view, {
		$document: null
	});

	UIK.loader = {};
	$.extend(UIK.loader, {
		templates: ['uikPopupTemplate', 'uikPopupInfoTemplate', 'searchResultsTemplate', 'userLogsTemplate', 'alertsTemplate'],

		init: function () {
			this.setDomOptions();
			this.compileTemplates();
		},

		initModules: function () {
//			try {
				UIK.common.init();
                UIK.alerts.init();
				UIK.map.init();
				UIK.searcher.init();
				UIK.editor.init();
				UIK.user.init();
				UIK.uiks.init();
//			} catch (e) {
//				alert(e);
//			}
		},

		setDomOptions: function () {
			UIK.view.$document = $(document);
		},

		compileTemplates: function () {
			var context = this, deferreds = [], templates = [], htmlTemplates = [], templateIndex,
				templatesCount = this.templates.length;
			for (templateIndex = 0; templateIndex < templatesCount; templateIndex++) {
				deferreds.push($.get(document['url_root'] + 'static/js/templates/' + this.templates[templateIndex] + '.htm', function (doc, state, response) {
					htmlTemplates.push({
						'name' : this.url.substr((this.url.lastIndexOf("/") + 1)).replace('.htm', ''),
						'html' : response.responseText
                    });
				}));
			}
			$.when.apply(null, deferreds).done(function () {
				for (templateIndex = 0; templateIndex < templatesCount; templateIndex++) {
					var name = htmlTemplates[templateIndex].name;
					UIK.templates[name] = Mustache.compile(htmlTemplates[templateIndex].html);
				}
				window.setTimeout(function () {
					context.initModules();
					$('img').imagesLoaded(function () {
						UIK.view.$body.removeClass('loading');
					});
				}, 1000);
			});
		}
	});

	$(document).ready(function () {
		UIK.loader.init();
	});

})(jQuery, UIK);

(function ($) {
	$.sm = {};
	$.viewmodel = {};
	$.view = {};
	$.templates = {};

	$.extend($.viewmodel, {
		version : null
	});
	$.extend($.view, {
		$document: null
	});

	$.sm.loader = {};
	$.extend($.sm.loader, {
		templates: ['osmPopupTemplate', 'stopPopupTemplate', 'stopPopupInfoTemplate', 'searchResultsTemplate', 'userLogsTemplate'],

		init: function () {
			this.setDomOptions();
			this.compileTemplates();
		},

		initModules: function () {
			try {
				$.sm.common.init();
				$.sm.map.init();
				$.sm.searcher.init();
//				$.sm.editor.init();
//				$.sm.osm.init();
				$.sm.user.init();
				$.sm.stops.init();
			} catch (e) {
				alert(e);
			}
		},

		setDomOptions: function () {
			$.view.$document = $(document);
		},

		compileTemplates: function () {
			var context = this, deferreds = [], templates = [], htmlTemplates = [], templateIndex,
				templatesCount = this.templates.length;
			for (templateIndex = 0; templateIndex < templatesCount; templateIndex++) {
				deferreds.push($.get(document['url_root'] + 'static/js/templates/' + this.templates[templateIndex] + '.htm', function (doc, state, response) {
					htmlTemplates.push({
						'name' : this.url.substr((this.url.lastIndexOf("/") + 1)).replace('.htm', ''),
						'html' : response.responseText });
				}));
			}
			$.when.apply(null, deferreds).done(function () {
				for (templateIndex = 0; templateIndex < templatesCount; templateIndex++) {
					var name = htmlTemplates[templateIndex].name;
					$.templates[name] = Mustache.compile(htmlTemplates[templateIndex].html);
				}
				window.setTimeout(function() {
					context.initModules();
					$('img').imagesLoaded( function () {
						$.view.$body.removeClass('loading');
					});
				}, 1000);
			});
		}
	});
	$(document).ready(function () {
		$.sm.loader.init();
	});
})(jQuery);

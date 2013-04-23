(function ($) {
	$.extend($.viewmodel, {
		bodyPanelsVisible: [true, true, true, true]
	});

	$.extend($.view, {
		$body: null,
		$popup: null
	});

	$.sm.common = {};
	$.extend($.sm.common, {
		init: function () {
			this.setDomOptions();
			this.bindEvents();
		},

		bindEvents: function () {
			var context = this;
			$.view.$document.on('/sm/common/openPopup', function (e, header, contentPopup) {
				context.openPopup(header, contentPopup);
			});
			$.view.$popup.find('a.close').off('click').on('click', function () {
				$.view.$body.removeClass('popup');
			});
			$.view.$document.on('/sm/common/setMainLoad', function () {
				$.view.$body.addClass('loader');
			});
		},

		openPopup: function (header, content) {
			var $popup = $.view.$popup,
				marginLeft, marginTop;
			$popup.find('div.header').text(header);
			$popup.find('div.content').html(content);
			marginLeft = $popup.width() / 2;
			marginTop = $popup.height() / 2;
			$popup.css({
				'margin-left' : -marginLeft + 'px',
				'margin-top' :  -marginTop  + 'px'
			});
			$.view.$body.addClass('popup');
		},

		closePopup: function () {

		},

		setDomOptions: function () {
			$.view.$body = $('body');
			$.view.$popup = $('#popup');
		}
	});
})(jQuery);

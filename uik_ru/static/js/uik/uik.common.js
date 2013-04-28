(function ($, UIK) {
	$.extend(UIK.viewmodel, {
		bodyPanelsVisible: [true, true, true, true]
	});

	$.extend(UIK.view, {
		$body: null,
		$popup: null
	});

	UIK.common = {};
	$.extend(UIK.common, {
		init: function () {
			this.setDomOptions();
			this.bindEvents();
		},

		bindEvents: function () {
			var context = this;
			UIK.view.$document.on('/sm/common/openPopup', function (e, header, contentPopup) {
				context.openPopup(header, contentPopup);
			});
			UIK.view.$popup.find('a.close').off('click').on('click', function () {
				UIK.view.$body.removeClass('popup');
			});
			UIK.view.$document.on('/sm/common/setMainLoad', function () {
				UIK.view.$body.addClass('loader');
			});
		},

		openPopup: function (header, content) {
			var $popup = UIK.view.$popup,
				marginLeft, marginTop;
			$popup.find('div.header').text(header);
			$popup.find('div.content').html(content);
			marginLeft = $popup.width() / 2;
			marginTop = $popup.height() / 2;
			$popup.css({
				'margin-left' : -marginLeft + 'px',
				'margin-top' :  -marginTop  + 'px'
			});
			UIK.view.$body.addClass('popup');
		},

		closePopup: function () {

		},

		setDomOptions: function () {
			UIK.view.$body = $('body');
			UIK.view.$popup = $('#popup');
		}
	});
})(jQuery, UIK);

(function ($, UIK) {
	$.extend(UIK.viewmodel, {
		isAuth: false
	});
	$.extend(UIK.view, {
		$userContainer: null,
		$signInForm: null,
		$signOutForm: null
	});
	UIK.user = {};
	$.extend(UIK.user, {
		init: function () {
			this.setDomOptions();
			this.bindEvents();
		},

		setDomOptions: function () {
			UIK.view.$userContainer = $('#userContainer');
			UIK.view.$signInForm = $('#signInForm');
			UIK.view.$signOutForm = $('#signOutForm');
			if (UIK.view.$userContainer.hasClass('inner')) { UIK.viewmodel.isAuth = true; }
		},

		bindEvents: function () {
			var context = this;
			$('#signOutForm div.log').off('click').on('click', function () {
				context.renderLogs();
			});
		},

		renderLogs: function () {
			var url = document['url_root'] + 'logs';
			UIK.view.$document.trigger('/sm/common/setMainLoad');
			$.ajax({
				type: "GET",
				url: url,
				dataType: 'json',
				success: function(data) {
					var html = UIK.templates.userLogsTemplate({
						user_logs: data.stops_by_users,
						count_all: data.count.all,
						count_editable: data.count.editable,
						percent: (data.count.editable / data.count.all * 100).toFixed(2)
					});
					UIK.view.$body.removeClass('loader');
					UIK.view.$document.trigger('/sm/common/openPopup', ['Статистика пользователей', html]);
				}
			});
		}
	});
})(jQuery, UIK);


(function (DB, $) {
    'use strict';

    var subscriberModule;
    UIK.module.subscriberModule = {};
    subscriberModule = DB.module.routing;
    $.extend(DB.module.routing, {
        isLog: false,
        routes: {},
        $document: $(document),
        init: function () {
        },

        subscribe: function (channel, callback, context) {
            routingModule.log("SUBSCRIBE: " + channel);
            var route = {callback: callback, context: context };
            if (!routingModule.routes[channel]) {
                routingModule.routes[channel] = [ route];
            } else {
                routingModule.routes[channel].push(route);
            }
        },

        publish: function (channel, parameters) {
            var route;
            parameters = parameters || [];
            routingModule.log("PUBLISH: " + channel);
            routingModule.trigger(channel, parameters);
            if (!routingModule.routes.hasOwnProperty(channel)) return false;
            for (var callbackIndex = 0, callbackCount = routingModule.routes[channel].length; callbackIndex < callbackCount; callbackIndex += 1) {
                route = routingModule.routes[channel][callbackIndex];
                route.callback.apply(route.context, parameters);
            }

        },

        unsubscribe: function (channel) {
            routingModule.log("UNSUBSCRIBE: " + channel);
            delete routingModule.routes[channel];
        },

        call: function (channel, parameters) {
            parameters = parameters || [];
            routingModule.log("CALL: " + channel);
            if (!routingModule.routes.hasOwnProperty(channel)) return false;

            var route = routingModule.routes[channel][0];
            return  route.callback.apply(route.context, parameters);
        },

        log: function (message) {
            if (routingModule.isLog && window.console && console.log) console.info(message);
        },

        /*via dom communication*/
        trigger: function (channel, parameters) {
            routingModule.log("TRIGGER: " + channel);
            parameters = parameters || [];
            routingModule.$document.trigger(channel, parameters);
        }
    });

    DB.subscribe = DB.module.routing.subscribe;
    DB.unsubscribe = DB.module.routing.unsubscribe;
    DB.publish = DB.module.routing.publish;
    DB.call = DB.module.routing.call;
    DB.trigger = DB.module.routing.trigger;
})(DB, jQuery);
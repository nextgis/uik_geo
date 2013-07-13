/*!
 * jQuery imagesLoaded plugin v2.1.1
 * http://github.com/desandro/imagesloaded
 *
 * MIT License. by Paul Irish et al.
 */

/*jshint curly: true, eqeqeq: true, noempty: true, strict: true, undef: true, browser: true */
/*global jQuery: false */

;(function($, undefined) {
'use strict';

// blank image data-uri bypasses webkit log warning (thx doug jones)
var BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

$.fn.imagesLoaded = function( callback ) {
	var $this = this,
		deferred = $.isFunction($.Deferred) ? $.Deferred() : 0,
		hasNotify = $.isFunction(deferred.notify),
		$images = $this.find('img').add( $this.filter('img') ),
		loaded = [],
		proper = [],
		broken = [];

	// Register deferred callbacks
	if ($.isPlainObject(callback)) {
		$.each(callback, function (key, value) {
			if (key === 'callback') {
				callback = value;
			} else if (deferred) {
				deferred[key](value);
			}
		});
	}

	function doneLoading() {
		var $proper = $(proper),
			$broken = $(broken);

		if ( deferred ) {
			if ( broken.length ) {
				deferred.reject( $images, $proper, $broken );
			} else {
				deferred.resolve( $images );
			}
		}

		if ( $.isFunction( callback ) ) {
			callback.call( $this, $images, $proper, $broken );
		}
	}

	function imgLoadedHandler( event ) {
		imgLoaded( event.target, event.type === 'error' );
	}

	function imgLoaded( img, isBroken ) {
		// don't proceed if BLANK image, or image is already loaded
		if ( img.src === BLANK || $.inArray( img, loaded ) !== -1 ) {
			return;
		}

		// store element in loaded images array
		loaded.push( img );

		// keep track of broken and properly loaded images
		if ( isBroken ) {
			broken.push( img );
		} else {
			proper.push( img );
		}

		// cache image and its state for future calls
		$.data( img, 'imagesLoaded', { isBroken: isBroken, src: img.src } );

		// trigger deferred progress method if present
		if ( hasNotify ) {
			deferred.notifyWith( $(img), [ isBroken, $images, $(proper), $(broken) ] );
		}

		// call doneLoading and clean listeners if all images are loaded
		if ( $images.length === loaded.length ) {
			setTimeout( doneLoading );
			$images.unbind( '.imagesLoaded', imgLoadedHandler );
		}
	}

	// if no images, trigger immediately
	if ( !$images.length ) {
		doneLoading();
	} else {
		$images.bind( 'load.imagesLoaded error.imagesLoaded', imgLoadedHandler )
		.each( function( i, el ) {
			var src = el.src;

			// find out if this image has been already checked for status
			// if it was, and src has not changed, call imgLoaded on it
			var cached = $.data( el, 'imagesLoaded' );
			if ( cached && cached.src === src ) {
				imgLoaded( el, cached.isBroken );
				return;
			}

			// if complete is true and browser supports natural sizes, try
			// to check for image status manually
			if ( el.complete && el.naturalWidth !== undefined ) {
				imgLoaded( el, el.naturalWidth === 0 || el.naturalHeight === 0 );
				return;
			}

			// cached images don't fire load sometimes, so we reset src, but only when
			// dealing with IE, or image is complete (loaded) and failed manual check
			// webkit hack from http://groups.google.com/group/jquery-dev/browse_thread/thread/eee6ab7b2da50e1f
			if ( el.readyState || el.complete ) {
				el.src = BLANK;
				el.src = src;
			}
		});
	}

	return deferred ? deferred.promise( $this ) : $this;
};

})(jQuery);L.BingLayer = L.TileLayer.extend({
	options: {
		subdomains: [0, 1, 2, 3],
		type: 'Aerial',
		attribution: 'Bing',
		culture: ''
	},

	initialize: function(key, options) {
		L.Util.setOptions(this, options);

		this._key = key;
		this._url = null;
		this.meta = {};
		this.loadMetadata();
	},

	tile2quad: function(x, y, z) {
		var quad = '';
		for (var i = z; i > 0; i--) {
			var digit = 0;
			var mask = 1 << (i - 1);
			if ((x & mask) != 0) digit += 1;
			if ((y & mask) != 0) digit += 2;
			quad = quad + digit;
		}
		return quad;
	},

	getTileUrl: function(p, z) {
		var z = this._getZoomForUrl();
		var subdomains = this.options.subdomains,
			s = this.options.subdomains[Math.abs((p.x + p.y) % subdomains.length)];
		return this._url.replace('{subdomain}', s)
				.replace('{quadkey}', this.tile2quad(p.x, p.y, z))
				.replace('{culture}', this.options.culture);
	},

	loadMetadata: function() {
		var _this = this;
		var cbid = '_bing_metadata_' + L.Util.stamp(this);
		window[cbid] = function (meta) {
			_this.meta = meta;
			window[cbid] = undefined;
			var e = document.getElementById(cbid);
			e.parentNode.removeChild(e);
			if (meta.errorDetails) {
				alert("Got metadata" + meta.errorDetails);
				return;
			}
			_this.initMetadata();
		};
		var url = "http://dev.virtualearth.net/REST/v1/Imagery/Metadata/" + this.options.type + "?include=ImageryProviders&jsonp=" + cbid + "&key=" + this._key;
		var script = document.createElement("script");
		script.type = "text/javascript";
		script.src = url;
		script.id = cbid;
		document.getElementsByTagName("head")[0].appendChild(script);
	},

	initMetadata: function() {
		var r = this.meta.resourceSets[0].resources[0];
		this.options.subdomains = r.imageUrlSubdomains;
		this._url = r.imageUrl;
		this._providers = [];
		for (var i = 0; i < r.imageryProviders.length; i++) {
			var p = r.imageryProviders[i];
			for (var j = 0; j < p.coverageAreas.length; j++) {
				var c = p.coverageAreas[j];
				var coverage = {zoomMin: c.zoomMin, zoomMax: c.zoomMax, active: false};
				var bounds = new L.LatLngBounds(
						new L.LatLng(c.bbox[0]+0.01, c.bbox[1]+0.01),
						new L.LatLng(c.bbox[2]-0.01, c.bbox[3]-0.01)
				);
				coverage.bounds = bounds;
				coverage.attrib = p.attribution;
				this._providers.push(coverage);
			}
		}
		this._update();
	},

	_update: function() {
		if (this._url == null || !this._map) return;
		this._update_attribution();
		L.TileLayer.prototype._update.apply(this, []);
	},

	_update_attribution: function() {
		var bounds = this._map.getBounds();
		var zoom = this._map.getZoom();
		for (var i = 0; i < this._providers.length; i++) {
			var p = this._providers[i];
			if ((zoom <= p.zoomMax && zoom >= p.zoomMin) &&
					bounds.intersects(p.bounds)) {
				if (!p.active)
					this._map.attributionControl.addAttribution(p.attrib);
				p.active = true;
			} else {
				if (p.active)
					this._map.attributionControl.removeAttribution(p.attrib);
				p.active = false;
			}
		}
	},

	onRemove: function(map) {
		for (var i = 0; i < this._providers.length; i++) {
			var p = this._providers[i];
			if (p.active) {
				this._map.attributionControl.removeAttribution(p.attrib);
				p.active = false;
			}
		}
        	L.TileLayer.prototype.onRemove.apply(this, [map]);
	}
});
/*!
 * mustache.js - Logic-less {{mustache}} templates with JavaScript
 * http://github.com/janl/mustache.js
 */

/*global define: false*/

(function (root, factory) {
  if (typeof exports === "object" && exports) {
    module.exports = factory; // CommonJS
  } else if (typeof define === "function" && define.amd) {
    define(factory); // AMD
  } else {
    root.Mustache = factory; // <script>
  }
}(this, (function () {

  var exports = {};

  exports.name = "mustache.js";
  exports.version = "0.7.2";
  exports.tags = ["{{", "}}"];

  exports.Scanner = Scanner;
  exports.Context = Context;
  exports.Writer = Writer;

  var whiteRe = /\s*/;
  var spaceRe = /\s+/;
  var nonSpaceRe = /\S/;
  var eqRe = /\s*=/;
  var curlyRe = /\s*\}/;
  var tagRe = /#|\^|\/|>|\{|&|=|!/;

  var _test = RegExp.prototype.test;
  var _toString = Object.prototype.toString;

  // Workaround for https://issues.apache.org/jira/browse/COUCHDB-577
  // See https://github.com/janl/mustache.js/issues/189
  function testRe(re, string) {
    return _test.call(re, string);
  }

  function isWhitespace(string) {
    return !testRe(nonSpaceRe, string);
  }

  var isArray = Array.isArray || function (obj) {
    return _toString.call(obj) === '[object Array]';
  };

  function escapeRe(string) {
    return string.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
  }

  var entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;',
    "/": '&#x2F;'
  };

  function escapeHtml(string) {
    return String(string).replace(/[&<>"'\/]/g, function (s) {
      return entityMap[s];
    });
  }

  // Export the escaping function so that the user may override it.
  // See https://github.com/janl/mustache.js/issues/244
  exports.escape = escapeHtml;

  function Scanner(string) {
    this.string = string;
    this.tail = string;
    this.pos = 0;
  }

  /**
   * Returns `true` if the tail is empty (end of string).
   */
  Scanner.prototype.eos = function () {
    return this.tail === "";
  };

  /**
   * Tries to match the given regular expression at the current position.
   * Returns the matched text if it can match, the empty string otherwise.
   */
  Scanner.prototype.scan = function (re) {
    var match = this.tail.match(re);

    if (match && match.index === 0) {
      this.tail = this.tail.substring(match[0].length);
      this.pos += match[0].length;
      return match[0];
    }

    return "";
  };

  /**
   * Skips all text until the given regular expression can be matched. Returns
   * the skipped string, which is the entire tail if no match can be made.
   */
  Scanner.prototype.scanUntil = function (re) {
    var match, pos = this.tail.search(re);

    switch (pos) {
    case -1:
      match = this.tail;
      this.pos += this.tail.length;
      this.tail = "";
      break;
    case 0:
      match = "";
      break;
    default:
      match = this.tail.substring(0, pos);
      this.tail = this.tail.substring(pos);
      this.pos += pos;
    }

    return match;
  };

  function Context(view, parent) {
    this.view = view;
    this.parent = parent;
    this._cache = {};
  }

  Context.make = function (view) {
    return (view instanceof Context) ? view : new Context(view);
  };

  Context.prototype.push = function (view) {
    return new Context(view, this);
  };

  Context.prototype.lookup = function (name) {
    var value = this._cache[name];

    if (!value) {
      if (name == '.') {
        value = this.view;
      } else {
        var context = this;

        while (context) {
          if (name.indexOf('.') > 0) {
            value = context.view;
            var names = name.split('.'), i = 0;
            while (value && i < names.length) {
              value = value[names[i++]];
            }
          } else {
            value = context.view[name];
          }

          if (value != null) break;

          context = context.parent;
        }
      }

      this._cache[name] = value;
    }

    if (typeof value === 'function') value = value.call(this.view);

    return value;
  };

  function Writer() {
    this.clearCache();
  }

  Writer.prototype.clearCache = function () {
    this._cache = {};
    this._partialCache = {};
  };

  Writer.prototype.compile = function (template, tags) {
    var fn = this._cache[template];

    if (!fn) {
      var tokens = exports.parse(template, tags);
      fn = this._cache[template] = this.compileTokens(tokens, template);
    }

    return fn;
  };

  Writer.prototype.compilePartial = function (name, template, tags) {
    var fn = this.compile(template, tags);
    this._partialCache[name] = fn;
    return fn;
  };

  Writer.prototype.getPartial = function (name) {
    if (!(name in this._partialCache) && this._loadPartial) {
      this.compilePartial(name, this._loadPartial(name));
    }

    return this._partialCache[name];
  };

  Writer.prototype.compileTokens = function (tokens, template) {
    var self = this;
    return function (view, partials) {
      if (partials) {
        if (typeof partials === 'function') {
          self._loadPartial = partials;
        } else {
          for (var name in partials) {
            self.compilePartial(name, partials[name]);
          }
        }
      }

      return renderTokens(tokens, self, Context.make(view), template);
    };
  };

  Writer.prototype.render = function (template, view, partials) {
    return this.compile(template)(view, partials);
  };

  /**
   * Low-level function that renders the given `tokens` using the given `writer`
   * and `context`. The `template` string is only needed for templates that use
   * higher-order sections to extract the portion of the original template that
   * was contained in that section.
   */
  function renderTokens(tokens, writer, context, template) {
    var buffer = '';

    var token, tokenValue, value;
    for (var i = 0, len = tokens.length; i < len; ++i) {
      token = tokens[i];
      tokenValue = token[1];

      switch (token[0]) {
      case '#':
        value = context.lookup(tokenValue);

        if (typeof value === 'object') {
          if (isArray(value)) {
            for (var j = 0, jlen = value.length; j < jlen; ++j) {
              buffer += renderTokens(token[4], writer, context.push(value[j]), template);
            }
          } else if (value) {
            buffer += renderTokens(token[4], writer, context.push(value), template);
          }
        } else if (typeof value === 'function') {
          var text = template == null ? null : template.slice(token[3], token[5]);
          value = value.call(context.view, text, function (template) {
            return writer.render(template, context);
          });
          if (value != null) buffer += value;
        } else if (value) {
          buffer += renderTokens(token[4], writer, context, template);
        }

        break;
      case '^':
        value = context.lookup(tokenValue);

        // Use JavaScript's definition of falsy. Include empty arrays.
        // See https://github.com/janl/mustache.js/issues/186
        if (!value || (isArray(value) && value.length === 0)) {
          buffer += renderTokens(token[4], writer, context, template);
        }

        break;
      case '>':
        value = writer.getPartial(tokenValue);
        if (typeof value === 'function') buffer += value(context);
        break;
      case '&':
        value = context.lookup(tokenValue);
        if (value != null) buffer += value;
        break;
      case 'name':
        value = context.lookup(tokenValue);
        if (value != null) buffer += exports.escape(value);
        break;
      case 'text':
        buffer += tokenValue;
        break;
      }
    }

    return buffer;
  }

  /**
   * Forms the given array of `tokens` into a nested tree structure where
   * tokens that represent a section have two additional items: 1) an array of
   * all tokens that appear in that section and 2) the index in the original
   * template that represents the end of that section.
   */
  function nestTokens(tokens) {
    var tree = [];
    var collector = tree;
    var sections = [];

    var token;
    for (var i = 0, len = tokens.length; i < len; ++i) {
      token = tokens[i];
      switch (token[0]) {
      case '#':
      case '^':
        sections.push(token);
        collector.push(token);
        collector = token[4] = [];
        break;
      case '/':
        var section = sections.pop();
        section[5] = token[2];
        collector = sections.length > 0 ? sections[sections.length - 1][4] : tree;
        break;
      default:
        collector.push(token);
      }
    }

    return tree;
  }

  /**
   * Combines the values of consecutive text tokens in the given `tokens` array
   * to a single token.
   */
  function squashTokens(tokens) {
    var squashedTokens = [];

    var token, lastToken;
    for (var i = 0, len = tokens.length; i < len; ++i) {
      token = tokens[i];
      if (token) {
        if (token[0] === 'text' && lastToken && lastToken[0] === 'text') {
          lastToken[1] += token[1];
          lastToken[3] = token[3];
        } else {
          lastToken = token;
          squashedTokens.push(token);
        }
      }
    }

    return squashedTokens;
  }

  function escapeTags(tags) {
    return [
      new RegExp(escapeRe(tags[0]) + "\\s*"),
      new RegExp("\\s*" + escapeRe(tags[1]))
    ];
  }

  /**
   * Breaks up the given `template` string into a tree of token objects. If
   * `tags` is given here it must be an array with two string values: the
   * opening and closing tags used in the template (e.g. ["<%", "%>"]). Of
   * course, the default is to use mustaches (i.e. Mustache.tags).
   */
  exports.parse = function (template, tags) {
    template = template || '';
    tags = tags || exports.tags;

    if (typeof tags === 'string') tags = tags.split(spaceRe);
    if (tags.length !== 2) throw new Error('Invalid tags: ' + tags.join(', '));

    var tagRes = escapeTags(tags);
    var scanner = new Scanner(template);

    var sections = [];     // Stack to hold section tokens
    var tokens = [];       // Buffer to hold the tokens
    var spaces = [];       // Indices of whitespace tokens on the current line
    var hasTag = false;    // Is there a {{tag}} on the current line?
    var nonSpace = false;  // Is there a non-space char on the current line?

    // Strips all whitespace tokens array for the current line
    // if there was a {{#tag}} on it and otherwise only space.
    function stripSpace() {
      if (hasTag && !nonSpace) {
        while (spaces.length) {
          delete tokens[spaces.pop()];
        }
      } else {
        spaces = [];
      }

      hasTag = false;
      nonSpace = false;
    }

    var start, type, value, chr, token;
    while (!scanner.eos()) {
      start = scanner.pos;

      // Match any text between tags.
      value = scanner.scanUntil(tagRes[0]);
      if (value) {
        for (var i = 0, len = value.length; i < len; ++i) {
          chr = value.charAt(i);

          if (isWhitespace(chr)) {
            spaces.push(tokens.length);
          } else {
            nonSpace = true;
          }

          tokens.push(['text', chr, start, start + 1]);
          start += 1;

          // Check for whitespace on the current line.
          if (chr == '\n') stripSpace();
        }
      }

      // Match the opening tag.
      if (!scanner.scan(tagRes[0])) break;
      hasTag = true;

      // Get the tag type.
      type = scanner.scan(tagRe) || 'name';
      scanner.scan(whiteRe);

      // Get the tag value.
      if (type === '=') {
        value = scanner.scanUntil(eqRe);
        scanner.scan(eqRe);
        scanner.scanUntil(tagRes[1]);
      } else if (type === '{') {
        value = scanner.scanUntil(new RegExp('\\s*' + escapeRe('}' + tags[1])));
        scanner.scan(curlyRe);
        scanner.scanUntil(tagRes[1]);
        type = '&';
      } else {
        value = scanner.scanUntil(tagRes[1]);
      }

      // Match the closing tag.
      if (!scanner.scan(tagRes[1])) throw new Error('Unclosed tag at ' + scanner.pos);

      token = [type, value, start, scanner.pos];
      tokens.push(token);

      if (type === '#' || type === '^') {
        sections.push(token);
      } else if (type === '/') {
        // Check section nesting.
        if (sections.length === 0) throw new Error('Unopened section "' + value + '" at ' + start);
        var openSection = sections.pop();
        if (openSection[1] !== value) throw new Error('Unclosed section "' + openSection[1] + '" at ' + start);
      } else if (type === 'name' || type === '{' || type === '&') {
        nonSpace = true;
      } else if (type === '=') {
        // Set the tags for the next time around.
        tags = value.split(spaceRe);
        if (tags.length !== 2) throw new Error('Invalid tags at ' + start + ': ' + tags.join(', '));
        tagRes = escapeTags(tags);
      }
    }

    // Make sure there are no open sections when we're done.
    var openSection = sections.pop();
    if (openSection) throw new Error('Unclosed section "' + openSection[1] + '" at ' + scanner.pos);

    tokens = squashTokens(tokens);

    return nestTokens(tokens);
  };

  // All Mustache.* functions use this writer.
  var _writer = new Writer();

  /**
   * Clears all cached templates and partials in the default writer.
   */
  exports.clearCache = function () {
    return _writer.clearCache();
  };

  /**
   * Compiles the given `template` to a reusable function using the default
   * writer.
   */
  exports.compile = function (template, tags) {
    return _writer.compile(template, tags);
  };

  /**
   * Compiles the partial with the given `name` and `template` to a reusable
   * function using the default writer.
   */
  exports.compilePartial = function (name, template, tags) {
    return _writer.compilePartial(name, template, tags);
  };

  /**
   * Compiles the given array of tokens (the output of a parse) to a reusable
   * function using the default writer.
   */
  exports.compileTokens = function (tokens, template) {
    return _writer.compileTokens(tokens, template);
  };

  /**
   * Renders the `template` with the given `view` and `partials` using the
   * default writer.
   */
  exports.render = function (template, view, partials) {
    return _writer.render(template, view, partials);
  };

  // This is here for backwards compatibility with 0.4.x.
  exports.to_html = function (template, view, partials, send) {
    var result = exports.render(template, view, partials);

    if (typeof send === "function") {
      send(result);
    } else {
      return result;
    }
  };

  return exports;

}())));
(function ($, UIK) {
    $.extend(UIK.viewmodel, {
        version: null
    });
    $.extend(UIK.view, {
        $document: null
    });

    UIK.loader = {};
    $.extend(UIK.loader, {
        templates: ['uikPopupTemplate', 'uikPopupInfoTemplate', 'searchResultsTemplate', 'userLogsTemplate', 'alertsTemplate'],

        init: function () {
            var context = this;

            this.setDomOptions();

            window.setTimeout(function () {
                context.initModules();
                $('img').imagesLoaded(function () {
                    UIK.view.$body.removeClass('loading');
                });
            }, 1000);
        },

        initModules: function () {
            try {
                UIK.common.init();
                UIK.alerts.init();
                UIK.permalink.init();
                UIK.map.init();
                UIK.searcher.init();
                UIK.searcher.tab.init();
                UIK.editor.init();
                UIK.user.init();
                UIK.uiks.init();
                UIK.uiks_2012.init();
                UIK.josm.init();
                UIK.editor.tab.init();
            } catch (e) {
                alert(e);
            }
        },

        setDomOptions: function () {
            UIK.view.$document = $(document);
        }
    });

    $(document).ready(function () {
        UIK.loader.init();
    });

})(jQuery, UIK);
(function ($, UIK) {
	UIK.helpers = {};
	$.extend(UIK.helpers, {
		getIcon: function (cssClass, iconSize) {
			return L.divIcon({
				className: cssClass,
				iconSize: [iconSize, iconSize],
				iconAnchor: [iconSize / 2, iconSize / 2],
				popupAnchor: [0, 2 - (iconSize / 2)]
			});
		},

		hashToArrayKeyValues: function (hash) {
			var res = [];
			if (Object.prototype.toString.call(hash) === '[object Array]') {
				return hash;
			}
			for (var prop in hash) {
				if (!hash.hasOwnProperty(prop)) continue;
				res.push({ 'key' : prop, 'val' : hash[prop]});
			}
			return res;
		},

		boolToString: function (bool, is_coded) {
			switch (bool) {
				case null:
					return is_coded ? 'null' : '';
					break;
				case true:
					return is_coded ? 'true' : 'Да';
					break;
				case false:
					return is_coded ? 'false' : 'Нет';
					break;
			}
			throw 'The bool value is not convertible to string'
		},

		valueNullToString: function (val) {
			if (val === null) { return ''; }
			return val;
		},

		sortByFields: function () {
			var props = arguments,
				context = this;
			return function (obj1, obj2) {
				var i = 0, result = 0, numberOfProperties = props.length;
				while(result === 0 && i < numberOfProperties) {
					result = context.dynamicSort(props[i])(obj1, obj2);
					i++;
				}
				return result;
			}
		},

		dynamicSort: function (property) {
			var sortOrder = 1;
			if(property[0] === "-") {
				sortOrder = -1;
				property = property.substr(1, property.length - 1);
			}
			return function (a,b) {
				var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
				return result * sortOrder;
			}
		}
	});
})(jQuery, UIK);(function ($, UIK) {
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
(function ($, UIK) {
    $.extend(UIK.viewmodel, {
        map: null,
        mapLayers: {},
        isPopupOpened: false
    });
    $.extend(UIK.view, {
        $map: null
    });

    UIK.map = {};
    $.extend(UIK.map, {

        defaultExtent: {
            latlng: new L.LatLng(55.742, 37.658),
            zoom: 17
        },


        init: function () {
            this.buildMap();
            this.buildLayerManager();
            this.buildLayers();
            this.bindEvents();
        },

        bindEvents: function () {
            var context = this;
            UIK.viewmodel.map.on('moveend', function (e) {
                var map = e.target,
                    center = map.getCenter(),
                    zoom = map.getZoom();

                context.setLastExtentToCookie(center, zoom);
                UIK.view.$document.trigger('/uik/permalink/update', [center, zoom]);
                UIK.view.$document.trigger('/uik/map/updateAllLayers');

            });
            UIK.view.$document.on('/uik/map/updateAllLayers', function () {
                UIK.view.$document.trigger('/uik/uiks_2012/updateUiks');
                UIK.view.$document.trigger('/uik/uiks/updateUiks');

            });
            UIK.view.$document.on('/uik/map/openPopup', function (e, latlng, html) {
                var vm = UIK.viewmodel,
                    selectLayer = vm.mapLayers.select,
                    map = vm.map;
                map.panTo(latlng);
                map.openPopup(L.popup().setLatLng(latlng).setContent(html));

            });
            UIK.viewmodel.map.on('popupclose', function () {
                var vm = UIK.viewmodel;
                vm.isPopupOpened = false;
                vm.mapLayers.select.clearLayers();
            });
        },

        buildMap: function () {
            var viewmodel = UIK.viewmodel,
                extentFromUrl = this.getExtentFromUrl(),
                selectedLayer;

            UIK.view.$map = $('#map');
            viewmodel.map = new L.Map('map');

            L.control.scale().addTo(viewmodel.map);

            if (extentFromUrl) {
                viewmodel.map.setView(extentFromUrl.latlng, extentFromUrl.zoom);
                this.setLastExtentToCookie(extentFromUrl.latlng, extentFromUrl.zoom);
            } else {
                lastExtent = this.getLastExtentFromCookie();
                if (lastExtent) {
                    viewmodel.map.setView(lastExtent.latlng, lastExtent.zoom);
                } else {
                    viewmodel.map.setView(this.defaultExtent.latlng, this.defaultExtent.zoom);
                    this.setLastExtentToCookie(this.defaultExtent.latlng, this.defaultExtent.zoom);
                }
            }

            UIK.view.$document.trigger('/uik/permalink/update', [viewmodel.map.getCenter(), viewmodel.map.getZoom()]);

            selectedLayer = L.layerGroup();
            viewmodel.map.addLayer(selectedLayer);
            viewmodel.mapLayers['select'] = selectedLayer;
        },


        buildLayers: function () {
            var configPoints = UIK.config.data.points,
                layerName,
                pointLayer,
                editGroup,
                layerIndex = {},
                indexesSort = [];
            UIK.viewmodel.mapLayers.points = {};

            for (layerName in configPoints) {
                if (configPoints.hasOwnProperty(layerName)) {
                    pointLayer = configPoints[layerName].createLayer();
                    UIK.viewmodel.map.addLayer(pointLayer);
                    UIK.viewmodel.mapLayers.points[layerName] = pointLayer;
                    layerIndex[configPoints[layerName].z] = layerName;
                    indexesSort.push(configPoints[layerName].z);
                }
            }

            indexesSort.sort(function (a, b) {
                return b - a;
            });

            $.each(indexesSort, function (i, zIndex) {
                UIK.viewmodel.mapLayers.points[layerIndex[zIndex]].bringToFront();
            });

//            editGroup = new L.layerGroup();
//            UIK.viewmodel.map.addLayer(editGroup);
//            UIK.viewmodel.mapLayers['edit'] = editGroup;
        },


        getLastExtentFromCookie: function () {
            var lat = parseFloat($.cookie('map.lat'), 10),
                lng = parseFloat($.cookie('map.lng'), 10),
                zoom = parseInt($.cookie('map.zoom'), 10);
            if (lat && lng && zoom) {
                return {'latlng': new L.LatLng(lat, lng), 'zoom': zoom};
            } else {
                return null;
            }
        },

        setLastExtentToCookie: function (latLng, zoom) {
            $.cookie('map.lat', latLng.lat, { expires: 7, path: '/' });
            $.cookie('map.lng', latLng.lng, { expires: 7, path: '/' });
            $.cookie('map.zoom', zoom, { expires: 7, path: '/' });
        },


        getExtentFromUrl: function () {
            var lat = parseFloat(this.getURLParameter('lat')),
                lng = parseFloat(this.getURLParameter('lon')),
                zoom = parseFloat(this.getURLParameter('zoom'));

            if (lat && lng && zoom) {
                return {'latlng': new L.LatLng(lat, lng), 'zoom': zoom};
            }
            return null;
        },


        getURLParameter: function (name) {
            return decodeURI((RegExp(name + '=' + '(.+?)(&|$)').exec(location.search) || [, null])[1]);
        }

    });
})(jQuery, UIK);

(function ($, UIK) {
	$.extend(UIK.map, {
		getIcon: function (cssClass, iconSize) {
			return L.divIcon({
				className: cssClass,
				iconSize: [iconSize, iconSize],
				iconAnchor: [iconSize / 2, iconSize / 2],
				popupAnchor: [0, 2 - (iconSize / 2)]
			});
		}
	});
})(jQuery, UIK);(function ($, UIK) {
	$.extend(UIK.viewmodel, {
		currentTileLayer: null
	});
	$.extend(UIK.view, {
		$tileLayers: null,
		$manager: null
	});

	$.extend(UIK.map, {
		_layers: {},
		_lastIndex: 0,

		buildLayerManager: function () {
			var v = UIK.view;
			UIK.view.$manager = $('#manager');
			// http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
			// http://{s}.tile.osmosnimki.ru/kosmo/{z}/{x}/{y}.png
			// http://{s}.tiles.mapbox.com/v3/karavanjo.map-opq7bhsy/{z}/{x}/{y}.png
			this.addTileLayer('osm', 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', '© OpenStreetMap contributors');
			this.addBingLayer('AujH--7B6FRTK8b81QgPhuvw_Sb3kc8hBO-Lp5OLNyhCD4ZQoGGW4cQS6zBgaeEh');
			UIK.view.$tileLayers = v.$map.find('div.leaflet-tile-pane div.leaflet-layer');
			this.bindLayerManagerEvents();
			this.onLayer('osm');
		},

		bindLayerManagerEvents: function () {
			var context = this;
			UIK.viewmodel.map.off('zoomend').on('zoomend', function () {
				context.onLayer();
			});
			UIK.view.$manager.find('div.tile-layers div.icon').off('click').on('click', function (e) {
				context.onLayer($(this).data('layer'));
			});
		},

		onLayer: function (nameLayer) {
			var vm = UIK.viewmodel,
				v = UIK.view,
				$tileLayers = $(UIK.viewmodel.map.getPanes().tilePane).find('div.leaflet-layer');
			if (nameLayer) {
				v.$body.removeClass(vm.currentTileLayer).addClass(nameLayer);
				vm.currentTileLayer = nameLayer;
				$tileLayers.hide().eq(this._layers[nameLayer].index).show();
			} else {
				$tileLayers.hide().eq(this._layers[vm.currentTileLayer].index).show();
			}
		},

		addTileLayer: function (nameLayer, url, attribution) {
			var layer = new L.TileLayer(url, {minZoom: 8, maxZoom: 18, attribution: attribution});
			this._layers[nameLayer] = {
				'layer' : UIK.viewmodel.map.addLayer(layer, true),
				'index' : this._lastIndex
			};
			this._lastIndex =+ 1;
		},

		addBingLayer: function (key) {
			var bingLayer = new L.BingLayer(key, {minZoom: 8, maxZoom: 19});
			this._layers['bing'] = {
				'layer' : UIK.viewmodel.map.addLayer(bingLayer, true),
				'index' : this._lastIndex
			};
			this._lastIndex =+ 1;
		}

	});
})(jQuery, UIK);(function ($, UIK) {
    $.extend(UIK.viewmodel, {
        searcherCollapsed: false,
        filter: {},
        isFilterValidated: true
    });
    $.extend(UIK.view, {
        $searchContainer: null,
        $filterName: null,
        $$filterAddr: null,
        $searchButton: null,
        $uiksSearchResults: null,
        $uikspSearchResults: null,
        $clearSearch: null
    });
    UIK.searcher = {};
    $.extend(UIK.searcher, {
        min_characters_count: 3,


        init: function () {
            this.setDomOptions();
            this.initFilter();
            this.bindEvents();
        },

        setDomOptions: function () {
            var view = UIK.view;
            view.$searchContainer = $('#searchContainer');
            view.$filterName = $('#filter_name');
            view.$filterAddr = $('#filter_address');
            view.$searchButton = $('#search');
            view.$uiksSearchResults = $('#searchUIK').find('div.searchResults');
            view.$uikspSearchResults = $('#searchUIK_2012').find('div.searchResults');
            view.$clearSearch = view.$searchContainer.find('a.clear-search');
        },


        initFilter: function () {
            var context = this,
                view = UIK.view,
                $searchBlock,
                filterBlock,
                $searchInput,
                filterParam,
                isValid,
                filter;

            view.$searchContainer.find('div.search-block').each(function (index) {
                $searchBlock = $(this);
                filterBlock = $searchBlock.data('filter');
                filter = UIK.viewmodel.filter;
                filter[filterBlock] = {};
                filter[filterBlock].json = {};
                filter[filterBlock].is_valid = true;
                filter[filterBlock].trigger = $searchBlock.data('trigger');
                filter[filterBlock].btn_search = $searchBlock.find('div.search');
                filter[filterBlock].clear_search = $searchBlock.find('a.clear-search');
                filter[filterBlock].elements = {};

                $searchBlock.find('input.filterable').each(function () {
                    (function (element, filterBlockName, filter) {
                        $searchInput = $(element);
                        filterParam = $searchInput.data('filter');
                        UIK.viewmodel.filter[filterBlockName].elements[filterParam] = {
                            'element': $searchInput,
                            'is_valid': true
                        };
                        filter[filterBlockName].json[filterParam] = '';
                    })(this, filterBlock, filter);
                });
            });
        },

        bindEvents: function () {
            var view = UIK.view,
                context = this;

            this.bindKeyUpHandlers();

            view.$searchContainer.find('span.icon-collapse, div.title').off('click').on('click', function () {
                UIK.viewmodel.searcherCollapsed = !UIK.viewmodel.searcherCollapsed;
                UIK.view.$body.toggleClass('searcher-collapsed', context.searcherCollapsed);
            });

            view.$document.on('/sm/searcher/update', function () {
                context.updateSearch();
            });
//
//            view.$document.on('/uik/uiks/startUpdate', function () {
//                var v = UIK.view;
//                v.$searchResults.prop('class', 'update');
//                v.$filterName.prop('disabled', true);
//                v.$filterAddr.prop('disabled', true);
//                context.validateSearch();
//            });
//
//            view.$document.on('/sm/stops/endUpdate', function () {
//                var v = UIK.view;
//                v.$searchResults.prop('class', 'active');
//                v.$filterName.prop('disabled', false);
//                v.$filterAddr.prop('disabled', false);
//            });
        },

        bindKeyUpHandlers: function () {
            var context = this,
                filter = UIK.viewmodel.filter,
                filterBlock,
                filterBlockName,
                element,
                elementName,
                isValid,
                isValidFilter,
                $this;

            for (filterBlockName in filter) {
                if (filter.hasOwnProperty(filterBlockName)) {
                    filterBlock = filter[filterBlockName];
                    for (elementName in filterBlock.elements) {
                        if (filterBlock.elements.hasOwnProperty(elementName)) {
                            element = filterBlock.elements[elementName].element;
                            (function (element, filterBlock, context) {
                                element.off('keyup').on('keyup', function (e) {
                                    $this = $(this);
                                    if (e.keyCode === 13) {
                                        if (context.validateFilter(filterBlock)) {
                                            context.applyFilter(filterBlock);
                                        }
                                    } else {
                                        isValid = context[$this.data('validate')]($this.val());
                                        $this.toggleClass('invalid', !isValid);
                                        filterBlock.elements[elementName].is_valid = isValid;
                                        isValidFilter = context.validateFilter(filterBlock);
                                        filterBlock.btn_search.toggleClass('active', isValidFilter);
                                        if (isValidFilter) { context.buildFilterJson(filterBlock); }
                                        if (isValidFilter && context.isEmptyFilters(filterBlock)) {
                                            filterBlock.btn_search.removeClass('active');
                                        }

                                    }
                                });
                                filterBlock.clear_search.off('click').on('click', function () {
                                    $.each(filterBlock.elements, function () {
                                        this.element.val('');
                                    });
                                    context.applyFilter(filterBlock);
                                });
                                filterBlock.btn_search.off('click').on('click', function () {
                                    if ($(this).hasClass('active')) {
                                        context.applyFilter(filterBlock);
                                    }
                                });
                            }) (element, filterBlock, context);
                        }
                    }
                }
            }
        },



        validateFilter: function (filterBlock) {
            var elements = filterBlock.elements,
                filterElem;
            for (filterElem in elements) {
                if (elements.hasOwnProperty(filterElem) && !elements[filterElem].is_valid) {
                    filterBlock.is_valid = false;
                    return false;
                }
            }
            filterBlock.is_valid = true;
            return true;
        },


        isEmptyFilters: function (filterBlock) {
            var elements = filterBlock.elements,
                elementName;
            for (elementName in elements) {
                if (elements.hasOwnProperty(elementName)) {
                    if ($.trim(elements[elementName].element.val()) !== '') {
                        return false;
                    }
                }
            }
            return true;
        },


        validateDefault: function (value) {
            var trimValue = $.trim(value);
            return trimValue.length > this.min_characters_count ||
                trimValue === '';
        },


        validateNumber: function (value) {
            var trimValue = $.trim(value);
            return trimValue.length > 2 ||
                trimValue === '';
        },


        applyFilter: function (filterBlock) {
            this.buildFilterJson(filterBlock);
            this.search(filterBlock);
        },

        buildFilterJson: function (filterBlock) {
            var elements = filterBlock.elements,
                elementName;

            for (elementName in elements) {
                if (elements.hasOwnProperty(elementName)) {
                    filterBlock.json[elementName] = $.trim(elements[elementName].element.val());
                }
            }
        },

        search: function (filterBlock) {
            UIK.view.$document.trigger(filterBlock.trigger);
        },

        updateSearch: function () {
            var pointLayers = UIK.viewmodel.pointLayers.uiks,
                pointsConfig = UIK.config.data.points,
                pointsType,
                $divSearchResults = UIK.view.$uiksSearchResults.find('div'),
                html;

            $divSearchResults.empty();
            for (pointsType in pointLayers) {
                if (pointLayers.hasOwnProperty(pointsType)) {
                    html = this.getHtmlForSearchResults(pointsConfig[pointsType].searchCssClass,
                        pointLayers[pointsType].elements);
                    $divSearchResults.append(html);
                }
            }

            $divSearchResults.find('a.target').on('click', function () {
                var $li = $(this).parent();
                UIK.viewmodel.map.setView(new L.LatLng($li.data('lat'), $li.data('lon')), 18);
                $('#target').show().delay(1000).fadeOut(1000);
            });

            $divSearchResults.find('a.edit').on('click', function () {
                if (UIK.viewmodel.editable) { return false; }

                var $li = $(this).parent(), uikId;
                UIK.viewmodel.map.setView(new L.LatLng($li.data('lat'), $li.data('lon')), 18);
                $('#target').show().delay(1000).fadeOut(1000);
                uikId = $li.data('id');
                $.getJSON(document['url_root'] + 'uik/' + uikId, function (data) {
                    if (!UIK.viewmodel.editable) {
                        UIK.viewmodel.uikSelected = data;
                        UIK.view.$document.trigger('/uik/editor/startEdit');
                    }
                });
            });
            $divSearchResults.prop('class', 'active');

            $divSearchResults = UIK.view.$uikspSearchResults.find('div');
            pointLayers = UIK.viewmodel.pointLayers.uiksp;

            $divSearchResults.empty();
            for (pointsType in pointLayers) {
                if (pointLayers.hasOwnProperty(pointsType)) {
                    html = UIK.templates.searchResultsTemplate({
                        cssClass: pointsConfig[pointsType].searchCssClass,
                        uiks: pointLayers[pointsType].elements,
                        isAuth: false
                    });
                    $divSearchResults.append(html);
                }
            }

            $divSearchResults.find('a.target').on('click', function () {
                var $li = $(this).parent();
                UIK.viewmodel.map.setView(new L.LatLng($li.data('lat'), $li.data('lon')), 18);
                $('#target').show().delay(1000).fadeOut(1000);
            });

            $divSearchResults.prop('class', 'active');
        },

        getHtmlForSearchResults: function (cssClass, uiks) {
            return UIK.templates.searchResultsTemplate({
                cssClass: cssClass,
                uiks: uiks,
                isAuth: UIK.viewmodel.isAuth
            });
        }
    });
})(jQuery, UIK);

(function ($, UIK) {
    $.extend(UIK.viewmodel, {

    });
    $.extend(UIK.view, {
        $activatedSearchTab: null
    });

    UIK.searcher.tab = {};

    $.extend(UIK.searcher.tab, {


        init: function () {
            this.setDomOptions();
            this.bindEvents();
        },


        setDomOptions: function () {
            UIK.view.$activatedSearchTab = UIK.view.$searchContainer.find('ul.nav li.active');
        },


        bindEvents: function () {
            var context = this,
                $tab;

            UIK.view.$searchContainer.find('ul.nav li').off('click').on('click', function (e) {
                $tab = $(this);
                if ($tab.data('id') !== UIK.view.$activatedSearchTab.data('id')) {
                    context.activateTab($tab);
                }
            });
        },


        activateTab: function ($tab) {
            var view = UIK.view;
            view.$activatedSearchTab.removeClass('active');
            view.$activatedSearchTab = $tab.addClass('active');
            view.$searchContainer.attr('class', $tab.data('id'));
        }

    });
})(jQuery, UIK);

(function ($, UIK) {
    $.extend(UIK.viewmodel, {
        editorCollapsed: false,
        editable: false,
        latlngEditable: {
            lat: {validated: null, marker: null, editor: null},
            lng: {validated: null, marker: null, editor: null},
            isNeedApplied: false,
            sourceCoordinates: null
        },
        markerEditable: null
    });

    $.extend(UIK.view, {
        $editorContainer: null
    });

    UIK.editor = {};
    $.extend(UIK.editor, {
        regex: { url: new RegExp("(https?)://[-A-Za-z0-9+&@#/%?=~_|!:,.;]*[-A-Za-z0-9+&@#/%=~_|]") },
        precisionDegree: 6,

        init: function () {
            this.setDomOptions();
            this.buildEditLayer();
            this.bindEvents();
        },

        setDomOptions: function () {
            UIK.view.$editorContainer = $('#editorContainer');
            UIK.viewmodel.editorCollapsed = UIK.view.$body.hasClass('editor-collapsed');
        },

        buildEditLayer: function () {
            var editedLayer = L.layerGroup();
            UIK.viewmodel.mapLayers['edit'] = editedLayer;
            UIK.viewmodel.map.addLayer(editedLayer);
        },

        bindEvents: function () {
            var context = this;
            UIK.view.$editorContainer.find('span.icon-collapse, div.title').off('click').on('click', function () {
                context.toggleEditor();
            });

            UIK.view.$document.on('/uik/editor/startEdit', function (e) {
                context.startAjaxEdition();
            });

            $('#save').off('click').on('click', function (e) {
                e.stopPropagation();
                context.save();
            });

            $('#discard').off('click').on('click', function (e) {
                var viewmodel = UIK.viewmodel;
                e.stopPropagation();
                if (!viewmodel.latlngEditable.sourceCoordinates.equals(viewmodel.markerEditable.getLatLng())) {
                    viewmodel.map.setView(viewmodel.latlngEditable.sourceCoordinates, 18);
                    $('#target').show().delay(1000).fadeOut(1000);
                }
                context.finishAjaxEdition();
            });

            $('#editorForm').find(':checkbox').off('click').on('click', function () {
                var checkbox = $(this),
                    hidden = $('#' + checkbox.data('id'));
                if (checkbox.is(':checked')) {
                    hidden.val(1);
                } else {
                    hidden.val(0);
                }
            });

            $('#lat, #lng').off('keyup').on('keyup', function (e) {
                context.coordinatesInputHandler(e, $(this));
            });

            $('#applyCoordinates').off('click').on('click', function () {
                context.applyCoordinates(UIK.viewmodel.latlngEditable);
            });

            $('#undoCoordinates').off('click').on('click', function () {
                context.undoCoordinates();
            });

            $('#resetCenter').off('click').on('click', function () {
                context.resetCenter();
            });


        },

        toggleEditor: function () {
            var editorCollapsed = !UIK.viewmodel.editorCollapsed;
            UIK.viewmodel.editorCollapsed = editorCollapsed;
            UIK.view.$body.toggleClass('editor-collapsed', editorCollapsed);
        },

        coordinatesInputHandler: function (e, $this) {
            var id = $this.attr('id'),
                value = $this.val(),
                latlngEditable = UIK.viewmodel.latlngEditable,
                currentCoordinateState = latlngEditable[id],
                preValidated = currentCoordinateState.validated,
                preDiffCoordinateState = currentCoordinateState.editor !== currentCoordinateState.marker,
                preIsCanApplied = latlngEditable.isNeedApplied;
            if (e.keyCode === 13) {
                if (latlngEditable.isNeedApplied) { this.applyCoordinates(latlngEditable); }
            } else {
                currentCoordinateState.validated = this.verifyDecimalDegree(value);
                if (currentCoordinateState.validated) {
                    value = parseFloat(value.replace(",", ".")).toFixed(this.precisionDegree);
                    currentCoordinateState.editor = value;
                } else {
                    UIK.alerts.showAlert('validateCoordinatesError');
                }
                latlngEditable.isNeedApplied = this.getIsCanApplied(latlngEditable);
                if (preIsCanApplied !== latlngEditable.isNeedApplied) {
                    $('#applyCoordinates').prop('disabled', !latlngEditable.isNeedApplied);
                }
                if (latlngEditable.isNeedApplied) {
                    UIK.alerts.showAlert('changeCoordinates');
                }
                if (preValidated !== currentCoordinateState.validated) {
                    $this.toggleClass('invalid', !currentCoordinateState.validated);
                } else if (preDiffCoordinateState !== (currentCoordinateState.editor !== currentCoordinateState.marker)) {
                    $this.toggleClass('need-apply', currentCoordinateState.editor !== currentCoordinateState.marker);
                }
            }
        },

        getIsCanApplied: function (latLngEditable) {
            if (!latLngEditable.lat.validated || !latLngEditable.lng.validated) {
                return false;
            }
            return latLngEditable.lat.editor !== latLngEditable.lat.marker ||
                latLngEditable.lng.editor !== latLngEditable.lng.marker;
        },

        verifyDecimalDegree: function (value) {
            return !/^\s*$/.test(value) && !isNaN(value);
        },

        applyCoordinates: function (latLngEditable) {
            var viewmodel = UIK.viewmodel,
                latlng = new L.LatLng(parseFloat(latLngEditable.lat.editor), parseFloat(latLngEditable.lng.editor));

            this.updateCoordinates(latlng);
            viewmodel.markerEditable.setLatLng(latlng);
            viewmodel.map.setView(latlng, 18);
            $('#target').show().delay(1000).fadeOut(1000);
            $('#lat, #lng').removeClass('need-apply');
            
            $('#undoCoordinates').prop('disabled', false);
        },

        undoCoordinates: function () {
            var viewmodel = UIK.viewmodel,
                latlng = new L.LatLng(viewmodel.uikSelected.uik.old_geom.lat, viewmodel.uikSelected.uik.old_geom.lng);

            this.updateCoordinates(latlng);
            viewmodel.markerEditable.setLatLng(latlng);
            viewmodel.map.setView(latlng, viewmodel.map.getZoom());

            $('#undoCoordinates').prop('disabled', true);
        },

        resetCenter: function () {
            var newCenter = UIK.viewmodel.map.getCenter();

            this.updateCoordinates(newCenter);
            UIK.viewmodel.markerEditable.setLatLng(newCenter);

            $('#undoCoordinates').prop('disabled', false);
        },

        startAjaxEdition: function () {
            var context = this;
            $.ajax({
                type: 'GET',
                url: document['url_root'] + 'uik/block/' + UIK.viewmodel.uikSelected.uik.id
            }).done(function () {
                context.startEdit();
            });
        },

        startEdit: function () {
            var viewmodel = UIK.viewmodel,
                view = UIK.view;
            view.$body.addClass('editable');
            if (viewmodel.editorCollapsed) { this.toggleEditor(); }
            view.$editorContainer.find('input, select, textarea, button').removeAttr('disabled');
            view.$editorContainer.find('form').removeClass('disabled');
            viewmodel.editable = true;
            this.startEditingGeometry(viewmodel.uikSelected.uik.geom.lat, viewmodel.uikSelected.uik.geom.lng);
            this.fillEditor(viewmodel.uikSelected);
            viewmodel.uikSelected.uik.old_geom = jQuery.extend({}, viewmodel.uikSelected.uik.geom);
            UIK.uiks.versions.showVersions();
            viewmodel.map.closePopup();
        },

        startEditingGeometry: function (lat, lng) {
            var context = this,
                marker = L.marker([lat, lng], {
                    icon: UIK.helpers.getIcon('stop-editable', 25),
                    draggable: true
                }),
                stringLat = lat.toFixed(this.precisionDegree),
                stringLng = lng.toFixed(this.precisionDegree);

            marker.on('dragend', function (e) {
                context.updateCoordinates(e.target.getLatLng());
                $('#undoCoordinates').prop('disabled', false);
            });
            UIK.viewmodel.mapLayers['edit'].addLayer(marker);

            $('#applyCoordinates').prop('disabled', true);
            $('#undoCoordinates').prop('disabled', true);

            UIK.viewmodel.latlngEditable = {
                lat: {validated: true, marker: stringLat, editor: stringLat},
                lng: {validated: true, marker: stringLng, editor: stringLng},
                isNeedApplied: false,
                sourceCoordinates: new L.LatLng(lat, lng)
            };
            UIK.viewmodel.markerEditable = marker;
        },

        updateCoordinates: function (latLng) {
            var lat = latLng.lat.toFixed(this.precisionDegree),
                lng = latLng.lng.toFixed(this.precisionDegree),
                viewmodel = UIK.viewmodel,
                isNeedApplied = viewmodel.latlngEditable.isNeedApplied,
                sourceCoordinates = viewmodel.latlngEditable.sourceCoordinates;

            viewmodel.uikSelected.uik.geom.lat = latLng.lat;
            viewmodel.uikSelected.uik.geom.lng = latLng.lng;

            if (isNeedApplied) { $('#applyCoordinates').prop('disabled', true); }

            viewmodel.latlngEditable = {
                lat: {validated: true, marker: lat, editor: lat},
                lng: {validated: true, marker: lng, editor: lng},
                isNeedApplied: false,
                sourceCoordinates: sourceCoordinates
            };

            $('#lat').val(lat);
            $('#lng').val(lng);
        },

        fillEditor: function (uik) {
            var helpers = UIK.helpers;
            $('#id').val(uik.uik.id).attr('disabled', 'disabled');
            $('#name').val(uik.uik.number_official).attr('disabled', 'disabled');
            $('#region').val(uik.region.name).attr('disabled', 'disabled');
            $('#tik').val(uik.tik.name).attr('disabled', 'disabled');
            $('#address_voting').val(helpers.valueNullToString(uik.uik.address_voting));
            $('#place_voting').val(helpers.valueNullToString(uik.uik.place_voting));
            $('#geo_precision option:eq(' + uik.geo_precision.id + ')').prop('selected', true);
            $('#lat').val(uik.uik.geom.lat.toFixed(this.precisionDegree));
            $('#lng').val(uik.uik.geom.lng.toFixed(this.precisionDegree));
            $('#comment').val(helpers.valueNullToString(uik.uik.comment));
            if (uik.uik.is_applied) {
                $('#is_applied').val(1);
                $('#chb_is_applied').prop('checked', true);
            } else {
                $('#is_applied').val(0);
                $('#chb_is_applied').prop('checked', false);
            }
        },

        save: function () {
            if (!this.verifyEditor()) {
                return;
            }
            var context = this,
                frm = $('#editorContainer form'),
                data_serialized = frm.serializeArray(),
                data_serialized_length = data_serialized.length,
                uik_selected = UIK.viewmodel.uikSelected,
                saved_uik = { 'id': uik_selected.uik.id },
                url = document['url_root'] + 'uik/' + saved_uik.id,
                i = 0;

            for (i; i < data_serialized_length; i += 1) {
                saved_uik[data_serialized[i].name] = data_serialized[i].value;
            }

            saved_uik.geom = uik_selected.uik.geom;

            $.ajax({
                type: 'POST',
                url: url,
                data: { 'uik': JSON.stringify(saved_uik)}
            }).done(function () {
                UIK.alerts.showAlert('saveSuccessful');
                context.finishEditing();
            }).error(function () {
                UIK.alerts.showAlert('saveError');
            });
        },

        verifyEditor: function () {
            var verificated = true,
                latLngEditable = UIK.viewmodel.latlngEditable;
            if (latLngEditable.isNeedApplied) {
                verificated = false;
                UIK.alerts.showAlert('notAppliedCoordinates');
            }
            if (!latLngEditable.lat.validated || !latLngEditable.lng.validated) {
                verificated = false;
                UIK.alerts.showAlert('validateCoordinatesError');
            }
            return verificated;
        },

        finishAjaxEdition: function () {
            var context = this;
            $.ajax({
                type: 'GET',
                url: document['url_root'] + 'uik/unblock/' + UIK.viewmodel.uikSelected.uik.id
            }).done(function () {
                context.finishEditing();
            });
        },

        finishEditing: function () {
            var vm = UIK.viewmodel,
                v = UIK.view;
            vm.map.closePopup();
            vm.mapLayers['edit'].clearLayers();
            vm.editable = false;
            v.$body.addClass('editable');
            v.$editorContainer.find('input, textarea').val('');
            v.$editorContainer.find('input:checkbox').prop('checked', false);
            v.$editorContainer.find('input, select, textarea, button').attr('disabled', 'disabled').removeClass('invalid');
            v.$editorContainer.find('form').addClass('disabled');
            UIK.view.$document.trigger('/uik/map/updateAllLayers');
        }
    });
})(jQuery, UIK);

(function ($, UIK) {
    $.extend(UIK.viewmodel, {
        uikSelected: null,
        uikSelectedId: null,
        pointLayers: {}
    });
    $.extend(UIK.view, {

    });
    UIK.uiks = {};
    $.extend(UIK.uiks, {
        init: function () {
            this.updatePoints();
            this.bindEvents();
        },


        bindEvents: function () {
            var context = this;
            UIK.view.$document.on('/uik/uiks/updateUiks', function () {
                context.updatePoints();
            });
        },


        updatePoints: function () {
            var validateZoom = this.validateZoom();
            this.clearLayers();
            if (!validateZoom) { return; }
            UIK.view.$document.trigger('/uik/uiks/startUpdate');
            this.updateUiksByAjax();
        },

        clearLayers: function () {
            var mapLayers = UIK.viewmodel.mapLayers;
            mapLayers.points.checked.clearLayers();
            mapLayers.points.unchecked.clearLayers();
            mapLayers.points.blocked.clearLayers();
        },

        updateUiksByAjax: function () {
            var context = this,
                url = document['url_root'] + 'uik/all',
                filter = UIK.viewmodel.filter,
                filter_json = {
                    'uik' : filter.uik.json,
                    'uik_2012' : filter.uik_2012.json
                };
            $.ajax({
                type: "GET",
                url: url,
                data: {
                    'bbox' : JSON.stringify(UIK.viewmodel.map.getBounds()),
                    'center' : JSON.stringify(UIK.viewmodel.map.getCenter()),
                    'filter' : JSON.stringify(filter_json)
                },
                dataType: 'json',
                success: function (data) {
                    context.renderUiks(data);
                    UIK.view.$document.trigger('/sm/searcher/update');
                    UIK.view.$document.trigger('/sm/stops/endUpdate');
                },
                context: context
            });
        },

        renderUiks: function (data) {
            var viewmodel = UIK.viewmodel,
                pointsLayers = viewmodel.mapLayers.points,
                pointsConfig = UIK.config.data.points,
                dataPointsLayers = data.data.points.layers,
                dataPointType,
                dataPointsIterable,
                dataPointsCount,
                dataPoint,
                icon,
                marker,
                i,
                htmlPopup = UIK.templates.uikPopupTemplate({ css: 'edit' }),
                context = this;

            viewmodel.pointLayers.uiks = data.data.points.layers;

            for (dataPointType in dataPointsLayers) {
                if (dataPointsLayers.hasOwnProperty(dataPointType)) {
                    dataPointsIterable = dataPointsLayers[dataPointType].elements;
                    dataPointsCount = dataPointsLayers[dataPointType].count;
                    if (dataPointsCount > 0) { icon = pointsConfig[dataPointType].createIcon(); }
                    for (i = 0; i < dataPointsCount; i += 1) {
                        dataPoint = dataPointsIterable[i];
                        marker = L.marker([dataPoint.lat, dataPoint.lon], {icon: icon}).on('click', function (e) {
                            var marker = e.target;
                            UIK.view.$document.trigger('/uik/map/openPopup', [marker.getLatLng(), htmlPopup]);
                            context.buildUikPopup(marker.id);
                        });
                        marker.id = dataPoint.id;
                        pointsLayers[dataPointType].addLayer(marker);
                    }
                }
            }
        },

        buildUikPopup: function (uikId) {
            return $.getJSON(document['url_root'] + 'uik/' + uikId, function (data) {
                if (!UIK.viewmodel.editable) {
                    UIK.viewmodel.uikSelected = data;
                }
                var html = UIK.templates.uikPopupInfoTemplate({
                    uik: data.uik,
                    tik: data.tik,
                    region: data.region,
                    geo_precision: data.geo_precision,
                    isUserEditor: UIK.viewmodel.isAuth,
                    editDenied: UIK.viewmodel.editable || data.uik.is_blocked,
                    isBlocked: data.uik.is_blocked,
                    userBlocked: data.uik.user_blocked,
                    isUnBlocked: data.uik.is_unblocked
                });
                $('#uik-popup').removeClass('loader').empty().append(html);
                $('button#edit').off('click').on('click', function () {
                    UIK.view.$document.trigger('/uik/editor/startEdit');
                });
                if (data.uik.is_unblocked) {
                    $('#unblock').off('click').on('click', function () {
                        $.ajax({
                            type: 'GET',
                            url: document['url_root'] + 'uik/unblock/' + UIK.viewmodel.uikSelected.uik.id
                        }).done(function () {
                                UIK.viewmodel.map.closePopup();
                                UIK.view.$document.trigger('/uik/map/updateAllLayers');
                        });
                    });
                }
            }).error(function () {
                    $('#uik-popup').removeClass('loader').empty().append('Error connection');
                });
        },

        validateZoom: function () {
            if (UIK.viewmodel.map.getZoom() < 14) {
                UIK.alerts.showAlert('zoom');
                return false;
            }
            return true;
        }
    });
})(jQuery, UIK);

(function ($, UIK) {
    $.extend(UIK.viewmodel, {
        uikSelected: null,
        uikSelectedId: null
    });

    $.extend(UIK.view, {
    });

    UIK.uiks_2012 = {};

    $.extend(UIK.uiks_2012, {
        init: function () {
            this.updatePoints();
            this.bindEvents();
        },

        bindEvents: function () {
            var context = this;
            UIK.view.$document.on('/uik/uiks_2012/updateUiks', function () {
                context.updatePoints();
            });
        },


        updatePoints: function () {
            var validateZoom = this.validateZoom();
            this.clearLayers();
            if (!validateZoom) { return; }
            UIK.view.$document.trigger('/uik/uiks_2012/startUpdate');
            this.updateUiksByAjax();
        },

        clearLayers: function () {
            UIK.viewmodel.mapLayers.points['uik_2012'].clearLayers();
        },

        updateUiksByAjax: function () {
            var context = this,
                url = document['url_root'] + 'uikp/all',
                filter = UIK.viewmodel.filter,
                filter_json = {
                    'uik' : filter.uik.json,
                    'uik_2012' : filter.uik_2012.json
                };
            $.ajax({
                type: "GET",
                url: url,
                data: {
                    'bbox' : JSON.stringify(UIK.viewmodel.map.getBounds()),
                    'center' : JSON.stringify(UIK.viewmodel.map.getCenter()),
                    'filter' : JSON.stringify(filter_json)
                },
                dataType: 'json',
                success: function (data) {
                    context.renderUiks(data);
                    UIK.view.$document.trigger('/sm/searcher/update');
                    UIK.view.$document.trigger('/sm/stops/endUpdate');
                },
                context: context
            });
        },

        renderUiks: function (data) {
            var viewmodel = UIK.viewmodel,
                pointsLayers = viewmodel.mapLayers.points,
                pointsConfig = UIK.config.data.points,
                dataPointsLayers = data.points.layers,
                dataPointType,
                dataPointsIterable,
                dataPointsCount,
                dataPoint,
                icon,
                marker,
                i,
                htmlPopup = UIK.templates.uikPopupTemplate({ css: 'edit' }),
                context = this;

            viewmodel.pointLayers.uiksp = data.points.layers;

            for (dataPointType in dataPointsLayers) {
                if (dataPointsLayers.hasOwnProperty(dataPointType)) {
                    dataPointsIterable = dataPointsLayers[dataPointType].elements;
                    dataPointsCount = dataPointsLayers[dataPointType].count;
                    if (dataPointsCount > 0) { icon = pointsConfig[dataPointType].createIcon(); }
                    for (i = 0; i < dataPointsCount; i += 1) {
                        dataPoint = dataPointsIterable[i];
                        marker = L.marker([dataPoint.lat, dataPoint.lon], {icon: icon}).on('click', function (e) {
                            var marker = e.target;
                            UIK.view.$document.trigger('/uik/map/openPopup', [marker.getLatLng(), htmlPopup]);
                            context.buildUikPopup(marker.id);
                        });
                        marker.id = dataPoint.id;
                        pointsLayers[dataPointType].addLayer(marker);
                    }
                }
            }
        },

        buildUikPopup: function (uikId) {
            return $.getJSON(document['url_root'] + 'uikp/' + uikId, function (data) {
                var html = UIK.templates.uik2012PopupInfoTemplate({
                    uikp: data.uikp
                });
                $('#uik-popup').removeClass('loader').empty().append(html);
            }).error(function () {
                $('#uik-popup').removeClass('loader').empty().append('Error connection');
            });
        },

        validateZoom: function () {
            if (UIK.viewmodel.map.getZoom() < 14) {
                UIK.alerts.showAlert('zoom');
                return false;
            }
            return true;
        }
    });
})(jQuery, UIK);(function ($, UIK) {
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
				success: function (data) {
					var html = UIK.templates.userLogsTemplate({
						user_logs: data.uiks_by_users,
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

(function ($, UIK) {

    $.extend(UIK.view, {
        $permalink: null,
        $fb_link: null
    });

    UIK.permalink = {};
    $.extend(UIK.permalink, {
        init: function () {
            this.setDomOptions();
            this.bindEvents();
        },


        setDomOptions: function () {
            UIK.view.$permalink = $('#permalink');
            UIK.view.$fb_link = $('#rightPanel a.facebook');
        },


        bindEvents: function () {
            UIK.view.$document.on('/uik/permalink/update', function (event, latlng, zoom) {
                var view = UIK.view,
                    url = document['url_root'] + '?lat=' + latlng.lat + '&lon=' + latlng.lng + '&zoom=' + zoom;
                view.$permalink.prop('href', url);
                view.$fb_link.prop('href', 'https://www.facebook.com/sharer/sharer.php?u=' + url);
            });
        }
    });
})(jQuery, UIK);
(function ($, UIK) {

    $.extend(UIK.viewmodel, {

    });

    $.extend(UIK.view, {
        $josmLink: null
    });

    UIK.josm = {};
    $.extend(UIK.josm, {

        init: function () {
            this.bindEvents();
            this.setDomOptions();
        },


        setDomOptions: function () {
            UIK.view.$josmLink = $('#josm-link');
        },


        bindEvents: function () {
            $('#json_link').on('mouseover', function() {
                var bounds = UIK.viewmodel.map.getBounds(),
                    link = ('http://127.0.0.1:8111/load_and_zoom?' +
                        'left=' + bounds.getNorthWest().lng +
                        '&top=' + bounds.getNorthWest().lat +
                        '&right=' + bounds.getSouthEast().lng +
                        '&bottom=' + bounds.getSouthEast().lat);
                $(this).attr('href', link);
            });
        }
    });

})(jQuery, UIK);
UIK.templates = {};
UIK.templates['versionsTemplate'] = Mustache.compile('<ul><li>v{{num}} {{text}} {{time}}</li></ul>');
UIK.templates['uikPopupInfoTemplate'] = Mustache.compile('<table class="table table-striped"> <tr> <td>Номер УИКа</td> <td>{{uik.number_official}}</td> </tr> <tr> <td>ТИК</td> <td>{{tik.name}}</td> </tr> <tr> <td>Регион</td> <td>{{region.name}}</td> </tr> <tr> <td>Адрес голосования</td> <td>{{uik.address_voting}}</td> </tr> <tr> <td>Место помещения голосования</td> <td>{{uik.place_voting}}</td> </tr> <tr> <td>Точность геокодирования</td> <td>{{geo_precision.name_ru}}</td> </tr> <tr> <td>Комментарий</td> <td>{{uik.comment}}</td> </tr> <tr> <td>Проверен</td> <td> {{#uik.is_applied}}Да{{/uik.is_applied}} {{^uik.is_applied}}Нет{{/uik.is_applied}} </td> </tr> {{#isBlocked}} <tr class="block"> {{#isUnBlocked}} <td>Заблокирована вами</td> <td> <button class="btn btn-small btn-primary block" id="unblock" type="button">Разблокировать</button> </td> {{/isUnBlocked}} {{^isUnBlocked}} <td>Заблокировал</td> <td>{{userBlocked}}</td> {{/isUnBlocked}} </tr> {{/isBlocked}} </table> {{#isUserEditor}} <div class="edit"> <button class="btn btn-small btn-primary {{#isBlock}}block{{/isBlock}}" id="edit" type="button" {{#editDenied}}disabled="disabled"{{/editDenied}}>Редактировать</button> </div> {{/isUserEditor}} ');
UIK.templates['osmPopupTemplate'] = Mustache.compile('<div class="osm-popup"> <div class="caption"> <span>{{id}}</span> <a href="{{link}}" target="_blank" title="Посмотреть на OpenStreetMaps" class="osm"></a> </div> <table class="table table-striped"> {{#tags}} <tr> <td>{{key}}</td> <td>{{val}}</td> </tr> {{/tags}} </table> </div>');
UIK.templates['uikPopupTemplate'] = Mustache.compile('<div id="uik-popup" class="{{css}} loader"></div>');
UIK.templates['alertsTemplate'] = Mustache.compile('<div id="alert_{{id}}" class="alert alert-{{type}}" style="display: none;"> <button type="button" class="close" data-dismiss="alert">&times;</button> <strong>{{statusText}}</strong> {{text}} </div>');
UIK.templates['userLogsTemplate'] = Mustache.compile('<table class="table table-striped logs"> <caption>Общая статистика</caption> <tr> <th>Показатель</th> <th>Значение</th> </tr> <tr> <td>Всего УИКов</td> <td class="stop">{{count_all}}</td> </tr> <tr> <td>Отредактировано УИКов</td> <td class="stop">{{count_editable}}</td> </tr> <tr> <td>Отредактировано, %</td> <td class="stop">{{percent}}</td> </tr> </table> <table class="table table-striped logs"> <caption>Статистика по пользователям</caption> <tr> <th>Пользователь</th> <th>Кол-во УИКов</th> </tr> {{#user_logs}} <tr> <td>{{user_name}}</td> <td class="stop">{{count_uiks}}</td> </tr> {{/user_logs}} </table>');
UIK.templates['uik2012PopupInfoTemplate'] = Mustache.compile('<table class="table table-striped"> <tr> <td>Номер УИКа</td> <td>{{uikp.name}}</td> </tr> <tr> <td>Адрес</td> <td>{{uikp.address}}</td> </tr> <tr> <td>Комментарий</td> <td>{{uikp.comment}}</td> </tr> </table> ');
UIK.templates['searchResultsTemplate'] = Mustache.compile('<ul class="{{cssClass}}"> {{#uiks}} <li data-lat={{lat}} data-lon={{lon}} data-id={{id}}> <span>{{name}}</span> {{addr}} <a class="target" title="Перейти к УИКу"></a> {{#isAuth}}<a class="edit" title="Редактировать УИК"></a>{{/isAuth}} </li> {{/uiks}} </ul>');
UIK.templates['.subl878'] = Mustache.compile('<ul><li>v{{num}} {{text}} {{time}}</li></ul>');
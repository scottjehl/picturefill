/* Modernizr 2.8.3 (Custom Build) | MIT & BSD
 * Build: http://modernizr.com/download/#-prefixes-css_calc
 */
;



window.Modernizr = (function( window, document, undefined ) {

	var version = '2.8.3',

	Modernizr = {},


	docElement = document.documentElement,

	mod = 'modernizr',
	modElem = document.createElement(mod),
	mStyle = modElem.style,

	inputElem  ,


	toString = {}.toString,

	prefixes = ' -webkit- -moz- -o- -ms- '.split(' '),



	tests = {},
	inputs = {},
	attrs = {},

	classes = [],

	slice = classes.slice,

	featureName,



	_hasOwnProperty = ({}).hasOwnProperty, hasOwnProp;

	if ( !is(_hasOwnProperty, 'undefined') && !is(_hasOwnProperty.call, 'undefined') ) {
	  hasOwnProp = function (object, property) {
		return _hasOwnProperty.call(object, property);
	  };
	}
	else {
	  hasOwnProp = function (object, property) {
		return ((property in object) && is(object.constructor.prototype[property], 'undefined'));
	  };
	}


	if (!Function.prototype.bind) {
	  Function.prototype.bind = function bind(that) {

		var target = this;

		if (typeof target != "function") {
			throw new TypeError();
		}

		var args = slice.call(arguments, 1),
			bound = function () {

			if (this instanceof bound) {

			  var F = function(){};
			  F.prototype = target.prototype;
			  var self = new F();

			  var result = target.apply(
				  self,
				  args.concat(slice.call(arguments))
			  );
			  if (Object(result) === result) {
				  return result;
			  }
			  return self;

			} else {

			  return target.apply(
				  that,
				  args.concat(slice.call(arguments))
			  );

			}

		};

		return bound;
	  };
	}

	function setCss( str ) {
		mStyle.cssText = str;
	}

	function setCssAll( str1, str2 ) {
		return setCss(prefixes.join(str1 + ';') + ( str2 || '' ));
	}

	function is( obj, type ) {
		return typeof obj === type;
	}

	function contains( str, substr ) {
		return !!~('' + str).indexOf(substr);
	}


	function testDOMProps( props, obj, elem ) {
		for ( var i in props ) {
			var item = obj[props[i]];
			if ( item !== undefined) {

							if (elem === false) return props[i];

							if (is(item, 'function')){
								return item.bind(elem || obj);
				}

							return item;
			}
		}
		return false;
	}
	for ( var feature in tests ) {
		if ( hasOwnProp(tests, feature) ) {
									featureName  = feature.toLowerCase();
			Modernizr[featureName] = tests[feature]();

			classes.push((Modernizr[featureName] ? '' : 'no-') + featureName);
		}
	}



	 Modernizr.addTest = function ( feature, test ) {
	   if ( typeof feature == 'object' ) {
		 for ( var key in feature ) {
		   if ( hasOwnProp( feature, key ) ) {
			 Modernizr.addTest( key, feature[ key ] );
		   }
		 }
	   } else {

		 feature = feature.toLowerCase();

		 if ( Modernizr[feature] !== undefined ) {
											  return Modernizr;
		 }

		 test = typeof test == 'function' ? test() : test;

		 if (typeof enableClasses !== "undefined" && enableClasses) {
		   docElement.className += ' ' + (test ? '' : 'no-') + feature;
		 }
		 Modernizr[feature] = test;

	   }

	   return Modernizr;
	 };


	setCss('');
	modElem = inputElem = null;


	Modernizr._version      = version;

	Modernizr._prefixes     = prefixes;

	return Modernizr;

})(this, this.document);
// Method of allowing calculated values for length units, i.e. width: calc(100%-3em) http://caniuse.com/#search=calc
// By @calvein

Modernizr.addTest('csscalc', function() {
	var prop = 'width:';
	var value = 'calc(10px);';
	var el = document.createElement('div');

	el.style.cssText = prop + Modernizr._prefixes.join(value + prop);

	return !!el.style.length;
});
;

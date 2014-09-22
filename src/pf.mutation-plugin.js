(function( factory ) {
	"use strict";
	if ( window.picturefill ) {
		factory( window.picturefill );
		factory = function() {};
	} else if ( typeof define === "function" && define.amd ) {
		// AMD. Register as an anonymous module.
		require( [ "picturefill" ], factory );
	} else if ( typeof module === "object" && typeof exports === "object" ) {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like environments that support module.exports,
		// like Node.
		module.exports = factory( require("picturefill") );
	} else {
		throw( "you need to include picturefill" );
	}

}( function( picturefill ) {
	"use strict";

	var document = window.document;
	var Element = window.Element;
	var MutationObserver = window.MutationObserver;
	var noop = function() {};
	var jQuery = window.jQuery;
	var pfobserver = {
		disconnect: noop,
		take: noop,
		observe: noop,
		start: noop,
		stop: noop,
		connected: false
	};

	if ( !picturefill._ ) {return pfobserver;}
	var matches, addMutation;
	var pf = picturefill._;
	var observeProps = { src: 1, srcset: 1, sizes: 1, media: 1, width: 1, height: 1 };

	pf.onMutations = function( mutations ) {
		var i, len, opts, img;
		var modifiedImgs = [];

		for (i = 0, len = mutations.length; i < len; i++) {
			if ( pf.isReady && mutations[i].type === "childList" ) {
				pf.onSubtreeChange( mutations[i], modifiedImgs );
			} else if ( mutations[i].type === "attributes" ) {
				pf.onAttrChange( mutations[i], modifiedImgs );
			}
		}

		if ( modifiedImgs.length ) {
			pf.setupRun();

			for ( i = 0, len = modifiedImgs.length; i < len; i++ ) {
				img = modifiedImgs[i];
				opts = {
					elements: [ img ],
					reparse: true,
					reevaluate: true
				};

				if ( img._pfOptions ) {
					opts.reparseSrc = img._pfOptions.reparseSrc || false;
					opts.reparseSrcset = img._pfOptions.reparseSrcset || false;
					opts.reparseDimensions = img._pfOptions.reparseDimensions || false;
					delete img._pfOptions;
				}

				pf.fillImg( img, opts );
			}

			pf.teardownRun();
		}
	};

	var elemProto = Element && Element.prototype;

	if ( elemProto && !elemProto.matches ) {
		elemProto.matches = elemProto.matchesSelector || elemProto.mozMatchesSelector || elemProto.webkitMatchesSelector || elemProto.msMatchesSelector;
	}

	if ( elemProto && elemProto.matches ) {
		matches = function( elem, sel ) {
			return elem.matches( sel );
		};
	} else {
		matches = function( elem, sel ) {
			return jQuery && jQuery.find.matchesSelector( elem, sel );
		};
	}

	pf.onSubtreeChange = function( mutations, imgs ) {
		pf.findAddedMutations( mutations.addedNodes, imgs );
		pf.findRemovedMutations( mutations.removedNodes, mutations.target, imgs );
	};

	pf.findAddedMutations = function( nodes, imgs ) {
		var i, len, node, nodeName;
		for ( i = 0, len = nodes.length; i < len; i++ ){
			node = nodes[i];
			if ( node.nodeType !== 1 ) {continue;}

			nodeName = node.nodeName.toUpperCase();

			if ( nodeName === "PICTURE" ) {
				pf.addToElements( node.getElementsByTagName( "img" )[0], imgs );
			} else if ( nodeName === "IMG" && matches( node, pf.selector ) ){
				pf.addToElements( node, imgs );
			} else if ( nodeName === "SOURCE" ) {
				pf.addImgForSource( node, node.parentNode, imgs );
			} else {
				pf.addToElements( pf.qsa( node, pf.selector ), imgs );
			}
		}
	};

	pf.findRemovedMutations = function( nodes, target, imgs ) {
		var i, len, node;
		for ( i = 0, len = nodes.length; i < len; i++ ) {
			node = nodes[i];
			if ( node.nodeType !== 1 ) {continue;}
			if ( node.nodeName.toUpperCase() === "SOURCE" ) {
				pf.addImgForSource( node, target, imgs );
			}
		}
	};

	pf.addImgForSource = function( node, parent, imgs ) {
		if ( parent && ( parent.nodeName || "" ).toUpperCase() !== "PICTURE" ) {
			parent = parent.parentNode;
		}
		if ( !parent || ( parent.nodeName || "" ).toUpperCase() !== "PICTURE" ) {
			return;
		}
		pf.addToElements( parent.getElementsByTagName( "img" )[0], imgs );
	};

	pf.addToElements = function( img, imgs ) {
		var i, len;
		if ( img ) {
			if ( ("length" in img) && !img.nodeType ){
				for ( i = 0, len = img.length; i < len; i++ ) {
					pf.addToElements( img[i], imgs );
				}
			} else if ( imgs.indexOf(img) === -1 ) {
				imgs.push( img );
			}
		}
	};

	pf.onAttrChange = function( mutation, modifiedImgs ) {
		var nodeName = mutation.target.nodeName.toUpperCase();
		var isImg = nodeName === "IMG";
		if ( mutation.attributeName === "src" ){
			if ( isImg && matches( mutation.target, pf.selector ) ) {
				if ( !mutation.target._pfOptions ) {
					mutation.target._pfOptions = {};
				}
				mutation.target._pfOptions.reparseSrc = true;
				pf.addToElements( mutation.target, modifiedImgs );
			}
		} else {
			if ( isImg ) {
				if ( mutation.attributeName === "srcset" ) {
					if ( !mutation.target._pfOptions ) {
						mutation.target._pfOptions = {};
					}
					mutation.target._pfOptions.reparseSrcset = true;
				} else if ( mutation.attributeName === "width" || mutation.attributeName === "height" ) {
					if ( !matches( mutation.target, pf.selector ) ) {
						return;
					}
					if ( !mutation.target._pfOptions ) {
						mutation.target._pfOptions = {};
					}
					mutation.target._pfOptions.reparseDimensions = true;
				}
				pf.addToElements( mutation.target, modifiedImgs );
			} else if ( nodeName === "SOURCE" ) {
				pf.addImgForSource( mutation.target, mutation.target.parentNode, modifiedImgs );
			}
		}
	};

	function createObserver() {
		var allowConnect = true;
		var sup = {};
		var monkeyPatch = function( name, fn ) {
			sup[ name ] = pf[ name ];
			pf[ name ] = fn;
		};
		var attrFilter = Object.keys( observeProps );
		var config = { attributes: true, childList: true, subtree: true, attributeFilter: attrFilter };

		var observer = new MutationObserver( pf.onMutations );

		monkeyPatch( "setupRun", function() {
			pfobserver.disconnect();
			return sup.setupRun.apply( this, arguments );
		});

		monkeyPatch( "teardownRun", function() {
			var ret = sup.setupRun.apply( this, arguments );
			pfobserver.observe();
			return ret;
		});

		monkeyPatch( "setSrc", function() {
			var ret;
			var wasConnected = pfobserver.connected;

			if ( wasConnected ) {
				pfobserver.disconnect();
			}

			ret = sup.setSrc.apply( this, arguments );

			if ( wasConnected ) {
				pfobserver.observe();
			}

			return ret;
		});

		monkeyPatch( "addDimensions", function() {
			var ret;
			var wasConnected = pfobserver.connected;

			if ( wasConnected ) {
				pfobserver.disconnect();
			}

			ret = sup.addDimensions.apply( this, arguments );

			if ( wasConnected ) {
				pfobserver.observe();
			}

			return ret;
		});

		pfobserver.observe = function() {
			if ( allowConnect ) {
				pfobserver.connected = true;
				observer.observe( document.body, config );
			}
		};

		pfobserver.disconnect = function() {
			pfobserver.connected = false;
			observer.disconnect();
		};

		pfobserver.take = function() {
			pf.onMutations( observer.takeRecords() );
			if ( addMutation.take ) {
				addMutation.take();
			}
		};

		pfobserver.start = function() {
			allowConnect = true;
			pfobserver.observe();
		};

		pfobserver.stop = function() {
			allowConnect = false;
			pfobserver.disconnect();
		};

		pfobserver.start();
	}

	(function() {
		var i;
		var domMethods = [ "appendChild", "insertBefore", "removeChild" ];

		addMutation = (function() {
			var running = false;
			var mutations = [];
			var setImmediate = window.setImmediate || window.setTimeout;
			return window.HTMLPictureElement ?
				noop :
				function(mutation) {
				if ( !running ) {
					running = true;
					if ( !addMutation.take ) {
						addMutation.take = function() {
							if ( mutations.length ) {
								pf.onMutations( mutations );
								mutations = [];
							}
							running = false;
						};
					}
					setImmediate( addMutation.take );
				}
				mutations.push( mutation );
			};
		})();

		picturefill.html = function( dom, html ) {
			pfobserver.disconnect();
			dom.innerHTML = html;
			addMutation( { type: "childList", addedNodes: [ dom ], removedNodes: [] } );
			pfobserver.observe();
		};

		for ( i = 0; i < domMethods.length; i++ ) {
			/*jshint loopfunc: true */
			(function( fnName ) {
				picturefill[ fnName ] = function( main, dom ) {
					var mutation = fnName === "removeChild" ?
						{ type: "childList", addedNodes: [], removedNodes: [ dom ], target: main } :
						{ type: "childList", addedNodes: [ dom ], removedNodes: [], target: main };

					pfobserver.disconnect();
					main[ fnName ]( dom );
					addMutation( mutation );
					pfobserver.observe();
				};
			})( domMethods[ i ] );
			/*jshint loopfunc: false */
		}

		//only setter || no getter (a normalized getter would be great?, nut then we should do it using IMAGE.prototype/SOURCE.prototype)
		picturefill.props = function(dom, props) {
			var prop, value, tmpObj;
			if ( typeof props === "string" ) {
				tmpObj = {};
				tmpObj[props] = arguments[2];
				props = tmpObj;
			}

			pfobserver.disconnect();

			for ( prop in props ) {
				value = props[prop];
				if ( value === null ) {
					dom.removeAttribute(prop);
				} else if ( prop in dom ) {
					dom[prop] = value;
				} else {
					dom.setAttribute( prop, value );
				}

				if ( observeProps[ prop ] ) {
					addMutation( { type: "attributes", target: dom, attributeName: prop } );
				}
			}

			pfobserver.observe();

		};

		//additionally we could also add jQuery attribute hooks?
	})();

	if ( !window.HTMLPictureElement && MutationObserver ) {
		createObserver();
	}

	pf.observer = pfobserver;

	return pfobserver;
}));

(function( factory ) {
	"use strict";
	var interValId;
	var intervalIndex = 0;
	var run = function() {
		if ( window.picturefill ) {
			factory( window.picturefill );
		}
		if (window.picturefill || intervalIndex > 9999) {
			clearInterval(interValId);
		}
		intervalIndex++;
	};
	interValId = setInterval(run, 8);

	run();

}( function( picturefill ) {
	"use strict";

	var document = window.document;
	var Element = window.Element;
	var MutationObserver = window.MutationObserver;
	var noop = function() {};
	var pfObserver = {
		disconnect: noop,
		take: noop,
		observe: noop,
		start: noop,
		stop: noop,
		connected: false
	};
	var isReady = /^loade|^c|^i/.test(document.readyState || "");
	var pf = picturefill._;
	pf.mutationSupport = false;
	pf.observer = pfObserver;
	if ( !Object.keys || !window.HTMLSourceElement || !document.addEventListener) {
		return;
	}
	var matches, observer, allowConnect, addMutation;

	var observeProps = { src: 1, srcset: 1, sizes: 1, media: 1 };
	var attrFilter = Object.keys( observeProps );
	var config = { attributes: true, childList: true, subtree: true, attributeFilter: attrFilter };
	var elemProto = Element && Element.prototype;
	var sup = {};
	var monkeyPatch = function( name, fn ) {
		sup[ name ] = pf[ name ];
		pf[ name ] = fn;
	};

	if ( elemProto && !elemProto.matches ) {
		elemProto.matches = elemProto.matchesSelector || elemProto.mozMatchesSelector || elemProto.webkitMatchesSelector || elemProto.msMatchesSelector;
	}

	if ( elemProto && elemProto.matches ) {
		matches = function( elem, sel ) {
			return elem.matches( sel );
		};
		pf.mutationSupport = !!( Object.create && Object.defineProperties );
	}

	if ( !pf.mutationSupport ) {
		return;
	}

	pfObserver.observe = function() {
		if ( allowConnect ) {
			pfObserver.connected = true;
			if ( observer ) {
				observer.observe( document.documentElement, config );
			}
		}
	};

	pfObserver.disconnect = function() {
		pfObserver.connected = false;
		if ( observer ) {
			observer.disconnect();
		}
	};

	pfObserver.take = function() {
		if ( observer ) {
			pf.onMutations( observer.takeRecords() );
		} else if ( addMutation ) {
			addMutation.take();
		}
	};

	pfObserver.start = function() {
		allowConnect = true;
		pfObserver.observe();
	};

	pfObserver.stop = function() {
		allowConnect = false;
		pfObserver.disconnect();
	};

	monkeyPatch( "setupRun", function() {
		pfObserver.disconnect();
		return sup.setupRun.apply( this, arguments );
	});

	monkeyPatch( "teardownRun", function() {
		var ret = sup.setupRun.apply( this, arguments );
		pfObserver.observe();
		return ret;
	});

	monkeyPatch( "setSrc", function() {
		var ret;
		var wasConnected = pfObserver.connected;
		pfObserver.disconnect();
		ret = sup.setSrc.apply( this, arguments );
		if ( wasConnected ) {
			pfObserver.observe();
		}
		return ret;
	});

	pf.onMutations = function( mutations ) {
		var i, len;
		var modifiedImgs = [];

		for (i = 0, len = mutations.length; i < len; i++) {
			if ( isReady && mutations[i].type === "childList" ) {
				pf.onSubtreeChange( mutations[i], modifiedImgs );
			} else if ( mutations[i].type === "attributes" ) {
				pf.onAttrChange( mutations[i], modifiedImgs );
			}
		}

		if ( modifiedImgs.length ) {

			pf.fillImgs({
				elements: modifiedImgs,
				reevaluate: true
			});
		}
	};

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
			} else if ( nodeName === "IMG" && matches( node, pf.selShort ) ){
				pf.addToElements( node, imgs );
			} else if ( nodeName === "SOURCE" ) {
				pf.addImgForSource( node, node.parentNode, imgs );
			} else {
				pf.addToElements( pf.qsa( node, pf.selShort ), imgs );
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

			if (!parent || ( parent.nodeName || "" ).toUpperCase() !== "PICTURE" ) {
				parent = null;
			}
		}

		if (parent) {
			pf.addToElements( parent.getElementsByTagName( "img" )[0], imgs );
		}
	};

	pf.addToElements = function( img, imgs ) {
		var i, len;
		if ( img ) {
			if ( ("length" in img) && !img.nodeType ){
				for ( i = 0, len = img.length; i < len; i++ ) {
					pf.addToElements( img[i], imgs );
				}
			} else if ( img.parentNode && imgs.indexOf(img) === -1 ) {
				imgs.push( img );
			}
		}
	};

	pf.onAttrChange = function( mutation, modifiedImgs ) {
		var nodeName;
		var riData = mutation.target[ pf.ns ];

		if ( !riData &&
			mutation.attributeName === "srcset" &&
			(nodeName = mutation.target.nodeName.toUpperCase()) === "IMG" ) {
			pf.addToElements( mutation.target, modifiedImgs );
		} else if ( riData ) {
			if (!nodeName) {
				nodeName = mutation.target.nodeName.toUpperCase();
			}

			if ( nodeName === "IMG" ) {
				if ( mutation.attributeName in riData ) {
					riData[ mutation.attributeName ] = undefined;
				}
				pf.addToElements( mutation.target, modifiedImgs );
			} else if ( nodeName === "SOURCE" ) {
				pf.addImgForSource( mutation.target, mutation.target.parentNode, modifiedImgs );
			}
		}
	};

	if ( !window.HTMLPictureElement ) {

		if ( MutationObserver && !pf.testMutationEvents ) {
			observer = new MutationObserver( pf.onMutations );
		} else {

			addMutation = (function() {
				var running = false;
				var mutations = [];
				var setImmediate = window.setImmediate || window.setTimeout;
				return function(mutation) {
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

			document.documentElement.addEventListener( "DOMNodeInserted", function( e ) {
				if ( pfObserver.connected && isReady ) {
					addMutation( { type: "childList", addedNodes: [ e.target ], removedNodes: [] } );
				}
			}, true);

			document.documentElement.addEventListener( "DOMNodeRemoved", function( e ) {

				if ( pfObserver.connected && isReady && (e.target || {}).nodeName === "SOURCE") {
					addMutation( { type: "childList", addedNodes: [], removedNodes: [ e.target ], target: e.target.parentNode } );
				}
			}, true);

			document.documentElement.addEventListener( "DOMAttrModified", function( e ) {
				if ( pfObserver.connected && observeProps[e.attrName] ) {
					addMutation( { type: "attributes", target: e.target, attributeName: e.attrName } );
				}
			}, true);
		}

		if ( window.HTMLImageElement && Object.defineProperties ) {

			(function() {

				var image = document.createElement( "img" );
				var imgIdls = [];
				var getImgAttr = image.getAttribute;
				var setImgAttr = image.setAttribute;
				var GETIMGATTRS = {
					src: 1
				};

				if ( pf.supSrcset && !pf.supSizes ) {
					GETIMGATTRS.srcset = 1;
				}

				Object.defineProperties(HTMLImageElement.prototype, {
					getAttribute: {
						value: function( attr ) {
							var internal;
							if ( GETIMGATTRS[ attr ] && (internal = this[ pf.ns ]) && ( internal[attr] !== undefined ) ) {
								return internal[ attr ];
							}
							return getImgAttr.apply( this, arguments );
						},
						writeable: true,
						enumerable: true,
						configurable: true
					}
				});

				if (!pf.supSrcset) {
					imgIdls.push("srcset");
				}

				if (!pf.supSizes) {
					imgIdls.push("sizes");
				}

				imgIdls.forEach(function(idl) {
					Object.defineProperty(HTMLImageElement.prototype, idl, {
						set: function( value ) {
							setImgAttr.call( this, idl, value );
						},
						get: function() {
							return getImgAttr.call( this, idl ) || "";
						},
						enumerable: true,
						configurable: true
					});
				});

				if (!("currentSrc" in image)) {
					(function() {
						var ascendingSort;
						var updateCurSrc = function(elem, src) {
							if (src == null) {
								src = elem.src || "";
							}

							Object.defineProperty(elem, "pfCurrentSrc", {
								value: src,
								writable: true
							});
						};
						var baseUpdateCurSrc = updateCurSrc;

						if (pf.supSrcset && window.devicePixelRatio) {
							ascendingSort = function( a, b ) {
								var aRes = a.d || a.w || a.res;
								var bRes = b.d || b.w || b.res;
								return aRes - bRes;
							};

							updateCurSrc = function(elem) {
								var i, cands, length, ret;
								var imageData = elem[ pf.ns ];

								if ( imageData && imageData.supported && imageData.srcset && imageData.sets && (cands = pf.parseSet(imageData.sets[0])) && cands.sort) {

									cands.sort( ascendingSort );
									length = cands.length;
									ret = cands[ length - 1 ];

									for (i = 0; i < length; i++) {
										if (cands[i].d >= window.devicePixelRatio) {
											ret = cands[i];
											break;
										}
									}

									if (ret) {
										ret = pf.makeUrl(ret.url);
									}
								}
								baseUpdateCurSrc(elem, ret);
							};
						}

						document.addEventListener("load", function(e) {
							if (e.target.nodeName.toUpperCase() === "IMG") {
								updateCurSrc(e.target);
							}
						}, true);

						Object.defineProperty(HTMLImageElement.prototype, "currentSrc", {
							set: function() {
								if (window.console && console.warn) {
									console.warn("currentSrc can't be set on img element");
								}
							},
							get: function() {
								if (this.complete) {
									updateCurSrc(this);
								}
								//IE is never complete if no src/srcset available
								return (!this.src && !this.srcset) ? "" : this.pfCurrentSrc || "";
							},
							enumerable: true,
							configurable: true
						});
					})();
				}

				if (window.HTMLSourceElement && !("srcset" in document.createElement("source"))) {

					[ "srcset", "sizes" ].forEach(function(idl) {
						Object.defineProperty(window.HTMLSourceElement.prototype, idl, {
							set: function( value ) {
								this.setAttribute( idl, value );
							},
							get: function() {
								return this.getAttribute( idl ) || "";
							},
							enumerable: true,
							configurable: true
						});
					});
				}

			})();
		}

		pfObserver.start();
	}
	if ( !isReady ) {
		document.addEventListener("DOMContentLoaded", function() {
			isReady = true;
		});
	}
}));

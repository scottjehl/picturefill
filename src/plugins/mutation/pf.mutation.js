(function( factory ) {
	"use strict";
	var interValId;
	var intervalIndex = 0;
	var run = function(){
		if ( window.picturefill ) {
			factory( window.picturefill );
		}
		if(window.picturefill || intervalIndex > 9999){
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
	var riobserver = {
		disconnect: noop,
		take: noop,
		observe: noop,
		start: noop,
		stop: noop,
		connected: false
	};
	var isReady = /^loade|^c|^i/.test(document.readyState || "");
	var ri = picturefill._;
	ri.mutationSupport = false;
	ri.observer = riobserver;
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
		sup[ name ] = ri[ name ];
		ri[ name ] = fn;
	};

	if ( elemProto && !elemProto.matches ) {
		elemProto.matches = elemProto.matchesSelector || elemProto.mozMatchesSelector || elemProto.webkitMatchesSelector || elemProto.msMatchesSelector;
	}

	if ( elemProto && elemProto.matches ) {
		matches = function( elem, sel ) {
			return elem.matches( sel );
		};
		ri.mutationSupport = !!( Object.create && Object.defineProperties );
	}

	if ( !ri.mutationSupport ) {
		return;
	}

	riobserver.observe = function() {
		if ( allowConnect ) {
			riobserver.connected = true;
			if ( observer ) {
				observer.observe( document.documentElement, config );
			}
		}
	};

	riobserver.disconnect = function() {
		riobserver.connected = false;
		if ( observer ) {
			observer.disconnect();
		}
	};

	riobserver.take = function() {
		if ( observer ) {
			ri.onMutations( observer.takeRecords() );
		} else if ( addMutation ) {
			addMutation.take();
		}
	};

	riobserver.start = function() {
		allowConnect = true;
		riobserver.observe();
	};

	riobserver.stop = function() {
		allowConnect = false;
		riobserver.disconnect();
	};

	monkeyPatch( "setupRun", function() {
		riobserver.disconnect();
		return sup.setupRun.apply( this, arguments );
	});

	monkeyPatch( "teardownRun", function() {
		var ret = sup.setupRun.apply( this, arguments );
		riobserver.observe();
		return ret;
	});

	monkeyPatch( "setSrc", function() {
		var ret;
		var wasConnected = riobserver.connected;
		riobserver.disconnect();
		ret = sup.setSrc.apply( this, arguments );
		if ( wasConnected ) {
			riobserver.observe();
		}
		return ret;
	});

	ri.onMutations = function( mutations ) {
		var i, len;
		var modifiedImgs = [];

		for (i = 0, len = mutations.length; i < len; i++) {
			if ( isReady && mutations[i].type === "childList" ) {
				ri.onSubtreeChange( mutations[i], modifiedImgs );
			} else if ( mutations[i].type === "attributes" ) {
				ri.onAttrChange( mutations[i], modifiedImgs );
			}
		}

		if ( modifiedImgs.length ) {

			ri.fillImgs({
				elements: modifiedImgs,
				reevaluate: true
			});
		}
	};

	ri.onSubtreeChange = function( mutations, imgs ) {
		ri.findAddedMutations( mutations.addedNodes, imgs );
		ri.findRemovedMutations( mutations.removedNodes, mutations.target, imgs );
	};

	ri.findAddedMutations = function( nodes, imgs ) {
		var i, len, node, nodeName;
		for ( i = 0, len = nodes.length; i < len; i++ ){
			node = nodes[i];
			if ( node.nodeType !== 1 ) {continue;}

			nodeName = node.nodeName.toUpperCase();

			if ( nodeName === "PICTURE" ) {
				ri.addToElements( node.getElementsByTagName( "img" )[0], imgs );
			} else if ( nodeName === "IMG" && matches( node, ri.selShort ) ){
				ri.addToElements( node, imgs );
			} else if ( nodeName === "SOURCE" ) {
				ri.addImgForSource( node, node.parentNode, imgs );
			} else {
				ri.addToElements( ri.qsa( node, ri.selShort ), imgs );
			}
		}
	};

	ri.findRemovedMutations = function( nodes, target, imgs ) {
		var i, len, node;
		for ( i = 0, len = nodes.length; i < len; i++ ) {
			node = nodes[i];
			if ( node.nodeType !== 1 ) {continue;}
			if ( node.nodeName.toUpperCase() === "SOURCE" ) {
				ri.addImgForSource( node, target, imgs );
			}
		}
	};

	ri.addImgForSource = function( node, parent, imgs ) {
		if ( parent && ( parent.nodeName || "" ).toUpperCase() !== "PICTURE" ) {
			parent = parent.parentNode;

			if(!parent || ( parent.nodeName || "" ).toUpperCase() !== "PICTURE" ) {
				parent = null;
			}
		}

		if(parent){
			ri.addToElements( parent.getElementsByTagName( "img" )[0], imgs );
		}
	};

	ri.addToElements = function( img, imgs ) {
		var i, len;
		if ( img ) {
			if ( ("length" in img) && !img.nodeType ){
				for ( i = 0, len = img.length; i < len; i++ ) {
					ri.addToElements( img[i], imgs );
				}
			} else if ( img.parentNode && imgs.indexOf(img) === -1 ) {
				imgs.push( img );
			}
		}
	};

	ri.onAttrChange = function( mutation, modifiedImgs ) {
		var nodeName;
		var riData = mutation.target[ ri.ns ];

		if ( !riData &&
			mutation.attributeName === "srcset" &&
			mutation.target.nodeName.toUpperCase() === "IMG" ) {
			ri.addToElements( mutation.target, modifiedImgs );
		} else if ( riData ) {
			nodeName = mutation.target.nodeName.toUpperCase();

			if ( nodeName === "IMG" ) {
				if ( mutation.attributeName in riData ) {
					riData[ mutation.attributeName ] = undefined;

					if ( mutation.attributeName === "src" || ( ri.supSrcset && mutation.attributeName === "srcset" ) ) {
						riData.curCan = null;
						riData.curSrc = undefined;
					}
				}
				ri.addToElements( mutation.target, modifiedImgs );
			} else if ( nodeName === "SOURCE" ) {
				ri.addImgForSource( mutation.target, mutation.target.parentNode, modifiedImgs );
			}
		}
	};

	if ( !window.HTMLPictureElement ) {

		if ( MutationObserver && !ri.testMutationEvents ) {
			observer = new MutationObserver( ri.onMutations );
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
									ri.onMutations( mutations );
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
				if ( riobserver.connected && isReady ) {
					addMutation( { type: "childList", addedNodes: [ e.target ], removedNodes: [] } );
				}
			}, true);

			document.documentElement.addEventListener( "DOMNodeRemoved", function( e ) {

				if ( riobserver.connected && isReady && (e.target || {}).nodeName == 'SOURCE') {
					addMutation( { type: "childList", addedNodes: [], removedNodes: [ e.target ], target: e.target.parentNode } );
				}
			}, true);

			document.documentElement.addEventListener( "DOMAttrModified", function( e ) {
				if ( riobserver.connected && observeProps[e.attrName] ) {
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

				if ( ri.supSrcset && !ri.supSizes ) {
					GETIMGATTRS.srcset = 1;
				}

				Object.defineProperties(HTMLImageElement.prototype, {
					getAttribute: {
						value: function( attr ) {
							var internal;
							if ( GETIMGATTRS[ attr ] && (internal = this[ ri.ns ]) && ( internal[attr] !== undefined ) ) {
								return internal[ attr ];
							}
							return getImgAttr.apply( this, arguments );
						},
						writeable: true,
						enumerable: true,
						configurable: true
					}
				});

				if(!ri.supSrcset){
					imgIdls.push('srcset');
				}

				if(!ri.supSizes){
					imgIdls.push('sizes');
				}

				imgIdls.forEach(function(idl){
					Object.defineProperty(HTMLImageElement.prototype, idl, {
						set: function( value ) {
							setImgAttr.call( this, idl, value );
						},
						get: function() {
							return getImgAttr.call( this, idl ) || '';
						},
						enumerable: true,
						configurable: true
					});
				});

				if(!('currentSrc' in image)){
					(function(){
						var ascendingSort;
						var updateCurSrc = function(elem, src) {
							if (src == null) {
								src = elem.src || '';
							}

							Object.defineProperty(elem, 'pfCurrentSrc', {
								value: src,
								writable: true
							});
						};
						var baseUpdateCurSrc = updateCurSrc;

						if(ri.supSrcset && window.devicePixelRatio){
							ascendingSort = function( a, b ) {
								var aRes = a.d || a.w || a.res;
								var bRes = b.d || b.w || b.res;
								return aRes - bRes;
							};

							updateCurSrc = function(elem) {
								var i, cands, length, ret;
								var imageData = elem[ ri.ns ];

								if ( imageData && imageData.supported && imageData.srcset && imageData.sets && (cands = ri.parseSet(imageData.sets[0])) && cands.sort) {

									cands.sort( ascendingSort );
									length = cands.length;
									ret = cands[ length - 1 ];

									for(i = 0; i < length; i++){
										if(cands[i].d >= window.devicePixelRatio){
											ret = cands[i];
											break;
										}
									}

									if(ret){
										ret = ri.makeUrl(ret.url);
									}
								}
								baseUpdateCurSrc(elem, ret);
							};
						}

						document.addEventListener('load', function(e) {
							if (e.target.nodeName.toUpperCase() == 'IMG') {
								updateCurSrc(e.target);
							}
						}, true);

						Object.defineProperty(HTMLImageElement.prototype, 'currentSrc', {
							set: function() {
								if(window.console && console.warn){
									console.warn('currentSrc can\'t be set on img element');
								}
							},
							get: function() {
								if (this.complete) {
									updateCurSrc(this);
								}
								return this.pfCurrentSrc || '';
							},
							enumerable: true,
							configurable: true
						});
					})();
				}

				if(window.HTMLSourceElement && !('srcset' in document.createElement('source'))){

					['srcset', 'sizes'].forEach(function(idl){
						Object.defineProperty(HTMLSourceElement.prototype, idl, {
							set: function( value ) {
								this.setAttribute( idl, value );
							},
							get: function() {
								return this.getAttribute( idl ) || '';
							},
							enumerable: true,
							configurable: true
						});
					});
				}

			})();
		}

		riobserver.start();
	}
	if ( !isReady ) {
		document.addEventListener("DOMContentLoaded", function(event) {
			isReady = true;
		});
	}
}));

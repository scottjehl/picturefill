(function(window, $) {
	// jscs:disable
	var relurls = {};
	var absurls = {};

	$.each(['350x150', '700x300', '1400x600', '2100x900', '2800x1200'], function(i, name){
		var img = document.createElement('img');
		img.src = 'resources/more-imgs/'+ name +'.gif';
		relurls[name] = 'more-imgs/'+ name +'.gif';
		absurls[name] = img.src;
	});

	var startTests = function() {

		var $iframe = $('#functional-content');
		var frameWindow = $iframe.prop('contentWindow');
		var f$ = frameWindow.$;
		var $content = f$('#content');
		var picturefill = frameWindow.picturefill;
		var ri = picturefill._;
		var roundedDPR = Math.round( (window.devicePixelRatio || 1) * 100 ) / 100;


		var getCurrentSrc = function(elem){
			return elem.currentSrc;
		};
		var afterImgLoad = function(cb){
			var timer;
			var onReady = function(){
				clearTimeout(timer);
				$content.find('img').off('load error', run);
				cb();
			};
			var run = function(){
				clearTimeout(timer);
				timer = setTimeout(onReady, 222);
			};
			$content
				.find('img')
				.filter(function(){
					return !this.complete;
				})
				.on('load error', run)
			;
			run();
		};
		var createPicture = function(srces, attrType){
			if(!attrType){
				attrType = 'attr';
			}
			var picture = frameWindow.document.createElement('picture');
			$.each(srces, function(i, attrs){
				var src;
				if(i >= srces.length -1){
					src = 'img';
				} else {
					src = 'source';
				}
				src = frameWindow.document.createElement(src);
				picture.appendChild(src);
				$(src)[attrType](attrs);
			});
			return picture;
		};
		var runViewportTests = function($picture, viewportDesc, cb){
			var $image;
			var results = {};
			var viewports = Object.keys(viewportDesc);

			var viewport = viewports.shift();
			var run = function(){

				results[viewport] = {
					currentSrc: getCurrentSrc($image[0]),
					offsetWidth: $image.prop('offsetWidth'),
					offsetHeight: $image.prop('offsetHeight'),
					src: $image.attr('src')
				};

				$.each(viewportDesc[viewport] || [], function(name, value){
					if(typeof value == 'function'){
						value(results[viewport], $picture, $image);
					} else {
						strictEqual(results[viewport][name], value, name);
					}
				});

				viewport = viewports.shift();

				if(viewport && viewportDesc[viewport]){
					$iframe.css('width', viewport);
					afterImgLoad(run);
				} else {
					if(cb) {
						cb(results);
						cb = false;
					}

					start();
				}
			};

			$picture = $($picture);

			if($picture.is('picture')){
				$image = $picture.find('img');
			} else {
				$image = $picture;
			}

			$iframe.css('width', viewport);

			setTimeout(function(){
				$picture.appendTo($content);

				if(!ri.mutationSupport){
					setTimeout(picturefill);
				}
				afterImgLoad(run);
			}, 120);
			return results;
		};

		var runMutationTests = function($picture, mutations, propType, cb){

			if(!propType){
				propType = 'attr';
			}
			var $image, mutationProps;
			var results = {};
			var i = 0;
			var run = function(){
				var lastObj, riData;
				var respProps = {elements: $image[0], reparse: true};

				results[i] = {
					currentSrc: getCurrentSrc($image[0]),
					offsetWidth: $image.prop('offsetWidth'),
					offsetHeight: $image.prop('offsetHeight'),
					src: $image.attr('src'),
					srcProp: $image.prop('src')
				};

				$.each(mutations[i].expects, function(name, val){
					strictEqual(results[i][name], val);
				});

				i++;
				mutationProps = mutations[i] && mutations[i].attrs;

				if(mutationProps){
					if($.isArray(mutationProps)){
						$picture.find('source, img').each(function(i){
							if(mutationProps[i]){
								$(this)[propType]( mutationProps[i] );
							}
						});
						lastObj = mutationProps[mutationProps.length - 1];
					} else if($.isPlainObject(mutationProps)) {
						$image[propType](mutationProps);
						lastObj = mutationProps;
					} else {
						mutationProps($picture, $image, i);
					}

					if(!ri.mutationSupport){

						if(lastObj){
							riData = $image.prop(ri.ns);
							$.each(lastObj, function(name){
								if(name in riData){
									riData[name] = undefined;
								}
							});
						}

						setTimeout(function(){
							picturefill(respProps);
						});
					}
					afterImgLoad(run);
				} else {
					if(cb) {
						cb(results);
						cb = false;
					}
					start();
				}
			};
			$picture = $($picture);
			if($picture.is('picture')){
				$image = $picture.find('img');
			} else {
				$image = $picture;
			}


			setTimeout(function(){
				$picture.appendTo($content);

				if(!ri.mutationSupport){
					setTimeout(picturefill);
				}
				afterImgLoad(run);
			}, 33);
			return results;
		};

		// reset stubbing

		module( "method", {
			setup: function() {
				$iframe.css('width', 1024);
				$iframe.css('height', 300);
				$content.empty();
			}
		});

		if(!ri.mutationSupport && !('currentSrc' in document.createElement('img'))){
			getCurrentSrc = function(elem){
				return elem.src;
			};
		}

		if((window.HTMLPictureElement && !(/testnative/i).test(location.hash || '')) || (roundedDPR != 1 && roundedDPR != 2)){
			test('exit native', function(){
				ok(true);
			});
			return;
		}

		asyncTest( "simple x image without 1x in srcset", function() {
			var $ximage = f$('<img />').attr({
				src: relurls['350x150'],
				srcset: relurls['700x300'] +' 2x'
			});
			$ximage.appendTo($content);

			//IE8/IE9 needs a clear remove here
			$ximage.removeAttr('width');
			$ximage.removeAttr('height');
			if(!ri.mutationSupport){
				setTimeout(picturefill);
			}

			afterImgLoad(function(){
				var curSrc = ri.DPR > 1.2 ? absurls['700x300'] : absurls['350x150'];

				equal(getCurrentSrc($ximage[0]), curSrc);
				equal($ximage.prop('offsetWidth'), 350);
				if(ri.mutationSupport){
					equal($ximage.attr('src'), relurls['350x150']);
				}
				start();
			});
		});

		asyncTest( "simple x image with 1x in srcset", function() {
			var $ximage = f$('<img />').attr({
				src: relurls['1400x600'],
				srcset: relurls['350x150'] +' 1x, '+ relurls['700x300'] +' 2x'
			});
			$ximage.prependTo($content);

			//IE8/IE9 needs a clear remove here
			$ximage.removeAttr('width');
			$ximage.removeAttr('height');
			if(!ri.mutationSupport){
				setTimeout(picturefill);
			}

			afterImgLoad(function(){

				var curSrc = ri.DPR > 1.2 ? absurls['700x300'] : absurls['350x150'];
				if(!ri.supSrcset || window.HTMLPictureElement){
					equal(getCurrentSrc($ximage[0]), curSrc);
				}
				equal($ximage.prop('offsetWidth'), 350);
				if(ri.mutationSupport) {
					equal($ximage.attr('src'), relurls['1400x600']);
				}
				start();
			});
		});

		if(!window.HTMLPictureElement && !ri.supSizes){
			(function(){
				var test = function(attrType) {
					return function(){

						var $wimage = f$('<img />')[attrType]({
							src: relurls['350x150'],
							sizes: '(max-width: 400px) calc(200px * 1.7), (max-width: 700px) 710px, 2000px',
							srcset: relurls['1400x600'] + ' 1400w, ' +relurls['350x150'] +' 350w, ' +
							relurls['700x300'] +' 700w,' +
							relurls['2100x900'] +' 2100w 900h,' +
							absurls['2800x1200'] + ' 1200h 2800w'
						});

						var viewports = {
							340: {
								currentSrc: roundedDPR < 1.2 ? absurls['350x150'] : absurls['700x300'],
								offsetWidth: 340
							},
							620: {
								currentSrc: roundedDPR < 1.2 && /^(edge|experimental)$/.test(ri.cfg.algorithm) ?
									absurls['700x300'] :
									absurls['1400x600'],
								offsetWidth: 710
							},
							800: {
								currentSrc: roundedDPR < 1.2 ? absurls['2100x900'] : absurls['2800x1200'],
								offsetWidth: 2000
							}
						};

						//IE8/IE9 needs a clear remove here
						$wimage.removeAttr('width');
						$wimage.removeAttr('height');

						runViewportTests($wimage, viewports);
					};
				};

				asyncTest("image with w descriptor (setAttribute)", test('attr'));

				if(ri.mutationSupport){
					asyncTest("image with w descriptor (prop idl setter)", test('prop'));
				}
			})();
		}

		asyncTest("image with w descriptor and untrue w", function() {
			var $wimage = f$('<img />').attr({
				src: relurls['350x150'],
				sizes: '300px',
				srcset: relurls['350x150'] +' 300w, ' +
				relurls['700x300'] +' 600w'
			});

			$wimage.appendTo($content);

			afterImgLoad(function(){
				var curSrc = ri.DPR > 1.3 ? absurls['700x300'] : absurls['350x150'];
				equal($wimage.prop('offsetWidth'), 350);
				equal(getCurrentSrc($wimage[0]), curSrc);

				if(ri.mutationSupport) {
					equal($wimage.attr('src'), relurls['350x150']);
				}
				start();
			});
		});

		asyncTest( "simple picture without src img", function() {

			var picture = createPicture([
				{
					srcset: relurls['350x150'],
					media: '(max-width: 480px)'
				},
				{
					srcset: relurls['1400x600'],
					media: '(min-width: 800px)'
				},
				{
					srcset: relurls['700x300']
				}
			]);
			var viewports = {
				320: {
					currentSrc: absurls['350x150']
				},
				620: {
					currentSrc: absurls['700x300']
				},
				850: {
					currentSrc: absurls['1400x600']
				}
			};

			runViewportTests(picture, viewports);

		});

		asyncTest( "complex picture with src and srcset img", function() {

			var picture = createPicture([
				{
					srcset: relurls['350x150']+' 1x,'+relurls['2100x900']+' 1.2x',
					media: '(max-width: 480px)'
				},
				{
					srcset: relurls['1400x600'],
					media: '(min-width: 800px)'
				},
				{
					src: relurls['700x300'],
					srcset: relurls['2800x1200']
				}
			]);
			var viewports = {
				320: {
					currentSrc: ri.DPR < 1.1 ? absurls['350x150'] : absurls['2100x900']
				},
				620: {
					currentSrc: absurls['2800x1200']
				},
				850: {
					currentSrc: absurls['1400x600']
				}
			};

			runViewportTests(picture, viewports);
		});

		(function(){
			var test = function(attrType){
				return function() {

					var data = [
						{
							srcset: relurls['350x150']+'  350w 150h,'+relurls['700x300']+' 200h 400w',
							media: '(max-width: 480px)',
							sizes: '340px'
						},

						{
							src: relurls['2100x900'],
							srcset: relurls['2800x1200'] +'  600w 300h, '+relurls['1400x600']+' 700w , '
						}
					];
					var picture = createPicture(data, attrType);

					var viewports = {
						320: {
							currentSrc: ri.DPR < 1.1 ? absurls['350x150'] : absurls['700x300']
						},
						800: {
							currentSrc: absurls['1400x600']
						}
					};

					runViewportTests(picture, viewports, function(results){
						if(ri.mutationSupport){
							equal($('source', picture).prop('srcset'), data[0].srcset);
							equal($('source', picture).prop('media'), data[0].media);
							equal($('source', picture).prop('sizes'), data[0].sizes);
							strictEqual($('source', picture).prop('type'), '');

							if(!ri.supSrcset || (ri.supSizes && window.HTMLPictureElement)){
								equal($('img', picture).prop('srcset'), data[1].srcset);
							} else {
								equal($('img', picture).prop('srcset'), '');
							}
							equal($('img', picture).prop('media'), data[1].media);
							strictEqual($('img', picture).prop('sizes'), '');
						}

						if(!ri.supSrcset || (ri.supSizes && window.HTMLPictureElement)) {
							equal($('img', picture).attr('srcset'), data[1].srcset);
						} else {
							equal($('img', picture).prop('srcset'), '');
						}

					});
				};
			};

			asyncTest( "complex picture with src and srcset img and w descriptors (setAttribute)", test('attr'));

			if(ri.mutationSupport){
				asyncTest( "complex picture with src and srcset img (idl setter)", test('prop'));
			}

		})();


		if(ri.mutationSupport && (roundedDPR == 1 || roundedDPR == 2)){
			(function(){
				if(!ri.supSizes){
					asyncTest('change attributes on img[srcset][sizes]', function(){
						var $wimage = f$('<img src="'+ relurls['350x150'] +'" ' +
							'srcset="' + relurls['2100x900'] +' 2100w 900h,'+ absurls['2800x1200'] + ' 1200h 2800w, '+ relurls['1400x600'] + ' 1400w, ' +relurls['350x150'] +' 350w,'+ relurls['700x300'] +' 700w" ' +
							' sizes="345px" />');


						runMutationTests($wimage, [
							{
								expects: {
									currentSrc: roundedDPR == 2 ? absurls['700x300'] : absurls['350x150']
								}
							},
							{
								attrs: {
									'sizes': 'calc(344px + 344px)'
								},
								expects: {
									currentSrc: roundedDPR == 2 ? absurls['1400x600'] : absurls['700x300']
								}
							},
							{
								attrs: {
									srcset: absurls['2800x1200']
								},
								expects: {
									currentSrc: absurls['2800x1200']
								}
							},
							{
								attrs: {
									srcset: null
								},
								expects: {
									currentSrc: absurls['350x150'],
									srcProp: absurls['350x150']
								}
							},
							{
								attrs: {
									src: null
								},
								expects: {
									currentSrc: ''
								}
							}
						]);
					});
				}

				asyncTest('change attributes on img[src]', function(){
					var $wimage = f$('<img src="'+ relurls['350x150'] +'" />');


					runMutationTests($wimage, [
						{
							expects: {
								currentSrc: absurls['350x150']
							}
						},
						{
							attrs: {
								srcset: relurls['1400x600'] + ' 1x, '+ absurls['2800x1200'] +' 2x'
							},
							expects: {
								currentSrc: roundedDPR == 2 ? absurls['2800x1200']  : absurls['1400x600']
							}
						},
						{
							attrs: {
								srcset: absurls['2800x1200']
							},
							expects: {
								currentSrc: absurls['2800x1200'],
								src: relurls['350x150']
							}
						},
						{
							attrs: {
								src: null
							},
							expects: {
								currentSrc: absurls['2800x1200']
							}
						},
						{
							attrs: {
								srcset: null
							},
							expects: {
								currentSrc: ''
							}
						}
					]);
				});

				if(!window.HTMLPictureElement){
					(function(){
						var test = function(attrType){
							if(!attrType){
								attrType = 'attr';
							}
							return function(){
								var picture = createPicture([
									{
										srcset: relurls['350x150']+' 1x,'+relurls['2100x900']+' 1.2x',
										media: '(max-width: 480px)',
										sizes: '600px'
									},
									{
										srcset: relurls['1400x600'] +' 1400w',
										media: '(min-width: 490px)',
										sizes: '800px'
									},
									{
										src: relurls['700x300'],
										srcset: relurls['2800x1200'] +' 2800w',
										sizes: '400px'
									}
								], attrType);


								runMutationTests(picture, [
									{
										expects: {
											currentSrc: absurls['1400x600'],
											offsetWidth: 800
										}
									},
									{
										attrs: [
											{},
											{sizes: '300px'}
										],
										expects: {
											currentSrc: absurls['1400x600'],
											offsetWidth: 300
										}
									},
									{
										attrs: [
											{
												media: '(min-width: 1em)'
											}
										],
										expects: {
											currentSrc: roundedDPR > 1.2 ? absurls['2100x900'] : absurls['350x150'],
											offsetWidth: roundedDPR > 1.2 ? 1750 : 350
										}
									},
									{
										attrs: function($picture){
											$picture.prepend( f$(frameWindow.document.createElement('source'))[attrType]( 'srcset', relurls['700x300']) );
										},
										expects: {
											currentSrc: absurls['700x300'],
											offsetWidth: 700
										}
									},
									{
										attrs: function($picture){
											$picture.find('source').remove();
										},
										expects: {
											currentSrc: absurls['2800x1200'],
											offsetWidth: 400
										}
									}
								], attrType);
							};
						};

						asyncTest('changes to picture element', test());

						if(ri.mutationSupport){
							asyncTest('changes to picture element (prop)', test('prop'));
						}
					})();

				}
			})();
		}

	};

	$(window).load(startTests);

})( window, jQuery );

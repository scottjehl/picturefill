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

	var ri = picturefill._;

	if(!document.querySelector){
		ri.qsa = function(context, sel) {
			return jQuery(sel, context);
		};

		var anchor = document.createElement('a');

		ri.makeUrl = function(src) {
			jQuery.attr(anchor, 'href', src+'' );
			return jQuery.prop(anchor, 'href');
		};
	}

}));

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
	if (!window.addEventListener) {return;}
	var oldMatches, oldXQant, oldDPR;
	var printMedia = window.matchMedia && matchMedia("print") || { matches: false };
	var pf = picturefill._;
	var resetMedia = function(media) {
		if (!media) {return true;}
		if (media.indexOf("print") !== -1) {return true;}
		if (oldMatches) {return oldMatches.apply(this, arguments);}
	};
	var beforeprint = function() {
		if (!printMedia.matches && !oldMatches) {
			oldMatches = pf.matchesMedia;
			pf.matchesMedia = resetMedia;
		}

		if (!oldXQant && !oldDPR && pf.DPR < 1.5 && pf.cfg.xQuant < 1.5) {
			oldXQant = pf.cfg.xQuant;
			oldDPR = pf.DPR;
			pf.DPR = 1.5;
			pf.cfg.xQuant = 1.5;
		}
		picturefill({ reselect: true });
	};
	var afterprint = function() {
		if (oldMatches) {
			pf.matchesMedia = oldMatches;
			oldMatches = false;
		}
		if (oldXQant) {
			pf.cfg.xQuant = oldXQant;
			oldXQant = false;
		}
		if (oldDPR) {
			pf.DPR = oldDPR;
			oldDPR = false;
		}
		picturefill({ reselect: true });
	};

	if ("onbeforeprint" in window) {
		addEventListener("beforeprint", beforeprint, false);
		addEventListener("afterprint", afterprint, false);
	}
}));

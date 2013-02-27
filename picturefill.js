/*! Picturefill - Responsive Images that work today. (and mimic the proposed Picture element with divs). Author: Scott Jehl, Filament Group, 2012 | License: MIT/GPLv2 */
/*globals document*/
(function (w) {

	// Enable strict mode
	"use strict";

	var isFirstTime = true;

	w.picturefill = function () {
		var ps = w.document.getElementsByTagName("div"),
			eventName = (isFirstTime) ? "picturefill_ready" : "picturefill_update",
			memo,
			i,
			j,
			jl,
			il,
			media,
			picImg,
			matches,
			sources,
			myevent;

		// Loop the pictures
		for (i = 0, il = ps.length; i < il; i = i + 1) {
			if (ps[i].getAttribute("data-picture") !== null) {

				sources = ps[i].getElementsByTagName("div");
				matches = [];

				// See if which sources match
				for (j = 0, jl = sources.length; j < jl; j = j + 1) {
					media = sources[j].getAttribute("data-media");
					// if there's no media specified, OR w.matchMedia is supported 
					if (!media || (w.matchMedia && w.matchMedia(media).matches)) {
						matches.push(sources[j]);
					}
				}

				// Find any existing img element in the picture element
				picImg = ps[i].getElementsByTagName("img")[0];

				if (matches.length) {
					if (!picImg) {
						picImg = w.document.createElement("img");
						picImg.alt = ps[i].getAttribute("data-alt");
						ps[i].appendChild(picImg);
					}

					picImg.src =  matches.pop().getAttribute("data-src");
				} else if (picImg) {
					ps[i].removeChild(picImg);
				}
			}
		}

		// fire custom event
    if (document.createEvent) {
      myevent = document.createEvent("HTMLEvents");
      myevent.initEvent(eventName, true, true);
    } else {
      myevent = document.createEventObject();
      myevent.eventType = eventName;
    }

    myevent.eventName = eventName;
    myevent.memo = memo || {};

    if (document.createEvent) {
      document.dispatchEvent(myevent);
    } else {
      document.fireEvent("on" + myevent.eventType, myevent);
    }

    isFirstTime = false;
	};

	// Run on resize and domready (w.load as a fallback)
	if (w.addEventListener) {
		w.addEventListener("resize", w.picturefill, false);
		w.addEventListener("DOMContentLoaded", function () {
			w.picturefill();
			// Run once only
			w.removeEventListener("load", w.picturefill, false);
		}, false);
		w.addEventListener("load", w.picturefill, false);
	} else if (w.attachEvent) {
		w.attachEvent("onload", w.picturefill);
	}

}(this));
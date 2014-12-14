window.parseSrcset = (function(){
	var memDescriptor = {};
	var regDescriptor =  /^([\+eE\d\.]+)(w|x)$/; // currently no h
	var regHDesc = /\s*\d+h\s*/;

	var parseDescriptor = function ( descriptor ) {

		if ( !(descriptor in memDescriptor) ) {
			var descriptorObj = [1, 'x'];
			var parsedDescriptor = ( descriptor || "" ).trim();

			if ( parsedDescriptor ) {
				parsedDescriptor = parsedDescriptor.replace(regHDesc, "");
				if ( ( parsedDescriptor ).match( regDescriptor ) ) {

					descriptorObj = [RegExp.$1 * 1, RegExp.$2];

				} else {
					descriptorObj = false;
				}
			}

			memDescriptor[ descriptor ] = descriptorObj;
		}
		return memDescriptor[ descriptor ];
	};

	return function(srcset){
		var pos, url, descriptor, last, descpos, can;
		var candidates = [];
		while ( srcset ) {
			srcset = srcset.replace(/^\s+/g,"");
			// 5. Collect a sequence of characters that are not space characters, and let that be url.
			pos = srcset.search(/\s/g);
			descriptor = null;
			if ( pos != -1 ) {
				url = srcset.slice( 0, pos );
				last = url.charAt( url.length - 1 );
				// 6. If url ends with a U+002C COMMA character (,), remove that character from url
				// and let descriptors be the empty string. Otherwise, follow these substeps
				// 6.1. If url is empty, then jump to the step labeled descriptor parser.
				if ( last == "," || !url ) {
					url = url.replace(/,+$/, "");
					descriptor = "";
				}
				srcset = srcset.slice( pos + 1 );
				// 6.2. Collect a sequence of characters that are not U+002C COMMA characters (,), and
				// let that be descriptors.
				if ( descriptor == null ) {
					descpos = srcset.indexOf( "," );
					if ( descpos != -1 ) {
						descriptor = srcset.slice( 0, descpos );
						srcset = srcset.slice( descpos + 1 );
					} else {
						descriptor = srcset;
						srcset = "";
					}
				}
			} else {
				url = srcset;
				srcset = "";
			}

			// 7. Add url to raw candidates, associated with descriptors.
			if ( url && (descriptor = parseDescriptor( descriptor )) ) {

				can = {
					url: url.replace(/^,+/, "")
				};
				can[descriptor[1]] = descriptor[0];

				candidates.push(can);
			}
		}
		return candidates;
	};
})();

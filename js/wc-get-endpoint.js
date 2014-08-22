var configURL = "parse.config";

function parseEndpoint( parseConfigRaw, callback ) {
    var parseConfig = JSON.parse( parseConfigRaw );
    getEndpoint( parseConfig, callback );
}

function getEndpoint( parseConfig, callback ) {
    Parse.initialize( parseConfig.applicationId, parseConfig.javaScriptKey );
    var query = new Parse.Query( parseConfig.className );
    query.get( parseConfig.objectId, {
      success: function( object ) {
		wc_endpoint = object.attributes[ parseConfig.columnName ];
	callback( wc_endpoint );
      },
      error: function( object, error ) {
        console.log( "Parse error, sad face." );
      }
    });
}

function get_wc_endpoint( callback ) {
    $.ajax({
      url: configURL,
    }).done( function( data ) {
	    parseEndpoint( data, callback );
      });
}

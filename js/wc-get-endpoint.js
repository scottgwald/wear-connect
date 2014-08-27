var configURL = "config.json";

function parseEndpoint(wcConfigRaw, callback) {
  var wcConfig = {};
  if (typeof wcConfigRaw === "string") {
    wcConfig = JSON.parse(wcConfigRaw);
  } else if (typeof wcConfigRaw === "object") {
    wcConfig = wcConfigRaw
  }
  getEndpoint(wcConfig, callback);
}

function getEndpoint(wcConfig, callback) {
  if (wcConfig.use_local) {
    callback(wcConfig.wc_ip_address);
  } else {
    Parse.initialize(wcConfig.applicationId, wcConfig.javaScriptKey);
    var query = new Parse.Query(wcConfig.className);
    query.get(wcConfig.objectId, {
      success: function(object) {
        wc_endpoint = object.attributes[wcConfig.columnName];
        callback(wc_endpoint);
      },
      error: function(object, error) {
        console.log("Parse error, sad face.");
      }
    });
  }
}

function get_wc_endpoint(callback) {
  $.ajax({
    url: configURL,
  }).done(function(data) {
    parseEndpoint(data, callback);
  });
}

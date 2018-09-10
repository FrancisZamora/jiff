var express = require('express');
var app = express();
var http = require('http').Server(app);
var jiff_instance = require('../../lib/jiff-server').make_jiff(http, {logs:true});
require('../../lib/ext/jiff-server-bignumber').make_jiff(jiff_instance);

// Serve static files.
app.use("/demos", express.static("demos"));
app.use("/lib", express.static("lib"));
app.use("/lib/ext", express.static("lib/ext"));
app.use("/bignumber.js", express.static("node_modules/bignumber.js"));
app.use("/numeric.js", express.static("node_modules/numeric/numeric-1.2.6.js"));
http.listen(8080, function() {
  console.log('listening on *:8080');
});

console.log("Direct your browser to *:8080/demos/pca/client.html.");
console.log("To run a server-based party: node demos/pca/party <input>");
console.log();
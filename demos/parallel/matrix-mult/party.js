/**
 * Do not change this unless you have to.
 * This code parses input command line arguments, 
 * and calls the appropriate initialization and MPC protocol from ./mpc.js
 */

console.log("Command line arguments: <input to look for> <array size> <party_id> <party_count_total> <computation_id>");

var mpc = require('./mpc');

// Read Command line arguments
var input = parseInt(process.argv[2]);
var matrixDimension = parseInt(process.argv[3]);
var party_id = parseInt(process.argv[4]);
var party_count = parseInt(process.argv[5]);
var computation_id = process.argv[6];

// JIFF options
var options = {party_count: party_count, party_id: party_id, Zp: 2039};
options.onConnect = function(jiff_instance) {
  try {
    var promise = mpc.compute(input);
    promise.then(function(v) {
      console.log(v);
      jiff_instance.disconnect();
    });
  } catch(err) {
    console.log(err);
  }
};

// Connect
mpc.connect("http://localhost:8080", computation_id, options);


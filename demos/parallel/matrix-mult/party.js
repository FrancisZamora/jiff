/**
 * Do not change this unless you have to.
 * This code parses input command line arguments, 
 * and calls the appropriate initialization and MPC protocol from ./mpc.js
 */

console.log("Command line arguments: <input to look for> <array size> <party_id> <party_count_total> <computation_id>");

var mpc = require('./mpc');

// Read Command line arguments
var input = parseInt(process.argv[2]);
var numberOfElements = parseInt(process.argv[3]);
var party_id = parseInt(process.argv[4]);
var party_count = parseInt(process.argv[5]);
var computation_id = process.argv[6];

// JIFF options
var options = {party_count: party_count, party_id: party_id, Zp: 2039};
options.onConnect = function(jiff_instance) {

  var promise = mpc.compute(input);

  promise.then(function(v) {
    console.log(v);
    jiff_instance.disconnect();
  });


// //   // var my_shares = [];
// //   // var all_shares = require("../shares.json");

// // //   var rank = Math.floor((party_id - 1) / 3);
// // //   var clique = [];
// // //   for(var i = 3*rank + 1; i < 3*rank + 3 + 1; i++) clique.push(i);
// // // console.log(clique);
// // //   for(var i = 0; i < numberOfElements; i++) {
// // //     var inputIndex = i + rank * numberOfElements;
// // //     var share = all_shares[inputIndex][clique][party_id];
// // //     my_shares.push(share);
// // //   };

// // console.log(clique);
//   var promise = mpc.compute(input, my_shares, clique);

};

// Connect
mpc.connect("http://localhost:8080", computation_id, options);


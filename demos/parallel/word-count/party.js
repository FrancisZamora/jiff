/**
 * Do not change this unless you have to.
 * This code parses input command line arguments, 
 * and calls the appropriate initialization and MPC protocol from ./mpc.js
 */

console.log("Command line arguments: <input to look for> <array size> <party_id> <party_count_total>");

var jiff = require('../../../lib/jiff-client');

// Read Command line arguments
var input = parseInt(process.argv[2]);
var numberOfElements = parseInt(process.argv[3]);
var party_id = parseInt(process.argv[4]);
var party_count = parseInt(process.argv[5]);
var computation_id = "test-1";

// Figure out parameters and inputs
var rank = Math.floor((party_id - 1) / 3);
var clique = [1,2,3];

var all_parties = [];
for(var i = 1; i <= party_count; i++) all_parties.push(i);

var my_shares = [];
var all_shares = require("../shares.json");
for(var i = 0; i < numberOfElements; i++) {
  var inputIndex = i + rank * numberOfElements;
  var share = all_shares[inputIndex][clique.join()][party_id - rank * clique.length];
  my_shares.push(share);
}

// JIFF options
var options = {party_count: party_count, party_id: party_id, Zp: 127};
var opt1 = Object.assign({}, options);
var opt2 = Object.assign({}, options);
opt2.party_count = clique.length;
opt2.party_id = opt2.party_id % clique.length;
opt2.party_id = opt2.party_id == 0 ? clique.length : opt2.party_id;

var hosts = {
  1: "http://localhost:8081",
  2: "http://localhost:8082",
  3: "http://localhost:8083",
  4: "http://localhost:8084"
};
var main_host = "http://localhost:8080";

// Connect
var all_instance = jiff.make_jiff(main_host, computation_id, opt1);
var clique_instance = jiff.make_jiff(hosts[rank + 1], computation_id, opt2);

// start clique computation
clique_instance.wait_for([1, 2, 3], function() {
  // The MPC implementation should go *HERE*
  for(var i = 0; i < my_shares.length; i++) {
    my_shares[i] = clique_instance.secret_share(clique_instance, true, null, my_shares[i], clique, clique.length, clique_instance.Zp, clique.join()+":"+i);
  }
  
  var startTime = new Date();
  // now my_shares is an array of secret share objects
  var result = my_shares[0].ceq(input);
  (function batch(i, result) {
    if(i < my_shares.length) {
      for(var j = i; j < my_shares.length && j < i + 25; j++)
        result = result.sadd(my_shares[j].ceq(input));
        
      console.log("batch " + i);
      Promise.all([result.promise]).then(function() {
        batch(i = i + 25, result);
      });
    }
    
    else {
      all_instance.wait_for(all_parties, function() {
        if(all_instance.id > clique.length)
          all_instance.emit("combine", [ clique_instance.id ], result.value);
        
        else {
          var shares = [ all_instance.secret_share(all_instance, true, null, result.value, clique, clique.length, all_instance.Zp, null) ];
          
          function finish() {
            result = shares[0];
            for(var i = 1; i < shares.length; i++)
              result = result.sadd(shares[i]);

            var promise = all_instance.open(result, [1]);
            if(promise != null) promise.then(function(r) {
              console.log("time (ms) ", new Date() - startTime);
              console.log(r);
            });
          }

          all_instance.listen("combine", function(from_id, share_value) {
            shares.push(all_instance.secret_share(all_instance, true, null, share_value, clique, clique.length, all_instance.Zp, null));
            if(shares.length == party_count / clique.length)
              finish();
          });
          
          if(party_count == clique.length)
            finish();
        }
      }); 
    }
  })(1, result);
});

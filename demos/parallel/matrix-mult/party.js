/**
 * Do not change this unless you have to.
 * This code parses input command line arguments, 
 * and calls the appropriate initialization and MPC protocol from ./mpc.js
 */

console.log("Command line arguments: <array size> <party_id> <party_count_total>");

var jiff = require('../../../lib/jiff-client');

// Read Command line arguments
var numberOfElements = parseInt(process.argv[2]);
var party_id = parseInt(process.argv[3]);
var party_count = parseInt(process.argv[4]);
var computation_id = "test-1";

// Figure out parameters and configurations
var rank = Math.floor((party_id - 1) / 3);
var clique = [1,2,3];

var all_parties = [];
for(var i = 1; i <= party_count; i++) all_parties.push(i);

var numberOfCliques = party_count / clique.length;
var mostPartiesNumOfCols = Math.floor(numberOfElements / numberOfCliques);

var numberOfRows = numberOfElements;
var numberOfCols = mostPartiesNumOfCols;
if(party_id >= party_count - clique.length) numberOfCols += numberOfElements - numberOfCols * numberOfCliques;

// Read inputs
var all_shares = require("../shares.json");
var matA = [];
var matB = [];
for(var i = 0; i < numberOfRows; i++) {
  matA[i] = [];
  for(var j = 0; j < numberOfCols; j++) {
    var colIndex = rank * mostPartiesNumOfCols + j;
    var inputIndex = (i*numberOfElements + colIndex);
    var share = all_shares[inputIndex][clique.join()][party_id - rank * clique.length];
    matA[i].push(share);
  }
}

for(var i = 0; i < numberOfRows; i++) {
  matB[i] = [];
  for(var j = 0; j < numberOfCols; j++) {
    var colIndex = rank * mostPartiesNumOfCols + j;
    var inputIndex = (i*numberOfElements + colIndex) + numberOfElements * numberOfElements;
    var share = all_shares[inputIndex][clique.join()][party_id - rank * clique.length];
    matB[i].push(share);
  }
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
  
  // Matrices are secret shared
  for(var i = 0; i < matA.length; i++) {
    for(var j = 0; j < matA[i].length; j++) {
      matA[i][j] = clique_instance.secret_share(clique_instance, true, null, matA[i][j], clique, clique.length, clique_instance.Zp, clique.join()+":"+i);
    }
  }
  for(var i = 0; i < matB.length; i++) {
    for(var j = 0; j < matB[i].length; j++) {
      matB[i][j] = clique_instance.secret_share(clique_instance, true, null, matB[i][j], clique, clique.length, clique_instance.Zp, clique.join()+":"+i);
    }
  }
  
  var startTime = new Date();
  
  // Begin computing
  var matResult = [];
  (function oneRow(i) {
    if(i < matA.length) {
      console.log("row ", i);
      // one row of matrix multiplication
      matResult[i] = [];
      var x = matA[i];
      for(var j = 0; j < matA[i].length; j++) {
        var y = matB[j];
        // vector inner product
        matResult[i][j] = x[0].smult(y[0]);
        for(var k = 1; k < x.length; k++) {
          matResult[i][j] = matResult[i][j].sadd(x[k].smult(y[k]));
        }
        matResult[i][j] = clique_instance.open(matResult[i][j]);
      }
      matResult[i] = Promise.all(matResult[i]);
      matResult[i].then(function() { oneRow(i+1); });
    } else {
      // all is done and is opened.
      Promise.all(matResult).then(function(matResult) {
        for(var i = 0; i < matResult.length; i++) {
          for(var j = 0; j < matResult[i].length; j++) {
            matResult[i][j] = { "i": i, "j": rank * mostPartiesNumOfCols + j, "v": matResult[i][j] };
          }
        }

        if(party_id > clique.length)
          all_instance.emit("combine", [ clique_instance.id ], JSON.stringify(matResult));
          
        if(party_id <= clique.length) {
          var result = [];
          for(var i = 0; i < matResult.length; i++) {
            result[i] = [];
            for(var j = 0; j < matResult[i].length; j++) {
              result[i][j] = matResult[i][j].v;
            }
          }

          var count = 1;
          all_instance.listen("combine", function(_, oneResult) {
            oneResult = JSON.parse(oneResult);

            for(var i = 0; i < oneResult.length; i++) {
              for(var j = 0; j < oneResult[i].length; j++) {
                var obj = oneResult[i][j];
                console.log(obj.j);
                result[obj.i][obj.j] = obj.v;
              }
            }

            count++;
            if(count == numberOfCliques) {
              console.log(result);
              console.log("dimensions ", result.length, result[0].length);
              console.log("time (ms) ", new Date() - startTime);
            }
          });

          if(count == numberOfCliques) {
            console.log(result);
            console.log("dimensions ", result.length, result[0].length);
            console.log("time (ms) ", new Date() - startTime);
          }
        }
      });
    }
  })(0);
  
  // Leaders combine

});

// Chai 
var expect = require('chai').expect;
var assert = require('chai').assert;

var party_count = 2;
var mpc = require('./mpc.js');

/**
 * CHANGE THIS: Generate inputs for your tests
 * Should return an object with this format:
 * {
 *   'party_id': [ 'test1_input', 'test2_input', ...]
 * }
 */
function generateInputs(party_count) {
  return {
    1:[0,0,1,1],
    2:[0,1,0,1]
  };
}

/**
 * CHANGE THIS: Compute the expected results not in MPC
 * @param {object} inputs - same format as generateInputs output.
 * Should return a single array with the expected result for every test in order
 *   [ 'test1_output', 'test2_output', ... ]
 */
function computeResults(inputs) {
  var results = [];

  for (var j = 0; j < inputs['1'].length; j++) {
    results.push(inputs[1][j]*inputs[2][j]);
  }
  return results;
}


/**
 * Do not change unless you have to.
 */
describe('Test', function() {
  this.timeout(0); // Remove timeout

  it('Exhaustive', function(done) {
    var count = 0;

    var inputs = generateInputs(party_count);
    var results = computeResults(inputs);

    var onConnect = function(jiff_instance) {
      var partyInputs = inputs[jiff_instance.id];
      var promises = [];
      for (var j = 0; j < partyInputs.length; j++) {
        var promise = mpc.compute(partyInputs[j], jiff_instance);
        promises.push(promise);
      }

      Promise.all(promises).then(function(values) {
        count++;
        for (var i = 0; i < values.length; i++) {
          // construct debugging message
          var ithInputs = inputs[1][i] + "";
          for(var j = 2; j <= party_count; j++)
            ithInputs += "," + inputs[j][i];
          var msg = "Party: " + jiff_instance.id + ". inputs: [" + ithInputs + "]";

          // assert results are accurate
          try {
            assert.deepEqual(values[i], results[i], msg);
          } catch(assertionError) {
            done(assertionError);
            done = function(){}
          }
        }

        jiff_instance.disconnect();
        if (count == party_count)
          done();
      });
    };
    
    var options = { party_count: party_count, onError: console.log, onConnect: onConnect };
    for(var i = 0; i < party_count; i++)
      mpc.connect("http://localhost:8080", "mocha-test", options);
  });
});

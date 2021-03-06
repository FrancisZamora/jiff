var jiff = require('../../lib/jiff-client.js');
var jiffBigNumber = require('../../lib/ext/jiff-client-bignumber.js');
var jiffNegNumber = require('../../lib/ext/jiff-client-negativenumber.js');

var jiff_instances = null;
var parties = 0;
var tests = [];
var has_failed = false;
var Zp = 15485867;
// function mod(x, y) { if (x < 0) return (x % y) + y; return x % y; }

// Operation strings to "lambdas"
var operations = {
  '+': function (operand1, operand2) {
    return operand1 + operand2;
  },
  'add_cst': function (operand1, operand2) {
    return operand1.cadd(operand2);
  },
  '-': function (operand1, operand2) {
    return operand1 - operand2;
  },
  'sub_cst': function (operand1, operand2) {
    return operand1.csub(operand2);
  },
  '*': function (operand1, operand2) {
    return operand1 * operand2;
  },
  'mult_cst': function (operand1, operand2) {
    return operand1.cmult(operand2);
  },
  '^': function (operand1, operand2) {
    return (operand1 === operand2) ? 0 : 1;
  },
  'xor_cst': function (operand1, operand2) {
    return operand1.cxor_bit(operand2);
  },
  '/': function (operand1, operand2) {
    var res = operand1 / operand2;
    if (res < 0) {
      return Math.ceil(res);
    } else {
      return Math.floor(res);
    }
  },
  'div_cst': function (operand1, operand2) {
    return operand1.cdiv(operand2, null, false); // Round to zero
  }
};

// Maps MPC operation to its open dual
var dual = {add_cst: '+', sub_cst: '-', mult_cst: '*', xor_cst: '^', div_cst: '/'};

// Entry Point
function run_test(computation_id, operation, callback) {
  // Generate Numbers - make sure we generate both positive and negative numbers.
  for (var i = 0; i < 200; i++) {
    tests[i] = [];

    for (var p = 0; p < 3; p++) {
      // ensure numbers wont wrap around
      var max = Zp / 2;
      if (operation === 'mult_cst') {
        max = Math.sqrt(Zp);
      } else if (operation === 'div_cst') {
        max = Zp;
      }

      var offset = Math.floor(max / 2);
      if (operation === 'xor_cst') {
        max = 2;
        offset = 0;
      }

      var randnum = Math.floor(Math.random() * max) - offset;
      tests[i].push(randnum);
    }
  }

  // Assign values to global variables
  parties = tests[0].length;
  computation_id = computation_id + '';

  var counter = 0;
  var options = {party_count: parties, Zp: Zp, autoConnect: false};
  options.onConnect = function () {
    if (++counter === 3) {
      test(callback, operation);
    }
  };
  options.onError = function (error) {
    console.log(error);
    has_failed = true;
  };

  var jiff_instance1 = jiffBigNumber.make_jiff(jiff.make_jiff('http://localhost:3004', computation_id, options));
  jiff_instance1 = jiffNegNumber.make_jiff(jiff_instance1);
  var jiff_instance2 = jiffBigNumber.make_jiff(jiff.make_jiff('http://localhost:3004', computation_id, options));
  jiff_instance2 = jiffNegNumber.make_jiff(jiff_instance2);
  var jiff_instance3 = jiffBigNumber.make_jiff(jiff.make_jiff('http://localhost:3004', computation_id, options));
  jiff_instance3 = jiffNegNumber.make_jiff(jiff_instance3);
  jiff_instances = [jiff_instance1, jiff_instance2, jiff_instance3];
  jiff_instance1.connect();
  jiff_instance2.connect();
  jiff_instance3.connect();
}

// Run all tests after setup
function test(callback, mpc_operator) {
  var open_operator = dual[mpc_operator];

  if (jiff_instances[0] == null || !jiff_instances[0].isReady()) {
    console.log('Please wait!');
    return;
  }
  has_failed = false;

  // Run every test and accumulate all the promises
  var promises = [];
  var length = mpc_operator === 'div_cst' ? 10 : tests.length;
  for (var i = 0; i < length; i++) {
    for (var j = 0; j < jiff_instances.length; j++) {
      var promise = single_test(i, jiff_instances[j], mpc_operator, open_operator);
      promises.push(promise);
    }
  }

  // When all is done, check whether any failures were encountered
  Promise.all(promises).then(function () {
    for (var i = 0; i < jiff_instances.length; i++) {
      jiff_instances[i].disconnect();
    }
    jiff_instances = null;
    callback(!has_failed);
  });
}

// Run test case at index
function single_test(index, jiff_instance, mpc_operator, open_operator) {
  var numbers = tests[index];
  var party_index = jiff_instance.id - 1;
  var shares = jiff_instance.share(numbers[party_index]);

  // Apply operation on shares
  var res = operations[mpc_operator](shares[1], numbers[1]);

  var deferred = $.Deferred();
  res.open().then(function (result) {
    test_output(index, result, open_operator);
    deferred.resolve();
  }, error);
  return deferred.promise();
}

// Determine if the output is correct
function test_output(index, result, open_operator) {
  var numbers = tests[index];

  // Apply operation in the open to test
  var res = operations[open_operator](numbers[0], numbers[1]);
  //  res = mod(res, Zp);

  // Incorrect result
  if (!(res.toString() === result.toString())) {
    has_failed = true;
    console.log(numbers.join(open_operator) + ' = ' + res + ' != ' + result);
  }
}

// Register Communication Error
function error() {
  has_failed = true;
  console.log('Communication error');
}

// Export API
module.exports = {
  run_test: run_test
};

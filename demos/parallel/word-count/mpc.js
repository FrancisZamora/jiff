(function(exports, node) {
  var saved_instance;
  var startTime;

  /**
   * Connect to the server and initialize the jiff instance
   */
  exports.connect = function (hostname, computation_id, options) {
    var opt = Object.assign({}, options);
    // Added options goes here
    opt.numbers_server = "http://localhost:808" + Math.floor((options.party_id - 1) / 3);

    if(node)
      jiff = require('../../../lib/jiff-client');

    saved_instance = jiff.make_jiff(hostname, computation_id, opt);
    // if you need any extensions, put them here

    return saved_instance;
  };
  
  function combine(jiff_instance, result) {
  try {
    var promises = [ jiff_instance.open(result, [1]) ];
    
    if(jiff_instance.id == 1) {
      for(var i = 4; i < jiff_instance.party_count; i += 3) {
        var clique = [i, i+1, i+2];
        promises.push(jiff_instance.receive_open(clique));
      }
      
      Promise.all(promises).then(function(results) {
        var sum = 0;
        for(var i = 0; i < results.length; i++) sum += results[i];
        
        var endTime = new Date();

        console.log(endTime - startTime);
        console.log(sum);
      })
    }
    } catch(err) { console.log(err);}
  }

  /**
   * The MPC computation
   */
  exports.compute = function (input, my_shares, clique, jiff_instance) {
    if(jiff_instance == null) jiff_instance = saved_instance;
    try {
    // The MPC implementation should go *HERE*
    for(var i = 0; i < my_shares.length; i++) {
      my_shares[i] = jiff_instance.secret_share(jiff_instance, true, null, my_shares[i], clique, clique.length, jiff_instance.Zp, clique.join()+":"+i);
    }
    
    startTime = new Date();
    
    // now my_shares is an array of secret share objects
    var result = my_shares[0].ceq(input);
    (function batch(i, result) {
      if(i >= my_shares.length) {
        combine(jiff_instance, result);
        return;
      }
      for(var j = i; j < my_shares.length && j < i + 25; j++)
        result = result.sadd(my_shares[j].ceq(input));
        
      console.log("batch " + i);
      result.promise.then(function() {
        batch(i = i + 25, result);
      });
    })(1, result);
    } catch(err) { console.log(err); }
  };
}((typeof exports == 'undefined' ? this.mpc = {} : exports), typeof exports != 'undefined'));

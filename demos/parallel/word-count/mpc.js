(function(exports, node) {
  var saved_instance;

  /**
   * Connect to the server and initialize the jiff instance
   */
  exports.connect = function (hostname, computation_id, options) {
    var opt = Object.assign({}, options);
    // Added options goes here

    if(node)
      jiff = require('../../../lib/jiff-client');

    saved_instance = jiff.make_jiff(hostname, computation_id, opt);
    // if you need any extensions, put them here

    return saved_instance;
  };

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
    
    // now my_shares is an array of secret share objects
/*    var result = my_shares[0].ceq(input);
    for(var i = 1; i < my_shares.length; i++)
      result = result.sadd(my_shares[0].ceq(input));
  */  
    // Return a promise to the final output(s)
    return jiff_instance.open(my_shares[0]);
    } catch(err) { console.log(err); }
  };
}((typeof exports == 'undefined' ? this.mpc = {} : exports), typeof exports != 'undefined'));

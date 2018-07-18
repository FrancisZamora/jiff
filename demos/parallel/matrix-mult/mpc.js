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
   * Matrix multiplication
   * @param {*} m1 array of shares 
   * @param {*} m2 
   */
  function matrixMult(m1, m2) {
    const numRows = m1.length;
    const numCols = m1[0].length;

    const product = [];

    for (let r = 0; r < numRows; r++) {
      product[r] = [];

      for (let c = 0; c < numCols; c++) {
        product[r][c] = 0;

        for (let d = 0; d < numCols; d++) {
          let p = m1[r][d].smult(m2[d][c]);
          product[r][c] = product[r][c].sadd(p);
        }
      }
    }
    return product;

  }

  /**
   * The MPC computation
   */
  exports.compute = function (input, jiff_instance) {
    if(jiff_instance == null) jiff_instance = saved_instance;
    try {
    // The MPC implementation should go *HERE*
    for(var i = 0; i < my_shares.length; i++) {
      my_shares[i] = jiff_instance.secret_share(jiff_instance, true, null, my_shares[i], clique, clique.length, jiff_instance.Zp, clique.join()+":"+i);
    }
    
    


    

    // Return a promise to the final output(s)
    return jiff_instance.open(my_shares[0]);
    } catch(err) { console.log(err); }
  };
}((typeof exports == 'undefined' ? this.mpc = {} : exports), typeof exports != 'undefined'));

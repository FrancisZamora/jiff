(function (exports, node) {
  if(node) {
    BigNumber = require('bignumber.js');
  }

  let amortFalse = null;
  const amortTrue = 0;

  let operationNum = 0;


  function convert(secret) {
    return secret.times(amortFalse);
  }

  function revert() {
    return this.cgteq(amortFalse);
  }


  function amortized_or(o) {

    return this.sadd(o);

    // if (operationNum >= booleans.or._false) {
    //   // reset
    //   operationNum = 0;
    // }
     
  }

  function amortized_and(o) {
    // todo
    console.log('AND');
    return o;
  }

  function amortizedOpen() {

    var amortBool = this.revert()
    return amortBool.open.apply(amortBool, arguments);
  
  }

  function amortizedBool(instance, share) {
    share.amortized_or = amortized_or;
    share.amortized_and = amortized_and;
    share.revert = revert;
    return share;
  }

  function parseOptions(base_instance, options) {
    if(options == null) options = {};

    if(options.Zp != null) {
      base_instance.Zp = new BigNumber(options.Zp);
    } 

   amortFalse = base_instance.Zp.squareRoot().floor();
   console.log('amortized false: ', amortFalse)
  }

  function make_jiff(base_instance, options) {
    if (base_instance.modules.indexOf('bignumber') == -1)
      throw "Amortizedbool: base instance must use bignumber";

    // Parse options
    parseOptions(base_instance, options);

    // Add extension to modules
    base_instance.modules.push("amortizedbool");
    
    // Add new functionality
    base_instance.hooks.createSecretShare.push(amortizedBool);
    base_instance.hooks.beforeShare.push(function(jiff, secret, threshold, receivers_list, senders_list, Zp) { return convert(secret); });
    // base_instance.hooks.beforeOpen.push(function(jiff, share, parties) { return revert(share)});
    
    return base_instance;

  }

  exports.make_jiff = make_jiff;
}((typeof exports == 'undefined' ? this.jiff_amortizedbool = {} : exports), typeof exports != 'undefined'));

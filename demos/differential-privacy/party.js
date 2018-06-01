
      var jiff_instance;

      function connect() {
        $('#connectButton').prop('disabled', true);
        var computation_id = $('#computation_id').val();
        var party_count = parseInt($('#count').val());

        if(isNaN(party_count)) {
          $("#output").append("<p class='error'>Party count must be a valid number!</p>");
          $('#connectButton').prop('disabled', false);
        } else {
          var options = { party_count: party_count};
          options.onError = function(error) { $("#output").append("<p class='error'>"+error+"</p>"); };
          options.onConnect = function() { $("#output").append("<p>All parties Connected!</p>"); $("#voteButton").attr("disabled", false); };

          var hostname = window.location.hostname.trim();
          var port = window.location.port;
          if(port == null || port == '') 
            port = "80";
          if(!(hostname.startsWith("http://") || hostname.startsWith("https://")))
            hostname = "http://" + hostname;
          if(hostname.endsWith("/"))
            hostname = hostname.substring(0, hostname.length-1);
          if(hostname.indexOf(":") > -1)
            hostanme = hostname.substring(0, hostname.indexOf(":"));
          hostname = hostname + ":" + port;
          jiff_instance = jiff.make_jiff(hostname, computation_id, options);
          jiff_instance = jiff_bignumber.make_jiff(jiff_instance, options)
          jiff_instance = jiff_fixedpoint.make_jiff(jiff_instance, { decimal_digits: 5, integral_digits: 5}); // Max bits after decimal allowed

          $('#inputCard').show();

        }
      }

      function submit() {

        const value = parseInt(document.getElementById('input').value);
        // const noise = generateNoise();

        const noisyData = value;
        console.log(noisyData)

        MPC(noisyData);
        
    
      }

      function generateNoise() {
        const variance = calcVariance(0.5, 1, jiff_instance.party_count);

        const distribution = gaussian(jiff_instance.party_count, variance);

        const rand = distribution.ppf(Math.random());

        return rand;
      }

      function calcVariance(epsilon, del, n) {
        return ((2 * Math.log(1.25/del)) * (((2 * n) - 1) / (epsilon * epsilon))) / n;
      }

      function sumShares(shares) {
        var sum = shares["1"];

        for (var i = 2; i <= Object.keys(shares).length; i++) {
          sum = sum.add(shares[i])
        }   
        
        return sum;
      }

      function MPC(input) {
        $("#sumButton").attr("disabled", true);
        $("#output").append("<p>Starting...</p>");

        const data = jiff_instance.share(input);

        const totalSum = sumShares(data);

        jiff_instance.open(totalSum).then(handleResult);
      }

      function handleResult(results) {

        for(var i = 0; i < results.length; i++) {
          if(results[i] == null) continue;
          $("#res"+i).html(results[i]);
        }

        $("#sumButton").attr("disabled", false);
      }

      function handleError() {
        console.log("Error in open_all");
      }




// var party_count = process.argv[3];
// if(party_count == null) party_count = 2;
// else party_count = parseInt(party_count);

// var computation_id = process.argv[4];
// if(computation_id == null) computation_id = 'test-fixed';

// var party_id = process.argv[5];
// if(party_id != null) party_id = parseInt(party_id, 10);

// var BigNumber = require('bignumber.js');
// var jiff_instance;

// var options = {party_count: party_count, party_id: party_id, Zp: new BigNumber(32416190071), autoConnect: false };
// options.onConnect = function() {
//   try {
//     var shares = jiff_instance.share(input);

//     var sum = shares[1];
//     for(var i = 2; i <= jiff_instance.party_count; i++)
//       sum = sum.sadd(shares[i]);

//     sum.open(function(r) { console.log(r.toString(10)); jiff_instance.disconnect(); } );
//   } catch (err) {
//     console.log(err);
//   }
// }

// var base_instance = require('../../lib/jiff-client').make_jiff("http://localhost:8080", computation_id, options);
// base_instance = require('../../lib/ext/jiff-client-bignumber').make_jiff(base_instance, options)
// jiff_instance = require('../../lib/ext/jiff-client-fixedpoint').make_jiff(base_instance, { decimal_digits: 5, integral_digits: 5});
// jiff_instance.connect();

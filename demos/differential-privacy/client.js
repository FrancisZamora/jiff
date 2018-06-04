var epsilon = 0.5;
var delta = 1; 
var max_input = 4;
var jiff_instance;

function connect() {
  $('#connectButton').prop('disabled', true);
  var computation_id = $('#computation_id').val();
  var party_count = parseInt($('#count').val());

  if(isNaN(party_count)) {
    $("#output").append("<p class='error'>Party count must be a valid number!</p>");
    $('#connectButton').prop('disabled', false);
  } else {
    var options = {
      party_count: party_count,
      autoConnect: false,
      onError: function(error) {
        $("#output").append("<p class='error'>"+error+"</p>");
      },
      onConnect: function() {
        $("#output").append("<p>All parties Connected!</p>");
        $("#voteButton").attr("disabled", false);
      }
    };

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
    jiff_instance.connect();
    
    $("#output").show();
    $("#output").append("<p>Waiting for all parties!</p>");

    $('#inputCard').show();
  }
}

// function submit() {
//   var value = parseInt(document.getElementById('input').value);
//   MPC(value);
// }

function generateNoise() {
  const variance = calcVariance();
  const distribution = gaussian(0, variance);
  const rand = distribution.ppf(Math.random());
  var noise = jiff_instance.BigNumber(rand.toString());
  console.log(noise.toString());
  return noise;
}

// function generateNoise(mean) {
//   const variance = calcVariance(0.5, 1, jiff_instance.party_count);

//   const distribution = gaussian(mean, variance);

//   const rand = distribution.ppf(Math.random());

//   return rand;
// }

// function calcVariance(epsilon, del, n) {
//   return ((2 * Math.log(1.25/del)) * (((2 * n) - 1) / (epsilon * epsilon))) / n;
// }


function calcVariance() {
  var n = jiff_instance.BigNumber(jiff_instance.party_count);
  var sensitivty = n.times(2).minus(1).sqrt().times(max_input);
  var log1 = Math.log(1.25 / delta)/Math.log(2);
  var factor = jiff_instance.BigNumber(log1.toString()).times(2).sqrt(); // Loosing accuracy when using native Math.log & '/'
  factor = factor.div(epsilon).times(sensitivty); 
  return factor.pow(2).div(n).toNumber();
}

function openTab(event, id) {

  if (id === 'binaryOption') {
    $('#binaryOption').show();
    $('#averageOption').hide();
  } else {
    $('#averageOption').show();
    $('#binaryOption').hide();

  }
}

function MPCAverage(input) {
  // $("#sumButton").attr("disabled", true);
  // $("#output").append("<p>Starting...</p>");

  // var shares = jiff_instance.share(input);

  // var sum = shares[1];
  // for (var i = 2; i <= jiff_instance.party_count; i++)
  //   sum = sum.sadd(shares[i]);

  // var noise_shares = jiff_instance.share(generateNoise());
  // var noise = noise_shares[1];
  // for (var i = 2; i <= jiff_instance.party_count; i++)
  //   noise = noise.sadd(noise_shares[i]);

  // var noisy_sum = sum.sadd(noise);
  // jiff_instance.open(noisy_sum).then(handleResult);
  // noise.open(function(v) { console.log(v.toString()); } );
}

function handleResult(result) {
  $("#output").append("<p>Result: "+result.div(jiff_instance.party_count).toString()+"</p>");
  $("#sumButton").attr("disabled", false);
}




function vote() {

  let vote = 0;
  if (document.getElementById('hillary').checked) {
    vote++;
  }

  const noise = generateNoise(0);
  console.log(noise)

  MPCVote(noise.plus(vote));
  

}


function submit() {

  const value = parseInt(document.getElementById('input').value);

  // const noisyData = value;
  noise = generateNoise(3.0);

  MPCAverage(noise + value);
  

}



function MPCVote(vote) {
  $("#sumButton").attr("disabled", true);
  $("#output").append("<p>Starting...</p>");

  const votes = jiff_instance.share(vote);
  const voteSum = sumShares(votes);


  jiff_instance.open(voteSum).then(function(value) {
    console.log(value.toString());
  });
}


function sumShares(shares) {
  var sum = shares["1"];

  for (var i = 2; i <= Object.keys(shares).length; i++) {
    sum = sum.add(shares[i])
  }   
  
  return sum;
}


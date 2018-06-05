var epsilon = 0.5;
var delta = 1;
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
    $('#binaryOption').hide();
    $('#averageOption').hide();
  }
}

function average() {
  var value = parseInt(document.getElementById('input').value);
  MPCAvg(value);
}

function vote() {
  if(document.getElementById('hillary').checked)
    MPCVote(1);
  else
    MPCVote(0);
}

function generateNoise(max_input) {
  const variance = calcVariance(max_input);
  const distribution = gaussian(0, variance);
  const rand = distribution.ppf(Math.random());
  var noise = jiff_instance.BigNumber(rand.toString());
  console.log(noise.toString());
  return noise;
}


function calcVariance(max_input) {
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

function sumShares(shares) {
  var sum = shares[1];
  for(var i = 2; i <= jiff_instance.party_count; i++)
    sum = sum.sadd(shares[i]);
  return sum;
}

function MPCAvg(input) {
  $("#submitButton").attr("disabled", true);
  $("#output").append("<p>Starting...</p>");

  var shares = jiff_instance.share(input);
  var sum = sumShares(shares);

  var noise_shares = jiff_instance.share(generateNoise(4));
  var noise = sumShares(noise_shares);

  var noisy_sum = sum.sadd(noise);
  jiff_instance.open(noisy_sum).then(handleResult);
}

function MPCVote(input) {
  $("#voteButton").attr("disabled", true);
  $("#output").append("<p>Starting...</p>");

  const votes = jiff_instance.share(input);
  const voteSum = sumShares(votes);
  
  const noises = jiff_instance.share(generateNoise(1));
  const noiseSum = sumShares(noises);

  const result = voteSum.sadd(noiseSum);

  jiff_instance.open(result).then(handleResult);

  //initGraph( {raw:{x:jiff_instance.id, y:value},noisy:{x:jiff_instance.id, y:noisyData}} );
}

function handleResult(result) {
  $("#output").append("<p>Result: "+result.div(jiff_instance.party_count).toString()+"</p>");
  $("#submitButton").attr("disabled", false);
  $("#voteButton").attr("disabled", false);
}

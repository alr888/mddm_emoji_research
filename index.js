var cool = require('cool-ascii-faces');
var express = require('express');
var app = express();
var EventEmitter = require("events").EventEmitter;
var moment = require('moment');

const bodyParser = require('body-parser');

app.use(bodyParser.json());

app.set('port', (process.env.PORT || 5000));

//Meter read request function
app.post('/hook', function (req, res) {
    console.log('hook request');
	var moment = require('moment');
    var request = require('request');
	
    try {
		
        var speech = 'empty speech';
		var sp2 = 'empty speech';
		
		function post_opts(struser,strdate) {
			var temp = [];
			var par_optns = [];
			temp = struser.split(",");
			var optns = {
			headers: {"content-type": "application/json"},
			json: true,
			url: "https://api.meterdataapi.net/icp/agent/" + temp[0] + "/" + temp[1] + "/" + strdate + "/" + strdate + "?tz=Pacific/Auckland",
			timeout: 120000,
			auth: {
				user: temp[0],//username, ICP is temp[1]
				password: temp[2]//password
				}
			};
					
			par_optns[0] = optns;
			par_optns[1] = temp[3]; //meter_no
			par_optns[2] = temp[4]; //reg_content
			par_optns[3] = temp[7]; //reg_sums e.g. TOTAL, MAIN
			//arielreyes[0],0000009801TR-4D6[1],jR8xM098YX[2],214521754[3],D16/N8[4],"💚"[5],"👎"[6],TOTAL[7]
			
			return par_optns;
		}	
			
		function loadSets( id ) {
			var total = 0;
			for (var i = 0; i < id.length; i++) {
				total  =  total + id[i];
			}
			var vtotal = total.toFixed(3);
			return vtotal;
		}	
		
		function foo(optns,callback) {
			var options = optns[0];  
			request(options, function (err, res, body) {
			var test = JSON.stringify(body.meters);
						if (test === '{}') {
							var my_number = [];
							my_number[0] = 0;
							my_number[1] = speech;
						} else 
						//{var sum_curr =  body["meters"][optns[1]]["MAIN"]["registers"][optns[2]]["reads"];
					    {var sum_curr =  body["meters"][optns[1]][optns[3]]["registers"][optns[2]]["reads"];
					       console.log("Reg:"+optns[3]);
						//{ var sum_curr =  body["meters"][optns[1]][optns[7]]["registers"][optns[2]]["reads"];
							var my_number = [];
							my_number[0] = loadSets(sum_curr);
							my_number[1] = speech;
						}
						callback(my_number);
					}
				);
			}

		var cur = 0;	
			
		if (req.body) {
            var requestBody = req.body;
			
            if (requestBody.result) {
                speech = '';
                if (requestBody.result.fulfillment) {
                    speech += requestBody.result.fulfillment.speech;
                    speech += ' ';
                }		
				//API.AI Webhook PARAMETER NAME
				
				var date = ' ';//moment(date,'YYYYMMDD').format('YYYYMMDD');;
				var past_date = ' ';//moment(date,'YYYYMMDD').subtract('years', 1).format('YYYYMMDD');
				var spec_date = ' ';//moment(date,'YYYYMMDD').subtract('years', 1).format('YYYYMMDD');
				var process = ' ';
                
				var parameters = requestBody.result.parameters;
			    if (parameters){
                    for (var p in parameters){
                       	if(p === 'date') {
							var tmpdate = parameters[p];
							date = moment(tmpdate,'YYYY-MM-DD').format('YYYYMMDD');
							speech += 'Meter read requested for ' + moment(tmpdate,'YYYY-MM-DD').format('YYYY-MM-DD');
							console.log('Current: ' + tmpdate);
						}
						if(p === 'range') {
						
						if(parameters[p] === 'day') {
							past_date = moment(date,'YYYYMMDD').subtract('days', 1).format('YYYYMMDD');
							speech += ' and comparing it to meter read for ' + moment(past_date,'YYYYMMDD').format('YYYY-MM-DD') + '. ';
							console.log('Previous: ' + past_date);
						} else if(parameters[p] === 'week') {
							past_date = moment(date,'YYYYMMDD').subtract('days', 7).format('YYYYMMDD');
							speech += ' and comparing it to meter read for ' + moment(past_date,'YYYYMMDD').format('YYYY-MM-DD') + '. ';
							console.log('Previous: ' + past_date)
						} else if(parameters[p] === 'month') {
							past_date = moment(date,'YYYYMMDD').subtract('months', 1).format('YYYYMMDD');
							speech += ' and comparing it to meter read for ' + moment(past_date,'YYYYMMDD').format('YYYY-MM-DD') + '. ';
							console.log('Previous: ' + past_date)
						} else if(parameters[p] === 'year') {
							past_date = moment(date,'YYYYMMDD').subtract('years', 1).format('YYYYMMDD');
							speech += ' and comparing it to meter read for ' + moment(past_date,'YYYYMMDD').format('YYYY-MM-DD') + '. ';
							console.log('Previous: ' + past_date)
						} else {
							var tmpdate = parameters[p];
							past_date = moment(date,'YYYY-MM-DD').format('YYYYMMDD');
							}
							
							process = 'range';
							
						}
						
						if(p === 'specdate') {
						
							var tmpdate = parameters[p];
							var sdate = moment(tmpdate,'YYYY-MM-DD');
							var cdate = moment(date,'YYYY-MM-DD');
							
							if (cdate > sdate) {
								spec_date = moment(tmpdate,'YYYY-MM-DD').format('YYYYMMDD');
								speech += ' and comparing it to meter read for ' + moment(spec_date,'YYYYMMDD').format('YYYY-MM-DD') + '. ';
								console.log('Specific Date: ' + spec_date);
							} 	
							
							process = 'specific';
						
						}
						
						if(p === 'price') {
							let axios = require('axios');
							let cheerio = require('cheerio');
							
							var kurs= ' ';

							let base_url = 'https://www1.electricityinfo.co.nz/price_indexes';

							  axios.get(base_url).then( (response) => {
								let $ = cheerio.load(response.data);
								//let kurs = ' ';
								//let kurs = [];
								
								kurs = 'Spot Market Price as of ' +  $('.date-of-current-value').first().text().trim() +  ' --- ' ;
								
								kurs += 'New Zealand : ' +  $('.current-value').eq(3).text().replace(/(\r\n|\n|\r)/gm,'').trim() + ', ';
								kurs += ' Upper North Island : ' +  $('.current-value').eq(0).text().replace(/(\r\n|\n|\r)/gm,'').trim() + ', ';
								kurs += ' Lower North Island : ' +  $('.current-value').eq(1).text().replace(/(\r\n|\n|\r)/gm,'').trim() + ', ';
								kurs += ' South Island: ' +  $('.current-value').eq(2).text().replace(/(\r\n|\n|\r)/gm,'').trim() + '.';
								
								//kurs[0] =   'Upper North Island: ' +  $('.current-value').eq(0).text().replace(/(\r\n|\n|\r)/gm,'').trim();
								//kurs[1] =   ' Lower North Island: ' +  $('.current-value').eq(1).text().replace(/(\r\n|\n|\r)/gm,'').trim();
								//kurs[2] =   ' South Island: ' +  $('.current-value').eq(2).text().replace(/(\r\n|\n|\r)/gm,'').trim();
								//kurs[3] =   ' New Zealand: ' +  $('.current-value').eq(3).text().replace(/(\r\n|\n|\r)/gm,'').trim();
								
								return(kurs);
							}).then( (kurs) => {
							  speech += kurs;
							  return res.json({
												speech: speech,
												displayText: speech,
												source: 'apiai-webhook-sample'
										});
							 });
							 
							 console.log(kurs);
						}
						
						
						
						if(p === 'user') {
							
							var tmpuser = parameters[p];
							
							var optn = post_opts(tmpuser,date);
							
								

							
							var temp = [];  
							temp = tmpuser.split(","); //String to array to store emoji
												
							var cur = 0;
							var prev = 0;
							var good = temp[5];
							var bad = temp[6]
												
							foo(optn, function(num1) {
								//Result for first date provided.
								cur = num1[0];	

								if (cur === 0 ) {
									speech += "Oops! There is no meter data for one or both of the dates requested.";
									return res.json({
												speech: speech,
												displayText: speech,
												source: 'apiai-webhook-sample'
										});	
								}
								
								var cdate = moment(date,'YYYY-MM-DD');
								var pdate = moment(past_date,'YYYY-MM-DD');
								var sdate = moment(spec_date,'YYYY-MM-DD');

								//Check is for a specific date or range based on intent from API.AI
								if (process === 'specific') {		
									var optn2 = post_opts(tmpuser,spec_date);
								} 
								
								if (process === 'range') {
									var optn2 = post_opts(tmpuser,past_date);
								}
								
								if ( past_date === ' ' && spec_date === ' ' ) {
										speech += " Read for Requested Date: " + parseFloat(cur).toFixed(3) + "KwH .";
										console.log(speech);
										return res.json({
											speech: speech,
											displayText: speech,
											source: 'apiai-webhook-sample'
										});
								}
																
								if (cdate > pdate || cdate > sdate ) {								
									foo(optn2, function(num2) {
									prev = num2[0];
									//Only generate comparison if current reads is > 0.
									if( cur > 0 ){
										if (+cur <= +prev) {
											var emoji = good; //good emoji
										} 
										if (+cur > +prev) {
											var emoji = bad; //bad emoji
										}	
										speech += " Read for Requested Date: " + parseFloat(cur).toFixed(3) + "KwH and Previous Read:" + parseFloat(prev).toFixed(3) + "KwH Sentiment: " + emoji;
										console.log(speech);
										return res.json({
												speech: speech,
												displayText: speech,
												source: 'apiai-webhook-sample'
										});
										}				
									});		
								} 								
							});	
						};		
						}				
					}
				}
            }

		
		
    } catch (err) {
        console.error("Can't process request", err);

        return res.status(400).json({
            status: {
                code: 400,
                errorType: err.message
            }
        });
    }
});


app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.render('pages/index');
});

app.get('/cool', function(request, response) {
  response.send(cool());
});

app.get('/favicon.ico', function(request, response) {
  response.send(cool());
});

app.get('/writer', function(request, response) {
  var schedule = require('node-schedule');

var rule = new schedule.RecurrenceRule();
rule.minute = 30;

var fs = require('fs'),
	path = require('path'),    
    filePath = path.join(__dirname, 'dailyprice.txt');


fs.writeFile(filePath, "Hey there!", function(err) {
    if(err) {
        return console.log(err);
    }
  console.log("The file was saved!");
  });

  console.log(filePath);
  
  
//ReadFile
fs.readFile(filePath, {encoding: 'utf-8'}, function(err,data){
    if (!err) {
        console.log('received data: ' + data);
        //response.writeHead(200, {'Content-Type': 'text/html'});
        //response.write(data);
       // response.end();
    } else {
        console.log(err);
    }
});
 
var j = schedule.scheduleJob(rule, function(){
  console.log('The answer to life, the universe, and everything!');
});


});

//Electricity market spot prices function

app.get('/cheerio', function(request, response) {
 let axios = require('axios');
 let cheerio = require('cheerio');


 let base_url = 'https://www1.electricityinfo.co.nz/price_indexes';



  axios.get(base_url).then( (response) => {
    let $ = cheerio.load(response.data);
    //let kurs = ' ';
	let kurs = [];
	
	
	//var search = $('td').filter( function ()
	//{
	//	return $( this ).text().toLowerCase().indexOf( text.toLowerCase() ) >= 0;
	//}).first();
  
    //kurs = search; //$(this).closest('.index-summary').siblings('.current-value').val();

    //kurs =  $('.current-value').text();
	
	//console.log(kurs); 
	kurs[0] =   'Upper North Island: ' +  $('.current-value').eq(0).text().replace(/(\r\n|\n|\r)/gm,'').trim();
	kurs[1] =   'Lower North Island: ' +  $('.current-value').eq(1).text().replace(/(\r\n|\n|\r)/gm,'').trim();
	kurs[2] =   'South Island: ' +  $('.current-value').eq(2).text().replace(/(\r\n|\n|\r)/gm,'').trim();
	kurs[3] =   'New Zealand: ' +  $('.current-value').eq(3).text().replace(/(\r\n|\n|\r)/gm,'').trim();
	
	return(kurs);
}).then( (kurs) => {
  response.send(kurs);
 })
 
});


app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

app.get('/times', function(request, response) {
    var result = ''
    var times = process.env.TIMES || 5
    for (i=0; i < times; i++)
      result += i + ' ';
  response.send(result);
});

app.get('/db', function (request, response) {
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query('SELECT * FROM test_table', function(err, result) {
      done();
      if (err)
       { console.error(err); response.send("Error " + err); }
      else
       { response.render('pages/db', {results: result.rows} ); }
    });
  });
});

app.get('/:date', function(request, response) {
	var date = request.params.date;
	
	var year = 0;
	
	year = date.substring(0,4);
	year = year - 1;
	
	var monthday = date.substring(4,8);

	var year_ago = "" + year + monthday;
	
	var request = require('request');
	
	
	var username = ''
	var password = ''
	
	var options = {
		headers: {"content-type": "application/json"},
		json: true,
		url: "https://api.meterdataapi.net/icp/agent/arielreyes/0000125682TR-D76/" + date + "/" + date + "?tz=Pacific/Auckland",
		auth: {
				user: username,
				password: password
		}
	};
	
	
	var options2 = {
		headers: {"content-type": "application/json"},
		json: true,
		url: "https://api.meterdataapi.net/icp/agent/arielreyes/0000125682TR-D76/" + year_ago + "/" + year_ago + "?tz=Pacific/Auckland",
		auth: {
				user: username,
				password: password
		}
	};
	
	
	
	function loadSets( id ) {
	var total = 0;
	
	for (var i = 0; i < id.length; i++) {
		 total  =  total + id[i];
	}
	 return total;
	}

// define our function with the callback argument


function some_function(callback) {
  
   request(options, function (err, res, body) {
	   
		var test = JSON.stringify(body.meters);
		
		if (test === '{}') {
			var my_number = 0;
		} else {
			//test = body["meters"]["214521754"]["MAIN"]["registers"]["UN24"]["reads"];
			var sum_curr =  body["meters"]["214521754"]["MAIN"]["registers"]["UN24"]["reads"];
			var my_number = loadSets(sum_curr);
		}
		
		callback(my_number);
		
	});	
  
}

some_function(function(num) {
  // this anonymous function will run when the
  // callback is called
  //response.send("callback called! " + num);

   request(options2, function (err, res, body) {
	   
	    var test = JSON.stringify(body.meters);
		
		if (test === '{}' || num === 0) {
			response.send("No data for date requested.");
		} else {
			var sum_curr =  body["meters"]["214521754"]["MAIN"]["registers"]["UN24"]["reads"];
			var prev = loadSets(sum_curr);
			if (num <= prev) {
				var emoji = "🙂";
			} else {
				var emoji = "😞";
			}	
			response.send("Current Read: " + parseFloat(num).toFixed(2) + "kwh Last Year's Read:" + parseFloat(prev).toFixed(2) + "kwh Sentiment: " + emoji );
			
		}
				
		});		
  	});
}); 

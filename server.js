const nr = require('newrelic');
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express()

// API key for open weather in the New Relic Home directory.
// export as environment variable to avoid checking into git. 
// TODO: Make a proper .env file. 
//const apiKey = '*****************';
const apiKey = process.env.openWeatherAPIkey;

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs')

app.get('/', function (req, res) {
  res.render('index', {weather: null, error: null});
})

app.post('/', function (req, res) {
  let city = req.body.city;
  let url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=imperial&appid=${apiKey}`

  request(url, function (err, response, body) {
    if(err){
      res.render('index', {weather: null, error: 'Error, please try again'});
    } else {
      let weather = JSON.parse(body)
      if(weather.main == undefined){
        res.render('index', {weather: null, error: 'Error, please try again'});
      } else {
        let weatherText = `It's ${weather.main.temp} degrees in ${weather.name}!`;
        res.render('index', {weather: weatherText, error: null});
      }
    }
  });
})

app.set('port', process.env.PORT || 3000);
app.listen(app.get('port'), function () {
  console.log('Simple Weather App listening on port '+ app.get('port'))
})

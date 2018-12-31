let newrelic = require('newrelic');
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();
const numberOfWeatherAPICallsKey = 'Custom/WeatherAPI/Calls';

// API key for open weather in the New Relic Home directory.
// export as environment variable to avoid checking into git. 
// TODO: Make a proper .env file. 
//const apiKey = '*****************';
const apiKey = process.env.openWeatherAPIkey;

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('nr', newrelic);

newrelic.recordMetric(numberOfWeatherAPICallsKey,0);

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
      let weather = JSON.parse(body);
      res.app.get('nr').incrementMetric(numberOfWeatherAPICallsKey);
      if(weather.main == undefined){
        res.app.get('nr').addCustomAttributes({
          "Error Code": weather.cod,
          "Message": weather.message
        });
        res.render('index', {weather: null, error: 'Error, please try again'});
      } else {
        let weatherEventDetail = {
          "lon": weather.coord.lon,
          "lat": weather.coord.lat,
          "visibility":weather.visibility,
          "temp": weather.main.temp,
          "temp_max": weather.main.temp_max,
          "temp_min": weather.main.temp_min,
          "pressure": weather.main.pressure,
          "humidity": weather.main.humidity,
          "cityName": weather.name,
          "cityId": weather.id,
          "windSpeed": weather.wind.speed,
          "windDirection": weather.wind.deg,
          "weatherCondition": weather.weather[0].id,
          "weatherConditionCategoy": weather.weather[0].main,
          "weatherConditionDetail": weather.weather[0].description,
        };
        res.app.get('nr').recordCustomEvent("WeatherEventDetail", weatherEventDetail);
        res.app.get('nr').recordMetric('Custom/Weather/Temp', weather.main.temp);
        res.app.get('nr').recordMetric('Custom/'+ weather.name + '/Temp', weather.main.temp);
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

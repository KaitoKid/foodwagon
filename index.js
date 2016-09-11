var Flint = require('node-flint');
var webhook = require('node-flint/webhook');
var Restify = require('restify');
var server = Restify.createServer();
server.use(Restify.bodyParser());


var wagons = [];
var wagonId = 1;
function getId() {
    return wagonId++;
}

var restaurants = [];
restaurants.push('McDonalds');
function pickRandRestaurant() {
    var restaurant = restaurants[Math.floor(Math.random() * restaurants.length)];
    return restaurant;
}

function listrestaurants(){
  var i = 1;
  var currentList = "The current list of restaurants are the following: "
  while (i <= restaurants.length){
    currentList = currentList + '\n' + i.toString() + "." + restaurants[i - 1];
  }
}
// flint options
var config = {
    webhookUrl: 'http://b8f93335.ngrok.io/flint',
    token: 'NjExNDJlYWItZTllNC00MDMyLWE0YjItNDk3ZjBjZTcxODlkOWQ2MDVkZTItZDE3',
    port: 80
};

server.get('/aaa', function() { console.log("aaa");});

// init flint
var flint = new Flint(config);
flint.start();
console.log('Started')

// say hello
flint.hears('/hello', function(bot, trigger) {
    console.log("hello");
    bot.say('Hello %s!', trigger.personDisplayName);
});


var Wagon = function (time, minPeople) {
    this.time = time;
    this.minPeople = minPeople;
    this.numPeople = 1;
    this.restaurant = pickRandRestaurant();

    this.id = getId();

    /*this.addPerson = function(name) {
        console.log("add " + name);
        numPeople++;
    };*/

    console.log("create wagon " + this.time + " " + this.minPeople + " " + this.restaurant);
};


flint.hears('/add', function(bot, trigger) {
    var restaurant = trigger.text.substring(13);
    console.log(restaurant);
    restaurants.push(restaurant);
    bot.say('Added %s to the list of restaurants.', restaurant);
});


flint.hears('/food', function(bot, trigger) {
    console.log('\/food');
    var keywords = trigger.text.split(" ");
    if (keywords.length != 4) {
        console.log('error');
        bot.say('Invalid arguments. Please make sure the command is in the form \"\/food <time> <number of people>\"');
        return;
    }
    var time = keywords[2];
    var numPeople = keywords[3];
    // TODO validation, convert time properly

    var wagon = new Wagon(time, numPeople);
    wagons[wagon.id] = wagon;

    bot.say('How about %s for lunch at %s? Looking for %s people.', wagon.restaurant, wagon.time, wagon.minPeople);
    bot.say('Enter the command \"\/join %s\" to join this Foodwagon', wagon.id);

    console.log(wagons);
});

// define restify path for incoming webhooks
server.post('/flint', webhook(flint));

// start restify server
server.listen(config.port, function () {
    console.log("listening on port " + config.port);
    flint.debug('Flint listening on port %s', config.port);
});

// gracefully shutdown (ctrl-c)
process.on('SIGINT', function() {
    flint.debug('stoppping...');
    server.close();
    flint.stop().then(function() {
        process.exit();
    });
});

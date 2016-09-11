var Flint = require('node-flint');
var webhook = require('node-flint/webhook');
var Restify = require('restify');
var server = Restify.createServer();
server.use(Restify.bodyParser());

function isInt(value) {
    return !isNaN(value) && 
           parseInt(Number(value)) == value && 
           !isNaN(parseInt(value, 10));
}

var wagons = [];
var wagonId = 1;

function getId() {
    return wagonId++;
}

function wagonExists(wagonId) {
    if (wagons[wagonId]) {
        return true;
    }
    return false;
}

function findWagon(wagonId) {
    return wagons[wagonId];
}


var restaurants = [];
restaurants.push('McDonalds');

function pickRandRestaurant() {
    var restaurant = restaurants[Math.floor(Math.random() * restaurants.length)];
    return restaurant;
}

function listRestaurants(){
    var currentList = "The current list of restaurants are the following: ";
    return currentList + restaurants.join(", ");
}

function addRestaurant(restaurant) {
    if (restaurants.indexOf(restaurant) < 0) {
        restaurants.push(restaurant);
    }
}


// flint options
var config = {
    webhookUrl: 'http://b8f93335.ngrok.io/flint',
    token: 'NjExNDJlYWItZTllNC00MDMyLWE0YjItNDk3ZjBjZTcxODlkOWQ2MDVkZTItZDE3',
    port: 80
};

// init flint
var flint = new Flint(config);
flint.start();
console.log('Started')

// say hello
flint.hears('/hello', function(bot, trigger) {
    console.log("hello");
    bot.say('Hello %s!', trigger.personDisplayName);
});


var Wagon = function (time, minPeople, restaurant, owner) {
    this.time = time;
    this.minPeople = minPeople;
    this.numPeople = 0;
    this.restaurant = restaurant;
    this.id = getId();

    this.people = [];

    this.addPerson = function(name) {
        console.log("add " + name);
        this.numPeople++;
        console.log('a');
        this.people.push(name);
        console.log("a " + this.numPeople + " " +  this.minPeople);
    };

    this.addPerson(owner);

    console.log("create wagon " + this.time + " " + this.minPeople + " " + this.restaurant);
};


flint.hears('/add', function(bot, trigger) {
    var restaurant = trigger.text.substring(13);
    console.log(restaurant);
    restaurants.push(restaurant);
    bot.say('Added %s to the list of restaurants.', restaurant);
});

flint.hears('/list', function(bot, trigger) {
    bot.say(listRestaurants());
});


flint.hears('/food', function(bot, trigger) {
    console.log('\/food');
    var keywords = trigger.text.split(" ");
    if (keywords.length < 4) {
        console.log('error');
        bot.say('Invalid arguments. Please make sure the command is in the form \"\/food <time> <number of people>\"');
        return;
    }
    var time = keywords[2];
    var numPeople = parseInt(keywords[3]);

    console.log('a');
    var wagon;
    if (keywords.length == 4) {
        console.log('b');
        wagon = new Wagon(time, numPeople, pickRandRestaurant(), trigger.personDisplayName);
    } else {
        console.log('c');
        var restaurant = keywords.slice(4).join(" ");
        console.log('d');
        addRestaurant(restaurant);
        console.log('e');
        wagon = new Wagon(time, numPeople, restaurant, trigger.personDisplayName);
    }
    bot.say('How about %s for food at %s? Looking for %s people.', wagon.restaurant, wagon.time, wagon.minPeople - 1);
    bot.say('Enter the command \"\/join %s\" to join this Foodwagon', wagon.id);
    
    wagons[wagon.id] = wagon;
    
    console.log(wagons);
});

flint.hears('/join', function(bot, trigger) {
    var keywords = trigger.text.split(" ");
    if (!isInt(keywords[2])) {
        bot.say('Unable to parse your command \"%s\".', trigger.text);
        return;
    }
    var wagonId = parseInt(keywords[2], 10);
    if (!wagonExists(wagonId)) {
        bot.say('Wagon %s does not exist.', wagonId);
        return;
    }
    var wagon = findWagon(wagonId);
    wagon.addPerson(trigger.personDisplayName);
    //console.log(wagon.numPeople + " " + wagon.minPeople);
    if (wagon.numPeople < wagon.minPeople) {
        var required = wagon.minPeople - wagon.numPeople;
        bot.say('%s has joined the wagon to %s. Need %s more people to join', trigger.personDisplayName, wagon.restaurant, required);
    } else {
        bot.say('%s has joined the wagon to %s. All aboard!', trigger.personDisplayName, wagon.restaurant);
    }
});

flint.hears('/wagons', function(bot, trigger) {
    console.log('wagons');
    var message = "The current wagons are:";
    for (var i = 1; i < wagons.length; i++) {
        var wagon = wagons[i]
        message = message + "\n" + wagon.restaurant + ": " + wagon.people.join(", ");
    }
    bot.say(message);
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

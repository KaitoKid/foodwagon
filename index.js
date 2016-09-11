var Flint = require('node-flint');
var webhook = require('node-flint/webhook');
var Restify = require('restify');
var server = Restify.createServer();
server.use(Restify.bodyParser());

// flint options
var config = {
  webhookUrl: 'http://myserver.com/flint',
  token: 'Y2VmNDI4ZjQtMGU3My00YWE1LWE1NWItYzllNDlmMjIyNTMwMjY5ZjQzMjYtYzhi',
  port: 80
};

// init flint
var flint = new Flint(config);
flint.start();
console.log('Started')

// say hello
flint.hears('/hello', function(bot, trigger) {
  bot.say('Hello %s!', trigger.personDisplayName);
});

// define restify path for incoming webhooks
server.post('/flint', webhook(flint));

// start restify server
server.listen(config.port, function () {
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

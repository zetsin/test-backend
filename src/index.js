const forever = require('forever-monitor');

const child = new (forever.Monitor)(__dirname + '/app.js', {
  watch: true,
  watchDirectory: __dirname
});

child.on('exit', () => {
  console.log('app.js has exited');
});

child.start();
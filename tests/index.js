const forever = require('forever-monitor');

const child = new (forever.Monitor)(__dirname + '/test.js', {
  watch: true,
  watchDirectory: __dirname
});

child.on('exit', () => {
  console.log('app.js has exited');
});

child.start();
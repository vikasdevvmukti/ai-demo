const app = require('./app');
const { initTwoWayTalk } = require('./services/twoWayTalk');
const { initFlvProxy } = require('./services/flvProxy');

const PORT = process.env.PORT || 8082;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

initTwoWayTalk(server);
initFlvProxy(server);
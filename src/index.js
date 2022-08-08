const { setupApp } = require('./express-server');
const log = require('./log');

setupApp()
  .then((app) => {
    const port = 4447;
    app.listen({ port }, () => log.info(`app running on port ${port}`));
    return app;
  })
  .catch((error) => {
    log.error(error);
  });

const express = require('express');
const mongoose = require('mongoose');
const routes = require('./routes');
require('dotenv/config');

const app = express();
const port = 4447;

async function setupApp() {
  app.use(express.json());

  app.use('/api/anyJS/v1', routes);

  mongoose.connect(process.env.DB_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true }, () => console.log('Connected to DB!'));

  return app;
};

setupApp()
  .then((app) => {
    app.listen({ port }, () => console.log(`app running on port ${port}`));
    return app;
  })
  .catch((error) => {
    console.log(error);
  });

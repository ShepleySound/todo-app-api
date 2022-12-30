'use strict';

require('dotenv').config();
const { app } = require('./src/server');
const { sequelizeDB } = require('./src/models');
const PORT = process.env.PORT || 3002;

async function init() {
  await sequelizeDB.authenticate();
  await sequelizeDB.sync();

  app.listen(PORT, () => {
    console.log(`Server started. Listening on port ${PORT}`);
  });
}

init();

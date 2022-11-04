'use strict';

const { users } = require('../../models');

module.exports = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return _authError();
    }
    // console.log("ERROR")

    const token = req.headers.authorization.split(' ').pop();
    const validUser = await users.authenticateToken(token);
    req.user = {};
    req.user.id = validUser.id;
    req.user.username = validUser.username;
    req.user.capabilities = validUser.capabilities;
    // req.token = validUser.token;
    next();
  } catch (err) {
    console.error('Invalid bearer request', err.message);
    res.status(401).send('Invalid bearer request. ' + err.message);
  }

  function _authError() {
    res.status(401).send('Invalid Credentials.');
  }
};

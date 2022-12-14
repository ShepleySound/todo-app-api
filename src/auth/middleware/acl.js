'use strict';

module.exports = (capability) => {
  return (req, res, next) => {
    try {
      if (req.user.capabilities.includes(capability) || req.user.capabilities.includes('superuser')) {
        next();
      }
      else {
        res.status(403).send('Not enough permission to perform this action.');
      }
    } catch (e) {
      next('Invalid Login');
    }
  };
};

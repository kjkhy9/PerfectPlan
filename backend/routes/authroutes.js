// routes/authroutes.js
const express = require('express');

module.exports = function(authCtrl) {
  const router = express.Router();

  router.post('/signup', authCtrl.signup);
  router.post('/login', authCtrl.login);

  return router;
};

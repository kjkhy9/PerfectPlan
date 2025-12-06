// routes/grouproutes.js
const express = require('express');

module.exports = function(groupCtrl) {
  const router = express.Router();

  router.post('/', groupCtrl.createGroup);
  router.post('/join', groupCtrl.joinGroup);
  router.post('/leave', groupCtrl.leaveGroup);
  router.get('/user/:id', groupCtrl.getUserGroups);

  return router;
};

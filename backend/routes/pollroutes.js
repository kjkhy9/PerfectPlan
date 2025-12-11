const express = require("express");

module.exports = (pollCtrl) => {
  const router = express.Router();

  router.post("/", pollCtrl.createPoll);
  router.post("/vote", pollCtrl.vote);
  router.get("/group/:groupId", pollCtrl.getGroupPolls);
  router.delete("/", pollCtrl.deletePoll);


  return router;
};

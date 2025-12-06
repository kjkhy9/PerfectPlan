// routes/eventroutes.js
const express = require("express");

module.exports = (eventCtrl) => {
  const router = express.Router();

  router.post("/", eventCtrl.createEvent);
  router.get("/group/:groupId", eventCtrl.getGroupEvents);
  router.get("/user/:userId", eventCtrl.getUserEvents);
  router.delete("/:id", eventCtrl.deleteEvent);

  return router;
};

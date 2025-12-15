const poll = require("../models/poll");

module.exports = (pollService) => ({
  createPoll: async (req, res) => {
    try {
      const poll = await pollService.createPoll(req.body);
      res.json(poll);
    } catch (err) {
      console.error(err);
      res.status(400).json({ message: err.message });
    }
  },

  vote: async (req, res) => {
    try {
      const poll = await pollService.vote(req.body);
      res.json(poll);
    } catch (err) {
      console.error(err);
      res.status(400).json({ message: err.message });
    }
  },

  getGroupPolls: async (req, res) => {
    try {
      const polls = await pollService.getGroupPolls(req.params.groupId);
      res.json(polls);
    } catch (err) {
      console.error(err);
      res.status(400).json({ message: err.message });
    }
  },

  deletePoll: async (req, res) => {
    try {
      const { pollId, userId } = req.body;
      const result = await pollService.deletePoll(pollId, userId);
      res.json(result);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }


});

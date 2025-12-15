const Poll = require("../models/poll");
const Group = require("../models/group");

class PollService {
  constructor(PollModel, GroupModel) {
    this.Poll = PollModel;
    this.Group = GroupModel;
  }

  async createPoll({ groupId, question, options, createdBy }) {
    const group = await this.Group.findById(groupId);
    if (!group) throw new Error("Group not found");

    if (group.creator.toString() !== createdBy.toString()) {
      throw new Error("Only the group creator can create polls");
    }

    return this.Poll.create({
      groupId,
      question: question || "Select a final meeting time",
      createdBy,
      options
    });
  }

  async vote({ pollId, userId, optionId }) {
    const poll = await this.Poll.findById(pollId);
    if (!poll) throw new Error("Poll not found");

    const option = poll.options.id(optionId);
    if (!option) throw new Error("Invalid date option");

    // Prevent double voting
    const alreadyVoted = poll.options.some(opt =>
      opt.votes.includes(userId)
    );
    if (alreadyVoted) throw new Error("User already voted");

    option.votes.push(userId);
    await poll.save();
    return poll;
  }

  async getGroupPolls(groupId) {
    return this.Poll.find({ groupId }).sort({ createdAt: -1 });
  }

  async deletePoll(pollId, userId) {
      const poll = await Poll.findById(pollId);
      if (!poll) throw new Error("Poll not found");

      const group = await Group.findById(poll.groupId);
      if (!group) throw new Error("Group not found");

      if (group.creator.toString() !== userId) {
        throw new Error("Only the group owner can delete polls");
      }

      await poll.deleteOne();
      return { success: true };
    }

}

module.exports = PollService;

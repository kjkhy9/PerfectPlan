class ChatService {
  constructor(Message, Group) {
    this.Message = Message;
    this.Group = Group;
  }

  async sendMessage({ groupId, sender, text, pollId }) {
    return this.Message.create({ groupId, sender, text, pollId });
  }

  async getMessages(groupId) {
    return this.Message.find({ groupId })
      .populate("sender", "username")
      .populate("pollId")
      .sort({ createdAt: 1 });
  }
}

module.exports = ChatService;

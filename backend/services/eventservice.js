// services/eventservice.js
const mongoose = require('mongoose');

class EventService {
  constructor(EventModel, GroupModel) {
    this.Event = EventModel;
    this.Group = GroupModel;
  }

  async createEvent({ groupId, title, description, date, userId }) {
    const event = await this.Event.create({
      groupId,
      title,
      description,
      date,
      createdBy: new mongoose.Types.ObjectId(userId),
    });
    return event;
  }

  async getGroupEvents(groupId) {
    return this.Event.find({ groupId })
      .populate('createdBy', 'username')
      .sort({ date: 1 });
  }

  async getUserEvents(userId) {
    // same logic as your master planner route
    const groups = await this.Group.find({ members: userId }).select('_id');
    const groupIds = groups.map((g) => g._id);

    return this.Event.find({ groupId: { $in: groupIds } })
      .populate('createdBy', 'username')
      .populate('groupId', 'name')
      .sort({ date: 1 });
  }

  async deleteEvent(eventId) {
    await this.Event.findByIdAndDelete(eventId);
    return { message: 'Event deleted' };
  }
}

module.exports = EventService;

// services/eventservice.js
const mongoose = require('mongoose');

class EventService {
  constructor(EventModel, GroupModel) {
    this.Event = EventModel;
    this.Group = GroupModel;
  }

  async createEvent(data) {
    const {
      groupId,
      title,
      description,
      startTime,
      endTime,
      userId,
    } = data;

    const group = await this.Group.findById(groupId);
    if (!group) {
      throw new Error("Group not found");
    }

    if (group.creator.toString() !== userId){
      const err = new Error("Only group owners can create events");
      err.status = 403;
      throw err;
    }

    if (!startTime || !endTime) {
      throw new Error("Start time and end time are required");
    }

    const event = await this.Event.create({
      groupId,
      title,
      description,
      startTime,
      endTime,
      createdBy: userId,
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

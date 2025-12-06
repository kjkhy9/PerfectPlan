// services/groupservice.js
const mongoose = require('mongoose');

class GroupService {
  constructor(GroupModel) {
    this.Group = GroupModel;
  }

  async createGroup(name, userId) {
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const objId = new mongoose.Types.ObjectId(userId);

    const group = await this.Group.create({
      name,
      inviteCode,
      creator: objId,
      members: [objId],
    });

    return group;
  }

  async joinGroup(code, userId) {
    const group = await this.Group.findOne({ inviteCode: code });
    if (!group) throw new Error('Invalid invite code');

    const userObjId = new mongoose.Types.ObjectId(userId);

    if (!group.members.some((id) => id.equals(userObjId))) {
      group.members.push(userObjId);
      await group.save();
    }

    return group;
  }

  async leaveGroup(groupId, userId) {
    const group = await this.Group.findById(groupId);
    if (!group) throw new Error('Group not found');

    if (group.creator.toString() === userId && group.members.length > 1) {
      throw new Error('Creator cannot leave a group with members');
    }

    group.members = group.members.filter((id) => id.toString() !== userId);
    await group.save();

    return { message: 'Left group successfully' };
  }

  async getUserGroups(userId) {
    const created = await this.Group.find({ creator: userId })
      .populate('members', 'username')
      .lean();

    const joined = await this.Group.find({ members: userId })
      .populate('members', 'username')
      .lean();

    return { created, joined };
  }
}

module.exports = GroupService;

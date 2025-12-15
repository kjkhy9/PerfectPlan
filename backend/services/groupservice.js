// services/groupservice.js
const mongoose = require('mongoose');

class GroupService {
  constructor(GroupModel) {
    this.Group = GroupModel;
  }

  async createGroup(name, userId) {
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const guestCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const objId = new mongoose.Types.ObjectId(userId);

    const group = await this.Group.create({
      name,
      inviteCode,
      guestCode,
      creator: objId,
      members: [objId],
      guest: [],
    });

    return group;
  }

  async joinGroup(code, userId) {
    const group = await this.Group.findOne({ $or:[{ inviteCode: code }, { guestCode: code }] });
    if (!group) throw new Error('Invalid invite code');

    const userObjId = new mongoose.Types.ObjectId(userId);

    if(group.inviteCode === code) {
      if (!group.members.some((id) => id.equals(userObjId))) {
        group.members.push(userObjId);
      }
    }

    if(group.guestCode === code) {
      if (!group.guest.some((id) => id.equals(userObjId))) {
        group.guest.push(userObjId);
      }
    }
    await group.save();
    return group;
  }

  async leaveGroup(groupId, userId) {
    const group = await this.Group.findById(groupId);
    if (!group) throw new Error('Group not found');

    if (group.creator.toString() === userId && group.members.length > 1) {
      throw new Error('Creator cannot leave a group with members');
    }

    if (group.creator.toString() === userId && group.members.length === 0) {
      await this.Group.findByIdAndDelete(groupId);
      return { message: 'Group deleted as creator left and no members remain' };
    }

    group.members = group.members.filter((id) => id.toString() !== userId);
    group.guest = group.guest.filter((id) => id.toString() !== userId);
    await group.save();

    return { message: 'Left group successfully' };
  }

  async getUserGroups(userId) {
    // Groups the user CREATED
    const created = await this.Group.find({ creator: userId })
      .populate("members", "username")
      .populate("guest", "username")
      .lean();

    created.forEach(g => g.role = "owner");

    // Groups the user JOINED AS MEMBER (but not owner)
    const joined = await this.Group.find({
      members: userId,
      creator: { $ne: userId }
    })
      .populate("members", "username")
      .populate("guest", "username")
      .lean();

    joined.forEach(g => g.role = "member");

    // Groups the user JOINED AS GUEST
    const guest = await this.Group.find({
      guest: userId
    })
      .populate("members", "username")
      .populate("guest", "username")
      .lean();

    guest.forEach(g => g.role = "guest");

    return { created, joined, guest };
  }

}

module.exports = GroupService;

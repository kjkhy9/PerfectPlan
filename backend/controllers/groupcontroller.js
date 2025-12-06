// controllers/groupcontroller.js
function groupController(groupService) {
  return {
    createGroup: async (req, res) => {
      const { name, userId } = req.body;
      try {
        const group = await groupService.createGroup(name, userId);
        res.json(group);
      } catch (err) {
        console.error(err);
        res.status(400).json({ message: err.message || 'Failed to create group' });
      }
    },

    joinGroup: async (req, res) => {
      const { code, userId } = req.body;
      try {
        const group = await groupService.joinGroup(code, userId);
        res.json({ message: 'Joined group successfully', group });
      } catch (err) {
        console.error(err);
        res.status(400).json({ message: err.message || 'Failed to join group' });
      }
    },

    leaveGroup: async (req, res) => {
      const { groupId, userId } = req.body;
      try {
        const result = await groupService.leaveGroup(groupId, userId);
        res.json(result);
      } catch (err) {
        console.error('Leave group error:', err);
        res.status(400).json({ message: err.message || 'Error leaving group' });
      }
    },

    getUserGroups: async (req, res) => {
      const userId = req.params.id;
      try {
        const groups = await groupService.getUserGroups(userId);
        res.json(groups);
      } catch (err) {
        console.error('Get groups error:', err);
        res.status(500).json({ message: 'Error fetching user groups' });
      }
    },
  };
}

module.exports = groupController;

// controllers/eventcontroller.js
module.exports = (eventService) => ({
  createEvent: async (req, res) => {
    try {
      const {
        groupId,
        title,
        description,
        startTime,
        endTime,
        userId,
      } = req.body;

      const event = await eventService.createEvent({
        groupId,
        title,
        description,
        startTime,
        endTime,
        userId,
      });

      res.json(event);
    } catch (err) {
      console.error("Create event error:", err);
      res.status(400).json({ message: err.message });
    }
  },

  getGroupEvents: async (req, res) => {
    try {
      const events = await eventService.getGroupEvents(req.params.groupId);
      res.json(events);
    } catch (err) {
      console.error("Fetch events error:", err);
      res.status(500).json({ message: "Error fetching events" });
    }
  },

  getUserEvents: async (req, res) => {
    try {
      const events = await eventService.getUserEvents(req.params.userId);
      res.json(events);
    } catch (err) {
      console.error("Master planner fetch error:", err);
      res.status(500).json({ message: "Error fetching planner events" });
    }
  },

  deleteEvent: async (req, res) => {
    try {
      const result = await eventService.deleteEvent(req.params.id);
      res.json(result);
    } catch (err) {
      console.error("Delete event error:", err);
      res.status(500).json({ message: "Error deleting event" });
    }
  },
});

app.use(express.json());

let planners = [];

app.post('/api/planner', (req, res) => {
  const { name } = req.body;
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const newPlanner = { name, inviteCode };
  planners.push(newPlanner);
  res.json(newPlanner);
});
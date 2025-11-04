const express = require('express');
const app = express();

app.use(express.json());

let planners = [];

app.get('/api/planner', (req, res) => {
  res.json(planners);
});

app.post('/api/planner', (req, res) => {
  const { name } = req.body;
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const newPlanner = { name, inviteCode };
  planners.push(newPlanner);
  res.json(newPlanner);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
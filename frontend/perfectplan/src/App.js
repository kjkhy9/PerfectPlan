import React, { useState } from 'react';
import axios from 'axios';

const API = "http://localhost:5000/api";

function App() {
  const [view, setView] = useState('signup');
  const [form, setForm] = useState({ username: '', password: '', group: '', code: '' });
  const [eventForm, setEventForm] = useState({ title: "", description: "", date: "" });

  const [token, setToken] = useState('');
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [groups, setGroups] = useState({ created: [], joined: [] });

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [events, setEvents] = useState([]);
  const [plannerEvents, setPlannerEvents] = useState([]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleEventChange = e => setEventForm({ ...eventForm, [e.target.name]: e.target.value });

  // SIGNUP
  const signup = async () => {
    try {
      await axios.post(`${API}/signup`, form);
      alert("Account created!");
      setView("login");
    } catch (err) {
      console.error(err);
      alert("Signup failed");
    }
  };

  // LOGIN
  const login = async () => {
    try {
      const res = await axios.post(`${API}/login`, form);
      const token = res.data.token;

      setToken(token);
      const payload = JSON.parse(atob(token.split('.')[1]));

      setUserId(payload.userId);
      setUserName(payload.username);

      setView("groups");
      fetchGroups(payload.userId);

    } catch (err) {
      console.error(err);
      alert("Login failed");
    }
  };

  // FETCH GROUPS
  const fetchGroups = async (id) => {
    try {
      const res = await axios.get(`${API}/groups/user/${id}`);
      setGroups(res.data);
    } catch (err) {
      console.error(err);
      alert("Error loading groups");
    }
  };

  // OPEN EVENTS PAGE
  const openEventPage = async (group) => {
    try {
      setSelectedGroup(group);
      setView("events");

      const res = await axios.get(`${API}/events/group/${group._id}`);
      setEvents(res.data);

    } catch (err) {
      console.error(err);
      alert("Could not load events");
    }
  };

  // CREATE EVENT
  const createEvent = async () => {
    try {
      await axios.post(`${API}/events`, {
        groupId: selectedGroup._id,
        title: eventForm.title,
        description: eventForm.description,
        date: eventForm.date,
        userId
      });

      const res = await axios.get(`${API}/events/group/${selectedGroup._id}`);
      setEvents(res.data);

      alert("Event created!");

    } catch (err) {
      console.error(err);
      alert("Failed to create event");
    }
  };

  // CREATE GROUP
  const createGroup = async () => {
    try {
      const res = await axios.post(`${API}/groups`, {
        name: form.group,
        userId
      });

      alert(`Group created! Invite code: ${res.data.inviteCode}`);
      fetchGroups(userId);

    } catch (err) {
      console.error(err);
      alert("Failed to create group");
    }
  };

  // JOIN GROUP
  const joinGroup = async () => {
    try {
      await axios.post(`${API}/groups/join`, { code: form.code, userId });
      alert("Joined group!");
      fetchGroups(userId);

    } catch (err) {
      console.error(err);
      alert("Failed to join group");
    }
  };

  // LEAVE GROUP
  const leaveGroup = async (groupId) => {
    try {
      await axios.post(`${API}/groups/leave`, { groupId, userId });
      alert("Left group");
      fetchGroups(userId);

    } catch (err) {
      console.error(err);
      alert("Could not leave group");
    }
  };

  // MASTER PLANNER VIEW
  const openMasterPlanner = async () => {
    try {
      const res = await axios.get(`${API}/events/user/${userId}`);
      setPlannerEvents(res.data);
      setView("master");

    } catch (err) {
      console.error(err);
      alert("Could not load master planner");
    }
  };

  // -------------------------
  // VIEWS
  // -------------------------

  // SIGNUP
  if (view === "signup")
    return (
      <div>
        <h2>Sign Up</h2>
        <input name="username" placeholder="Username" onChange={handleChange} /><br />
        <input type="password" name="password" placeholder="Password" onChange={handleChange} /><br />
        <button onClick={signup}>Sign Up</button>
        <p>Already have an account? <button onClick={() => setView("login")}>Login</button></p>
      </div>
    );

  // LOGIN
  if (view === "login")
    return (
      <div>
        <h2>Login</h2>
        <input name="username" placeholder="Username" onChange={handleChange} /><br />
        <input type="password" name="password" placeholder="Password" onChange={handleChange} /><br />
        <button onClick={login}>Login</button>
        <button onClick={() => setView("signup")}>Back</button>
      </div>
    );

  // GROUP LIST
  if (view === "groups")
    return (
      <div>
        <h2>Welcome, {userName}</h2>

        <button onClick={openMasterPlanner}>Open Master Planner</button>

        <h3>Create Group</h3>
        <input name="group" placeholder="Group Name" onChange={handleChange} /><br />
        <button onClick={createGroup}>Create</button>

        <h3>Join Group</h3>
        <input name="code" placeholder="Invite Code" onChange={handleChange} /><br />
        <button onClick={joinGroup}>Join</button>

        <hr />
        <h3>Your Created Groups</h3>
        <ul>
          {groups.created.map(g => (
            <li key={g._id}>
              {g.name} ({g.inviteCode})
              <button onClick={() => openEventPage(g)}>Events</button>
              <button onClick={() => leaveGroup(g._id)}>Leave</button>
            </li>
          ))}
        </ul>

        <h3>Groups You Joined</h3>
        <ul>
          {groups.joined.map(g => (
            <li key={g._id}>
              {g.name}
              <button onClick={() => openEventPage(g)}>Events</button>
              <button onClick={() => leaveGroup(g._id)}>Leave</button>
            </li>
          ))}
        </ul>

        <button onClick={() => setView("login")}>Log Out</button>
      </div>
    );

  // EVENT PAGE
  if (view === "events")
    return (
      <div>
        <h2>Events for {selectedGroup.name}</h2>

        <h3>Create Event</h3>
        <input name="title" placeholder="Title" onChange={handleEventChange} /><br />
        <input name="description" placeholder="Description" onChange={handleEventChange} /><br />
        <input type="date" name="date" onChange={handleEventChange} /><br />
        <button onClick={createEvent}>Create Event</button>

        <hr />

        <h3>Upcoming Events</h3>
        <ul>
          {events.map(e => (
            <li key={e._id}>
              <b>{e.title}</b> — {new Date(e.date).toLocaleDateString()}<br />
              {e.description}
            </li>
          ))}
        </ul>

        <button onClick={() => setView("groups")}>Back</button>
      </div>
    );

  // MASTER PLANNER VIEW
  if (view === "master")
    return (
      <div>
        <h2>Master Planner — All Events</h2>
        <ul>
          {plannerEvents.map(e => (
            <li key={e._id}>
              <b>{e.title}</b> ({new Date(e.date).toLocaleDateString()})<br />
              Group: {e.groupId?.name}<br />
              Created by: {e.createdBy?.username}<br />
              {e.description}
            </li>
          ))}
        </ul>

        <button onClick={() => setView("groups")}>Back</button>
      </div>
    );

  return null;
}

export default App;

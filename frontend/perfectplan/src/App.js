import React, { useState } from 'react';
import axios from 'axios';

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

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleEventChange = e => setEventForm({ ...eventForm, [e.target.name]: e.target.value });

  // -------------------------
  // SIGNUP
  // -------------------------
  const signup = async () => {
    try {
      await axios.post('http://localhost:5000/api/signup', form);
      alert('Account created');
      setView('login');
    } catch (err) {
      console.error(err);
      alert('Signup failed');
    }
  };

  // -------------------------
  // LOGIN
  // -------------------------
  const login = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/login', form);
      setToken(res.data.token);

      const payload = JSON.parse(atob(res.data.token.split('.')[1]));
      const id = payload.userId;
      const name = payload.username || form.username;

      if (!id) return alert("Error: Token missing userId");

      setUserId(id);
      setUserName(name);
      setView('groups');
      fetchGroups(id);
    } catch (err) {
      console.error(err);
      alert('Login failed');
    }
  };

  // -------------------------
  // FETCH GROUPS
  // -------------------------
  const fetchGroups = async (id) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/groups/user/${id}`);
      setGroups(res.data);
    } catch (err) {
      console.error(err);
      alert('Error fetching groups');
    }
  };

  // -------------------------
  // OPEN EVENTS PAGE
  // -------------------------
  const openEventPage = async (group) => {
    try {
      setSelectedGroup(group);
      setView("events");

      const res = await axios.get(`http://localhost:5000/api/events/group/${group._id}`);
      setEvents(res.data);
    } catch (err) {
      console.error(err);
      alert("Could not load events");
    }
  };

  // -------------------------
  // CREATE EVENT
  // -------------------------
  const createEvent = async () => {
    try {
      await axios.post("http://localhost:5000/api/events", {
        groupId: selectedGroup._id,
        title: eventForm.title,
        description: eventForm.description,
        date: eventForm.date,
        userId
      });

      alert("Event created!");

      const res = await axios.get(`http://localhost:5000/api/events/group/${selectedGroup._id}`);
      setEvents(res.data);

    } catch (err) {
      console.error(err);
      alert("Failed to create event");
    }
  };

  // -------------------------
  // CREATE GROUP
  // -------------------------
  const createGroup = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/groups', {
        name: form.group,
        userId
      });
      alert(`Group created! Invite code: ${res.data.inviteCode}`);
      fetchGroups(userId);
    } catch (err) {
      console.error(err);
      alert('Failed to create group');
    }
  };

  // -------------------------
  // JOIN GROUP
  // -------------------------
  const joinGroup = async () => {
    try {
      await axios.post('http://localhost:5000/api/groups/join', { code: form.code, userId });
      alert('Joined group successfully!');
      fetchGroups(userId);
    } catch (err) {
      console.error(err);
      alert('Failed to join group');
    }
  };

  // -------------------------
  // VIEWS
  // -------------------------

  // SIGNUP PAGE
  if (view === 'signup')
    return (
      <div>
        <h2>Sign Up</h2>
        <input name="username" placeholder="Username" onChange={handleChange} /><br />
        <input type="password" name="password" placeholder="Password" onChange={handleChange} /><br />
        <button onClick={signup}>Sign Up</button>
        <p>Already have an account? <button onClick={() => setView('login')}>Log In</button></p>
      </div>
    );

  // LOGIN PAGE
  if (view === 'login')
    return (
      <div>
        <h2>Login</h2>
        <input name="username" placeholder="Username" onChange={handleChange} /><br />
        <input type="password" name="password" placeholder="Password" onChange={handleChange} /><br />
        <button onClick={login}>Login</button>
        <button onClick={() => setView('signup')}>Back</button>
      </div>
    );

  // GROUP PAGE
  if (view === 'groups')
    return (
      <div>
        <h2>Welcome, {userName || 'User'}!</h2>

        <h3>Create Group</h3>
        <input name="group" placeholder="New Group Name" onChange={handleChange} /><br />
        <button onClick={createGroup}>Create Group</button>

        <h3>Join Group</h3>
        <input name="code" placeholder="Invite Code" onChange={handleChange} /><br />
        <button onClick={joinGroup}>Join Group</button>

        <hr />

        <h3>Your Created Groups</h3>
        <ul>
          {groups.created.length > 0 ? (
            groups.created.map(g => (
              <li key={g._id}>
                {g.name} ({g.inviteCode})
                <button onClick={() => openEventPage(g)}>Events</button>
              </li>
            ))
          ) : (
            <li>None yet</li>
          )}
        </ul>

        <h3>Groups You’ve Joined</h3>
        <ul>
          {groups.joined.length > 0 ? (
            groups.joined.map(g => (
              <li key={g._id}>
                {g.name}
                <button onClick={() => openEventPage(g)}>Events</button>
              </li>
            ))
          ) : (
            <li>None yet</li>
          )}
        </ul>

        <button onClick={() => setView('login')}>Log Out</button>
      </div>
    );

  // EVENTS PAGE
  if (view === 'events')
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
          {events.length > 0 ? (
            events.map(e => (
              <li key={e._id}>
                <b>{e.title}</b> — {new Date(e.date).toLocaleDateString()}<br />
                {e.description}
              </li>
            ))
          ) : (
            <li>No events yet</li>
          )}
        </ul>

        <button onClick={() => setView("groups")}>Back</button>
      </div>
    );

  return null;
}

export default App;

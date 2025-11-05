import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [view, setView] = useState('signup');
  const [form, setForm] = useState({ username: '', password: '', group: '', code: '' });
  const [token, setToken] = useState('');
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [groups, setGroups] = useState({ created: [], joined: [] });

  // Handle form field updates
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  // --- SIGN UP ---
  const signup = async () => {
    try {
      await axios.post('http://localhost:5000/api/signup', form);
      alert('Account created! You can now log in.');
      setView('login');
    } catch (err) {
      console.error(err);
      alert('Signup failed');
    }
  };

  // --- LOGIN ---
  const login = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/login', form);
      setToken(res.data.token);

      // Decode token to get userId
      const payload = JSON.parse(atob(res.data.token.split('.')[1]));
      const id = payload.userId;
      const name = payload.username || form.username;

      if (!id) {
        alert("Login failed: userId missing from token");
        return;
      }

      setUserId(id);
      setUserName(name);
      alert('Login successful!');
      setView('groups');

      fetchGroups(id);
    } catch (err) {
      console.error(err);
      alert('Login failed');
    }
  };

  // --- CREATE GROUP ---
  const createGroup = async () => {
    if (!userId) {
      alert("You must be logged in to create a group.");
      return;
    }
    try {
      const res = await axios.post('http://localhost:5000/api/groups', { name: form.group, userId });
      alert(`Group created! Invite code: ${res.data.inviteCode}`);
      fetchGroups(userId);
    } catch (err) {
      console.error(err);
      alert('Failed to create group');
    }
  };

  // --- JOIN GROUP ---
  const joinGroup = async () => {
    if (!userId) {
      alert("You must be logged in to join a group.");
      return;
    }
    try {
      await axios.post('http://localhost:5000/api/groups/join', { code: form.code, userId });
      alert('Joined group successfully!');
      fetchGroups(userId);
    } catch (err) {
      console.error(err);
      alert('Failed to join group');
    }
  };

  // --- FETCH USER GROUPS ---
  const fetchGroups = async (id) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/groups/user/${id}`);
      setGroups(res.data);
    } catch (err) {
      console.error(err);
      alert('Error fetching groups');
    }
  };

  // --- SIGNUP VIEW ---
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

  // --- LOGIN VIEW ---
  if (view === 'login')
    return (
      <div>
        <h2>Login</h2>
        <input name="username" placeholder="Username" onChange={handleChange} /><br />
        <input type="password" name="password" placeholder="Password" onChange={handleChange} /><br />
        
        <button onClick={login}>Login</button>
      </div>
    );

  // --- GROUP VIEW ---
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
                {g.members && g.members.length > 0 && (
                  <ul>
                    {g.members.map(m => (
                      <li key={m._id}>{m.username}</li>
                    ))}
                  </ul>
                )}
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
              <li key={g._id}>{g.name}</li>
            ))
          ) : (
            <li>None yet</li>
          )}
        </ul>

        <button onClick={() => setView('login')}>Log Out</button>
      </div>
    );

  return null;
}

export default App;

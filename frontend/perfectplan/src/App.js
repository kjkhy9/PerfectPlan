import React, { useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import "./App.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

function App() {
  const [view, setView] = useState("welcome");
  const [form, setForm] = useState({
    username: "",
    password: "",
    group: "",
    code: "",
  });
  const showPassword = false;

  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
  });

  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [groups, setGroups] = useState({ created: [], joined: [] });

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [events, setEvents] = useState([]);
  const [plannerEvents, setPlannerEvents] = useState([]);

  const isGroupOwner =
    selectedGroup &&
    (selectedGroup.creator === userId || selectedGroup.creator?._id === userId);
  const isGuest =
    selectedGroup && selectedGroup.guest?.some((u) => u._id === userId);

  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  const [polls, setPolls] = useState([]);
  const [pollOptions, setPollOptions] = useState([]);
  const [pollQuestion, setPollQuestion] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleEventChange = (e) =>
    setEventForm({ ...eventForm, [e.target.name]: e.target.value });

  const signup = async () => {
    try {
      await axios.post(`${API}/auth/signup`, form);
      alert("Account created successfully!");
      setView("login");
    } catch (err) {
      console.error(err);
      alert(`Error: ${err.response?.data?.message || "Signup failed"}`);
    }
  };

  const login = async () => {
    try {
      const res = await axios.post(`${API}/auth/login`, form);
      const t = res.data.token;
      const payload = JSON.parse(atob(t.split(".")[1]));
      setUserId(payload.userId);
      setUserName(payload.username);
      setView("groups");
      fetchGroups(payload.userId);
    } catch (err) {
      console.error(err);
      alert(`Error: ${err.response?.data?.message || "Login failed"}`);
    }
  };

  const fetchGroups = async (id) => {
    try {
      const res = await axios.get(`${API}/groups/user/${id}`);
      setGroups(res.data);
    } catch (err) {
      console.error(err);
      alert("Error loading groups");
    }
  };

  const createGroup = async () => {
    try {
      const res = await axios.post(`${API}/groups`, {
        name: form.group,
        userId,
      });
      alert(
        `Group created!\n\nMember Code: ${res.data.inviteCode}\nGuest Code: ${res.data.guestCode}`
      );
      fetchGroups(userId);
    } catch (err) {
      console.error(err);
      alert(`Error: ${err.response?.data?.message || "Failed to create group"}`);
    }
  };

  const joinGroup = async () => {
    try {
      await axios.post(`${API}/groups/join`, { code: form.code, userId });
      alert("Successfully joined group!");
      fetchGroups(userId);
    } catch (err) {
      console.error(err);
      alert(`Error: ${err.response?.data?.message || "Failed to join group"}`);
    }
  };

  const leaveGroup = async (groupId) => {
    if (!window.confirm("Are you sure you want to leave this group?")) return;
    try {
      await axios.post(`${API}/groups/leave`, { groupId, userId });
      alert("Left group successfully");
      fetchGroups(userId);
    } catch (err) {
      console.error(err);
      alert(`Error: ${err.response?.data?.message || "Failed to leave group"}`);
    }
  };

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

  const createEvent = async () => {
    if (!selectedGroup) return;
    const { title, description, date, startTime, endTime } = eventForm;

    if (!date || !startTime || !endTime) {
      alert("Date, start time, and end time are required");
      return;
    }

    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);

    if (end <= start) {
      alert("End time must be after start time");
      return;
    }

    try {
      await axios.post(`${API}/events`, {
        groupId: selectedGroup._id,
        title,
        description,
        startTime: start,
        endTime: end,
        userId,
      });
      const res = await axios.get(`${API}/events/group/${selectedGroup._id}`);
      setEvents(res.data);
      setEventForm({ title: "", description: "", date: "", startTime: "", endTime: "" });
      alert("Event created successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to create event");
    }
  };

  const deleteEvent = async (eventId) => {
    if (!window.confirm("Delete this event?")) return;
    try {
      await axios.delete(`${API}/events/${eventId}`);
      setEvents((prev) => prev.filter((e) => e._id !== eventId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete event");
    }
  };

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

  const openChat = async (group) => {
    setSelectedGroup(group);
    setView("chat");
    setMessages([]);
    setPolls([]);

    if (!socket) {
      const newSocket = io("http://localhost:5000");
      setSocket(newSocket);

      newSocket.on("chatMessage", (msg) => {
        setMessages((prev) => [...prev, msg]);
      });

      newSocket.on("newPoll", (poll) => {
        setPolls((prev) => {
          const existing = prev.find((p) => p._id === poll._id);
          if (existing) {
            return prev.map((p) => (p._id === poll._id ? poll : p));
          }
          return [...prev, poll];
        });
      });

      newSocket.on("pollUpdate", (poll) => {
        setPolls((prev) => prev.map((p) => (p._id === poll._id ? poll : p)));
      });

      newSocket.emit("joinGroup", group._id);
    } else {
      socket.emit("joinGroup", group._id);
    }

    try {
      const res = await axios.get(`${API}/polls/group/${group._id}`);
      setPolls(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const sendChatMessage = () => {
    if (!chatInput.trim() || !socket || !selectedGroup) return;
    const msg = {
      text: chatInput,
      user: userName,
      groupId: selectedGroup._id,
    };
    socket.emit("chatMessage", msg);
    setChatInput("");
  };

  // Poll helper functions (date-based)

  const addPollOption = () => {
    setPollOptions([...pollOptions, { date: "", startTime: "", endTime: "" }]);
  };

  const updatePollOption = (index, field, value) => {
    const updated = [...pollOptions];
    updated[index][field] = value;
    setPollOptions(updated);
  };

  const removePollDate = (index) => {
    setPollOptions(pollOptions.filter((_, i) => i !== index));
  };

  const createPoll = async () => {
    if (!selectedGroup) return;
    if (pollOptions.length === 0) return alert("Add at least one option");
    if (!pollQuestion.trim()) return alert("Enter a poll question");

    try {
      const formattedOptions = pollOptions.map((opt) => {
        if (!opt.date || !opt.startTime || !opt.endTime) {
          throw new Error("Each option needs date, start time, and end time");
        }

        const start = new Date(`${opt.date}T${opt.startTime}`);
        const end = new Date(`${opt.date}T${opt.endTime}`);

        if (end <= start) {
          throw new Error("End time must be after start time");
        }

        return {
          date: new Date(opt.date + "T12:00:00"),
          startTime: opt.startTime,
          endTime: opt.endTime,
          votes: []
        };
      });

      const res = await axios.post(`${API}/polls`, {
        groupId: selectedGroup._id,
        createdBy: userId,
        question: pollQuestion,
        options: formattedOptions
      });

      if (socket) socket.emit("newPoll", res.data);

      setPolls((prev) => [...prev, res.data]);
      setPollOptions([]);
      setPollQuestion("");
    } catch (err) {
      alert(err.message);
    }
  };

const deletePoll = async (pollId) => {
  try {
    await axios.delete(`${API}/polls`, {
      data: { pollId, userId }
    });

    setPolls((prev) => prev.filter((p) => p._id !== pollId));
  } catch (err) {
    console.error(err);
    alert(`Error: ${err.response.data.message}`);
  }
};

const votePoll = async (pollId, optionId) => {
    try {
      const res = await axios.post(`${API}/polls/vote`, {
        pollId,
        userId,
        optionId
      });

      if (socket) {
        socket.emit("pollUpdate", res.data);
      }

      setPolls((prev) =>
        prev.map((p) => (p._id === res.data._id ? res.data : p))
      );
    } catch (err) {
      console.error(err);
      alert(`Error: ${err.response?.data?.message || "Failed to vote"}`);
    }
  };

  // AUTH VIEWS
  if (view === "welcome")
    return (
      <div className="App">
        <div className="auth-container welcome-screen">
          <h1 style={{ fontSize: '36px', marginBottom: '16px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Welcome! 👋
          </h1>
          <p style={{ fontSize: '18px', color: '#718096', marginBottom: '40px' }}>
            Get started by creating an account or logging in
          </p>
          <button 
            onClick={() => setView("signup")}
            style={{ fontSize: '16px', padding: '16px 32px', marginBottom: '12px' }}
          >
            ✨ Create Account
          </button>
          <button 
            className="btn-secondary"
            onClick={() => setView("login")}
            style={{ fontSize: '16px', padding: '16px 32px' }}
          >
            🔑 Login
          </button>
        </div>
      </div>
    );

  if (view === "signup")
    return (
      <div className="App">
        <div className="auth-container">
          <h2>✨ Create Account</h2>
          <input
            name="username"
            placeholder="Username"
            onChange={handleChange}
            onKeyPress={(e) => e.key === "Enter" && signup()}
          />
          <div className="password-input-container">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              onChange={handleChange}
              onKeyPress={(e) => e.key === "Enter" && signup()}
            />
          </div>
          <button onClick={signup}>Sign Up</button>
          <p style={{ marginTop: 16, textAlign: "center" }}>
            Already have an account?{" "}
            <button className="btn-secondary" onClick={() => setView("login")}>
              Login
            </button>
          </p>
          <button 
            className="btn-secondary" 
            onClick={() => setView("welcome")}
            style={{ marginTop: '8px' }}
          >
            ← Back
          </button>
        </div>
      </div>
    );

  if (view === "login")
    return (
      <div className="App">
        <div className="auth-container">
          <h2>👋 Welcome Back</h2>
          <input
            name="username"
            placeholder="Username"
            onChange={handleChange}
            onKeyPress={(e) => e.key === "Enter" && login()}
          />
          <div className="password-input-container">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              onChange={handleChange}
              onKeyPress={(e) => e.key === "Enter" && login()}
            />
          </div>
          <button onClick={login}>Login</button>
          <button className="btn-secondary" onClick={() => setView("welcome")}>
            ← Back
          </button>
        </div>
      </div>
    );

  // GROUPS VIEW
  if (view === "groups")
    return (
      <div className="App">
        <div className="welcome-header">
          <h2>Welcome, {userName}! 👋</h2>
          <div className="button-group">
            <button onClick={openMasterPlanner}>📅 Master Planner</button>
            <button onClick={() => setView("login")}>Log Out</button>
          </div>
        </div>

        <div className="section">
          <h3>🆕 Create Group</h3>
          <input
            name="group"
            placeholder="Enter group name"
            onChange={handleChange}
          />
          <button onClick={createGroup}>Create Group</button>
        </div>

        <div className="section">
          <h3>➕ Join Group</h3>
          <input
            name="code"
            placeholder="Enter invite code"
            onChange={handleChange}
          />
          <button onClick={joinGroup}>Join Group</button>
        </div>

        <hr />

        <h3>📁 Your Created Groups</h3>
        {groups.created.length === 0 ? (
          <p className="text-muted">No groups created yet</p>
        ) : (
          <ul>
            {groups.created.map((g) => (
              <li key={g._id}>
                <b>{g.name}</b>
                <span className="badge">Owner</span>
                <div className="group-codes">
                  Member Code: <code>{g.inviteCode}</code>
                  <br />
                  Guest Code: <code>{g.guestCode}</code>
                </div>
                <div className="button-group">
                  <button onClick={() => openEventPage(g)}>📅 Events</button>
                  <button onClick={() => openChat(g)}>💬 Chat</button>
                  <button className="btn-danger" onClick={() => leaveGroup(g._id)}>
                    Leave
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <h3>👥 Groups You Joined</h3>
        {groups.joined.length === 0 ? (
          <p className="text-muted">No groups joined yet</p>
        ) : (
          <ul>
            {groups.joined.map((g) => (
              <li key={g._id}>
                <b>{g.name}</b>
                <span className="badge">Member</span>
                <div className="button-group">
                  <button onClick={() => openEventPage(g)}>📅 Events</button>
                  <button onClick={() => openChat(g)}>💬 Chat</button>
                  <button className="btn-danger" onClick={() => leaveGroup(g._id)}>
                    Leave
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {groups.guest && groups.guest.length > 0 && (
          <>
            <h3>👁️ Guest Groups (Read-Only)</h3>
            <ul>
              {groups.guest.map((g) => (
                <li key={g._id}>
                  <b>{g.name}</b>
                  <span className="badge">Guest</span>
                  <div className="button-group">
                    <button onClick={() => openEventPage(g)}>📅 Events</button>
                    <button onClick={() => openChat(g)}>💬 Chat</button>
                    <button className="btn-danger" onClick={() => leaveGroup(g._id)}>
                      Leave
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    );

  // EVENTS VIEW
  if (view === "events")
    return (
      <div className="App">
        <h2>📅 Events for {selectedGroup.name}</h2>

        {isGroupOwner && (
          <div className="section poll-container">
            <h3>Create New Event</h3>
            <input
              name="title"
              placeholder="Event title"
              value={eventForm.title}
              onChange={handleEventChange}
            />
            <input
              name="description"
              placeholder="Event description"
              value={eventForm.description}
              onChange={handleEventChange}
            />
            <label style={{ display: "block", marginTop: 8, color: "#4a5568" }}>
              Date:
            </label>
            <input
              type="date"
              name="date"
              value={eventForm.date}
              onChange={handleEventChange}
            />
            <label style={{ display: "block", marginTop: 8, color: "#4a5568" }}>
              Start Time:
            </label>
            <input
              type="time"
              name="startTime"
              step="900"
              value={eventForm.startTime}
              onChange={handleEventChange}
            />
            <label style={{ display: "block", marginTop: 8, color: "#4a5568" }}>
              End Time:
            </label>
            <input
              type="time"
              name="endTime"
              step="900"
              value={eventForm.endTime}
              onChange={handleEventChange}
            />
            <button onClick={createEvent}>Create Event</button>
          </div>
        )}

        <h3>Upcoming Events</h3>
        {events.length === 0 ? (
          <p className="text-muted">No events scheduled yet</p>
        ) : (
          <ul>
            {events.map((e) => (
              <li key={e._id}>
                <b>{e.title}</b>
                <div className="event-time">
                  📅 {new Date(e.startTime).toLocaleDateString()} •{" "}
                  {new Date(e.startTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  -{" "}
                  {new Date(e.endTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <p>{e.description}</p>
                {isGroupOwner && (
                  <button
                    className="btn-danger"
                    onClick={() => deleteEvent(e._id)}
                  >
                    Delete Event
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        <button className="btn-secondary" onClick={() => setView("groups")}>
          ← Back to Groups
        </button>
      </div>
    );

  // MASTER PLANNER
  if (view === "master")
    return (
      <div className="App">
        <h2>📅 Master Planner — All Events</h2>
        {plannerEvents.length === 0 ? (
          <p className="text-muted">No events scheduled yet</p>
        ) : (
          <ul>
            {plannerEvents.map((e) => (
              <li key={e._id}>
                <b>{e.title}</b>
                <div className="event-time">
                  📅 {new Date(e.startTime).toLocaleDateString()} •{" "}
                  {new Date(e.startTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",

                  })}
                  {" "}
                  -
                  {" "}
                  {new Date(e.endTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <p>
                  <strong>Group:</strong> {e.groupId?.name}
                </p>
                <p>
                  <strong>Created by:</strong> {e.createdBy?.username}
                </p>
                <p>{e.description}</p>
              </li>
            ))}
          </ul>
        )}
        <button className="btn-secondary" onClick={() => setView("groups")}>
          ← Back to Groups
        </button>
      </div>
    );

  // CHAT + POLLS
  if (view === "chat")
    return (
      <div className="App">
        <h2>💬 Group Chat — {selectedGroup.name}</h2>

        <div className="chat-container">
          {messages.length === 0 ? (
            <p className="text-muted">No messages yet. Start the conversation!</p>
          ) : (
            messages.map((m, i) => (
              <div key={i} className="chat-message">
                <b>{m.user}:</b> {m.text}
              </div>
            ))
          )}
        </div>

        {!isGuest ? (
          <div className="input-group">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type your message..."
              onKeyPress={(e) => e.key === "Enter" && sendChatMessage()}
            />
            <button onClick={sendChatMessage}>Send</button>
          </div>
        ) : (
          <p className="text-muted">
            <i>👁️ Guests have read-only access to chat</i>
          </p>
        )}

        <hr />

        <h3>📊 Polls</h3>

        {isGroupOwner && (
          <div className="poll-container">
            <h4>Create Poll</h4>
            <input
              type="text"
              placeholder="Poll question (e.g., 'When should we meet?')"
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
            />

            {pollOptions.map((opt, i) => (
              <div key={i}>
                <input
                  type="date"
                  value={opt.date}
                  onChange={(e) => updatePollOption(i, "date", e.target.value)}
                />
                <input
                  type="time"
                  step="900"
                  value={opt.startTime}
                  onChange={(e) => updatePollOption(i, "startTime", e.target.value)}
                />
                <input
                  type="time"
                  step="900"
                  value={opt.endTime}
                  onChange={(e) => updatePollOption(i, "endTime", e.target.value)}
                />
                <button
                  className="btn-danger"
                  onClick={() => removePollDate(i)}
                >
                  Remove
                </button>
              </div>
            ))}

            <button onClick={addPollOption}>Add Time Option</button>
            <br />

            <button onClick={createPoll}>Create Poll</button>
          </div>
        )}

        {polls.length === 0 ? (
          <p className="text-muted">No polls yet</p>
        ) : (
          polls.map((poll) => (
            <div key={poll._id} className="poll-container">
              <b>📊 {poll.question || "Select a meeting time"}</b>

              {poll.isClosed && poll.winningDate && (
                <p>
                  <b>
                    Final Date:{" "}
                    {new Date(poll.winningDate.date).toLocaleDateString()}{" "}
                    {poll.winningDate.startTime} - {poll.winningDate.endTime}
                  </b>
                </p>
              )}

              {!poll.isClosed &&
                poll.options.map((opt) => (
                  <div key={opt._id}>
                    <button disabled={isGuest} onClick={() => votePoll(poll._id, opt._id)}>
                      {new Date(opt.date).toLocaleDateString()}{" "}
                      {opt.startTime} - {opt.endTime}
                    </button>
                    <span>
                      {opt.votes.length} vote{opt.votes.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                ))}

              {poll.createdBy === userId && (
                <button
                  className="btn-danger"
                  onClick={() => deletePoll(poll._id)}
                >
                  Delete Poll
                </button>
              )}
            </div>
          ))
        )}

        <button className="btn-secondary" onClick={() => setView("groups")}>
          ← Back to Groups
        </button>
      </div>
    );

  return null;
}

export default App;
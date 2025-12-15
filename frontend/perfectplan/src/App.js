import React, { useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const API = "http://localhost:5000/api";

function App() {
  const [view, setView] = useState("signup");

  const [form, setForm] = useState({
    username: "",
    password: "",
    group: "",
    code: "",
  });


  const [eventForm, setEventForm] = useState({title: "", description: "", date: "", startTime: "", endTime: "",});

  const [token, setToken] = useState("");
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [groups, setGroups] = useState({ created: [], joined: [] });
  

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [events, setEvents] = useState([]);
  const [plannerEvents, setPlannerEvents] = useState([]);

    const isGroupOwner =
    selectedGroup &&
    (
      selectedGroup.creator === userId ||
      selectedGroup.creator?._id === userId
    );
    const isGuest = 
      selectedGroup && 
      selectedGroup.guest?.some(u => u._id === userId);

  // Chat + socket
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  // Poll state (date-based)
  const [polls, setPolls] = useState([]);
  const [pollOptions, setPollOptions] = useState([]);
  const [pollQuestion, setPollQuestion] = useState("");


  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleEventChange = (e) =>
    setEventForm({ ...eventForm, [e.target.name]: e.target.value });

  // -------------------------
  // AUTH
  // -------------------------

  const signup = async () => {
    try {
      await axios.post(`${API}/auth/signup`, form);
      alert("Account created!");
      setView("login");
    } catch (err) {
      console.error(err);
      alert(`Error: ${err.response.data.message}`);
    }
  };

  const login = async () => {
    try {
      const res = await axios.post(`${API}/auth/login`, form);
      const t = res.data.token;

      setToken(t);
      const payload = JSON.parse(atob(t.split(".")[1]));

      setUserId(payload.userId);
      setUserName(payload.username);

      document.getElementById("pass").value='';
      setView("groups");
      fetchGroups(payload.userId);
    } catch (err) {
      console.error(err);
      alert(`Error: ${err.response.data.message}`);
    }
  };

  // -------------------------
  // GROUPS
  // -------------------------

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

      alert(`Group created! Invite code: ${res.data.inviteCode}, Guest code: ${res.data.guestCode}`);
      fetchGroups(userId);
    } catch (err) {
      console.error(err);
      alert(`Error: ${err.response.data.message}`);
    }
  };

  const joinGroup = async () => {
    try {
      await axios.post(`${API}/groups/join`, { code: form.code, userId });
      alert("Joined group!");
      fetchGroups(userId);
    } catch (err) {
      console.error(err);
      alert(`Error: ${err.response.data.message}`);
    }
  };

  const leaveGroup = async (groupId) => {
    try {
      await axios.post(`${API}/groups/leave`, { groupId, userId });
      alert("Left group");
      fetchGroups(userId);
    } catch (err) {
      console.error(err);
      alert(`Error: ${err.response.data.message}`);
    }
  };

  // -------------------------
  // EVENTS
  // -------------------------

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

      alert("Event created!");
    } catch (err) {
      console.error(err);
      alert("Failed to create event");
    }
  };

  const deleteEvent = async (eventId) => {
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

  // -------------------------
  // CHAT + POLLS
  // -------------------------

  const openChat = async (group) => {
    setSelectedGroup(group);
    setView("chat");
    setMessages([]);
    setPolls([]);

    // create socket only once
    if (!socket) {
      const newSocket = io("http://localhost:5000");
      setSocket(newSocket);

      // receive chat messages
      newSocket.on("chatMessage", (msg) => {
        setMessages((prev) => [...prev, msg]);
      });

      // new poll created
      newSocket.on("newPoll", (poll) => {
        setPolls((prev) => {
          const existing = prev.find((p) => p._id === poll._id);
          if (existing) {
            return prev.map((p) => (p._id === poll._id ? poll : p));
          }
          return [...prev, poll];
        });
      });

      // poll updated (new vote)
      newSocket.on("pollUpdate", (poll) => {
        setPolls((prev) =>
          prev.map((p) => (p._id === poll._id ? poll : p))
        );
      });

      // join room once socket is ready
      newSocket.emit("joinGroup", group._id);
    } else {
      socket.emit("joinGroup", group._id);
    }

    // fetch existing polls for this group
    try {
      const res = await axios.get(`${API}/polls/group/${group._id}`);
      setPolls(res.data);
    } catch (err) {
      console.error(err);
      // chat still works even if polls fail
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
          date: new Date(opt.date),
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
      alert(`Error: ${err.response.data.message}`);
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
        <input
          name="username"
          placeholder="Username"
          onChange={handleChange}
        />
        <br />
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
        />
        <br />
        <button onClick={signup}>Sign Up</button>
        <p>
          Already have an account?{" "}
          <button onClick={() => setView("login")}>Login</button>
        </p>
      </div>
    );

  // LOGIN
  if (view === "login")
    return (
      <div>
        <h2>Login</h2>
        <input
          name="username"
          placeholder="Username"
          onChange={handleChange}
        />
        <br />
        <input
          id="pass"
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
        />
        <br />
        <button onClick={login}>Login</button>
        <button onClick={() => setView("signup")}>Back</button>
      </div>
    );

  // GROUPS
  if (view === "groups")
    return (
      <div>
        <h2>Welcome, {userName}</h2>

        <button onClick={openMasterPlanner}>Open Master Planner</button>

        <h3>Create Group</h3>
        <input
          name="group"
          placeholder="Group Name"
          onChange={handleChange}
        />
        <br />
        <button onClick={createGroup}>Create</button>

        <h3>Join Group</h3>
        <input
          name="code"
          placeholder="Invite Code"
          onChange={handleChange}
        />
        <br />
        <button onClick={joinGroup}>Join</button>

        <hr />
        <h3>Your Created Groups</h3>
        <ul>
          {groups.created.map((g) => (
            <li key={g._id}>
              <b>{g.name}</b>
              <br />
              <span> Member Code: <code>{g.inviteCode}</code></span> 
              <br />
              <span> Guest Code: <code>{g.guestCode}</code></span>
              <br />
              <button onClick={() => openEventPage(g)}>Events</button>
              <button onClick={() => openChat(g)}>Chat</button>
              <button onClick={() => leaveGroup(g._id)}>Leave</button>
            </li>
          ))}
        </ul>

        <h3>Groups You Joined</h3>
        <ul>
          {groups.joined.map((g) => (
            <li key={g._id}>
              {g.name}
              <button onClick={() => openEventPage(g)}>Events</button>
              <button onClick={() => openChat(g)}>Chat</button>
              <button onClick={() => leaveGroup(g._id)}>Leave</button>
            </li>
          ))}
        </ul>

        <h3>Guest Groups (Read-Only)</h3>
        <ul>
          {groups.guest?.map((g) => (
            <li key={g._id}>
              {g.name}
              <button onClick={() => openEventPage(g)}>Events</button>
              <button onClick={() => openChat(g)}>Chat</button>
              <button onClick={() => leaveGroup(g._id)}>Leave</button>
            </li>
          ))}
        </ul>

        <button onClick={() => setView("login")}>Log Out</button>
      </div>
    );

  // EVENTS
  if (view === "events")
    return (
      <div>
        <h2>Events for {selectedGroup.name}</h2>
        {isGroupOwner && (
          <div style={{ marginBottom: 20 }}>
            <h3>Create Event</h3>
            <input name="title" placeholder="Title" onChange={handleEventChange}/>
            <input name="description" placeholder="Description" onChange={handleEventChange}/>
            <p>Date:</p>
            <input type="date" name="date" onChange={handleEventChange} />
            <p>Start Time:</p>
            <input type="time" name="startTime" step="900" onChange={handleEventChange} />
            <p>End Time:</p>
            <input type="time" name="endTime" step="900" onChange={handleEventChange} />
            <br />
            <button onClick={createEvent}>Create Event</button>
          </div>
        )}
        <h3>Upcoming Events</h3>
        <ul>
          {events.map((e) => (
            <li key={e._id}>
              <b>{e.title}</b><br />
              {new Date(e.startTime).toLocaleString()}{" "}
              {new Date(e.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              {" - "}
              {new Date(e.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              <br />
              {e.description}
              
              {isGroupOwner && (
                <>
                  <br />
                  <button onClick={() => deleteEvent(e._id)}>Delete Event</button>
                </>
              )}
            </li>
          ))}
        </ul>

        <button onClick={() => setView("groups")}>Back</button>
      </div>
    );

  // MASTER PLANNER
  if (view === "master")
    return (
      <div>
        <h2>Master Planner — All Events</h2>
        <ul>
          {plannerEvents.map((e) => (
            <li key={e._id}>
              <b>{e.title}</b> 
              {new Date(e.startTime).toLocaleDateString()}{" "}
              {new Date(e.startTime).toLocaleString([], {hour: '2-digit', minute:'2-digit'})} 
              {" - "}
              {new Date(e.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              <br />
              Group: {e.groupId?.name}
              <br />
              Created by: {e.createdBy?.username}
              <br />
              {e.description}
            </li>
          ))}
        </ul>

        <button onClick={() => setView("groups")}>Back</button>
      </div>
    );

  // CHAT + POLLS
  if (view === "chat")
    return (
      <div>
        <h2>Group Chat — {selectedGroup.name}</h2>

        {/* CHAT MESSAGES */}
        <div
          style={{
            border: "1px solid #ccc",
            padding: 10,
            height: 250,
            overflowY: "scroll",
            marginBottom: 20,
          }}
        >
          {messages.map((m, i) => (
            <p key={i}>
              <b>{m.user}:</b> {m.text}
            </p>
          ))}
        </div>

        {/* SEND CHAT MESSAGE */}
        {!isGuest && (
         <>
          <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type message..." />
          <button onClick={sendChatMessage}>Send</button>
        </>
        )}
        {isGuest && (<p><i>Guests have read-only access</i></p>)}
        <hr />

        {/* POLLS SECTION */}
        <h3>Polls</h3>

        {/* CREATE POLL */}
        {isGroupOwner && (
          <div style={{ marginBottom: 20 }}>
            <h4>Create Poll</h4>

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
                <button onClick={() => removePollDate(i)}>Remove</button>
              </div>
            ))}

            <button onClick={addPollOption}>Add Time Option</button>
            <br />

            <input
              type="text"
              placeholder="Poll Question"
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
            />
            <br />

            <button onClick={createPoll}>Create Poll</button>
          </div>
        )}


        {/* EXISTING POLLS */}
        {polls.length === 0 ? (
          <p>No polls yet</p>
        ) : (
          polls.map((poll) => (
            <div
              key={poll._id}
              style={{
                border: "1px solid #aaa",
                padding: 10,
                marginBottom: 10,
              }}
            >
              <b>Poll:</b> {poll.question || "Select a meeting time"}
              <br />
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
                    {" — "}
                    {opt.votes.length} votes
                  </div>
                ))}
              {poll.createdBy === userId && (
              <button onClick={() => deletePoll(poll._id)}>
                Delete Poll
              </button>
              )}
            </div>
          ))
        )}

        <button onClick={() => setView("groups")}>Back</button>
      </div>
    );

  return null;
}

export default App;

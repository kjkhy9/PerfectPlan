import React, { useState, useEffect } from 'react';

export default function PlannerForm() {
  const [name, setName] = useState('');
  const [planners, setPlanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // fetch existing planners if backend GET route exists
    fetch('/api/planner')
      .then(res => res.ok ? res.json() : Promise.reject(res.statusText))
      .then(setPlanners)
      .catch(() => setPlanners([]));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const created = await res.json();
      setPlanners(prev => [created, ...prev]);
      setName('');
    } catch (err) {
      setError(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '1rem auto' }}>
      <form onSubmit={handleSubmit}>
        <label>
          Planner name
          <input value={name} onChange={e => setName(e.target.value)} required />
        </label>
        <button type="submit" disabled={loading || !name}>
          {loading ? 'Creating...' : 'Create Planner'}
        </button>
      </form>

      {error && <div style={{ color: 'red' }}>{error}</div>}

      <h3>Planners</h3>
      <ul>
        {planners.map((p, i) => (
          <li key={p.inviteCode + i}>
            {p.name} — {p.inviteCode}
          </li>
        ))}
        {planners.length === 0 && <li>No planners yet</li>}
      </ul>
    </div>
  );
}
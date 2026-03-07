import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = "https://us-central1-js04-b4877.cloudfunctions.net/tasks";

function App() {
  const [view, setView] = useState('home'); 
  const [taskInput, setTaskInput] = useState('');
  const [tasks, setTasks] = useState([]); 
  const [sentTasks, setSentTasks] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}?t=${new Date().getTime()}`);
      const result = await response.json();
      setTasks(result.data || []);
      setSelectedIds(new Set());
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
  }, [view]);

  const handleSend = async () => {
    if (!taskInput.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: taskInput }),
      });
      if (res.ok) {
        setSentTasks([{ text: taskInput, id: Date.now() }, ...sentTasks]);
        setTaskInput(''); 
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  const toggleSelect = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const toggleAll = () => {
    if (selectedIds.size === tasks.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(tasks.map(t => t.id)));
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0 || !confirm(`წავშალო ${selectedIds.size} ჩანაწერი?`)) return;
    setLoading(true);
    try {
      await Promise.all(Array.from(selectedIds).map(id => 
        fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' })
      ));
      fetchData();
    } catch (e) { alert("შეცდომა"); }
    finally { setLoading(false); }
  };

  return (
    <div className="app-layout">
      <div className="bg-glow bg-glow-1"></div>
      <div className="bg-glow bg-glow-2"></div>

      <nav className="sidebar">
        <div className="logo">🚀 Nika_Geims</div>
        <ul className="nav-links">
          <li className={view === 'home' ? 'active' : ''} onClick={() => setView('home')}>
            🏠 Home
          </li>
          <li className={view === 'dashboard' ? 'active' : ''} onClick={() => setView('dashboard')}>
            📊 Dashboard
          </li>
        </ul>
        <div className="sidebar-bottom-right">
           <a href={API_BASE_URL} target="_blank" rel="noreferrer">
             ⚙️ Data API
           </a>
        </div>
      </nav>

      <main className="main-content">
        {view === 'home' ? (
          <div className="home-container">
            <div className="glass-card main-input-card">
              <h1>მომწერე ინფორმაცია</h1>
              <p>მონაცემები ავტომატურად სინქრონიზდება ღრუბელთან</p>
              
              <div className="input-group">
                <input 
                  type="text" 
                  value={taskInput} 
                  onChange={(e) => setTaskInput(e.target.value)} 
                  onKeyDown={handleKeyDown}
                  placeholder="შეიყვანეთ ახალი დავალება..." 
                />
                <button className="send-btn" onClick={handleSend} disabled={loading}>
                  {loading ? '...' : 'დამატება'}
                </button>
              </div>

              <div className="sent-list">
                {sentTasks.map(item => (
                  <div key={item.id} className="sent-item">
                    <span>{item.text}</span>
                    <span className="status-badge">● გაგზავნილია</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="dashboard-wrapper">
            <header className="db-header">
              <div className="header-text">
                <h1>შენახული მონაცემები</h1>
                <p>მართე და გაასუფთავე შენი ინფორმაცია</p>
              </div>
              <div className="controls">
                <div className="select-all-wrapper" onClick={toggleAll}>
                   <input type="checkbox" checked={selectedIds.size === tasks.length && tasks.length > 0} readOnly />
                   <label>ყველას მონიშვნა</label>
                </div>
                {selectedIds.size > 0 && (
                  <button onClick={deleteSelected} className="bulk-delete-btn">
                    🗑️ წაშლა ({selectedIds.size})
                  </button>
                )}
                <button onClick={fetchData} className="refresh-btn">🔄</button>
              </div>
            </header>

            <div className="data-grid">
              {tasks.map(item => (
                <div key={item.id} className={`data-card ${selectedIds.has(item.id) ? 'selected' : ''}`} onClick={() => toggleSelect(item.id)}>
                  <div className="card-top">
                    <div className={`custom-checkbox ${selectedIds.has(item.id) ? 'checked' : ''}`}></div>
                  </div>
                  <div className="data-content">
                    <p className="data-text">{item.text}</p>
                  </div>
                  <div className="card-footer">
                    <span className="id-badge">ID: {item.id.substring(0, 8)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
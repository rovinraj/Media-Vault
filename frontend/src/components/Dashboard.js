// Dashboard.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FaHome,
  FaBookmark,
  FaCog,
  FaMusic,
  FaVideo,
  FaImage,
  FaList,
  FaPlus,
  FaSignOutAlt,
  FaTrash
} from 'react-icons/fa';
import MediaList from './MediaList';
import MediaViewer from './MediaViewer';
import './Dashboard.css';

const API_BASE = 'http://localhost:5000';

export default function Dashboard({ user, onLogout }) {
  const [nav, setNav] = useState('Home');
  const [mediaType, setMediaType] = useState(null);
  const [listName, setListName] = useState(null);
  const [playFile, setPlayFile] = useState(null);
  const [playType, setPlayType] = useState(null);
  const [lists, setLists] = useState([]);

  // load custom lists
  useEffect(() => {
    axios.get(`${API_BASE}/api/lists`)
      .then(res => setLists(res.data))
      .catch(console.error);
  }, []);

  const handleNav = name => {
    setNav(name);
    setMediaType(null);
    setListName(name === 'Bookmarks' ? 'Bookmarks' : null);
  };

  const handleMedia = (type, label) => {
    setNav(label);
    setMediaType(type);
    setListName(null);
  };

  const handleList = name => {
    setNav(name);
    setListName(name);
    setMediaType(null);
  };

  const createList = async () => {
    const name = prompt('Enter new list name:');
    if (!name) return;
    try {
      await axios.post(`${API_BASE}/api/lists`, { list: name });
      setLists(prev => [...prev, name]);
    } catch (err) {
      alert(err.response?.data?.error || 'Error creating list');
    }
  };

  const deleteList = async name => {
    if (!window.confirm(`Delete list "${name}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API_BASE}/api/lists/${encodeURIComponent(name)}`);
      setLists(prev => prev.filter(l => l !== name));
      if (nav === name) {
        setNav('Home');
        setListName(null);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Error deleting list');
    }
  };

  if (playFile) {
    return (
      <MediaViewer
        type={playType}
        file={playFile}
        goBack={() => {
          setPlayFile(null);
          setPlayType(null);
        }}
      />
    );
  }

  const navItems = [
    { name: 'Home', icon: <FaHome /> },
    { name: 'Bookmarks', icon: <FaBookmark /> },
    { name: 'Settings', icon: <FaCog /> }
  ];
  const mediaItems = [
    { type: 'music', label: 'Music', icon: <FaMusic /> },
    { type: 'videos', label: 'Videos', icon: <FaVideo /> },
    { type: 'photos', label: 'Photos', icon: <FaImage /> }
  ];

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header">MediaVault</div>
        <div className="sidebar-content">

          {/* Navigation */}
          <div className="sidebar-section">
            <div className="section-title">Navigation</div>
            {navItems.map(i => (
              <button
                key={i.name}
                className={nav === i.name ? 'active' : ''}
                onClick={() => handleNav(i.name)}
              >
                <span className="icon">{i.icon}</span>
                <span className="label">{i.name}</span>
              </button>
            ))}
          </div>

          {/* Media Types */}
          <div className="sidebar-section">
            <div className="section-title">Media Types</div>
            {mediaItems.map(i => (
              <button
                key={i.type}
                className={nav === i.label ? 'active' : ''}
                onClick={() => handleMedia(i.type, i.label)}
              >
                <span className="icon">{i.icon}</span>
                <span className="label">{i.label}</span>
              </button>
            ))}
          </div>

          {/* Custom Lists with Delete */}
          <div className="sidebar-section">
            <div className="section-title">Lists</div>
            {lists.map(name => (
              <div
                key={name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <button
                  className={nav === name ? 'active' : ''}
                  onClick={() => handleList(name)}
                >
                  <span className="icon"><FaList /></span>
                  <span className="label">{name}</span>
                </button>
                <FaTrash
                  style={{ marginLeft: '8px', cursor: 'pointer' }}
                  title={`Delete list "${name}"`}
                  onClick={() => deleteList(name)}
                />
              </div>
            ))}
          </div>

          {/* Create New List */}
          <button className="create-list-button" onClick={createList}>
            <span className="icon"><FaPlus /></span>
            <span className="label">Create New List</span>
          </button>

        </div>

        {/* Logout */}
        <button className="logout-button" onClick={onLogout}>
          <span className="icon"><FaSignOutAlt /></span>
          <span className="label">Logout</span>
        </button>
      </aside>

      <main className="main-content">
        {nav === 'Home' && <h1 className="welcome">Welcome, {user}</h1>}

        {(mediaType || listName) && (
          <MediaList
            mediaType={mediaType}
            listName={listName}
            lists={lists}                // ← pass down updated lists
            onPlay={(filename, type) => {
              setPlayFile(filename);
              setPlayType(type);
            }}
          />
        )}

        {nav === 'Settings' && <h1>Settings</h1>}
      </main>
    </div>
  );
}

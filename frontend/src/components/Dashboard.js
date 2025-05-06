// Dashboard.js
import React, { useState } from 'react';
import {
  FaHome,
  FaBookmark,
  FaCog,
  FaMusic,
  FaVideo,
  FaImage,
  FaList,
  FaPlus,
  FaSignOutAlt
} from 'react-icons/fa';
import MediaList from './MediaList';
import MediaViewer from './MediaViewer';
import './Dashboard.css';

export default function Dashboard({ user, onLogout }) {
  const [nav, setNav] = useState('Home');
  const [mediaType, setMediaType] = useState(null);
  const [listName, setListName] = useState(null);
  const [file, setFile] = useState(null);

  // when you click on a file to view
  if (file) {
    return (
      <MediaViewer
        type={mediaType || listName}
        file={file}
        goBack={() => setFile(null)}
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
  // static lists until you add creation logic
  const listItems = ['Favorites', 'Recently Added', 'Test'];

  const handleNav = name => {
    setNav(name);
    setMediaType(null);
    setListName(null);
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

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header">MediaVault</div>
        <div className="sidebar-content">
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

          <div className="sidebar-section">
            <div className="section-title">Lists</div>
            {listItems.map(name => (
              <button
                key={name}
                className={nav === name ? 'active' : ''}
                onClick={() => handleList(name)}
              >
                <span className="icon"><FaList /></span>
                <span className="label">{name}</span>
              </button>
            ))}
          </div>

          <button
            className="create-list-button"
            onClick={() => {
              /* Future: open your “Create New List” modal */
            }}
          >
            <span className="icon"><FaPlus /></span>
            <span className="label">Create New List</span>
          </button>
        </div>

        <button className="logout-button" onClick={onLogout}>
          <span className="icon"><FaSignOutAlt /></span>
          <span className="label">Logout</span>
        </button>
      </aside>

      <main className="main-content">
        {nav === 'Home' && <h1 className="welcome">Welcome, {user}</h1>}

        {/* whenever a mediaType or listName is set, show MediaList */}
        {(mediaType || listName) && (
          <MediaList
            mediaType={mediaType}
            listName={listName}
            onPlay={setFile}
          />
        )}

        {nav === 'Bookmarks' && <h1>Bookmarks</h1>}
        {nav === 'Settings'  && <h1>Settings</h1>}
      </main>
    </div>
  );
}

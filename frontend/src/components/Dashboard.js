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
  const [mediaType, setMediaType] = useState('music');
  const [file, setFile] = useState(null);

  if (file) {
    return (
      <MediaViewer
        type={mediaType}
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

  const listItems = ['All Media', 'Favorites', 'Recently Added'];

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header">MediaVault</div>

        <div className="sidebar-content">
          <div className="sidebar-section">
            <div className="section-title">Navigation</div>
            {navItems.map(item => (
              <button
                key={item.name}
                className={nav === item.name ? 'active' : ''}
                onClick={() => setNav(item.name)}
              >
                <span className="icon">{item.icon}</span>
                <span className="label">{item.name}</span>
              </button>
            ))}
          </div>

          <div className="sidebar-section">
            <div className="section-title">Media Types</div>
            {mediaItems.map(item => (
              <button
                key={item.type}
                className={mediaType === item.type ? 'active' : ''}
                onClick={() => {
                  setMediaType(item.type);
                  setNav('All Media');
                }}
              >
                <span className="icon">{item.icon}</span>
                <span className="label">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="sidebar-section">
            <div className="section-title">Lists</div>
            {listItems.map(list => (
              <button
                key={list}
                className={nav === list ? 'active' : ''}
                onClick={() => setNav(list)}
              >
                <span className="icon"><FaList /></span>
                <span className="label">{list}</span>
              </button>
            ))}
          </div>

          <button
            className="create-list-button"
            onClick={() => {
              /* handle create new list */
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
        {['All Media', 'Favorites', 'Recently Added'].includes(nav) && (
          <h1>{nav}</h1>
        )}
        {nav === 'Bookmarks' && <h1>Bookmarks</h1>}
        {nav === 'Settings' && <h1>Settings</h1>}
        {mediaType && nav === 'All Media' && (
          <MediaList type={mediaType} onPlay={setFile} />
        )}
      </main>
    </div>
  );
}

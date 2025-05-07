// MediaList.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FaUpload,
  FaPlus,
  FaTrash,
  FaTimes,
  FaBookmark
} from 'react-icons/fa';
import './MediaList.css';

const API_BASE = 'http://localhost:5000';

// Utility to infer media type by file extension
function inferType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  if (ext === 'mp3') return 'music';
  if (['jpg','jpeg','png','gif','bmp','webp'].includes(ext)) return 'photos';
  if (['mp4','mov','avi','mkv','webm'].includes(ext)) return 'videos';
  return 'music';
}

export default function MediaList({ mediaType, listName, onPlay }) {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState({ visible: false, item: '' });
  const [lists, setLists] = useState([]);

  // Determine API endpoint
  let endpoint = '';
  if (listName === 'Bookmarks') endpoint = 'bookmarks';
  else if (mediaType) endpoint = mediaType;
  else if (listName) endpoint = `list/${encodeURIComponent(listName)}`;

  // Fetch items
  useEffect(() => {
    if (!endpoint) return;
    axios.get(`${API_BASE}/api/${endpoint}`)
      .then(res => setItems(res.data || []))
      .catch(() => setItems([]));
  }, [endpoint]);

  // Fetch custom lists
  useEffect(() => {
    axios.get(`${API_BASE}/api/lists`)
      .then(res => setLists(res.data || []))
      .catch(() => setLists([]));
  }, []);

  const uploadHandler = e => {
    if (!mediaType) return;
    const file = e.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    axios.post(`${API_BASE}/api/${mediaType}/upload`, form)
      .then(() => axios.get(`${API_BASE}/api/${mediaType}`))
      .then(r => setItems(r.data || []))
      .catch(console.error);
  };

  const openAdd = name => setModal({ visible: true, item: name });

  const addToList = list => {
    axios.post(
      `${API_BASE}/api/list/${encodeURIComponent(list)}/${encodeURIComponent(modal.item)}`
    )
    .then(() => {
      setModal({ visible: false, item: '' });
      alert(`Added "${modal.item}" to "${list}"`);
    })
    .catch(() => alert('Error adding to list'));
  };

  const bookmark = name => {
    axios.post(`${API_BASE}/api/bookmarks`, { mediaType, filename: name })
      .then(() => alert(`Bookmarked "${name}"`))
      .catch(err => {
        if (err.response?.data?.error === 'Already bookmarked') {
          alert(`"${name}" is already bookmarked.`);
        } else {
          alert('Error bookmarking');
        }
      });
  };

  const removeBookmark = (name, type) => {
    axios.delete(
      `${API_BASE}/api/bookmarks/${encodeURIComponent(type)}/${encodeURIComponent(name)}`
    )
    .then(() => {
      setItems(prev => prev.filter(item =>
        !(item.media_type === type && item.filename === name)
      ));
      alert(`Removed bookmark "${name}"`);
    })
    .catch(() => alert('Error removing bookmark'));
  };

  const removeFromList = name => {
    axios.delete(
      `${API_BASE}/api/list/${encodeURIComponent(listName)}/${encodeURIComponent(name)}`
    )
    .then(() => {
      setItems(prev => prev.filter(n => n !== name));
      alert(`Removed "${name}" from "${listName}"`);
    })
    .catch(() => alert('Error removing from list'));
  };

  const filtered = items.filter(item => {
    const nm = typeof item === 'string' ? item : item.filename;
    return nm.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <div className="media-list-container">
      <div className="media-list-header">
        <h2>{listName || mediaType}</h2>
        <div className="actions">
          {!listName && mediaType && (
            <label className="upload">
              <FaUpload /> Upload
              <input type="file" onChange={uploadHandler} />
            </label>
          )}
          <input
            type="text"
            placeholder="Search..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="media-cards">
        {filtered.map(item => {
          const name = typeof item === 'string' ? item : item.filename;
          
          // Determine actual media type
          let type;
          if (listName === 'Bookmarks') type = item.media_type;
          else if (mediaType) type = mediaType;
          else type = inferType(name);

          // Thumbnail/preview logic
          let thumbContent;
          if (type === 'music') {
            // Default grey background + centered play icon
            thumbContent = <div className="icon">▶</div>;
          } else if (type === 'photos') {
            thumbContent = (
              <img
                src={`${API_BASE}/api/photos/${encodeURIComponent(name)}`}
                alt={name}
              />
            );
          } else { // videos
            thumbContent = (
              <>
                <video
                  src={`${API_BASE}/api/videos/${encodeURIComponent(name)}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  muted
                />
                <div className="icon">▶</div>
              </>
            );
          }

          return (
            <div className="card" key={name}>
              <div
                className="thumb"
                onClick={() => onPlay(name, type)}
                style={{ cursor: modal.visible ? 'default' : 'pointer' }}
              >
                {thumbContent}
              </div>
              <div className="info">
                <span className="name">{name}</span>
                <div className="controls">
                  {listName === 'Bookmarks' ? (
                    <FaTrash onClick={() => removeBookmark(name, type)} />
                  ) : listName ? (
                    <FaTrash onClick={() => removeFromList(name)} />
                  ) : mediaType ? (
                    <>
                      <FaPlus onClick={() => openAdd(name)} />
                      <FaBookmark
                        style={{ marginLeft: '0.5rem' }}
                        onClick={() => bookmark(name)}
                      />
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {modal.visible && (
        <div className="modal">
          <div className="modal-box">
            <h4>Add “{modal.item}” to:</h4>
            {lists.length > 0 ? (
              <ul>
                {lists.map(l => (
                  <li key={l} onClick={() => addToList(l)}>{l}</li>
                ))}
              </ul>
            ) : (
              <p>No lists available.</p>
            )}
            <button onClick={() => setModal({ visible: false, item: '' })}>
              <FaTimes /> Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

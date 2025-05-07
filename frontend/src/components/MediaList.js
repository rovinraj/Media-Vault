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

export default function MediaList({ mediaType, listName, onPlay }) {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState({ visible: false, item: '' });
  const [lists, setLists] = useState([]);

  // Determine endpoint
  let endpoint = '';
  if (listName === 'Bookmarks') {
    endpoint = 'bookmarks';
  } else if (mediaType) {
    endpoint = mediaType;
  } else if (listName) {
    endpoint = `list/${encodeURIComponent(listName)}`;
  }

  // Load items
  useEffect(() => {
    if (!endpoint) return;
    axios.get(`${API_BASE}/api/${endpoint}`)
      .then(res => setItems(res.data || []))
      .catch(err => {
        console.error('Fetch error:', err);
        setItems([]);
      });
  }, [endpoint]);

  // Load custom lists
  useEffect(() => {
    axios.get(`${API_BASE}/api/lists`)
      .then(res => setLists(res.data || []))
      .catch(err => {
        console.error('Error fetching lists:', err);
        setLists([]);
      });
  }, []);

  // Upload
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

  // Open add modal
  const openAdd = name => setModal({ visible: true, item: name });

  // Add to list
  const addToList = list => {
    axios.post(
      `${API_BASE}/api/list/${encodeURIComponent(list)}/${encodeURIComponent(modal.item)}`
    )
    .then(() => {
      setModal({ visible: false, item: '' });
      alert(`Added "${modal.item}" to "${list}"`);
    })
    .catch(err => {
      console.error('Add to list error:', err);
      alert('Error adding to list');
    });
  };

  // Bookmark
  const bookmark = name => {
    axios.post(`${API_BASE}/api/bookmarks`, {
      mediaType,
      filename: name
    })
    .then(() => {
      alert(`Bookmarked "${name}"`);
    })
    .catch(err => {
      const msg = err.response?.data?.error;
      if (msg === 'Already bookmarked') {
        alert(`"${name}" is already bookmarked.`);
      } else {
        console.error('Bookmark error:', err);
        alert('Error bookmarking');
      }
    });
  };

  // Remove bookmark
  const removeBookmark = (name, type) => {
    axios.delete(
      `${API_BASE}/api/bookmarks/${encodeURIComponent(type)}/${encodeURIComponent(name)}`
    )
    .then(() => {
      setItems(prev =>
        prev.filter(item =>
          !(item.media_type === type && item.filename === name)
        )
      );
      alert(`Removed bookmark "${name}"`);
    })
    .catch(err => {
      console.error('Remove bookmark error:', err);
      alert('Error removing bookmark');
    });
  };

  // Remove from custom list
  const removeFromList = name => {
    axios.delete(
      `${API_BASE}/api/list/${encodeURIComponent(listName)}/${encodeURIComponent(name)}`
    )
    .then(() => {
      setItems(prev => prev.filter(n => n !== name));
      alert(`Removed "${name}" from "${listName}"`);
    })
    .catch(err => {
      console.error('Remove from list error:', err);
      alert('Error removing from list');
    });
  };

  // Filtering
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
          const type = listName === 'Bookmarks'
            ? item.media_type
            : mediaType || 'music';

          return (
            <div className="card" key={name}>
              <div
                className="thumb"
                onClick={() => onPlay(name, type)}
                style={{ cursor: modal.visible ? 'default' : 'pointer' }}
              >
                <div className="icon">▶</div>
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
                  <li key={l} onClick={() => addToList(l)}>
                    {l}
                  </li>
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

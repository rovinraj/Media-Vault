// MediaList.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUpload, FaPlus, FaTrash, FaTimes } from 'react-icons/fa';
import './MediaList.css';

const API_BASE = 'http://localhost:5000';

export default function MediaList({ mediaType, listName, onPlay }) {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState({ visible: false, item: '' });

  // Build endpoint: either "/api/music" or "/api/list/Favorites"
  const endpointPath = mediaType
    ? mediaType
    : `list/${listName}`;

  useEffect(() => {
    if (!endpointPath) return;
    axios
      .get(`${API_BASE}/api/${endpointPath}`)
      .then(res => setItems(Array.isArray(res.data) ? res.data : []))
      .catch(err => {
        console.error('Fetch error:', err);
        setItems([]);
      });
  }, [endpointPath]);

  // Upload new file (only when browsing mediaType)
  const uploadHandler = e => {
    if (!mediaType) return;
    const file = e.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);

    axios
      .post(`${API_BASE}/api/${mediaType}/upload`, form)
      .then(() => axios.get(`${API_BASE}/api/${mediaType}`))
      .then(r => setItems(r.data))
      .catch(console.error);
  };

  // Open “Add to list” modal
  const openAdd = name => setModal({ visible: true, item: name });

  // POST to add file to chosen list
  const addToList = list => {
    axios
      .post(`${API_BASE}/api/list/${list}/${modal.item}`)
      .then(() => setModal({ visible: false, item: '' }))
      .catch(console.error);
  };

  // DELETE to remove from current list
  const removeFromList = name => {
    axios
      .delete(`${API_BASE}/api/list/${listName}/${name}`)
      .then(() => setItems(prev => prev.filter(n => n !== name)))
      .catch(console.error);
  };

  return (
    <div className="media-list-container">
      <div className="media-list-header">
        <h2>{listName || mediaType}</h2>
        <div className="actions">
          {!listName && (
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
        {items
          .filter(n => n.toLowerCase().includes(query.toLowerCase()))
          .map(name => (
            <div className="card" key={name}>
              <div
                className="thumb"
                onClick={() => {
                  if (!modal.visible) onPlay(name);
                }}
                style={{ cursor: modal.visible ? 'default' : 'pointer' }}
              >
                <div className="icon">▶</div>
              </div>
              <div className="info">
                <span className="name">{name}</span>
                <div className="controls">
                  {listName ? (
                    <FaTrash onClick={() => removeFromList(name)} />
                  ) : (
                    <FaPlus onClick={() => openAdd(name)} />
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>

      {modal.visible && (
        <div className="modal">
          <div className="modal-box">
            <h4>Add “{modal.item}” to:</h4>
            <ul>
              {['Favorites', 'Recently Added'].map(l => (
                <li key={l} onClick={() => addToList(l)}>
                  {l}
                </li>
              ))}
            </ul>
            <button onClick={() => setModal({ visible: false, item: '' })}>
              <FaTimes /> Cancel
            </button>
          </div>
        </div>
      )}
    </div>
);
}

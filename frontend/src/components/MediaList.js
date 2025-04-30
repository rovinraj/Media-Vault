import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUpload, FaMusic, FaEdit, FaTrash } from 'react-icons/fa';
import './MediaList.css';

const LIST_OPTIONS = ['All Media', 'Favorites', 'Recently Added'];

export default function MediaList({ type, onPlay }) {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState({ visible: false, item: null });

  useEffect(() => {
    axios.get(`http://localhost:5000/api/${type}`)
      .then(res => setItems(res.data))
      .catch(console.error);
  }, [type]);

  const filtered = items.filter(name =>
    name.toLowerCase().includes(query.toLowerCase())
  );

  const uploadFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    axios.post(`http://localhost:5000/api/${type}/upload`, fd)
      .then(() => axios.get(`http://localhost:5000/api/${type}`)
        .then(res => setItems(res.data)))
      .catch(console.error);
  };

  const openModal = name => setModal({ visible: true, item: name });
  const closeModal = () => setModal({ visible: false, item: null });
  const assignList = listName => {
    console.log(`Assigned ${modal.item} → ${listName}`);
    closeModal();
  };

  return (
    <>
    <div className="media-list-container">
      <div className="media-list-header">
        <h2>{type.charAt(0).toUpperCase() + type.slice(1)}</h2>
        <div className="actions">
          <input
            type="text"
            placeholder="Search..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <label className="upload">
            <FaUpload />
            <input type="file" onChange={uploadFile} />
          </label>
        </div>
      </div>
      <h3 className="section-label">Your {type}</h3>
      <div className="media-cards">
        {filtered.map(name => (
          <div key={name} className="card">
            <div className="thumb" onClick={() => onPlay(name)}>
              <img
                src={`http://localhost:5000/api/${type}/thumbnail/${encodeURIComponent(name.replace(/\..+$/, ''))}`}
                alt={name}
                onError={e => { e.currentTarget.style.display = 'none'; }}
              />
              <FaMusic className="icon" />
            </div>
            <div className="info">
              <span className="name">{name}</span>
              <div className="controls">
                <FaEdit onClick={() => openModal(name)} />
                <FaTrash onClick={() => {/* TODO delete */}} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {modal.visible && (
      <div className="modal">
        <div className="modal-box">
          <h4>Move "{modal.item}" to:</h4>
          <ul>
            {LIST_OPTIONS.map(opt => (
              <li key={opt} onClick={() => assignList(opt)}>{opt}</li>
            ))}
          </ul>
          <button onClick={closeModal}>Cancel</button>
        </div>
      </div>
    )}
    </>
  );
}
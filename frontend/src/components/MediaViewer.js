// MediaViewer.js

import React from 'react';

export default function MediaViewer({ type, file, goBack }) {
  const url = `http://localhost:5000/api/${type}/${encodeURIComponent(file)}`;

  return (
    <div>
      <button onClick={goBack}>Back</button>
      {type === 'music' && <audio controls src={url} />}
      {type === 'videos' && (
        <video controls width="600" src={url} style={{ maxWidth: '100%' }} />
      )}
      {type === 'photos' && (
        <img
          src={url}
          alt={file}
          style={{ maxWidth: '100%', maxHeight: '80vh' }}
        />
      )}
    </div>
  );
}

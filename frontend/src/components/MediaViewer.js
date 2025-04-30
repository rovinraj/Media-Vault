import React from 'react';
export default function MediaViewer({ type, file, goBack }){
  const url = `http://localhost:5000/api/${type}/${file}`;
  return (
    <div>
      <button onClick={goBack}>Back</button>
      {type==='music' && <audio controls src={url} />}
      {type==='videos' && <video controls width={400} src={url} />}
      {type==='photos' && <img src={url} alt={file} width={400} />}
    </div>
  );
}
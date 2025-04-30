import React from 'react';
export default ({ onSelectNav, onSelectMedia, onLogout })=> (
  <nav>
    <h4>Navigation</h4>
    {['Home','Bookmarks','Settings','My Lists'].map(x=>
      <button key={x} onClick={()=>onSelectNav(x)}>{x}</button>
    )}
    <h4>Media Types</h4>
    {['music','videos','photos'].map(t=>
      <button key={t} onClick={()=>onSelectMedia(t)}>{t}</button>
    )}
    <button onClick={onLogout}>Logout</button>
  </nav>
);
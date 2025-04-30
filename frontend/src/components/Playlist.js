import React, { useState, useEffect } from 'react';
export default function Playlist(){
  const [lists, setLists] = useState(() => JSON.parse(localStorage.getItem('lists')||'[]'));
  const [name, setName] = useState('');
  const add=()=>{
    let updated=[...lists,name]; setLists(updated);
    localStorage.setItem('lists',JSON.stringify(updated)); setName('');
  };
  return (
    <div>
      <h3>My Lists</h3>
      <input value={name} onChange={e=>setName(e.target.value)} placeholder="New list name"/>
      <button onClick={add}>Add</button>
      <ul>{lists.map((l,i)=><li key={i}>{l}</li>)}</ul>
    </div>
  );
}
import React, { useRef, useState, useEffect } from 'react';
import {
  FaArrowLeft,
  FaCog,
  FaStepBackward,
  FaPlay,
  FaPause,
  FaStepForward,
  FaVolumeUp,
  FaExpand,
  FaCompress
} from 'react-icons/fa';
import './MediaViewer.css';

const API_BASE = 'http://localhost:5000';

export default function MediaViewer({ type, file, goBack }) {
  const containerRef = useRef(null);
  const mediaRef    = useRef(null);
  const [playing,   setPlaying]   = useState(false);
  const [currentTime, setCT]      = useState(0);
  const [duration,  setDur]       = useState(0);
  const [volume,    setVol]       = useState(1);
  const [isFullscreen, setFull]   = useState(false);

  const url = `${API_BASE}/api/${type}/${encodeURIComponent(file)}`;

  // fullscreen toggle listener
  useEffect(() => {
    const onFS = () => setFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFS);
    return () => document.removeEventListener('fullscreenchange', onFS);
  }, []);

  // time & metadata hooks
  useEffect(() => {
    if (type !== 'music' && type !== 'videos') return;
    const m = mediaRef.current;
    if (!m) return;
    const onTime = () => setCT(m.currentTime);
    const onMeta = () => setDur(m.duration);
    m.addEventListener('timeupdate', onTime);
    m.addEventListener('loadedmetadata', onMeta);
    m.volume = volume;
    return () => {
      m.pause();
      m.removeEventListener('timeupdate', onTime);
      m.removeEventListener('loadedmetadata', onMeta);
    };
  }, [url, volume, type]);

  const togglePlay = () => {
    const m = mediaRef.current;
    if (!m) return;
    playing ? m.pause() : m.play();
    setPlaying(!playing);
  };

  const seek = e => {
    const t = parseFloat(e.target.value);
    mediaRef.current.currentTime = t;
    setCT(t);
  };

  const changeVolume = e => {
    const v = parseFloat(e.target.value);
    mediaRef.current.volume = v;
    setVol(v);
  };

  const fmt = t => {
    if (isNaN(t)) return '0:00';
    const m = Math.floor(t / 60),
          s = String(Math.floor(t % 60)).padStart(2, '0');
    return `${m}:${s}`;
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) containerRef.current.requestFullscreen();
    else document.exitFullscreen();
  };

  return (
    <div className="mv-container" ref={containerRef}>
      {/* Top bar */}
      <div className="mv-header-top">
        <button className="mv-back" onClick={goBack}>
          <FaArrowLeft /> Back
        </button>
        <button className="mv-settings">
          <FaCog />
        </button>
      </div>

      {/* Title */}
      <h2 className="mv-title">{file}</h2>

      {/* Main media area */}
      <div className="mv-artwork">
        {type === 'music' ? (
          <div className="mv-music-placeholder">
            <div className="mv-art-icon">♪</div>
            <audio ref={mediaRef} src={url} style={{ display: 'none' }} />
          </div>
        ) : type === 'videos' ? (
          <video ref={mediaRef} className="mv-media" src={url} />
        ) : type === 'photos' ? (
          <img className="mv-media" src={url} alt={file} />
        ) : null}
      </div>

      {/* Pinned bottom controls */}
      {(type === 'music' || type === 'videos') && (
        <div className="mv-controls">
          <div className="mv-scrub-container">
            <span className="mv-time">{fmt(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration}
              step="0.01"
              className="mv-scrubber"
              value={currentTime}
              onChange={seek}
            />
            <span className="mv-time">{fmt(duration)}</span>
          </div>

          <div className="mv-actions">
            <div className="mv-action-left">
              {type === 'videos' && (
                <button className="mv-full" onClick={toggleFullscreen}>
                  {isFullscreen ? <FaCompress /> : <FaExpand />}
                </button>
              )}
            </div>

            <div className="mv-buttons">
              <FaStepBackward />
              {playing
                ? <FaPause onClick={togglePlay} />
                : <FaPlay onClick={togglePlay} />
              }
              <FaStepForward />
            </div>

            <div className="mv-volume">
              <FaVolumeUp />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                className="mv-volume-slider"
                value={volume}
                onChange={changeVolume}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

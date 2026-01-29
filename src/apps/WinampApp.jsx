import { useState, useRef, useEffect, useCallback } from 'react';

// Working demo tracks using public domain/test audio
const DEMO_TRACKS = [
  { 
    id: 1, 
    title: 'Winamp Intro (Llama)', 
    artist: 'DJ Mike Llama', 
    duration: '0:05', 
    src: 'https://archive.org/download/WinampItReallyWhipsTheLlamasAss/Winamp_It_really_whips_the_llamas_ass.mp3' 
  },
  { 
    id: 2, 
    title: 'Techno Beat', 
    artist: 'SoundHelix', 
    duration: '6:12', 
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' 
  },
  { 
    id: 3, 
    title: 'Classic Synth', 
    artist: 'Retro Wave', 
    duration: '7:05', 
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' 
  },
];

export default function WinampApp() {
  const audioRef = useRef(null);
  const animationRef = useRef(null);
  
  const [playlist, setPlaylist] = useState(DEMO_TRACKS);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(75);
  const [visualizerData, setVisualizerData] = useState(new Array(32).fill(0));

  const currentTrack = playlist[currentTrackIndex] || {};

  // Initialize volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Handle track change - play automatically if was playing or is new track
  useEffect(() => {
    if (!audioRef.current || !currentTrack.src) return;

    // Load the new source
    audioRef.current.src = currentTrack.src;
    audioRef.current.load();

    if (isPlaying) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Auto-play prevented:", error);
          setIsPlaying(false);
        });
      }
    }
  }, [currentTrackIndex, currentTrack.src]);

  // Visualizer Animation
  useEffect(() => {
    if (!isPlaying) {
      // Decay effect when stopped
      if (visualizerData.some(v => v > 0)) {
         setVisualizerData(prev => prev.map(v => Math.max(0, v - 5)));
      }
      return;
    }

    const animate = () => {
      // Simulate frequency data since we can't easily analyze cross-origin audio
      setVisualizerData(prev => 
        prev.map(v => {
          const target = Math.random() * 100;
          return v + (target - v) * 0.3; // Smooth transition
        })
      );
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  // Audio Event Handlers
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    nextTrack();
  };

  // Playback controls
  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Playback failed:", error);
          alert("Could not play audio. Check URL or network.\n\nTry dragging an MP3 file from your computer!");
        });
      }
    }
    setIsPlaying(!isPlaying);
  };

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const previousTrack = () => {
    setCurrentTrackIndex(prev => 
      prev > 0 ? prev - 1 : playlist.length - 1
    );
  };

  const nextTrack = useCallback(() => {
    setCurrentTrackIndex(prev => 
      prev < playlist.length - 1 ? prev + 1 : 0
    );
  }, [playlist.length]);

  // Seek
  const handleSeek = (e) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle file drop (Real local files)
  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const audioFiles = files.filter(f => f.type.startsWith('audio/'));
    
    if (audioFiles.length > 0) {
      const newTracks = audioFiles.map((file, idx) => ({
        id: Date.now() + idx,
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'Local File',
        duration: '?:??',
        src: URL.createObjectURL(file), // Create a real blob URL for the file
      }));
      
      setPlaylist(prev => [...prev, ...newTracks]);
      
      // If playlist was empty or just default, play the new one
      if (playlist.length === DEMO_TRACKS.length && playlist[0].title === DEMO_TRACKS[0].title) {
         // Optionally auto-switch to first dropped file
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div 
      className="winamp-app"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={(e) => console.error("Audio error occurred", e)}
      />

      {/* Main Display */}
      <div className="winamp-display">
        <div className="winamp-visualizer">
          {visualizerData.map((value, i) => (
            <div
              key={i}
              className="winamp-bar"
              style={{ 
                height: `${value}%`,
                backgroundColor: value > 70 ? '#ff0000' : value > 40 ? '#ffff00' : '#00ff00'
              }}
            />
          ))}
        </div>
        <div className="winamp-info">
          <div className="winamp-title">{currentTrack.title || 'No Track'}</div>
          <div className="winamp-artist">{currentTrack.artist || ''}</div>
          <div className="winamp-time">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      </div>

      {/* Seek Bar */}
      <div className="winamp-seek">
        <input
          type="range"
          min="0"
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="winamp-seek-slider"
        />
      </div>

      {/* Controls */}
      <div className="winamp-controls">
        <button className="winamp-btn" onClick={previousTrack} title="Previous">
          ⏮️
        </button>
        <button className="winamp-btn winamp-btn-play" onClick={togglePlay} title={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        <button className="winamp-btn" onClick={stop} title="Stop">
          ⏹️
        </button>
        <button className="winamp-btn" onClick={nextTrack} title="Next">
          ⏭️
        </button>
      </div>

      {/* Volume */}
      <div className="winamp-volume">
        <span>🔊</span>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="winamp-volume-slider"
        />
        <span>{volume}%</span>
      </div>

      {/* Playlist */}
      <div className="winamp-playlist">
        <div className="winamp-playlist-header">📋 Playlist</div>
        <div className="winamp-playlist-items">
          {playlist.map((track, index) => (
            <div
              key={track.id}
              className={`winamp-playlist-item ${index === currentTrackIndex ? 'active' : ''}`}
              onClick={() => {
                setCurrentTrackIndex(index);
                // Auto play on click
                setIsPlaying(true);
              }}
            >
              <span className="winamp-track-num">{index + 1}.</span>
              <span className="winamp-track-title">{track.artist} - {track.title}</span>
              <span className="winamp-track-duration">{track.duration === '?:??' ? '' : track.duration}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Drop Zone Hint */}
      <div className="winamp-drop-hint">
        🎵 Drop audio files here to add to playlist
      </div>
    </div>
  );
}

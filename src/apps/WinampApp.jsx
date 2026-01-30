import { useState, useRef, useEffect, useCallback } from 'react';

// Custom Playlist - Matches files in public/music/
const DEMO_TRACKS = [
  { id: 1, title: 'August', artist: 'Taylor Swift', duration: '4:21', src: '/music/august.mp3' },
  { id: 2, title: 'Enchanted', artist: 'Taylor Swift', duration: '5:52', src: '/music/enchanted.mp3' },
  { id: 3, title: 'Iris', artist: 'Goo Goo Dolls', duration: '4:50', src: '/music/iris.mp3' },
  { id: 4, title: 'Marry You', artist: 'Bruno Mars', duration: '3:50', src: '/music/marry_you.mp3' },
  { id: 5, title: 'Memories', artist: 'Conan Gray', duration: '4:08', src: '/music/memories.mp3' },
  { id: 6, title: 'Let Her Go', artist: 'Passenger', duration: '4:12', src: '/music/passenger.mp3' },
  { id: 7, title: 'Photograph', artist: 'Ed Sheeran', duration: '4:19', src: '/music/photograph.mp3' },
  { id: 8, title: 'Somewhere Only We Know', artist: 'Keane', duration: '3:57', src: '/music/somewhere_only_we_know.mp3' },
  { id: 9, title: 'Talking to the Moon', artist: 'Bruno Mars', duration: '3:37', src: '/music/talking_to_the_moon.mp3' },
  { id: 10, title: 'We Are Young', artist: 'fun. ft. Janelle Monáe', duration: '4:10', src: '/music/we_are_young.mp3' },
  { id: 11, title: 'You Belong With Me', artist: 'Taylor Swift', duration: '3:51', src: '/music/you_belong_with_me.mp3' },
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

  // Handle track change
  const lastTrackIdRef = useRef(null);

  useEffect(() => {
    if (!audioRef.current || !currentTrack.src) return;

    // Only load if it's a different track
    if (lastTrackIdRef.current !== currentTrack.id) {
      audioRef.current.src = currentTrack.src;
      audioRef.current.load();
      lastTrackIdRef.current = currentTrack.id;

      if (isPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Auto-play prevented:", error);
            setIsPlaying(false);
          });
        }
      }
    } else {
        // Same track, just ensure play state matches
        if (isPlaying && audioRef.current.paused) {
            audioRef.current.play().catch(e => console.error(e));
        } else if (!isPlaying && !audioRef.current.paused) {
            audioRef.current.pause();
        }
    }
  }, [currentTrackIndex, currentTrack.src, currentTrack.id, isPlaying]);

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

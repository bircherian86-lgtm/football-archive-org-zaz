'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

const tracks = [
  'https://files.catbox.moe/azh589.mp3',
  'https://files.catbox.moe/ov28wr.mp3',
];

export function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  // Update volume and mute state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Handle track changes
  useEffect(() => {
    if (audioRef.current) {
      // Set the src only on initial load or when track index changes.
      if (audioRef.current.src !== tracks[currentTrackIndex]) {
        audioRef.current.src = tracks[currentTrackIndex];
      }
      
      if (isPlaying) {
        // Autoplay the new track
        audioRef.current.play().catch(error => {
          console.error("Autoplay failed, user interaction required.", error)
          setIsPlaying(false);
        });
      }
    }
  }, [currentTrackIndex, isPlaying]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    // Initialize src if it's not set
    if (!audioRef.current.src) {
        audioRef.current.src = tracks[currentTrackIndex];
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(error => console.error("Audio play failed. User may need to interact with the page first.", error));
    }
    // The onPlay/onPause event handlers will update the isPlaying state
  };
  
  const playNextTrack = () => {
    setCurrentTrackIndex((prevIndex) => (prevIndex + 1) % tracks.length);
  };

  const playPreviousTrack = () => {
    setCurrentTrackIndex((prevIndex) => (prevIndex - 1 + tracks.length) % tracks.length);
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div className="flex items-center gap-2">
      <audio 
        ref={audioRef} 
        onEnded={playNextTrack}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      
      <Button onClick={playPreviousTrack} variant="ghost" size="icon">
        <SkipBack className="h-5 w-5" />
      </Button>
      
      <Button onClick={togglePlayPause} variant="ghost" size="icon">
        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
      </Button>

      <Button onClick={playNextTrack} variant="ghost" size="icon">
        <SkipForward className="h-5 w-5" />
      </Button>
      
      <div className="flex w-24 items-center gap-2">
         <Button onClick={toggleMute} variant="ghost" size="icon">
            {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
         </Button>
        <Slider
          value={[isMuted ? 0 : volume * 100]}
          onValueChange={(value) => {
            const newVolume = value[0] / 100;
            setVolume(newVolume);
            if (newVolume > 0 && isMuted) {
              setIsMuted(false);
            }
          }}
          max={100}
          step={1}
        />
      </div>
    </div>
  );
}

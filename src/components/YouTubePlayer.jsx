import React, { useEffect } from 'react';

function YouTubePlayer({ videoId }) {
  useEffect(() => {
    // Only load the script once
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    // Create a function to initialize this specific player
    const initPlayer = () => {
      new window.YT.Player(`youtube-player-${videoId}`, {
        height: '390',
        width: '640',
        videoId: videoId,
        playerVars: {
          'playsinline': 1
        }
      });
    };

    // If YT is already loaded, create the player immediately
    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      // Add this player's init function to a queue
      const oldCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (oldCallback) oldCallback();
        initPlayer();
      };
    }
  }, [videoId]);

  return (
    <div id={`youtube-player-${videoId}`}>
      {/* Player will be inserted here */}
    </div>
  );
}

export default YouTubePlayer; 
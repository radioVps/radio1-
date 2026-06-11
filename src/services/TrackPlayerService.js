import TrackPlayer, { Event } from 'react-native-track-player';

module.exports = async function () {
  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    TrackPlayer.play();
  });

  TrackPlayer.addEventListener(Event.RemotePause, () => {
    TrackPlayer.pause();
  });

  TrackPlayer.addEventListener(Event.RemoteStop, () => {
    TrackPlayer.reset();
  });

  TrackPlayer.addEventListener(Event.RemoteDuck, async (event) => {
    // If audio focus lost or headset unplugged, pause playback
    if (event.paused) {
      TrackPlayer.pause();
    } else if (event.permanent) {
      TrackPlayer.stop();
    } else {
      // Lower volume temporarily on duck, or restore
      const volume = event.ducking ? 0.2 : 0.8;
      TrackPlayer.setVolume(volume);
    }
  });

  TrackPlayer.addEventListener(Event.PlaybackQueueEnded, () => {
    console.log('Playback queue ended');
  });

  TrackPlayer.addEventListener(Event.PlaybackError, (error) => {
    console.error('TrackPlayer service playback error:', error);
  });
};

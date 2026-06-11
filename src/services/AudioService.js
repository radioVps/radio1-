import TrackPlayer, { 
  Capability, 
  AppKilledPlaybackBehavior,
  State
} from 'react-native-track-player';

export const AudioService = {
  isInitialized: false,

  /**
   * Safe initialization of react-native-track-player
   */
  async setupPlayer() {
    if (this.isInitialized) return true;
    try {
      await TrackPlayer.setupPlayer({
        waitForBuffer: true,
      });

      await TrackPlayer.updateOptions({
        android: {
          appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
          // Mandatory to display modern Notification with background image art and controls
          alwaysPauseOnAuthorizeAnAudioPlay: true,
        },
        // Display control capabilities
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.Stop,
        ],
        compactCapabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.Stop,
        ],
        notificationCapabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.Stop,
        ]
      });

      this.isInitialized = true;
      return true;
    } catch (e) {
      console.error('AudioService setupPlayer error:', e);
      // Sometimes it is already initialized but throws an error.
      if (e.message && e.message.includes('already initialized')) {
        this.isInitialized = true;
        return true;
      }
      return false;
    }
  },

  /**
   * Starts playing a radio station
   * @param {object} station - Station config from stations list
   * @param {number} initialVolume - Saved volume setting
   */
  async playStation(station, initialVolume = 0.8) {
    await this.setupPlayer();
    try {
      await TrackPlayer.reset();

      const track = {
        id: station.id,
        url: station.stream,
        title: station.nombre,
        artist: 'Radio Mix Live',
        album: station.descripcion,
        genre: station.genero,
        artwork: station.cover,
        isLiveStream: true,
      };

      await TrackPlayer.add([track]);
      await TrackPlayer.setVolume(initialVolume);
      await TrackPlayer.play();
    } catch (e) {
      console.error('AudioService playStation error:', e);
    }
  },

  /**
   * Toggles play / pause state
   */
  async togglePlay(currentPlaybackState) {
    await this.setupPlayer();
    try {
      if (currentPlaybackState === State.Playing) {
        await TrackPlayer.pause();
      } else {
        await TrackPlayer.play();
      }
    } catch (e) {
      console.error('AudioService togglePlay error:', e);
    }
  },

  /**
   * Pauses the media stream
   */
  async pause() {
    await this.setupPlayer();
    try {
      await TrackPlayer.pause();
    } catch (e) {
      console.error('AudioService pause error:', e);
    }
  },

  /**
   * Completely stops the player status and removes notification
   */
  async stop() {
    await this.setupPlayer();
    try {
      await TrackPlayer.stop();
      await TrackPlayer.reset();
    } catch (e) {
      console.error('AudioService stop error:', e);
    }
  },

  /**
   * Adjusts player volume (0.0 to 1.0)
   * @param {number} volume 
   */
  async setVolume(volume) {
    await this.setupPlayer();
    try {
      await TrackPlayer.setVolume(volume);
    } catch (e) {
      console.error('AudioService setVolume error:', e);
    }
  }
};

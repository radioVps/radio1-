import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  LAST_STATION_ID: '@RadioMix:last_station_id',
  VOLUME: '@RadioMix:volume',
  PLAYING_STATE: '@RadioMix:playing_state',
};

export const StorageService = {
  /**
   * Saves the last active station ID
   * @param {string} stationId 
   */
  async saveLastStationId(stationId) {
    try {
      await AsyncStorage.setItem(KEYS.LAST_STATION_ID, stationId);
    } catch (e) {
      console.error('StorageService error saving station:', e);
    }
  },

  /**
   * Retrieves the last saved station ID
   * @returns {Promise<string|null>}
   */
  async getLastStationId() {
    try {
      return await AsyncStorage.getItem(KEYS.LAST_STATION_ID);
    } catch (e) {
      console.error('StorageService error reading station:', e);
      return null;
    }
  },

  /**
   * Saves volume level (0.0 to 1.0)
   * @param {number} volume 
   */
  async saveVolume(volume) {
    try {
      await AsyncStorage.setItem(KEYS.VOLUME, volume.toString());
    } catch (e) {
      console.error('StorageService error saving volume:', e);
    }
  },

  /**
   * Retrieves volume level
   * @returns {Promise<number>} Defaulting to 0.8
   */
  async getVolume() {
    try {
      const val = await AsyncStorage.getItem(KEYS.VOLUME);
      return val !== null ? parseFloat(val) : 0.8;
    } catch (e) {
      console.error('StorageService error reading volume:', e);
      return 0.8;
    }
  },

  /**
   * Saves current playing status
   * @param {boolean} isPlaying 
   */
  async savePlayingState(isPlaying) {
    try {
      await AsyncStorage.setItem(KEYS.PLAYING_STATE, isPlaying ? 'true' : 'false');
    } catch (e) {
      console.error('StorageService error saving playing state:', e);
    }
  },

  /**
   * Retrieves the last saved playing state
   * @returns {Promise<boolean>}
   */
  async getPlayingState() {
    try {
      const val = await AsyncStorage.getItem(KEYS.PLAYING_STATE);
      return val === 'true';
    } catch (e) {
      console.error('StorageService error reading playing state:', e);
      return false;
    }
  }
};

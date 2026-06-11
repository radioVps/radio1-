import React, { useEffect } from 'react';
import { LogBox } from 'react-native';
import { HomeScreen } from './src/screens/HomeScreen';
import TrackPlayer from 'react-native-track-player';

// Ignore specific cosmetic warning logs during live debugging
LogBox.ignoreLogs([
  'Setting a timer for a long period of time',
  'PlaybackState has been deprecated',
]);

export default function App() {
  useEffect(() => {
    // Make sure we stop all background track playback gracefully if component unmounts
    return () => {
      try {
        TrackPlayer.stop();
      } catch (e) {
        console.warn('TrackPlayer stops failed on unmount:', e);
      }
    };
  }, []);

  return <HomeScreen />;
}

import { AppRegistry } from 'react-native';
import App from './App';
import TrackPlayer from 'react-native-track-player';

AppRegistry.registerComponent('RadioMix', () => App);
TrackPlayer.registerPlaybackService(() => require('./src/services/TrackPlayerService'));


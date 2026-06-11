import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  Animated,
  Easing,
  Alert,
  ActivityIndicator
} from 'react-native';
import TrackPlayer, { usePlaybackState, State } from 'react-native-track-player';
import Icon from 'react-native-vector-icons/FontAwesome5';

import { theme } from '../constants/theme';
import { STATIONS } from '../constants/stations';
import { AudioService } from '../services/AudioService';
import { StorageService } from '../storage/StorageService';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

import { StationCard } from '../components/StationCard';
import { VolumeSlider } from '../components/VolumeSlider';
import { SocialMediaButtons } from '../components/SocialMediaButtons';

const BANNER_URL = 'https://drive.google.com/uc?export=view&id=1lC-H9RChTT03J5pWJ1JK3-DifKaKlpVq';

export function HomeScreen() {
  const playbackState = usePlaybackState();
  const [activeStation, setActiveStation] = useState(STATIONS[0]);
  const [volume, setVolume] = useState(0.8);
  const [bannerError, setBannerError] = useState(false);
  
  // Rotating Vinyl Animation Reference
  const spinValue = useRef(new Animated.Value(0)).current;
  const spinAnimation = useRef(null);

  // Monitor network status + perform auto-reconnect back online
  const isConnected = useNetworkStatus(async () => {
    // Reconnect callback: Trigger playback restart if active was playing
    const playedBefore = await StorageService.getPlayingState();
    if (playedBefore) {
      console.log('Network restored. Re-triggering stream connection...');
      await handlePlay();
    }
  });

  // Load user configurations on mount
  useEffect(() => {
    async function loadSavedState() {
      await AudioService.setupPlayer();
      
      const savedVolume = await StorageService.getVolume();

      if (savedVolume !== null) {
        setVolume(savedVolume);
        await AudioService.setVolume(savedVolume);
      }

      // Always load "Ecos del Mar" (STATIONS[0]) automatically when the app starts
      const targetStation = STATIONS[0];
      setActiveStation(targetStation);

      // Automatically play Ecos del Mar on start
      await handleStationChange(targetStation, savedVolume !== null ? savedVolume : volume);
    }
    loadSavedState();
  }, []);

  // Control Vinyl active spin animations
  const isPlaying = playbackState === State.Playing || playbackState.state === State.Playing;
  const isBuffering = playbackState === State.Buffering || playbackState.state === State.Buffering || playbackState === State.None || playbackState.state === State.None;

  useEffect(() => {
    if (isPlaying) {
      startSpinning();
    } else {
      stopSpinning();
    }
  }, [isPlaying]);

  const startSpinning = () => {
    spinValue.setValue(0);
    spinAnimation.current = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spinAnimation.current.start();
  };

  const stopSpinning = () => {
    if (spinAnimation.current) {
      spinAnimation.current.stop();
    }
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  // Action methods
  const handleStationChange = async (station, currentVol = volume) => {
    setActiveStation(station);
    await StorageService.saveLastStationId(station.id);
    
    if (!isConnected) {
      Alert.alert(
        'Sin Conexión',
         'No tienes acceso a Internet en este momento. La app intentará reproducir en background tan pronto recuperes conexión.'
      );
      await StorageService.savePlayingState(true);
      return;
    }

    await AudioService.playStation(station, currentVol);
    await StorageService.savePlayingState(true);
  };

  const handlePlay = async () => {
    if (!isConnected) {
      Alert.alert('Error', 'Comprueba tu conexión de Internet para iniciar stream.');
      return;
    }
    // Re-trigger playback of activeStation
    await AudioService.playStation(activeStation, volume);
    await StorageService.savePlayingState(true);
  };

  const handlePause = async () => {
    await AudioService.pause();
    await StorageService.savePlayingState(false);
  };

  const handleStop = async () => {
    await AudioService.stop();
    await StorageService.savePlayingState(false);
  };

  const handleVolumeChange = async (value) => {
    setVolume(value);
    await AudioService.setVolume(value);
    await StorageService.saveVolume(value);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      {/* 1. Header Banner */}
      <View style={styles.bannerContainer}>
        <Image
          source={bannerError ? require('../assets/images/regenerated_image_1780884894287.png') : { uri: BANNER_URL }}
          style={styles.bannerImage}
          resizeMode="cover"
          onError={() => setBannerError(true)}
        />
        {!isConnected && (
          <View style={styles.networkAlert}>
            <Icon name="exclamation-triangle" size={12} color="#ffffff" />
            <Text style={styles.networkAlertText}>MODO OFFLINE — Sin Conexión</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 2. Visual Audio Stage with Vinyl Spin */}
        <View style={styles.playerStage}>
          
          {/* Animated red LIVE indicator badge */}
          <View style={styles.topBadgeRow}>
            {isPlaying ? (
              <View style={styles.liveIndicator}>
                <View style={[styles.pulseCircle, { backgroundColor: theme.colors.accent }]} />
                <Text style={styles.liveIndicatorText}>LIVE BROADCAST</Text>
              </View>
            ) : (
              <View style={[styles.liveIndicator, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
                <Text style={styles.offlineText}>PAUSED</Text>
              </View>
            )}

            {/* Connection badge status */}
            <View style={[styles.connectionBadge, { backgroundColor: isConnected ? 'rgba(76, 175, 80, 0.15)' : 'rgba(244, 67, 54, 0.15)' }]}>
              <View style={[styles.statusDot, { backgroundColor: isConnected ? theme.colors.green : theme.colors.red }]} />
              <Text style={[styles.connectionText, { color: isConnected ? theme.colors.green : theme.colors.red }]}>
                {isConnected ? 'ONLINE' : 'DESCONECTADO'}
              </Text>
            </View>
          </View>

          {/* Core spinning media cover */}
          <View style={styles.wheelCenterFrame}>
            <Animated.Image
              source={{ uri: activeStation.cover }}
              style={[styles.vinylDisc, { transform: [{ rotate: spin }] }]}
            />
            {/* Spinning center core anchor hole */}
            <View style={styles.vinylCore}>
              <View style={styles.vinylCoreInner} />
            </View>
            {isBuffering && (
              <View style={styles.bufferingOverlay}>
                <ActivityIndicator size="large" color={theme.colors.accent} />
                <Text style={styles.bufferingText}>Cargando Audio...</Text>
              </View>
            )}
          </View>

          {/* Station Title Indicators */}
          <Text style={styles.activeStationTitle}>{activeStation.nombre}</Text>
          <Text style={styles.activeStationSubtitle}>{activeStation.genero} • {activeStation.descripcion}</Text>

          {/* 3. Control Button Panels */}
          <View style={styles.controlButtons}>
            <TouchableOpacity 
              style={[styles.roundBtn, styles.stopBtn]} 
              onPress={handleStop}
              activeOpacity={0.7}
            >
              <Icon name="stop" size={18} color="#ffffff" />
            </TouchableOpacity>

            {isPlaying ? (
              <TouchableOpacity 
                style={[styles.roundBtn, styles.playPauseBtn]} 
                onPress={handlePause}
                activeOpacity={0.7}
              >
                <Icon name="pause" size={24} color="#ffffff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.roundBtn, styles.playPauseBtn]} 
                onPress={handlePlay}
                activeOpacity={0.7}
              >
                <Icon name="play" size={24} color="#ffffff" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            )}

            <View style={[styles.roundBtn, styles.statusIndicatorFrame, { backgroundColor: isConnected ? 'rgba(76,175,80,0.1)' : 'rgba(244,67,54,0.1)' }]}>
              <Icon 
                name={isConnected ? "wifi" : "wifi-slash"} 
                size={16} 
                color={isConnected ? theme.colors.green : theme.colors.red} 
              />
            </View>
          </View>

        </View>

        {/* 4. Volume controller Slider */}
        <VolumeSlider volume={volume} onVolumeChange={handleVolumeChange} />

        {/* 5. Scrollable listing of radio streams */}
        <View style={styles.stationsListSection}>
          <Text style={styles.sectionHeader}>EMISORAS DISPONIBLES</Text>
          {STATIONS.map((station) => (
            <StationCard
              key={station.id}
              station={station}
              isActive={activeStation.id === station.id}
              isPlaying={activeStation.id === station.id && isPlaying}
              onPress={() => handleStationChange(station)}
            />
          ))}
        </View>

        {/* 6. Social Media panel */}
        <SocialMediaButtons />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  bannerContainer: {
    width: '100%',
    height: 110,
    backgroundColor: theme.colors.secondary,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  networkAlert: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    gap: 6,
  },
  networkAlertText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  playerStage: {
    margin: 15,
    padding: 20,
    borderRadius: 20,
    backgroundColor: theme.colors.secondary,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  topBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(233, 69, 96, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  pulseCircle: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveIndicatorText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  offlineText: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  connectionText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  wheelCenterFrame: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#050510',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    position: 'relative',
    borderWidth: 6,
    borderColor: '#3f3f3f',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  vinylDisc: {
    width: 156,
    height: 156,
    borderRadius: 78,
    opacity: 0.85,
  },
  vinylCore: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    borderColor: '#2e2e2e',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vinylCoreInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffffff',
  },
  bufferingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 5, 16, 0.8)',
    borderRadius: 85,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bufferingText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 6,
  },
  activeStationTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 15,
  },
  activeStationSubtitle: {
    fontSize: 13,
    color: theme.colors.accent,
    fontWeight: '500',
    marginTop: 3,
  },
  controlButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 25,
    marginTop: 20,
    width: '100%',
  },
  roundBtn: {
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  playPauseBtn: {
    width: 64,
    height: 64,
    backgroundColor: theme.colors.accent,
  },
  stopBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#3f3f3f',
  },
  statusIndicatorFrame: {
    width: 44,
    height: 44,
    shadowOpacity: 0,
    elevation: 0,
  },
  stationsListSection: {
    paddingHorizontal: 20,
    marginTop: 15,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 2,
    marginBottom: 12,
  }
});

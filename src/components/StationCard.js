import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';
import Icon from 'react-native-vector-icons/FontAwesome5';

export function StationCard({ station, isActive, isPlaying, onPress }) {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        isActive ? { borderColor: theme.colors.accent, borderWidth: 2 } : { borderColor: 'transparent', borderWidth: 0 }
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: station.cover }}
        style={styles.artwork}
        resizeMode="cover"
      />
      
      <View style={styles.infoContainer}>
        <View style={styles.row}>
          <Text style={styles.stationName}>{station.nombre}</Text>
          {isActive && (
            <View style={[styles.liveBadge, isPlaying ? { backgroundColor: 'rgba(233, 69, 96, 0.25)' } : null]}>
              <View style={styles.dot} />
              <Text style={styles.liveText}>{isPlaying ? 'PLAYING' : 'READY'}</Text>
            </View>
          )}
        </View>

        <Text style={styles.genre}>{station.genero}</Text>
        <Text style={styles.description} numberOfLines={1}>{station.descripcion}</Text>
      </View>

      <View style={styles.actionContainer}>
        {isActive && isPlaying && (
          <View style={styles.visualizerContainer} className="visualizer-container animated-visualizer">
            <View style={[styles.bar, styles.bar1]} className="visualizer-bar bar-1" />
            <View style={[styles.bar, styles.bar2]} className="visualizer-bar bar-2" />
            <View style={[styles.bar, styles.bar3]} className="visualizer-bar bar-3" />
            <View style={[styles.bar, styles.bar4]} className="visualizer-bar bar-4" />
          </View>
        )}
        <View style={[styles.playButtonWrapper, { backgroundColor: isActive ? theme.colors.accent : theme.colors.secondary }]}>
          <Icon 
            name={isActive ? (isPlaying ? 'volume-up' : 'volume-down') : 'play'} 
            size={14} 
            color="#ffffff" 
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  artwork: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stationName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(233, 69, 96, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.accent,
  },
  liveText: {
    fontSize: 9,
    fontWeight: '900',
    color: theme.colors.accent,
  },
  genre: {
    fontSize: 12,
    color: theme.colors.accent,
    fontWeight: '600',
    marginTop: 2,
  },
  description: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 10,
    gap: 12,
  },
  visualizerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 24,
    width: 24,
    gap: 3,
  },
  bar: {
    width: 3,
    backgroundColor: theme.colors.accent,
    borderRadius: 1.5,
  },
  bar1: {
    height: 4,
  },
  bar2: {
    height: 6,
  },
  bar3: {
    height: 3,
  },
  bar4: {
    height: 5,
  },
  playButtonWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

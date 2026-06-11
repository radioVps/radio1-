import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { theme } from '../constants/theme';

export function VolumeSlider({ volume, onVolumeChange }) {
  // Determine icon based on volume level
  const getVolumeIcon = () => {
    if (volume === 0) return 'volume-mute';
    if (volume < 0.4) return 'volume-down';
    return 'volume-up';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name={getVolumeIcon()} size={16} color={theme.colors.accent} />
        <Text style={styles.label}>Volumen: {Math.round(volume * 100)}%</Text>
      </View>
      
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={1}
        value={volume}
        onValueChange={onVolumeChange}
        minimumTrackTintColor={theme.colors.accent}
        maximumTrackTintColor="#555555"
        thumbTintColor={theme.colors.accent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 25,
    marginVertical: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  label: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  slider: {
    width: '100%',
    height: 40,
  }
});

import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';
import Icon from 'react-native-vector-icons/FontAwesome5';

const SOCIAL_LINKS = [
  {
    name: 'WhatsApp',
    url: 'https://wa.me/15196190373',
    icon: 'whatsapp',
    color: '#25D366',
  },
  {
    name: 'Facebook',
    url: 'https://www.facebook.com/share/18sTJS5yKm/',
    icon: 'facebook',
    color: '#1877F2',
  },
  {
    name: 'YouTube',
    url: 'https://youtube.com/@ecosdelmar',
    icon: 'youtube',
    color: '#FF0000',
  }
];

export function SocialMediaButtons() {
  const handlePress = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.warn(`Cannot open URL: ${url}`);
        // Fallback open
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening social URL:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SÍGUENOS EN REDES SOLIALES</Text>
      <View style={styles.buttonRow}>
        {SOCIAL_LINKS.map((item) => (
          <TouchableOpacity
            key={item.name}
            style={[styles.socialButton, { borderColor: item.color }]}
            onPress={() => handlePress(item.url)}
            activeOpacity={0.7}
          >
            {/* If Icon is unlinked/loaded in debug, it fails gracefully. So we wrap inside a try or fallback rendering */}
            <View style={styles.iconContainer}>
              <Icon name={item.icon} size={22} color={item.color} style={styles.icon} />
              <Text style={[styles.buttonText, { color: item.color }]}>{item.name}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 2,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    gap: 10,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    backgroundColor: theme.colors.secondary,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    marginRight: 4,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
  }
});

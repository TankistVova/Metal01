import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

export function PlaceholderScreen({ title, subtitle, onBack }) {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={onBack}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.darkBackground
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20
  },
  back: {
    color: '#6f7593',
    fontSize: 34
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    gap: 14
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center'
  },
  subtitle: {
    color: '#8d93ad',
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center'
  }
});

import { Image, Pressable, StyleSheet, Text, View } from 'react-native'

const palette = {
  card: '#F9FAFB',
  title: '#3f446d',
  subtitle: '#707894',
  accent: '#38bfd1',
  arrowBg: '#f4f5fb'
}

export function ProfileMenuCard({
  icon,
  iconSource,
  title,
  subtitle,
  onPress,
  disabled = false,
  trailing,
  showArrow = true
}) {
  return (
    <Pressable style={[styles.card, disabled && styles.cardDisabled]} onPress={onPress} disabled={disabled}>
      <View style={styles.left}>
        <View style={styles.iconWrap}>
          {iconSource ? (
            <Image source={iconSource} style={styles.iconImage} resizeMode="contain" />
          ) : (
            <Text style={styles.icon}>{icon}</Text>
          )}
        </View>

        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>

      {trailing ? (
        <View style={styles.trailingWrap}>{trailing}</View>
      ) : showArrow ? (
        <View style={styles.arrowWrap}>
          <Text style={styles.arrow}>›</Text>
        </View>
      ) : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    minHeight: 60,
    paddingLeft: 8,
    paddingRight: 8,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: palette.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8
  },
  cardDisabled: {
    opacity: 0.7
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  iconWrap: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center'
  },
  icon: {
    width: 38,
    color: palette.accent,
    fontSize: 34,
    textAlign: 'center'
  },
  iconImage: {
    width: 28,
    height: 28,
    tintColor: palette.accent
  },
  copy: {
    flex: 1,
    gap: 2
  },
  title: {
    color: palette.title,
    fontSize: 18,
    fontWeight: '800'
  },
  subtitle: {
    color: palette.subtitle,
    fontSize: 13,
    lineHeight: 17
  },
  arrowWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.arrowBg
  },
  trailingWrap: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center'
  },
  arrow: {
    color: palette.subtitle,
    fontSize: 28,
    lineHeight: 28
  }
})

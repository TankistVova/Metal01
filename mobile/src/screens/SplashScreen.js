import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

export function SplashScreen({ userName }) {
  return (
    <View style={styles.container}>
      <View style={styles.brandTop}>
        <Text style={styles.welcome}>Добро пожаловать!</Text>
        <Text style={styles.name}>{userName || 'Гость'}</Text>
      </View>

      <View style={styles.logoBlock}>
        <View style={styles.logoMark}>
          <View style={styles.bandageVerticalTop}>
            <View style={styles.dotGridLarge}>
              {Array.from({ length: 12 }).map((_, index) => (
                <View key={`top-${index}`} style={styles.dotLarge} />
              ))}
            </View>
          </View>
          <View style={styles.bandageVerticalBottom}>
            <View style={styles.dotGridLarge}>
              {Array.from({ length: 12 }).map((_, index) => (
                <View key={`bottom-${index}`} style={styles.dotLarge} />
              ))}
            </View>
          </View>
          <View style={styles.bandageHorizontal}>
            <View style={styles.dotGridSmall}>
              {Array.from({ length: 6 }).map((_, index) => (
                <View key={`side-${index}`} style={styles.dotSmall} />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.wordmark}>
          <Text style={styles.logoLine}>ЦИФРОВАЯ</Text>
          <Text style={styles.logoLine}>АПТЕЧКА</Text>
          <View style={styles.pixels}>
            <View style={styles.pixel} />
            <View style={styles.pixel} />
            <View style={styles.pixel} />
            <View style={[styles.pixel, styles.pixelOffset]} />
            <View style={[styles.pixel, styles.pixelOffsetWide]} />
            <View style={[styles.pixel, styles.pixelOffsetWider]} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: '#31BACB'
  },
  brandTop: {
    alignItems: 'center',
    marginBottom: 128
  },
  welcome: {
    color: colors.white,
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center'
  },
  name: {
    color: colors.white,
    fontSize: 27,
    fontWeight: '300',
    marginTop: 8,
    textAlign: 'center'
  },
  logoBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 14,
    alignSelf: 'center',
    transform: [{ translateX: -18 }]
  },
  logoMark: {
    width: 94,
    height: 104,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center'
  },
  bandageVerticalTop: {
    width: 44,
    height: 49,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0
  },
  bandageVerticalBottom: {
    width: 44,
    height: 49,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 0
  },
  bandageHorizontal: {
    width: 30,
    height: 44,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: 0
  },
  dotGridLarge: {
    width: 22,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4
  },
  dotGridSmall: {
    width: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 3
  },
  dotLarge: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.splashBottom
  },
  dotSmall: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.splashBottom
  },
  wordmark: {
    position: 'relative'
  },
  logoLine: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 33
  },
  pixels: {
    position: 'absolute',
    right: -30,
    top: 12,
    width: 24,
    height: 54
  },
  pixel: {
    width: 6,
    height: 6,
    backgroundColor: colors.white,
    position: 'absolute',
    right: 0
  },
  pixelOffset: {
    top: 18
  },
  pixelOffsetWide: {
    top: 30,
    right: 11
  },
  pixelOffsetWider: {
    top: 42
  }
});

import { StyleSheet, View } from 'react-native';

const colors = {
  stroke: '#9aa3b2'
};

export function EyeIcon({ open = false }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.eye} />
      <View style={styles.pupil} />
      {!open ? <View style={styles.slash} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  eye: {
    width: 16,
    height: 10,
    borderWidth: 1.5,
    borderColor: colors.stroke,
    borderRadius: 10,
    position: 'absolute'
  },
  pupil: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.stroke
  },
  slash: {
    width: 18,
    height: 1.5,
    backgroundColor: colors.stroke,
    position: 'absolute',
    transform: [{ rotate: '-35deg' }]
  }
});

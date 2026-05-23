import { StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../theme/colors';

export function AppShell({ children, bottomBar }) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={bottomBar ? ['top', 'left', 'right'] : ['top', 'bottom', 'left', 'right']}
    >
      <View style={styles.content}>{children}</View>
      {bottomBar ? (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {bottomBar}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.authBackground
  },
  content: {
    flex: 1
  },
  bottomBar: {
    backgroundColor: colors.authBackground,
    paddingTop: 4
  }
});

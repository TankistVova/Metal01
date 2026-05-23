import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { EyeIcon } from './EyeIcon';

const colors = {
  label: '#42466f',
  inputBg: '#dcebff',
  inputText: '#2b3058',
  placeholder: '#7f8cb5',
  eye: '#9aa3b2'
};

export function AuthField({
  label,
  value,
  onChangeText,
  secureTextEntry,
  placeholder,
  keyboardType,
  autoCapitalize = 'none',
  rightAction
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          style={styles.input}
        />
        {rightAction ? (
          <Pressable onPress={rightAction.onPress} style={styles.action}>
            {rightAction.icon ? (
              <Image source={rightAction.icon} style={styles.actionIcon} resizeMode="contain" />
            ) : rightAction.eyeState ? (
              <EyeIcon open={rightAction.eyeState === 'open'} />
            ) : (
              <Text style={styles.actionText}>{rightAction.label}</Text>
            )}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 7
  },
  label: {
    color: colors.label,
    fontSize: 14,
    fontWeight: '700'
  },
  inputWrap: {
    position: 'relative',
    justifyContent: 'center'
  },
  input: {
    minHeight: 49,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.inputBg,
    color: colors.inputText,
    fontSize: 15
  },
  action: {
    position: 'absolute',
    right: 12,
    padding: 6
  },
  actionText: {
    color: colors.eye,
    fontSize: 17,
    fontWeight: '700'
  },
  actionIcon: {
    width: 18,
    height: 18,
    tintColor: colors.eye
  }
});

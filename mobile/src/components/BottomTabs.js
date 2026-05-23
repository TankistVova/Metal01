import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

const palette = {
  bg: '#FFFFFF',
  text: '#44476F',
  active: '#35BFD2'
};

const homeIcon = require('../../assets/icons/home.png');
const calendarIcon = require('../../assets/icons/calendar.png');
const plusIcon = require('../../assets/icons/plus.png');
const menuIcon = require('../../assets/icons/line.png');

const tabs = [
  { key: 'inventory', label: 'Инвентарь', icon: homeIcon },
  { key: 'calendar', label: 'Календарь', icon: calendarIcon },
  { key: 'add', label: 'Добавить', icon: plusIcon },
  { key: 'profile', label: 'Меню', icon: menuIcon }
];

export function BottomTabs({ activeTab, onChange }) {
  return (
    <View style={styles.bar}>
      {tabs.map((tab) => {
        const active = tab.key === activeTab;

        return (
          <Pressable key={tab.key} style={styles.tab} onPress={() => onChange(tab.key)}>
            <View style={styles.iconWrap}>
              <Image
                source={tab.icon}
                style={[
                  styles.icon,
                  active && styles.iconActive,
                  tab.key === 'add' && styles.addIcon,
                  tab.key === 'profile' && styles.menuIcon
                ]}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: palette.bg,
    paddingTop: 8,
    paddingBottom: 2,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F2F7'
  },
  tab: {
    flex: 1,
    minWidth: 64,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2
  },
  iconWrap: {
    height: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  icon: {
    width: 21,
    height: 21,
    tintColor: palette.text
  },
  iconActive: {
    tintColor: palette.active
  },
  addIcon: {
    width: 22,
    height: 22
  },
  menuIcon: {
    width: 21,
    height: 16
  },
  label: {
    color: palette.text,
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center'
  },
  labelActive: {
    color: palette.active
  }
});

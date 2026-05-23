import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

import { getAlertDescription } from '../lib/errors';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';

const pullIcon = require('../../assets/icons/pull.png');

const getKitMeta = (kit, index) => {
  const value = `${kit?.avatar || ''} ${kit?.name || ''}`.toLowerCase();

  if (value.includes('car') || value.includes('авто') || value.includes('машин')) {
    return { label: 'car-outline', pack: 'ion' };
  }

  if (value.includes('kid') || value.includes('child') || value.includes('baby') || value.includes('реб')) {
    return { label: 'baby-face-outline', pack: 'material' };
  }

  if (value.includes('med') || value.includes('aid')) {
    return { label: 'medical-bag', pack: 'material' };
  }

  return index % 3 === 1
    ? { label: 'car-outline', pack: 'ion' }
    : index % 3 === 2
      ? { label: 'baby-face-outline', pack: 'material' }
      : { label: 'home-outline', pack: 'ion' };
};

const renderKitIcon = (meta, color) => {
  if (meta.pack === 'material') {
    return <MaterialCommunityIcons name={meta.label} size={20} color={color} />;
  }

  return <Ionicons name={meta.label} size={20} color={color} />;
};

export function InventoryScreen({ user, onOpenAdd }) {
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [aptechkas, setAptechkas] = useState([]);
  const [selectedKit, setSelectedKit] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [menuMedicineId, setMenuMedicineId] = useState(null);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    void loadKits();

    return () => {
      mountedRef.current = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (selectedKit) {
      void loadMedicines(selectedKit);
    } else {
      setMedicines([]);
    }
  }, [selectedKit]);

  const activeKit = useMemo(() => {
    return aptechkas.find((item) => item.id === selectedKit) || null;
  }, [aptechkas, selectedKit]);

  const loadKits = async () => {
    setLoading(true);
    setErrorText('');

    const userId = user?.id;
    if (!userId || !supabase) {
      if (mountedRef.current) {
        setAptechkas([]);
        setSelectedKit(null);
        setLoading(false);
      }
      return;
    }

    try {
      const { data: owned, error: ownedError } = await supabase
        .from('aptechkas')
        .select('*')
        .eq('owner_id', userId);

      if (ownedError) {
        throw ownedError;
      }

      const { data: memberRows, error: memberError } = await supabase
        .from('aptechka_members')
        .select('aptechka_id')
        .eq('user_id', userId);

      if (memberError) {
        throw memberError;
      }

      let shared = [];
      const ids = [...new Set((memberRows || []).map((row) => row.aptechka_id).filter(Boolean))];

      if (ids.length) {
        const { data, error: sharedError } = await supabase
          .from('aptechkas')
          .select('*')
          .in('id', ids)
          .neq('owner_id', userId);

        if (sharedError) {
          throw sharedError;
        }

        shared = data || [];
      }

      if (!mountedRef.current) {
        return;
      }

      const allKits = [...(owned || []), ...shared];
      setAptechkas(allKits);
      setSelectedKit((current) => {
        if (current && allKits.some((item) => item.id === current)) {
          return current;
        }

        return allKits[0]?.id || null;
      });
    } catch (error) {
      console.error('Failed to load kits for inventory', error);

      if (mountedRef.current) {
        setAptechkas([]);
        setSelectedKit(null);
        setErrorText(getAlertDescription(error, 'Не удалось загрузить аптечки.'));
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }

    return;

    const { data: owned, error: ownedError } = await supabase
      .from('aptechkas')
      .select('*')
      .eq('owner_id', userId);

    const { data: memberRows, error: memberError } = await supabase
      .from('aptechka_members')
      .select('aptechka_id')
      .eq('user_id', userId);

    if (ownedError || memberError) {
      setErrorText('Не удалось загрузить аптечки');
      setLoading(false);
      return;
    }

    let shared = [];

    if (memberRows?.length) {
      const ids = memberRows.map((row) => row.aptechka_id);
      const { data, error } = await supabase
        .from('aptechkas')
        .select('*')
        .in('id', ids)
        .neq('owner_id', userId);

      if (error) {
        setErrorText('Не удалось загрузить общие аптечки');
        setLoading(false);
        return;
      }

      shared = data || [];
    }

    const allKits = [...(owned || []), ...shared];
    setAptechkas(allKits);
    setSelectedKit(allKits[0]?.id || null);
    setLoading(false);
  };

  const loadMedicines = async (kitId) => {
    if (!kitId || !supabase) {
      if (mountedRef.current) {
        setMedicines([]);
      }
      return;
    }

    try {
      const { data, error } = await supabase.from('medicines').select('*').eq('aptechka_id', kitId);

      if (error) {
        throw error;
      }

      if (mountedRef.current) {
        setMedicines(data || []);
      }
    } catch (error) {
      console.error('Failed to load medicines for inventory', error);

      if (mountedRef.current) {
        setMedicines([]);
        setErrorText(getAlertDescription(error, 'Не удалось загрузить лекарства.'));
      }
    }

    return;

    const { data, error } = await supabase.from('medicines').select('*').eq('aptechka_id', kitId);

    if (error) {
      setErrorText('Не удалось загрузить лекарства');
      return;
    }

    setMedicines(data || []);
  };

  const handleDeleteMedicine = (medicineId) => {
    Alert.alert('Удалить лекарство?', 'Это действие нельзя отменить.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('medicines').delete().eq('id', medicineId);

            if (error) {
              throw error;
            }

            if (mountedRef.current) {
              setMenuMedicineId(null);
            }

            await loadMedicines(selectedKit);
          } catch (error) {
            Alert.alert('Ошибка', getAlertDescription(error, 'Не удалось удалить лекарство.'));
          }

          return;

          const { error } = await supabase.from('medicines').delete().eq('id', medicineId);
          if (!error) {
            setMenuMedicineId(null);
            loadMedicines(selectedKit);
          }
        }
      }
    ]);
  };

  const handleSaveMedicine = async () => {
    if (!editingMedicine?.id || !editingMedicine?.name?.trim()) {
      return;
    }

    try {
      const { error } = await supabase
        .from('medicines')
        .update({
          name: editingMedicine.name.trim(),
          dose: editingMedicine.dose || '',
          quantity: Number(editingMedicine.quantity) || 1
        })
        .eq('id', editingMedicine.id);

      if (error) {
        throw error;
      }

      if (mountedRef.current) {
        setEditingMedicine(null);
      }

      await loadMedicines(selectedKit);
    } catch (error) {
      Alert.alert('Ошибка', getAlertDescription(error, 'Не удалось сохранить лекарство.'));
    }

    return;

    const { error } = await supabase
      .from('medicines')
      .update({
        name: editingMedicine.name.trim(),
        dose: editingMedicine.dose || '',
        quantity: Number(editingMedicine.quantity) || 1
      })
      .eq('id', editingMedicine.id);

    if (!error) {
      setEditingMedicine(null);
      loadMedicines(selectedKit);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (errorText) {
    return (
      <View style={styles.stateScreen}>
        <Text style={styles.screenTitle}>Аптечки</Text>
        <View style={styles.stateCard}>
          <Text style={styles.stateTitle}>{errorText}</Text>
          <Text style={styles.stateText}>Проверь подключение к Supabase и попробуй еще раз.</Text>
          <Pressable style={styles.retryButton} onPress={loadKits}>
            <Text style={styles.retryText}>Повторить</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!aptechkas.length) {
    return (
      <View style={styles.stateScreen}>
        <Text style={styles.screenTitle}>Аптечки</Text>
        <View style={styles.stateCard}>
          <Text style={styles.stateTitle}>Пока нет аптечек</Text>
          <Text style={styles.stateText}>Создай первую аптечку, и здесь появится список лекарств.</Text>
          <Pressable style={styles.retryButton} onPress={onOpenAdd}>
            <Text style={styles.retryText}>Создать аптечку</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Аптечки</Text>
          <Pressable style={styles.headerButton}>
            <Feather name="settings" size={24} color={colors.darkText} />
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Мои аптечки</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.kitsRow}
        >
          {aptechkas.map((kit, index) => {
            const active = kit.id === selectedKit;
            const meta = getKitMeta(kit, index);
            const badgeCount = active ? medicines.length : null;
            const tint = active ? '#5A82FF' : colors.darkText;

            return (
              <Pressable
                key={String(kit.id)}
                onPress={() => setSelectedKit(kit.id)}
                style={[styles.kitCard, active && styles.kitCardActive]}
              >
                {badgeCount ? (
                  <View style={styles.kitBadge}>
                    <Text style={styles.kitBadgeText}>{badgeCount}</Text>
                  </View>
                ) : null}

                <View style={styles.kitIconWrap}>{renderKitIcon(meta, tint)}</View>
                <Text style={[styles.kitLabel, active && styles.kitLabelActive]} numberOfLines={2}>
                  {kit.name}
                </Text>
              </Pressable>
            );
          })}

          <Pressable style={styles.addKitCard} onPress={onOpenAdd}>
            <Ionicons name="add" size={22} color="#CFCFCF" />
          </Pressable>
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Сортировать</Text>
          <Pressable style={styles.filterButton}>
            <Feather name="filter" size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        <FlatList
          data={medicines}
          keyExtractor={(item) => String(item.id)}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={<Text style={styles.emptyText}>В этой аптечке пока нет лекарств.</Text>}
          renderItem={({ item }) => (
            <View style={styles.medicineCard}>
              <View style={styles.medicineLeft}>
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} style={styles.medicineImage} resizeMode="contain" />
                ) : (
                  <View style={styles.imageFallback}>
                    <Text style={styles.imageFallbackText}>{item.icon || '💊'}</Text>
                  </View>
                )}

                <View style={styles.medicineCopy}>
                  <Text style={styles.medicineName} numberOfLines={1}>
                    {item.name}
                  </Text>

                  <View style={styles.metaRow}>
                    <Text style={styles.medicineDose}>{item.dose || 'Без дозировки'}</Text>
                    {item.quantity ? (
                      <>
                        <Text style={styles.metaDivider}>|</Text>
                        <View style={styles.quantityWrap}>
                          <Image source={pullIcon} style={styles.quantityIcon} resizeMode="contain" />
                          <Text style={styles.medicineQuantity}>{item.quantity} шт</Text>
                        </View>
                      </>
                    ) : null}
                  </View>
                </View>
              </View>

              <Pressable
                style={styles.editButton}
                onPress={() =>
                  setMenuMedicineId((current) => (current === item.id ? null : item.id))
                }
              >
                <Feather name="edit-2" size={20} color={colors.darkText} />
              </Pressable>

              {menuMedicineId === item.id ? (
                <View style={styles.actionMenu}>
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => {
                      setMenuMedicineId(null);
                      setEditingMedicine({
                        id: item.id,
                        name: item.name || '',
                        dose: item.dose || '',
                        quantity: String(item.quantity || 1)
                      });
                    }}
                  >
                    <Text style={styles.actionText}>Редактировать</Text>
                  </Pressable>
                  <Pressable style={styles.actionButton} onPress={() => handleDeleteMedicine(item.id)}>
                    <Text style={[styles.actionText, styles.actionDanger]}>Удалить</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          )}
        />
      </ScrollView>

      <Pressable style={styles.fab} onPress={onOpenAdd}>
        <Ionicons name="add" size={36} color="#FFFFFF" />
      </Pressable>

      {editingMedicine ? (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Редактировать лекарство</Text>

            <TextInput
              value={editingMedicine.name}
              onChangeText={(value) => setEditingMedicine((current) => ({ ...current, name: value }))}
              placeholder="Название"
              placeholderTextColor="#C8CDD9"
              style={styles.modalInput}
            />
            <TextInput
              value={editingMedicine.dose}
              onChangeText={(value) => setEditingMedicine((current) => ({ ...current, dose: value }))}
              placeholder="Дозировка"
              placeholderTextColor="#C8CDD9"
              style={styles.modalInput}
            />
            <TextInput
              value={editingMedicine.quantity}
              onChangeText={(value) => setEditingMedicine((current) => ({ ...current, quantity: value }))}
              placeholder="Количество"
              placeholderTextColor="#C8CDD9"
              keyboardType="numeric"
              style={styles.modalInput}
            />

            <Pressable style={styles.modalPrimary} onPress={handleSaveMedicine}>
              <Text style={styles.modalPrimaryText}>Сохранить</Text>
            </Pressable>
            <Pressable style={styles.modalGhost} onPress={() => setEditingMedicine(null)}>
              <Text style={styles.modalGhostText}>Отмена</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF'
  },
  stateScreen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 34
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 30,
    paddingBottom: 118
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28
  },
  screenTitle: {
    color: colors.darkText,
    fontSize: 22,
    fontWeight: '800'
  },
  headerButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  sectionTitle: {
    color: colors.darkText,
    fontSize: 18,
    fontWeight: '800'
  },
  kitsRow: {
    gap: 12,
    paddingBottom: 28
  },
  kitCard: {
    width: 104,
    height: 74,
    borderWidth: 1.5,
    borderColor: '#3F446D',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    position: 'relative'
  },
  kitCardActive: {
    borderColor: '#DCE4FF',
    backgroundColor: '#E8EDFF'
  },
  kitBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.darkText,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6
  },
  kitBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },
  kitIconWrap: {
    marginBottom: 4
  },
  kitLabel: {
    color: colors.darkText,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center'
  },
  kitLabelActive: {
    color: '#5A82FF'
  },
  addKitCard: {
    width: 74,
    height: 74,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E7E7E7',
    backgroundColor: '#FCFCFC',
    alignItems: 'center',
    justifyContent: 'center'
  },
  filterButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#58C2CE',
    alignItems: 'center',
    justifyContent: 'center'
  },
  medicineCard: {
    minHeight: 80,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D7D7D7',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  medicineLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  medicineImage: {
    width: 62,
    height: 50,
    marginRight: 10
  },
  imageFallback: {
    width: 62,
    height: 50,
    marginRight: 10,
    borderRadius: 14,
    backgroundColor: '#EEF5FB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  imageFallbackText: {
    fontSize: 22
  },
  medicineCopy: {
    flex: 1,
    gap: 4
  },
  medicineName: {
    color: colors.darkText,
    fontSize: 14,
    fontWeight: '800'
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8
  },
  medicineDose: {
    color: '#22458A',
    fontSize: 12,
    fontWeight: '500'
  },
  metaDivider: {
    color: '#64C5D6',
    fontSize: 14
  },
  medicineQuantity: {
    color: '#22458A',
    fontSize: 12,
    fontWeight: '500'
  },
  quantityWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  quantityIcon: {
    width: 14,
    height: 14,
    tintColor: colors.accent
  },
  editButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8
  },
  actionMenu: {
    position: 'absolute',
    top: 54,
    right: 8,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EF',
    paddingVertical: 6,
    minWidth: 144,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5
  },
  actionButton: {
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  actionText: {
    color: colors.darkText,
    fontSize: 14,
    fontWeight: '600'
  },
  actionDanger: {
    color: '#D24F69'
  },
  separator: {
    height: 12
  },
  emptyText: {
    paddingTop: 16,
    color: colors.darkMuted,
    textAlign: 'center',
    fontSize: 14
  },
  stateCard: {
    marginTop: 36,
    borderRadius: 24,
    backgroundColor: '#F9FAFB',
    padding: 20,
    gap: 10
  },
  stateTitle: {
    color: colors.darkText,
    fontSize: 20,
    fontWeight: '800'
  },
  stateText: {
    color: colors.darkMuted,
    fontSize: 14,
    lineHeight: 20
  },
  retryButton: {
    marginTop: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
    backgroundColor: colors.accent
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 28,
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#43C0CD',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#43C0CD',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  modalCard: {
    width: '100%',
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 18
  },
  modalTitle: {
    color: colors.darkText,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 14
  },
  modalInput: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EF',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    color: colors.darkText,
    fontSize: 15,
    marginBottom: 10
  },
  modalPrimary: {
    marginTop: 6,
    minHeight: 50,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700'
  },
  modalGhost: {
    marginTop: 10,
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: '#F3F5FA',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalGhostText: {
    color: colors.darkText,
    fontSize: 15,
    fontWeight: '600'
  }
});

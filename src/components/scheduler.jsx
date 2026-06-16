import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, FlatList, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const STORE_KEY = 'demo_schedule_v1';

export default function Scheduler() {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [aiProtect, setAiProtect] = useState(false);

  useEffect(() => {
    (async () => {
      const raw = await SecureStore.getItemAsync(STORE_KEY);
      if (raw) {
        try {
          setItems(JSON.parse(raw));
        } catch {
          setItems([]);
        }
      }
      setLoading(false);
    })();
  }, []);

  async function persist(next) {
    await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(next));
  }

  async function addItem() {
    if (!title) return;
    setActionLoading(true);
    const next = [{ id: Date.now().toString(), title: title.trim(), time: time.trim(), aiProtect }, ...items];
    setItems(next);
    await persist(next);
    setTitle('');
    setTime('');
    setAiProtect(false);
    setActionLoading(false);
  }

  async function removeItem(id) {
    setActionLoading(true);
    const next = items.filter((i) => i.id !== id);
    setItems(next);
    await persist(next);
    setActionLoading(false);
  }

  function renderItem({ item }) {
    return (
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemMeta}>{item.time} {item.aiProtect ? '- AI Protected' : ''}</Text>
        </View>
        <TouchableOpacity style={styles.smallButton} onPress={() => removeItem(item.id)} disabled={actionLoading}>
          <Text style={styles.smallButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#000" />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Schedule Ideas</Text>

      <View style={styles.formCard}>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Idea Title"
          placeholderTextColor="#666"
        />
        <TextInput
          style={styles.input}
          value={time}
          onChangeText={setTime}
          placeholder="When (e.g. 2026-06-20 09:00)"
          placeholderTextColor="#666"
        />

        <View style={styles.controlsRow}>
          <TouchableOpacity 
            style={[styles.checkbox, aiProtect && styles.checkboxActive]} 
            onPress={() => setAiProtect(!aiProtect)}
          >
            <Text style={styles.checkboxText}>{aiProtect ? 'AI Protected' : 'Add Protection'}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, actionLoading && styles.disabled]} 
            onPress={addItem} 
            disabled={actionLoading}
          >
            {actionLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.buttonText}>Schedule</Text>}
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1, marginTop: 16 }}>
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.empty}>No scheduled ideas yet</Text>}
          scrollEnabled={true}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f9f9f9' },
  heading: { fontSize: 28, fontWeight: '800', color: '#000', marginBottom: 24, letterSpacing: -0.5 },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    color: '#000',
    backgroundColor: '#fafafa',
    fontSize: 15,
    fontWeight: '500',
  },
  controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  button: {
    backgroundColor: '#000',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    flex: 0.35,
  },
  disabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  checkbox: {
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fafafa',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    borderColor: '#000',
    backgroundColor: '#fff',
  },
  checkboxText: { color: '#000', fontWeight: '600', fontSize: 13 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  itemTitle: { color: '#000', fontWeight: '700', fontSize: 15 },
  itemMeta: { color: '#666', fontSize: 13, marginTop: 4 },
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#000',
    backgroundColor: '#fff',
  },
  smallButtonText: { color: '#000', fontWeight: '600', fontSize: 12 },
  empty: { color: '#666', textAlign: 'center', marginTop: 40, fontSize: 14, fontWeight: '500' },
});

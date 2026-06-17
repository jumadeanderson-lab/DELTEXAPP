import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

const STORE_DIRECTORY = `${FileSystem.documentDirectory || ''}deltex-json-store/`;

function storageFileForKey(key: string) {
  return `${STORE_DIRECTORY}${encodeURIComponent(key)}.json`;
}

async function ensureStoreDirectory() {
  const info = await FileSystem.getInfoAsync(STORE_DIRECTORY);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(STORE_DIRECTORY, { intermediates: true });
  }
}

export async function getLocalJsonItem(key: string) {
  if (Platform.OS === 'web') {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
  }

  const fileUri = storageFileForKey(key);
  const info = await FileSystem.getInfoAsync(fileUri);
  if (!info.exists) return null;

  return FileSystem.readAsStringAsync(fileUri);
}

export async function setLocalJsonItem(key: string, value: string) {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
    return;
  }

  await ensureStoreDirectory();
  await FileSystem.writeAsStringAsync(storageFileForKey(key), value);
}

export async function removeLocalJsonItem(key: string) {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
    return;
  }

  const fileUri = storageFileForKey(key);
  const info = await FileSystem.getInfoAsync(fileUri);
  if (info.exists) {
    await FileSystem.deleteAsync(fileUri, { idempotent: true });
  }
}

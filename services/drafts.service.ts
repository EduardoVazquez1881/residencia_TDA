import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const getDraftPath = (cid: number, pid: number) => 
  `${FileSystem.documentDirectory}draft_${cid}_${pid}.json`;

export const saveDraft = async (cid: number, pid: number, data: any) => {
  try {
    const key = `draft_${cid}_${pid}`;
    if (Platform.OS === 'web') {
      window.localStorage.setItem(key, JSON.stringify(data));
    } else {
      await FileSystem.writeAsStringAsync(getDraftPath(cid, pid), JSON.stringify(data));
    }
  } catch (e) {
    console.warn("Failed to save draft", e);
  }
};

export const loadDraft = async (cid: number, pid: number) => {
  try {
    const key = `draft_${cid}_${pid}`;
    if (Platform.OS === 'web') {
      const stored = window.localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } else {
      const path = getDraftPath(cid, pid);
      const info = await FileSystem.getInfoAsync(path);
      if (info.exists) {
        const content = await FileSystem.readAsStringAsync(path);
        return JSON.parse(content);
      }
    }
  } catch (e) {
    console.warn("Failed to load draft", e);
  }
  return null;
};

export const clearDraft = async (cid: number, pid: number) => {
  try {
    const key = `draft_${cid}_${pid}`;
    if (Platform.OS === 'web') {
      window.localStorage.removeItem(key);
    } else {
      const path = getDraftPath(cid, pid);
      const info = await FileSystem.getInfoAsync(path);
      if (info.exists) await FileSystem.deleteAsync(path);
    }
  } catch (e) {}
};

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@scanned_codes';

export const saveScannedCode = async (data) => {
  try {
    const existingCodesJson = await AsyncStorage.getItem(STORAGE_KEY);
    const existingCodes = existingCodesJson ? JSON.parse(existingCodesJson) : [];
    
    // Check if we just scanned this recently (optional: prevent duplicate immediate scans)
    // Here we just save everything.
    const newCode = {
      id: Date.now().toString(),
      data: data,
      timestamp: new Date().toISOString(),
    };
    
    const updatedCodes = [newCode, ...existingCodes];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCodes));
    return newCode;
  } catch (error) {
    console.error('Error saving scanned code:', error);
    throw error;
  }
};

export const getScannedCodes = async () => {
  try {
    const codesJson = await AsyncStorage.getItem(STORAGE_KEY);
    return codesJson ? JSON.parse(codesJson) : [];
  } catch (error) {
    console.error('Error getting scanned codes:', error);
    return [];
  }
};

export const clearScannedCodes = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing scanned codes:', error);
    throw error;
  }
};

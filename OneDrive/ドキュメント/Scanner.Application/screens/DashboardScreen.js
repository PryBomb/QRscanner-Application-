import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, SafeAreaView, StatusBar, Animated } from 'react-native';
import { getScannedCodes, clearScannedCodes } from '../utils/storage';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Animated wrapper for the list items
const AnimatedItem = ({ item, index, renderContent }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100, // Staggered delay
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      {renderContent(item)}
    </Animated.View>
  );
};

export default function DashboardScreen({ navigation }) {
  const [codes, setCodes] = useState([]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadCodes();
    });
    loadCodes();
    return unsubscribe;
  }, [navigation]);

  const loadCodes = async () => {
    const savedCodes = await getScannedCodes();
    setCodes(savedCodes);
  };

  const handleClear = () => {
    Alert.alert(
      "Clear History",
      "Are you sure you want to delete all scanned codes?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            await clearScannedCodes();
            setCodes([]);
          }
        }
      ]
    );
  };

  const renderItemContent = (item) => {
    const date = new Date(item.timestamp);
    const formattedDate = date.toLocaleDateString();
    const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <LinearGradient
        colors={['#1C1C1E', '#2C2C2E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <View style={styles.timeContainer}>
            <MaterialCommunityIcons name="clock-outline" size={14} color="#8E8E93" style={styles.timeIcon} />
            <Text style={styles.timestamp}>{formattedDate} at {formattedTime}</Text>
          </View>
          <View style={styles.iconBadge}>
            <MaterialCommunityIcons name="qrcode" size={16} color="#0A84FF" />
          </View>
        </View>
        <Text style={styles.dataText} selectable={true}>{item.data}</Text>
      </LinearGradient>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Scans</Text>
        {codes.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <MaterialCommunityIcons name="trash-can-outline" size={16} color="#FF453A" style={{ marginRight: 4 }} />
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {codes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <MaterialCommunityIcons name="line-scan" size={80} color="#3A3A3C" />
          </View>
          <Text style={styles.emptyTitle}>No Scans Yet</Text>
          <Text style={styles.emptySubtitle}>Start scanning QR codes and they will be safely stored here for you.</Text>
          <TouchableOpacity 
            style={styles.scanButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#0A84FF', '#005BB5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.scanButtonGradient}
            >
              <MaterialCommunityIcons name="camera" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.scanButtonText}>Start Scanning</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={codes}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <AnimatedItem item={item} index={index} renderContent={renderItemContent} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,69,58,0.1)',
    borderRadius: 20,
  },
  clearButtonText: {
    color: '#FF453A',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIcon: {
    marginRight: 6,
  },
  timestamp: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '600',
  },
  iconBadge: {
    backgroundColor: 'rgba(10,132,255,0.15)',
    padding: 6,
    borderRadius: 10,
  },
  dataText: {
    fontSize: 17,
    color: '#FFFFFF',
    lineHeight: 24,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: -50,
  },
  emptyIconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  emptyTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  scanButton: {
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  scanButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 30,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

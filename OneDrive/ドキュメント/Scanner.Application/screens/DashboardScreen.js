import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, SafeAreaView, StatusBar, Animated } from 'react-native';
import { getScannedCodes, clearScannedCodes } from '../utils/storage';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

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

// Count-up animation for the stats number
const CountUp = ({ value }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (count === value) return;
    
    const duration = 800; // ms
    const steps = 20; 
    const stepTime = Math.abs(Math.floor(duration / steps));
    const diff = value - count;
    const increment = diff / steps;
    
    let current = count;
    const timer = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= value) || (increment < 0 && current <= value)) {
        clearInterval(timer);
        setCount(value);
      } else {
        setCount(Math.round(current));
      }
    }, stepTime);
    
    return () => clearInterval(timer);
  }, [value, count]);

  return <Text style={styles.statsNumber}>{count}</Text>;
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
      <View style={styles.cardContainer}>
        <BlurView intensity={20} tint="light" style={styles.cardBlur}>
          <View style={styles.cardHeader}>
            <View style={styles.timeContainer}>
              <MaterialCommunityIcons name="clock-outline" size={14} color="#A1A1A6" style={styles.timeIcon} />
              <Text style={styles.timestamp}>{formattedDate} • {formattedTime}</Text>
            </View>
            <View style={styles.iconBadge}>
              <MaterialCommunityIcons name="qrcode" size={16} color="#0A84FF" />
            </View>
          </View>
          <Text style={styles.dataText} selectable={true}>{item.data}</Text>
        </BlurView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header and Stats Card */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTop}>
            <Text style={styles.title}>Dashboard</Text>
            {codes.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
                <MaterialCommunityIcons name="trash-can-outline" size={16} color="#FF453A" style={{ marginRight: 4 }} />
                <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
            )}
        </View>

        <View style={styles.statsCardWrapper}>
            <LinearGradient
                colors={['rgba(10,132,255,0.2)', 'rgba(0,91,181,0.1)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
            />
            <BlurView intensity={50} tint="dark" style={styles.statsCardBlur}>
                <View style={styles.statsContent}>
                    <View>
                        <Text style={styles.statsLabel}>Total Unique Scans</Text>
                        <CountUp value={codes.length} />
                    </View>
                    <View style={styles.statsIconContainer}>
                        <MaterialCommunityIcons name="chart-bar" size={32} color="#0A84FF" />
                    </View>
                </View>
            </BlurView>
        </View>
      </View>

      {codes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <MaterialCommunityIcons name="line-scan" size={80} color="rgba(255,255,255,0.1)" />
          </View>
          <Text style={styles.emptyTitle}>No Scans Yet</Text>
          <Text style={styles.emptySubtitle}>Start scanning QR codes to track your assets. They will appear right here.</Text>
          <TouchableOpacity 
            style={styles.scanButton}
            onPress={() => navigation.navigate('Scanner')}
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
    backgroundColor: '#0F0F13', // Slightly lighter black for better contrast with blur
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
  statsCardWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statsCardBlur: {
    padding: 24,
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsLabel: {
    fontSize: 15,
    color: '#A1A1A6',
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  statsNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statsIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(10,132,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  cardContainer: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardBlur: {
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.02)', // Subtle fill
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
    color: '#A1A1A6',
    fontWeight: '500',
  },
  iconBadge: {
    backgroundColor: 'rgba(10,132,255,0.1)',
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
    marginTop: -20,
  },
  emptyIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.02)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#A1A1A6',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  scanButton: {
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
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

import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, SafeAreaView, Dimensions, Animated, Easing } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { saveScannedCode } from '../utils/storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const boxSize = width * 0.7;

export default function ScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  // Animation values
  const lineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Reset scanned state when returning to this screen
    const unsubscribe = navigation.addListener('focus', () => {
      setScanned(false);
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (!scanned && permission && permission.granted) {
      startAnimations();
    } else {
      stopAnimations();
    }
  }, [scanned, permission]);

  const startAnimations = () => {
    // Laser line animation (moving up and down)
    Animated.loop(
      Animated.sequence([
        Animated.timing(lineAnim, {
          toValue: boxSize - 4,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(lineAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    ).start();

    // Pulse animation for corners
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    ).start();
  };

  const stopAnimations = () => {
    lineAnim.stopAnimation();
    pulseAnim.stopAnimation();
    lineAnim.setValue(0);
    pulseAnim.setValue(1);
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <MaterialCommunityIcons name="camera-outline" size={64} color="#0A84FF" style={{ marginBottom: 20 }} />
          <Text style={styles.title}>Camera Access Needed</Text>
          <Text style={styles.subtitle}>We need your permission to show the camera and scan QR codes.</Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleBarcodeScanned = async ({ type, data }) => {
    if (scanned) return;
    setScanned(true);
    
    try {
      await saveScannedCode(data);
      Alert.alert(
        "Code Scanned!",
        `Data: ${data}`,
        [
          { text: "Scan Another", onPress: () => setScanned(false) },
          { text: "View Dashboard", onPress: () => navigation.navigate('Dashboard') }
        ]
      );
    } catch (e) {
      Alert.alert("Error", "Failed to save scanned code.");
      setScanned(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView 
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Scan QR Code</Text>
            <Text style={styles.headerSubtext}>Align the QR code within the frame</Text>
          </View>
          
          <View style={styles.scanArea}>
            <Animated.View style={[styles.targetBox, { transform: [{ scale: pulseAnim }] }]}>
              {/* Corners */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              
              {/* Laser Line */}
              {!scanned && (
                <Animated.View 
                  style={[
                    styles.laserLine, 
                    { transform: [{ translateY: lineAnim }] }
                  ]} 
                />
              )}
            </Animated.View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.dashboardButton} 
              onPress={() => navigation.navigate('Dashboard')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="view-dashboard" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.dashboardButtonText}>View Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#0F0F13',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#0A84FF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'space-between',
  },
  header: {
    paddingTop: 80,
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  headerSubtext: {
    color: '#E5E5EA',
    fontSize: 15,
    fontWeight: '500',
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetBox: {
    width: boxSize,
    height: boxSize,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderColor: '#0A84FF',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 5,
    borderLeftWidth: 5,
    borderTopLeftRadius: 24,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 5,
    borderRightWidth: 5,
    borderTopRightRadius: 24,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 5,
    borderLeftWidth: 5,
    borderBottomLeftRadius: 24,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 5,
    borderRightWidth: 5,
    borderBottomRightRadius: 24,
  },
  laserLine: {
    width: '100%',
    height: 4,
    backgroundColor: '#0A84FF',
    position: 'absolute',
    top: 0,
    left: 0,
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
    borderRadius: 2,
  },
  footer: {
    padding: 50,
    alignItems: 'center',
  },
  dashboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  buttonIcon: {
    marginRight: 10,
  },
  dashboardButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

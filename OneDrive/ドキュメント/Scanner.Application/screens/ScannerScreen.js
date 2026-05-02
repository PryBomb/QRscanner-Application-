import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Dimensions, Animated, Easing } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { saveScannedCode } from '../utils/storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const boxSize = width * 0.7;

export default function ScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState] = useState('idle'); // 'idle', 'success', 'duplicate', 'error'
  
  // Throttle refs to prevent lag
  const isProcessing = useRef(false);
  const lastScannedRef = useRef(null);
  
  // Animation values
  const lineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const toastSlideAnim = useRef(new Animated.Value(-150)).current; // Slide down from top

  useEffect(() => {
    // Reset state when returning to this screen
    const unsubscribe = navigation.addListener('focus', () => {
      resetScanner();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (scanState === 'idle' && permission && permission.granted) {
      startAnimations();
    } else {
      stopAnimations();
    }
  }, [scanState, permission]);

  const resetScanner = () => {
    setScanState('idle');
    lastScannedRef.current = null;
    isProcessing.current = false;
    Animated.timing(toastSlideAnim, {
      toValue: -150, // Hide toast
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const showToast = () => {
    Animated.timing(toastSlideAnim, {
      toValue: 60, // Show toast (pixels from top)
      duration: 400,
      easing: Easing.out(Easing.back(1.5)),
      useNativeDriver: true,
    }).start();
  };

  const startAnimations = () => {
    // Laser line animation
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

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
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
    if (isProcessing.current || scanState !== 'idle') return;
    
    // Throttling to prevent rapid-fire scanning of the same duplicate code
    if (lastScannedRef.current === data) return;
    
    isProcessing.current = true;
    lastScannedRef.current = data;
    
    try {
      await saveScannedCode(data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScanState('success');
      showToast();
      
      // Auto transition to dashboard on success
      setTimeout(() => {
         navigation.navigate('Dashboard');
      }, 1500);

    } catch (e) {
      if (e.code === 'DUPLICATE_CODE') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setScanState('duplicate');
        showToast();
        
        // Auto-resume after 2 seconds for duplicates
        setTimeout(() => {
           resetScanner();
        }, 2000);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setScanState('error');
        showToast();
        
        // Auto-resume after 2 seconds for errors
        setTimeout(() => {
           resetScanner();
        }, 2000);
      }
    }
  };

  // Determine viewfinder color based on state
  const getBorderColor = () => {
    if (scanState === 'success') return '#34C759'; // Green
    if (scanState === 'duplicate' || scanState === 'error') return '#FF3B30'; // Red
    return '#0A84FF'; // Blue (Idle)
  };

  const borderColor = getBorderColor();

  const renderToast = () => {
    const isSuccess = scanState === 'success';
    const isDuplicate = scanState === 'duplicate';
    const isError = scanState === 'error';
    
    if (scanState === 'idle') return null;

    const iconName = isSuccess ? 'check-circle' : isDuplicate ? 'alert-circle' : 'close-circle';
    const iconColor = isSuccess ? '#34C759' : isDuplicate ? '#FF9F0A' : '#FF3B30';
    const titleText = isSuccess ? 'Success' : isDuplicate ? 'Already Scanned' : 'Error';
    const subtitleText = isSuccess ? 'Code captured successfully' : isDuplicate ? 'This code has already been processed' : 'Failed to save code';

    return (
      <Animated.View style={[styles.toastContainer, { transform: [{ translateY: toastSlideAnim }] }]} pointerEvents="none">
        <BlurView intensity={70} tint="dark" style={styles.toastBlur}>
          <View style={styles.toastContent}>
             <MaterialCommunityIcons name={iconName} size={28} color={iconColor} style={styles.toastIcon} />
             <View style={styles.toastTextContainer}>
                <Text style={styles.toastTitle}>{titleText}</Text>
                <Text style={styles.toastSubtitle}>{subtitleText}</Text>
             </View>
          </View>
        </BlurView>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <CameraView 
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      />
      
      {/* Overlays must be outside CameraView to prevent crashes */}
      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.header}>
          <Text style={styles.headerText}>Scan QR Code</Text>
          <Text style={styles.headerSubtext}>Align the QR code within the frame</Text>
        </View>
        
        <View style={styles.scanArea} pointerEvents="none">
          <Animated.View style={[styles.targetBox, { transform: [{ scale: pulseAnim }] }]}>
            {/* Corners with dynamic color */}
            <View style={[styles.corner, styles.topLeft, { borderColor }]} />
            <View style={[styles.corner, styles.topRight, { borderColor }]} />
            <View style={[styles.corner, styles.bottomLeft, { borderColor }]} />
            <View style={[styles.corner, styles.bottomRight, { borderColor }]} />
            
            {/* Laser Line */}
            {scanState === 'idle' && (
              <Animated.View 
                style={[
                  styles.laserLine, 
                  { transform: [{ translateY: lineAnim }] }
                ]} 
              />
            )}
            
            {/* Glow effect on success/error/duplicate */}
            {(scanState === 'success' || scanState === 'duplicate' || scanState === 'error') && (
              <View style={[styles.glowBox, { backgroundColor: borderColor }]} />
            )}
          </Animated.View>
        </View>

        <View style={styles.footer} pointerEvents="box-none">
          <TouchableOpacity 
            style={styles.dashboardButton} 
            onPress={() => navigation.navigate('Dashboard')}
            activeOpacity={0.8}
          >
            <BlurView intensity={40} tint="dark" style={styles.dashboardBlurButton}>
              <MaterialCommunityIcons name="view-dashboard" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.dashboardButtonText}>View Dashboard</Text>
            </BlurView>
          </TouchableOpacity>
        </View>
      </View>

      {renderToast()}
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
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
  glowBox: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    opacity: 0.2, // Soft glow
  },
  footer: {
    padding: 50,
    alignItems: 'center',
  },
  dashboardButton: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  dashboardBlurButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
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
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  toastBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toastIcon: {
    marginRight: 12,
  },
  toastTextContainer: {
    flexDirection: 'column',
  },
  toastTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  toastSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '500',
  },
});

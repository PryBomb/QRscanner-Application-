import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ScannerScreen from './screens/ScannerScreen';
import DashboardScreen from './screens/DashboardScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Scanner"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#0F0F13',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            headerBackTitleVisible: false,
          }}
        >
          <Stack.Screen 
            name="Scanner" 
            component={ScannerScreen} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="Dashboard" 
            component={DashboardScreen} 
            options={{ 
              title: 'Scanned Codes',
              headerShown: true,
              headerStyle: { backgroundColor: '#0F0F13' },
              headerShadowVisible: false, // Removes the border on iOS
            }} 
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

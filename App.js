import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ChoiceScreen } from './src/screens/ChoiceScreen';
import { DriverScreen } from './src/screens/DriverScreen';
import { ValidatorScreen } from './src/screens/ValidatorScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Choice"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#f4511e',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Choice" 
          component={ChoiceScreen} 
          options={{ title: 'Sélection du Mode' }}
        />
        <Stack.Screen 
          name="Driver" 
          component={DriverScreen} 
          options={{ title: 'Mode Conducteur' }}
        />
        <Stack.Screen 
          name="Validator" 
          component={ValidatorScreen} 
          options={{ title: 'Mode Validateur' }}
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen} 
          options={{ title: 'Paramètres' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}


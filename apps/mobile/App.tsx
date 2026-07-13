import 'react-native-gesture-handler';

import { StatusBar } from 'expo-status-bar';

import { AppDataProvider } from './src/hooks/useAppData';
import { AuthProvider } from './src/hooks/useAuth';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <StatusBar style="dark" />
        <AppNavigator />
      </AppDataProvider>
    </AuthProvider>
  );
}

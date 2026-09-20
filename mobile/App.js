import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ConfigProvider } from './src/context/ConfigContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AuthStack from './src/navigation/AuthStack';
import RootNavigator from './src/navigation/RootNavigator';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5000,
    },
  },
});

function Routes() {
  const { isAuthenticated, isRestoring } = useAuth();

  if (isRestoring) return null;

  return isAuthenticated ? <RootNavigator /> : <AuthStack />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider>
          <AuthProvider>
            <NavigationContainer>
              <Routes />
              <StatusBar style="auto" />
            </NavigationContainer>
          </AuthProvider>
        </ConfigProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import DashboardStack from './DashboardStack';
import GlucoseStack from './GlucoseStack';
import DeliveryStack from './DeliveryStack';
import SettingsStack from './SettingsStack';

const Tab = createBottomTabNavigator();

const ICONS = {
  Dashboard: 'home-outline',
  Glucose: 'pulse-outline',
  Delivery: 'water-outline',
  Settings: 'settings-outline',
};

export default function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONS[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStack} />
      <Tab.Screen name="Glucose" component={GlucoseStack} />
      <Tab.Screen name="Delivery" component={DeliveryStack} />
      <Tab.Screen name="Settings" component={SettingsStack} />
    </Tab.Navigator>
  );
}

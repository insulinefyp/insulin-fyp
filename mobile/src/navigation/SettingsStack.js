import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import ProfileHistoryScreen from '../screens/profile/ProfileHistoryScreen';
import TreatmentScreen from '../screens/treatment/TreatmentScreen';
import EditTreatmentScreen from '../screens/treatment/EditTreatmentScreen';
import TreatmentHistoryScreen from '../screens/treatment/TreatmentHistoryScreen';

const Stack = createNativeStackNavigator();

export default function SettingsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SettingsHome"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Patient profile' }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Edit profile' }}
      />
      <Stack.Screen
        name="ProfileHistory"
        component={ProfileHistoryScreen}
        options={{ title: 'Change history' }}
      />
      <Stack.Screen
        name="Treatment"
        component={TreatmentScreen}
        options={{ title: 'Treatment parameters' }}
      />
      <Stack.Screen
        name="EditTreatment"
        component={EditTreatmentScreen}
        options={{ title: 'Edit parameters' }}
      />
      <Stack.Screen
        name="TreatmentHistory"
        component={TreatmentHistoryScreen}
        options={{ title: 'Version history' }}
      />
    </Stack.Navigator>
  );
}

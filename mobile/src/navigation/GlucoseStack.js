import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GlucoseScreen from '../screens/GlucoseScreen';

const Stack = createNativeStackNavigator();

export default function GlucoseStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="GlucoseHome"
        component={GlucoseScreen}
        options={{ title: 'Glucose' }}
      />
    </Stack.Navigator>
  );
}

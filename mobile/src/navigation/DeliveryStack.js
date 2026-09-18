import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DeliveryScreen from '../screens/DeliveryScreen';

const Stack = createNativeStackNavigator();

export default function DeliveryStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="DeliveryHome"
        component={DeliveryScreen}
        options={{ title: 'Delivery' }}
      />
    </Stack.Navigator>
  );
}

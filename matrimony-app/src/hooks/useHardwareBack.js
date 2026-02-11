import { useEffect } from 'react';
import { BackHandler, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const useHardwareBack = () => {
  const navigation = useNavigation();
  const route = useRoute();

  useEffect(() => {
    const backAction = () => {
      // Screens where we don't want to go back (to prevent accidental exit)
      if (route.name === 'Dashboard' || route.name === 'Login' || route.name === 'AdminDashboard') {
        Alert.alert('Exit App', 'Are you sure you want to exit the app?', [
          { text: 'Cancel', onPress: () => null, style: 'cancel' },
          { text: 'YES', onPress: () => BackHandler.exitApp() }
        ]);
        return true;
      }

      if (navigation.canGoBack()) {
        navigation.goBack();
        return true;
      }

      return false; // Let the default behavior happen
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [navigation, route]);
};

export default useHardwareBack;

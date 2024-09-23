import React, {  useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import {Alert, PermissionsAndroid} from 'react-native';
import { Linking, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './src/modules/homeScreen';
import TransactionScreen from './src/modules/transactionScreen';
import PushNotification from 'react-native-push-notification';

const Stack = createStackNavigator();
const NAVIGATION_IDS = ['home', 'transaction'];

function buildDeepLinkFromNotificationData(data:any): string | null {
  const navigationId = data?.navigationId;
  if (!NAVIGATION_IDS.includes(navigationId)) {
    console.warn('Unverified navigationId', navigationId);
    return 'com.fcmproject://';
  }
  if (navigationId === 'home') {
    return 'com.fcmproject://home';
  }
  if (navigationId === 'transaction') {
    return 'com.fcmproject://transaction';
  }

  return null;
}



const linking = {
  prefixes: ['com.fcmproject://'],
  config: {
    screens: {
      Home: 'home',
      Transaction: 'transaction',
    },
  },
  async getInitialURL() {
    const url = await Linking.getInitialURL();
    if (typeof url === 'string') {
      return url;
    }
    //getInitialNotification: When the application is opened from a quit state.
    const message = await messaging().getInitialNotification();
    const deeplinkURL = buildDeepLinkFromNotificationData(message?.data);
    if (typeof deeplinkURL === 'string') {
      return deeplinkURL;
    }
  },
  subscribe(listener: (url: string) => void) {
    const onReceiveURL = ({url}: {url: string}) => listener(url);

    // Listen to incoming links from deep linking
    const linkingSubscription = Linking.addEventListener('url', onReceiveURL);
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Message handled in the background!', remoteMessage);

    });

    const foreground = messaging().onMessage(async remoteMessage => {
      console.log('A new FCM message arrived!', remoteMessage);
      const title = remoteMessage.notification?.title ?? 'title not found';
      const body = remoteMessage.notification?.body ?? 'body not found';
      Alert.alert(title, body, [
        {text: 'OK'},
      ]);

    });
    //onNotificationOpenedApp: When the application is running, but in the background.
    const unsubscribe = messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('A new FCM message arrived application is running, but in the background!', remoteMessage);
      const url = buildDeepLinkFromNotificationData(remoteMessage.data);

      if (typeof url === 'string') {
        listener(url);
      }
    });

    return () => {
      linkingSubscription.remove();
      unsubscribe();
      foreground();
    };
  },
};



function App(): React.JSX.Element {

  const requestUserPermission = async () => {
  PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);

  const authStatus = await messaging().requestPermission();
   const enabled =
     authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
     authStatus === messaging.AuthorizationStatus.PROVISIONAL;

   if (enabled) {
     console.log('Authorization status:', authStatus);
     const token = await messaging().getToken();
     console.log('FCM token:', token);
   }
 };



   useEffect(()=>{
    PushNotification.createChannel(
      {
        channelId: 'channel_id', // Must match the ID in strings.xml
        channelName: 'Default Channel', // User-visible name
        importance: 4, // High importance
      },
      (created:any) => console.log(`createChannel returned '${created}'`)
    );
   requestUserPermission();
   },[]);

  return (
    <NavigationContainer linking={linking} fallback={<ActivityIndicator animating />}>
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Transaction" component={TransactionScreen} />
    </Stack.Navigator>
  </NavigationContainer>
  );
}


export default App;

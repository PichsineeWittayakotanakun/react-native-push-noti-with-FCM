import { View, Text, TextInput } from 'react-native';
import React, { useEffect, useState } from 'react';
import messaging from '@react-native-firebase/messaging';

const HomeScreen = () => {
  const [ token , setToken] = useState('');
  const getToken = async ()=>{
    const msgToken = await messaging().getToken();
    setToken(msgToken);
  };

  useEffect(()=>{
    getToken();
  },[]);


  return (
    <View>
      <Text>homeScreen</Text>
      <TextInput value={token} multiline/>
    </View>
  );
};

export default HomeScreen;

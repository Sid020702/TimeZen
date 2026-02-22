/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import "../global.css"
import React from 'react';
import {
  StatusBar,
} from 'react-native';
import AppNavigation from './navigation/AppNavigator';
import { View } from "react-native";





function App(): React.JSX.Element {
  return (
    <View className='flex-1 bg-black'>
      <StatusBar barStyle="light-content" />
      <AppNavigation />
    </View>
  )
}



export default App;

import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { AppRegistry } from 'react-native';
import { Provider } from 'react-redux';
import './polyfills';
import AppNavigator from './src/navigation/AppNavigator';
import { store } from './src/store';

function App() {
  return (
    <Provider store={store}>
      <StatusBar style="auto" />
      <AppNavigator />
    </Provider>
  );
}

AppRegistry.registerComponent('main', () => App);

export default App;

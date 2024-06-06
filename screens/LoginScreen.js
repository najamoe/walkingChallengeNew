import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert, Image } from 'react-native';
import { auth } from '../firebase/FirebaseConfig'; 
import { signInWithEmailAndPassword } from 'firebase/auth';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    setLoading(true);

    signInWithEmailAndPassword(auth, email, password) 
      .then(userCredential => {
        setLoading(false);
        navigation.navigate('Home');
      })
      .catch(error => {
        setLoading(false);
        Alert.alert('Login Error', error.message);
        console.error(error);
      });
  };

  return (  
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={require('../assets/JourneyWalker.png')} style={styles.logo} />
      </View>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />
      <Button title={loading ? "Logging in..." : "Login"} onPress={handleLogin} disabled={loading} color="#1d7334" />
      <Text style={styles.registerText} onPress={() => navigation.navigate('Register')}>
        Don't have an account? Register
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9f5db',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  registerText: {
    marginTop: 12,
    color: 'blue',
    textAlign: 'center',
  },
  logoContainer: {
    alignItems: 'center', 
    overflow: 'hidden', 
    borderRadius: 10, 
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: 'cover', 
  },
});

export default LoginScreen;

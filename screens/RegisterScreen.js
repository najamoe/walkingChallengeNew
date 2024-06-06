import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert } from 'react-native';
import { firebaseAuth } from '../firebase/FirebaseConfig'; 
import { createUserWithEmailAndPassword } from 'firebase/auth'; 
import Icon from 'react-native-vector-icons/FontAwesome';

const RegisterScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [passwordError, setPasswordError] = useState(null);
    const [secureTextEntry, setSecureTextEntry] = useState(true);

    const toggleSecureTextEntry = () => {
        setSecureTextEntry(prevState => !prevState);
    };

    const handleRegister = () => {
        if (!email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill out all fields.');
            return;
        }

        if (password !== confirmPassword) {
            setPasswordError('Passwords do not match.');
            return;
        }

        if (password.length < 6) {
            setPasswordError('Password must be at least 6 characters long.');
            return;
        }

        setLoading(true);

        createUserWithEmailAndPassword(firebaseAuth, email, password) 
            .then(userCredential => {
                setLoading(false);
                Alert.alert('Success', 'Registration successful. You can now login.');
                navigation.navigate('Login');
            })
            .catch(error => {
                setLoading(false);
                Alert.alert('Registration Error', error.message);
                console.error(error);
            });
    };

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />
            <View style={styles.passwordInputContainer}>
                <TextInput
                    style={[styles.passwordInput, passwordError && { borderColor: 'red' }]}
                    placeholder="Password"
                    value={password}
                    onChangeText={text => {
                        setPassword(text);
                        if (passwordError) {
                            setPasswordError(null);
                        }
                    }}
                    secureTextEntry={secureTextEntry}
                    autoCapitalize="none"
                />
                <Icon
                    name={secureTextEntry ? 'eye-slash' : 'eye'}
                    size={24}
                    color="black"
                    onPress={toggleSecureTextEntry}
                />
            </View>
            {passwordError && <Text style={styles.errorText}>{passwordError}</Text>}
            <TextInput
                style={[styles.input, passwordError && { borderColor: 'red' }]}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={text => {
                    setConfirmPassword(text);
                    if (passwordError) {
                        setPasswordError(null);
                    }
                }}
                secureTextEntry={secureTextEntry}
                autoCapitalize="none"
            />
            <Button title={loading ? "Registering..." : "Register"} onPress={handleRegister} disabled={loading} />
            <Text style={styles.loginText} onPress={() => navigation.navigate('Login')}>
                Already have an account? Login
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
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
    passwordInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 12,
        paddingHorizontal: 8,
    },
    passwordInput: {
        flex: 1,
        height: 40,
        paddingHorizontal: 8,
    },
    loginText: {
        marginTop: 12,
        color: 'blue',
        textAlign: 'center',
    },
    errorText: {
        color: 'red',
        marginBottom: 8,
        paddingHorizontal: 8,
    },
});

export default RegisterScreen;

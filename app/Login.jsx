import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { useState } from 'react';
import {
  Alert,
  Button,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth } from '../firebase';


export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
  
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      // Save user data to AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify({
        uid: user.uid,
        email: user.email,
        accessToken: user.accessToken, // can be used for future API access if needed
      }));
  
      console.log("User logged in:", user.email);
      router.replace("/(auth)/Home");
  
    } catch (error) {
      console.error("Login error:", error.message);
      Alert.alert('Login Failed', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }
  

  function handleForgotPassword(){

      console.log(!email);
      

    
    if (!email) {
      Alert.prompt(
        'Reset Password',
        'Enter your email address',
        async (inputEmail) => {
          if (inputEmail) {
            try {
              await sendPasswordResetEmail(auth, inputEmail);
              Alert.alert('Success', 'Password reset email sent');
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          }
        },
        'plain-text',
        '',
        'email-address'
      );
    } else {
      console.log(email);
      
      sendPasswordResetEmail(auth, email)
        .then(() => {
          Alert.alert('Success', 'Password reset email sent');
        })
        .catch((error) => {
          Alert.alert('Error', error.message);
        });
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Login</Text>
      
      <Text>Email</Text>
      <TextInput
        placeholder="Enter email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text>Password</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Enter password"
          value={password}
          onChangeText={setPassword}
          style={styles.passwordInput}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons
            name={showPassword ? 'eye' : 'eye-off'}
            size={24}
            color="gray"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={handleForgotPassword}>
        <Text style={styles.forgotPasswordText}>Forgot Password??</Text>
      </TouchableOpacity>

      <Button title={loading ? "Logging in..." : "Submit"} onPress={handleLogin} disabled={loading} />
      
      <Pressable onPress={() => router.push("/SignUp")}>
        <Text style={{ marginTop: 12, color: 'blue' }}>
          Don't have an Account? Sign Up
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
  },
  heading: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 10,
    marginBottom: 5,
    borderRadius: 5,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 10,
  },
  forgotPasswordText: {
    color: 'blue',
    marginBottom: 15,
    textAlign: 'right',
  },
});

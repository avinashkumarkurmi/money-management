import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { Button, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { auth } from '../../firebase';

export default function Profile() {
  const router = useRouter();
  const handleLogout = async () => {
    try {
      // Sign out from Firebase
      await signOut(auth);

      // Remove user data from AsyncStorage
      await AsyncStorage.removeItem('user');

      // Redirect to Login screen
      router.replace('/Login');
    } catch (error) {
      console.error('Logout error:', error.message);
    }
  };
  return (


    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View><Text>Hello form Profile screen</Text>
          <Button title="Logout" onPress={handleLogout} />
        </View>
      </View>
    </SafeAreaView>
  );
}



const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 10, // 👈 adds space inside the screen
    paddingTop: 36,
},
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
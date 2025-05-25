import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  signOut,
  updateEmail,
  updatePassword,
} from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { auth, db } from '../../firebase';

export default function Profile() {
  const router = useRouter();
  const [profile, setProfile] = useState({ username: '', email: '' });
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [showReauthModal, setShowReauthModal] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const userData = await getUserProfile();
      if (userData) {
        setProfile(userData);
      }
    };
    fetchProfile();
  }, []);

  const getUserProfile = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return null;

      const userDocRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        return {
          username: data.username || '',
          email: data.email || '',
        };
      } else {
        console.warn('No user document found');
        return null;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem('user');
      router.replace('/Login');
    } catch (error) {
      console.error('Logout error:', error.message);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      const uid = auth.currentUser?.uid;
      const userRef = doc(db, 'users', uid);

      // Update Firestore
      await updateDoc(userRef, {
        username: profile.username,
        email: profile.email,
      });

      // Update Auth email
      if (auth.currentUser.email !== profile.email) {
        await updateEmail(auth.currentUser, profile.email);
      }

      Alert.alert('Success', 'Profile updated');
      setEditing(false);
    } catch (error) {
      console.error('Profile update error:', error.message);
      Alert.alert('Error', error.message);
    }
  };

  const handleChangePassword = () => {
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password should be at least 6 characters');
      return;
    }
    setShowReauthModal(true);
  };

  const handleReauthenticateAndChangePassword = async () => {
    const user = auth.currentUser;

    
  
    if (!user || !user.email) {
      Alert.alert('Error', 'User not found');
      return;
    }
  
    console.log('Reauth attempt for:', user.email);
    console.log('Password entered:', currentPassword);
  
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
  
    try {
      console.log(credential);
      
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
  
      Alert.alert('Success', 'Password updated successfully');
      setShowReauthModal(false);
      setChangingPassword(false);
      setNewPassword('');
      setCurrentPassword('');
    } catch (error) {
      console.error('Reauthentication or password update error:', error.message);
      Alert.alert('Error', error.message);
    }
  };
  
//   function handleForgotPassword(){

//     console.log(!email);
    

  
//   if (!email) {
//     Alert.prompt(
//       'Reset Password',
//       'Enter your email address',
//       async (inputEmail) => {
//         if (inputEmail) {
//           try {
//             await sendPasswordResetEmail(auth, inputEmail);
//             Alert.alert('Success', 'Password reset email sent');
//           } catch (error) {
//             Alert.alert('Error', error.message);
//           }
//         }
//       },
//       'plain-text',
//       '',
//       'email-address'
//     );
//   } else {
//     console.log(email);
    
//     sendPasswordResetEmail(auth, email)
//       .then(() => {
//         Alert.alert('Success', 'Password reset email sent');
//       })
//       .catch((error) => {
//         Alert.alert('Error', error.message);
//       });
//   }
// }

  return (
    <SafeAreaView style={styles.safeArea}>
     
      <View style={styles.container}>
        <View style={styles.profileCard}>
          <Image
            source={{ uri: 'https://i.pravatar.cc/150?img=12' }}
            style={styles.avatar}
          />
          {!editing ? (
            <>
              <Text style={styles.name}>{profile.username}</Text>
              <Text style={styles.email}>{profile.email}</Text>
            </>
          ) : (
            <>
              <TextInput
                value={profile.username}
                onChangeText={(text) => setProfile({ ...profile, username: text })}
                placeholder="Username"
                style={styles.input}
              />
              <TextInput
                value={profile.email}
                onChangeText={(text) => setProfile({ ...profile, email: text })}
                placeholder="Email"
                keyboardType="email-address"
                style={styles.input}
              />
              <Pressable style={styles.saveButton} onPress={handleProfileUpdate}>
                <Text style={styles.saveButtonText}>Save Profile</Text>
              </Pressable>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <Pressable style={styles.menuItem} onPress={() => setEditing(!editing)}>
            <Text style={styles.menuText}>{editing ? 'Cancel Edit' : 'Edit Profile'}</Text>
          </Pressable>
          <Pressable
            style={styles.menuItem}
            onPress={() => setChangingPassword(!changingPassword)}
          >
            <Text style={styles.menuText}>
              {changingPassword ? 'Cancel Password Change' : 'Change Password'}
            </Text>
          </Pressable>
        </View>

        {changingPassword && (
          <KeyboardAvoidingView>
          <View style={styles.section}>
            <TextInput
              placeholder="New Password"
              secureTextEntry
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <Pressable style={styles.saveButton} onPress={handleChangePassword}>
              <Text style={styles.saveButtonText}>Update Password</Text>
            </Pressable>
          </View>
          </KeyboardAvoidingView>
        )}

        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>

        {/* Reauthentication Modal */}
        <Modal
          visible={showReauthModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowReauthModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Re-authentication Required</Text>
              <TextInput
                placeholder="Current Password"
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
                style={styles.input}
              />
              <Pressable style={styles.saveButton} onPress={handleReauthenticateAndChangePassword}>
                <Text style={styles.saveButtonText}>Confirm</Text>
              </Pressable>
              <Pressable
                style={[styles.saveButton, { backgroundColor: '#ccc', marginTop: 10 }]}
                onPress={() => setShowReauthModal(false)}
              >
                <Text style={[styles.saveButtonText, { color: '#333' }]}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f6f7fb',
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 35,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginTop: 30,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
    marginBottom: 12,
  },
  menuItem: {
    paddingVertical: 12,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  menuText: {
    fontSize: 15,
    color: '#333',
  },
  logoutButton: {
    marginTop: 40,
    backgroundColor: '#ff4d4f',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    width: '100%',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 10,
    marginVertical: 8,
  },
  saveButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000aa',
  },
  modalContainer: {
    width: 300,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
});

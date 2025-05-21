import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function Transcations() {
    return(
        <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View><Text>Hello form Transactions screen</Text></View>
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
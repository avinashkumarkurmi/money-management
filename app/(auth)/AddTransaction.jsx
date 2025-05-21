import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from "@react-native-picker/picker";
import { addDoc, collection, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { useState } from "react";
import { Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Colors from "../../constants/Colors";
import { db } from '../../firebase'; // adjust path as needed


export default function AddTransaction() {
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("Food");
    const [type, setType] = useState("expense");
    const expenseCategories = ["Food", "Transport", "Shopping", "Entertainment", "Others"];
    const incomeCategories = ["Salary", "Bonus", "Investment", "Others"];


    const handleAddTrans = async () => {
        if (!title || !amount) {
            Alert.alert("Detail Unfilled", "Please fill all the deatils")
            return;
        }
        try {
            // Get current user from AsyncStorage
            const userJson = await AsyncStorage.getItem('user');
            const user = JSON.parse(userJson);

            if (!user?.uid) throw new Error('User not authenticated');

            // Reference to user's transactions subcollection
            const userTransactionsRef = collection(db, 'users', user.uid, 'transactions');

            // Add a new transaction document
            await addDoc(userTransactionsRef, {
                title: title,
                amount: parseInt(amount),
                category: category,
                type: type,
                date: serverTimestamp(),
            });

            console.log("Transaction added!");
            setTitle("");
            setAmount("");
            // setCategory("Food");
            // setType("expense");

            console.log(await fetchUserTransactions())
        } catch (error) {
            console.error("Error adding transaction:", error.message);
        }



    }


    async function fetchUserTransactions() {
        try {
            const userJson = await AsyncStorage.getItem('user');
            const user = JSON.parse(userJson);

            if (!user?.uid) throw new Error('User not authenticated');

            // Reference to user's transactions
            const userTransactionsRef = collection(db, 'users', user.uid, 'transactions');

            // Optional: order by timestamp descending
            const q = query(userTransactionsRef, orderBy('date', 'desc'));

            const querySnapshot = await getDocs(q);

            const transactions = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return transactions;
        } catch (error) {
            console.error("Error fetching transactions:", error.message);
            return [];
        }
    }


    const handleTransactionType = (selectedType) => {
        setType(selectedType);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.heading}>Add Transaction</Text>

                {/* Transaction Type */}
                <View style={styles.typeContainer}>
                    <TouchableOpacity
                        style={[styles.typeButton, type === "expense" && styles.selectedExpense]}
                        onPress={() => handleTransactionType("expense")}
                    >
                        <Text style={styles.typeText}>Expense</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.typeButton, type === "income" && styles.selectedIncome]}
                        onPress={() => handleTransactionType("income")}
                    >
                        <Text style={styles.typeText}>Income</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.label}>Title</Text>
                <TextInput
                    placeholder="e.g., Grocery, Freelance"
                    value={title}
                    onChangeText={setTitle}
                    style={styles.input}
                />

                <Text style={styles.label}>Amount</Text>
                <TextInput
                    placeholder="e.g., 1500"
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    style={styles.input}
                />

                <Text style={styles.label}>Category</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={category}
                        onValueChange={(itemValue) => setCategory(itemValue)}
                        style={styles.picker}
                    >
                        {(type === "expense" ? expenseCategories : incomeCategories).map((cat) => (
                            <Picker.Item key={cat} label={cat} value={cat} />
                        ))}
                    </Picker>

                </View>

                <TouchableOpacity style={styles.button} onPress={handleAddTrans}>
                    <Text style={styles.buttonText}>Add Transaction</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    container: {
        flex: 1,
        padding: 20,
        paddingTop: 30
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 8,
        marginTop: 6,
        backgroundColor: "#fff",
    },
    picker: {
        height: 50,
        width: "100%",
    },

    heading: {
        fontSize: 24,
        fontWeight: "bold",
        color: Colors.primary,
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        marginTop: 14,
        color: Colors.textPrimary,
    },
    input: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 8,
        padding: 10,
        marginTop: 6,
        backgroundColor: "#fff",
    },
    typeContainer: {
        flexDirection: "row",
        justifyContent: "center",
        marginBottom: 20,
        gap: 10,
    },
    typeButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: "#f1f1f1",
        alignItems: "center",
    },
    selectedExpense: {
        backgroundColor: Colors.error,
    },
    selectedIncome: {
        backgroundColor: Colors.success,
    },
    typeText: {
        color: "#fff",
        fontWeight: "bold",
    },
    button: {
        marginTop: 30,
        backgroundColor: Colors.primary,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: "center",
    },
    buttonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
});

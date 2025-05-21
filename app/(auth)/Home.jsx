import AntDesign from '@expo/vector-icons/AntDesign';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import FilterModal from '../../components/FilterModal';
import Colors from "../../constants/Colors";
import { db } from '../../firebase'; // adjust if needed


export default function Home() {

    const [filterVisible, setFilterVisible] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState(null);
    useEffect(()=> setSelectedFilter(filterOptions[0]),[])
    useEffect(()=> {
    
       async function onlyForFunCall() {
            
            await fetchUserTransactions()
        }
        onlyForFunCall();
    })

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

            console.log(transactions[0],">>");
            
            // return transactions;
        } catch (error) {
            console.error("Error fetching transactions:", error.message);
            // return [];
        }
    }

    const filterOptions = [
        { label: '7 Days', value: 7 },
        { label: '30 Days', value: 30 },
        { label: '6 Months', value: 180 },
    ];

    const handleFilterSelect = (option) => {
        console.log("Selected Filter:", option);
        setSelectedFilter(option);
        // Apply filter logic here
    };
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.balanceContainer}>
                    <Text style={styles.balanceText}>Available Balance</Text>
                    <Text style={styles.balanceAmount}>₹1000</Text>
                </View>
                <View style={styles.upperTotalIncomeExpenseContainer}>
                    <Text style={styles.totalIncomeExpenseText}>Total Income & Expense</Text>
                    <View style={styles.filterIconContainer}>
                    {selectedFilter && (
                        <Text style={{
                            marginBottom: 7,
                            marginTop: 23,
                        }}>
                            Filter: {selectedFilter.label}
                        </Text>
                    )}
                    <TouchableOpacity onPress={() => setFilterVisible(true)}>
                        <AntDesign name="filter" size={24} color={Colors.tabIconDefault} style={styles.filterIcon} />
                    </TouchableOpacity>
                    </View>


                    <FilterModal
                        visible={filterVisible}
                        onClose={() => setFilterVisible(false)}
                        options={filterOptions}
                        onSelect={handleFilterSelect}
                        title="Filter by Type"
                    />
                </View>
                <View style={styles.totalIncomeExpenseContainer}>
                    <View style={styles.incomeContainer}>
                        <Text style={{fontSize: 16, fontWeight: '500', marginBottom:5}}>Total Income</Text>
                        <Text style={{fontSize: 18, fontWeight: 'bold'}}>₹1000</Text>
                    </View>
                    <View style={styles.expenseContainer}>
                        <Text style={{fontSize: 16, fontWeight: '500', marginBottom:5}}>Total Expense</Text>
                        <Text style={{fontSize: 18, fontWeight: 'bold'}}>₹1000</Text>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background ,
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
    balanceContainer: {
        backgroundColor: Colors.card,
        padding: 10,
        borderRadius: 10,
    },
    balanceText: {
        marginBottom: 8,
        fontSize: 20,
        color: Colors.textPrimary
        // fontWeight: 'bold',
    },
    balanceAmount: {
        fontSize: 24,
        fontWeight: 'bold',
        color:Colors.textPrimary
    },
    totalIncomeExpenseContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        // marginTop: 20,

    },
    incomeContainer: {
        backgroundColor: Colors.card,
        padding: 10,
        borderRadius: 10,
        flex: 1,
        marginRight: 5
    },
    expenseContainer: {
        backgroundColor: Colors.card,
        padding: 10,
        borderRadius: 10,
        flex: 1,
        marginLeft: 5
    },
    totalIncomeExpenseText: {
        fontSize: 18,
        // fontWeight: 'bold',
        marginBottom: 10,
        marginTop: 20,
    },
    filterIconContainer:{
        flexDirection: 'row',

    },
    filterIcon: {
        marginBottom: 10,
        marginTop: 20,
    },
    upperTotalIncomeExpenseContainer: {
        flexDirection: 'row',
        justifyContent: "space-between"

    }
});
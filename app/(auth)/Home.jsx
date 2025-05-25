import AntDesign from "@expo/vector-icons/AntDesign";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Dimensions,
  // SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BarChart } from "react-native-chart-kit";
import FilterModal from "../../components/FilterModal";
import Colors from "../../constants/Colors";
import { db } from "../../firebase";

export default function Home() {
  const screenWidth = Dimensions.get("window").width;
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [allTransactions, setAllTransactions] = useState([]);
  const [highestIncomeAndExpense, setHighestIncomeAndExpense] = useState({});
  const [balance, setBalance] = useState(0);
  const [TotalIncome, setTotalIncome] = useState(0);
  const [TotalExpense, setTotalExpense] = useState(0);
  useEffect(() => setSelectedFilter(filterOptions[0]), []);

  useFocusEffect(
    useCallback(() => {
      async function onlyForFunCall() {
        await fetchUserTransactions();
      }
      onlyForFunCall();
      return () => {};
    }, [])
  );

  async function fetchUserTransactions() {
    try {
      const userJson = await AsyncStorage.getItem("user");
      const user = JSON.parse(userJson);

      if (!user?.uid) throw new Error("User not authenticated");

      // Fetch user document for balance
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.exists() ? userDoc.data() : null;
      const balance = userData?.balance || 0;

      // Fetch transactions from subcollection
      const transactionsRef = collection(db, "users", user.uid, "transactions");
      const q = query(transactionsRef, orderBy("date", "desc"));
      const querySnapshot = await getDocs(q);

      const transactions = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        const timestamp = data.date;

        // Convert Firestore timestamp to readable string
        let dateStr = "";
        if (
          timestamp &&
          timestamp.seconds !== undefined &&
          timestamp.nanoseconds !== undefined
        ) {
          const convertedDate = new Date(
            timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000
          );
          dateStr = convertedDate.toLocaleString();
        } else if (timestamp instanceof Date) {
          dateStr = timestamp.toLocaleString();
        } else if (typeof timestamp === "string") {
          dateStr = timestamp;
        }

        return {
          id: doc.id,
          ...data,
          date: dateStr,
        };
      });

      setBalance(balance);
      setAllTransactions(transactions);
      function getHighestIncomeAndExpense(transactions) {
        if (!Array.isArray(transactions) || transactions.length === 0) {
          return { highestIncome: null, highestExpense: null };
        }

        let highestIncome = null;
        let highestExpense = null;

        for (const tx of transactions) {
          if (tx.type === "income") {
            if (!highestIncome || tx.amount > highestIncome.amount) {
              highestIncome = tx;
            }
          } else if (tx.type === "expense") {
            if (!highestExpense || tx.amount > highestExpense.amount) {
              highestExpense = tx;
            }
          }
        }

        return { highestIncome, highestExpense };
      }

      const temp = getHighestIncomeAndExpense(transactions);
      console.log(temp);

      setHighestIncomeAndExpense(temp);

      let incomeAmt = 0;
      let expenseAmt = 0;
      transactions.filter((trns) => {
        if (trns.type == "income") {
          incomeAmt = incomeAmt + parseFloat(trns.amount);
        } else {
          expenseAmt = expenseAmt + parseFloat(trns.amount);
        }
      });
      setTotalExpense(expenseAmt);
      setTotalIncome(incomeAmt);

      return { balance, transactions };
    } catch (error) {
      console.error("Error fetching user data:", error.message);
      return { balance: 0, transactions: [] };
    }
  }

  // Utility to parse "21/5/2025, 7:38:13 pm" into a JS Date object
  const parseCustomDate = (dateStr) => {
    const [datePart, timePart] = dateStr.split(", ");
    const [day, month, year] = datePart.split("/").map(Number);
    let [time, period] = timePart.split(" ");
    let [hours, minutes, seconds] = time.split(":").map(Number);
    if (period === "pm" && hours !== 12) hours += 12;
    if (period === "am" && hours === 12) hours = 0;
    return new Date(year, month - 1, day, hours, minutes, seconds);
  };

  // Helper function reused

  // Check if the given custom date is within N days from now
  const isWithinDays = (customDateStr, days) => {
    const inputDate = parseCustomDate(customDateStr);
    const now = new Date();
    const pastDate = new Date();
    pastDate.setDate(now.getDate() - days);
    return inputDate >= pastDate && inputDate <= now;
  };

  //   console.log(formatDate());
  const data = {
    labels: ["Income", "Expense"],
    datasets: [
      {
        data: [TotalIncome, TotalExpense],
        colors: [() => Colors.income, () => Colors.expense],
      },
    ],
  };

  const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    decimalPlaces: 0,
    barPercentage: 0.7,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: () => Colors.label,
    fillShadowGradient: Colors.barBackground,
    fillShadowGradientOpacity: 1,
    propsForBackgroundLines: {
      stroke: Colors.grid,
      strokeDasharray: "", // solid lines
    },
  };

  const filterOptions = [
    { label: "No filter", value: 100000 },
    { label: "7 Days", value: 7 },
    { label: "30 Days", value: 30 },
    { label: "6 Months", value: 180 },
  ];

  const handleFilterSelect = (option) => {
    console.log("Selected Filter:", option);
    setSelectedFilter(option);
    setFilterVisible(false);

    // Step 1: Filter the transactions
    const filtered = allTransactions.filter((trns) => {
      // console.log(trns.date, option.value);
      // console.log(isWithinDays(trns.date, option.value));

      return isWithinDays(trns.date, option.value);
    });

    // Step 2: Compute totals
    let incomeAmt = 0;
    let expenseAmt = 0;
    filtered.forEach((trns) => {
      if (trns.type === "income") {
        incomeAmt += parseFloat(trns.amount);
      } else {
        expenseAmt += parseFloat(trns.amount);
      }
    });

    // Step 3: Update state
    setTotalIncome(incomeAmt);
    setTotalExpense(expenseAmt);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceText}>Available Balance</Text>
            <Text style={styles.balanceAmount}>₹{balance}</Text>
          </View>
          <View style={styles.upperTotalIncomeExpenseContainer}>
            <Text style={styles.totalIncomeExpenseText}>
              Total Income & Expense
            </Text>
            <View style={styles.filterIconContainer}>
              {selectedFilter && (
                <Text
                  style={{
                    marginBottom: 7,
                    marginTop: 23,
                  }}
                >
                  Filter: {selectedFilter.label}
                </Text>
              )}
              <TouchableOpacity onPress={() => setFilterVisible(true)}>
                <AntDesign
                  name="filter"
                  size={24}
                  color={Colors.tabIconDefault}
                  style={styles.filterIcon}
                />
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
              <Text
                style={{ fontSize: 16, fontWeight: "500", marginBottom: 5 }}
              >
                Total Income
              </Text>
              <Text style={{ fontSize: 18, fontWeight: "bold" }}>
                ₹{TotalIncome}
              </Text>
            </View>
            <View style={styles.expenseContainer}>
              <Text
                style={{ fontSize: 16, fontWeight: "500", marginBottom: 5 }}
              >
                Total Expense
              </Text>
              <Text style={{ fontSize: 18, fontWeight: "bold" }}>
                ₹{TotalExpense}
              </Text>
            </View>
          </View>
          <View style={{ marginVertical: 10 }}>
            <BarChart
              data={data}
              width={screenWidth - 20}
              height={270}
              chartConfig={chartConfig}
              verticalLabelRotation={0}
              fromZero={true}
              showValuesOnTopOfBars={true}
              withInnerLines={true}
              yAxisInterval={1}
            />
          </View>
          <View style={styles.hieContainer}>
            <View style={styles.hieCard}>
              <Text style={styles.hieHeader}>Highest Income</Text>
              {highestIncomeAndExpense.highestIncome ? (
                <>
                  <Text style={styles.hieText}>
                    Date: {highestIncomeAndExpense.highestIncome.date}
                  </Text>
                  <Text style={styles.hieText}>
                    Amount: ₹{highestIncomeAndExpense.highestIncome.amount}
                  </Text>
                  <Text style={styles.hieText}>
                    Category: {highestIncomeAndExpense.highestIncome.category}
                  </Text>
                  <Text style={styles.hieText}>
                    Title: {highestIncomeAndExpense.highestIncome.title}
                  </Text>
                </>
              ) : (
                <Text style={styles.hieText}>No income data</Text>
              )}
            </View>

            <View style={styles.hieCard}>
              <Text style={styles.hieHeader}>Highest Expense</Text>
              {highestIncomeAndExpense.highestExpense ? (
                <>
                  <Text style={styles.hieText}>
                    Date: {highestIncomeAndExpense.highestExpense.date}
                  </Text>
                  <Text style={styles.hieText}>
                    Amount: ₹{highestIncomeAndExpense.highestExpense.amount}
                  </Text>
                  <Text style={styles.hieText}>
                    Category: {highestIncomeAndExpense.highestExpense.category}
                  </Text>
                  <Text style={styles.hieText}>
                    Title: {highestIncomeAndExpense.highestExpense.title}
                  </Text>
                </>
              ) : (
                <Text style={styles.hieText}>No expense data</Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  hieContainer: {
    // padding: 16,
  },
  hieCard: {
    marginVertical: 10,
    padding: 12,
    backgroundColor: Colors.card,
    borderRadius: 8,
  },
  hieHeader: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 8,
    color: Colors.textPrimary, // replaced "#333"
  },
  hieText: {
    fontSize: 16,
    marginBottom: 4,
    color: Colors.textSecondary, // replaced "#555"
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    padding: 10,
    paddingBottom: 0,
    // paddingTop: 36,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: Colors.textPrimary, // added color for consistency
  },
  balanceContainer: {
    backgroundColor: Colors.card,
    padding: 10,
    borderRadius: 10,
  },
  balanceText: {
    marginBottom: 8,
    fontSize: 20,
    color: Colors.textPrimary,
    // fontWeight: 'bold',
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  totalIncomeExpenseContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    // marginTop: 20,
  },
  incomeContainer: {
    backgroundColor: Colors.card,
    padding: 10,
    borderRadius: 10,
    flex: 1,
    marginRight: 5,
  },
  expenseContainer: {
    backgroundColor: Colors.card,
    padding: 10,
    borderRadius: 10,
    flex: 1,
    marginLeft: 5,
  },
  totalIncomeExpenseText: {
    fontSize: 18,
    // fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 20,
    color: Colors.textPrimary, // added color
  },
  filterIconContainer: {
    flexDirection: "row",
  },
  filterIcon: {
    marginBottom: 10,
    marginTop: 20,
  },
  upperTotalIncomeExpenseContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});


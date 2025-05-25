import AntDesign from "@expo/vector-icons/AntDesign";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import {
    collection,
    getDocs,
    orderBy,
    query
} from "firebase/firestore";
import { useCallback, useState } from "react";
import {
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import FilterModal from "../../components/FilterModal";
import Colors from "../../constants/Colors";
import { db } from "../../firebase";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all"); // credit, debit, all
  const [selectedCategory, setSelectedCategory] = useState("all");

  useFocusEffect(
    useCallback(() => {
      fetchUserTransactions();
    }, [])
  );

  const fetchUserTransactions = async () => {
    try {
      const userJson = await AsyncStorage.getItem("user");
      const user = JSON.parse(userJson);

      if (!user?.uid) throw new Error("User not authenticated");

      const transactionsRef = collection(db, "users", user.uid, "transactions");
      const q = query(transactionsRef, orderBy("date", "desc"));
      const querySnapshot = await getDocs(q);

      const fetched = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        const timestamp = data.date;

        let dateStr = "";
        if (timestamp?.seconds && timestamp?.nanoseconds) {
          const convertedDate = new Date(
            timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000
          );
          dateStr = convertedDate.toLocaleString();
        } else if (typeof timestamp === "string") {
          dateStr = timestamp;
        }

        return {
          id: doc.id,
          ...data,
          date: dateStr,
        };
      });

      setAllTransactions(fetched);
      applyFilters(fetched, selectedFilter, selectedCategory);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const applyFilters = (all, type, category) => {
    let filtered = [...all];

    if (type !== "all") {
      filtered = filtered.filter((tr) =>
        type === "credit" ? tr.type === "income" : tr.type === "expense"
      );
    }

    if (category !== "all") {
      filtered = filtered.filter(
        (tr) =>
          tr.category?.toLowerCase().trim() === category.toLowerCase().trim()
      );
    }

    setTransactions(filtered);
  };

  const handleTypeFilter = (type) => {
    setSelectedFilter(type);
    applyFilters(allTransactions, type, selectedCategory);
  };

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category.value);
    setFilterVisible(false);
    applyFilters(allTransactions, selectedFilter, category.value);
  };

  const renderItem = ({ item }) => {
    const isIncome = item.type === "income";
    return (
      <View style={[styles.card, isIncome ? styles.income : styles.expense]}>
        <View style={styles.row}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.amount}>
            {isIncome ? "+" : "-"}₹{item.amount}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{item.category}</Text>
          <Text style={styles.metaText}>{item.date}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.heading}>Transactions</Text>
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Filter</Text>
            <TouchableOpacity onPress={() => setFilterVisible(true)}>
              <AntDesign
                name="filter"
                size={25}
                style={{marginTop:6}}
                color={Colors.tabIconDefault}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Category Modal */}
        <FilterModal
          visible={filterVisible}
          onClose={() => setFilterVisible(false)}
          options={[
            { label: "All Categories", value: "all" },
            { label: "Food", value: "food" },
            { label: "Transport", value: "transport" },
            { label: "Shopping", value: "shopping" },
            { label: "Entertainment", value: "Entertainment" },
            { label: "Others", value: "Others" },
            { label: "Salary", value: "Salary" },
            { label: "Bonus", value: "Bonus" },
            { label: "Investment", value: "Investment" },
          ]}
          onSelect={handleCategoryFilter}
          title="Filter by Category"
        />

        {/* Type Filter Buttons */}
        <View style={styles.typeFilterRow}>
          {["all", "credit", "debit"].map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => handleTypeFilter(type)}
              style={[
                styles.filterType,
                selectedFilter === type && styles.activeFilter,
              ]}
            >
              <Text
                style={[
                  styles.filterTypeText,
                  selectedFilter === type && styles.activeFilterText,
                ]}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Transaction List */}
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heading: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#333",
  },
  filterSection: {
    alignItems: "center",
    flexDirection: 'row'
  },
  filterLabel: {
    marginBottom: 4,
    marginTop:10
  },
  typeFilterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  filterType: {
    width: 100,
    padding: 10,
    borderRadius: 10,
    backgroundColor: Colors.card,
    alignItems: "center",
  },
  activeFilter: {
    backgroundColor: "red",
  },
  filterTypeText: {
    fontWeight: "bold",
    color: "#333",
  },
  activeFilterText: {
    color: "white",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  income: {
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  expense: {
    borderLeftWidth: 4,
    borderLeftColor: "#F44336",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222",
  },
  amount: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaText: {
    color: "#777",
    fontSize: 14,
  },
});

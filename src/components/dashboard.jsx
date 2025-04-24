import { Link } from "react-router-dom";
import React, { useState, useEffect, useContext } from "react";
import { 
  collection, addDoc, getDocs, 
  doc, updateDoc, deleteDoc, query,
  where, serverTimestamp, Timestamp
} from "firebase/firestore";
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { AuthContext } from '../contexts/AuthContext';
import {
  FiArrowUp,
  FiArrowDown,
  FiDollarSign,
  FiPieChart,
  FiCalendar,
  FiEdit2,
  FiTrash2,
  FiFilter,
  FiSearch,
} from "react-icons/fi";
import "../dashboard.css";

function Dashboard() {
  const { currentUser } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Categories for transactions
  const categories = {
    Income: ["Salary", "Freelance", "Investments", "Gifts", "Other"],
    Expense: [
      "Food",
      "Transport",
      "Housing",
      "Entertainment",
      "Healthcare",
      "Education",
      "Shopping",
      "Other",
    ],
  };

  // Load transactions from Firestore
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        if (!currentUser) return;
        
        const startDate = new Date(currentYear, currentMonth, 1);
        const endDate = new Date(currentYear, currentMonth + 1, 0);
        
        const q = query(
          collection(db, "transactions"),
          where("userId", "==", currentUser.uid),
          where("date", ">=", Timestamp.fromDate(startDate)),
          where("date", "<=", Timestamp.fromDate(endDate))
        );

        const querySnapshot = await getDocs(q);
        const loadedTransactions = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore Timestamp to JS Date
          date: doc.data().date?.toDate().toISOString().split("T")[0]
        }));
        setTransactions(loadedTransactions);
      } catch (err) {
        setError("Failed to load transactions. Please try again.");
        console.error("Error loading transactions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [currentUser, currentMonth, currentYear]);

  // Calculate totals
  const filteredTransactions = transactions.filter((txn) => {
    const matchesSearch = txn.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "All" || txn.type === filterType;
    const matchesCategory = filterCategory === "All" || txn.category === filterCategory;
    const txnDate = new Date(txn.date);
    const matchesMonth = txnDate.getMonth() === currentMonth;
    const matchesYear = txnDate.getFullYear() === currentYear;

    return matchesSearch && matchesType && matchesCategory && matchesMonth && matchesYear;
  });

  const income = filteredTransactions
    .filter((t) => t.type === "Income")
    .reduce((acc, curr) => acc + curr.amount, 0);
  const expenses = filteredTransactions
    .filter((t) => t.type === "Expense")
    .reduce((acc, curr) => acc + curr.amount, 0);
  const balance = income - expenses;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!title || !amount || !type || !category || !date) {
      setError("Please fill all fields");
      return;
    }

    try {
      const transactionData = {
        title,
        amount: parseFloat(amount),
        type,
        category,
        date: Timestamp.fromDate(new Date(date)), // Store as Firestore Timestamp
        userId: currentUser.uid,
        createdAt: serverTimestamp()
      };

      if (isEditing) {
        await updateDoc(doc(db, "transactions", editId), transactionData);
        setTransactions(transactions.map(txn => 
          txn.id === editId ? { 
            ...txn, 
            ...transactionData,
            date: date // Keep as string for local state
          } : txn
        ));
      } else {
        const docRef = await addDoc(collection(db, "transactions"), transactionData);
        setTransactions([{ 
          id: docRef.id, 
          ...transactionData,
          date: date // Keep as string for local state
        }, ...transactions]);
      }

      // Clear form
      setTitle("");
      setAmount("");
      setType("");
      setCategory("");
      setDate(new Date().toISOString().split("T")[0]);
      setIsEditing(false);
      setEditId(null);
    } catch (err) {
      setError("Failed to save transaction. Please try again.");
      console.error("Error saving transaction:", err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        await deleteDoc(doc(db, "transactions", id));
        setTransactions(transactions.filter(txn => txn.id !== id));
      } catch (err) {
        setError("Failed to delete transaction");
        console.error("Error deleting transaction:", err);
      }
    }
  };

  const handleEdit = (txn) => {
    setIsEditing(true);
    setEditId(txn.id);
    setTitle(txn.title);
    setAmount(txn.amount.toString());
    setType(txn.type);
    setCategory(txn.category);
    setDate(txn.date);
  };

  const handleMonthChange = (increment) => {
    const newMonth = currentMonth + increment;
    if (newMonth < 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else if (newMonth > 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(newMonth);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      setError("Logout failed");
      console.error("Logout error:", error);
    }
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="dashboard-container">
      {/* Navbar */}
      <nav className="dashboard-nav">
        <div className="logo-container">
          <FiPieChart className="logo-icon" />
          <h3 className="logo">BudgetPlanner</h3>
        </div>
        <div className="nav-links">
          <Link to="/dashboard" className="nav-link active">
            <span className="nav-link-text">Dashboard</span>
          </Link>
          <Link to="/login" onClick={handleLogout} className="nav-link active">
            <span className="nav-link-text">Logout</span>
          </Link>
        </div>
      </nav>

      <main className="dashboard-content">
        {/* Error Message */}
        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {/* Header */}
        <header className="dashboard-header">
          <div className="header-content">
            <h1>Financial Dashboard</h1>
            <p className="welcome-message">
              Welcome, {currentUser?.email} - Track and manage your expenses effectively
            </p>
          </div>
          <div className="month-selector">
            <button onClick={() => handleMonthChange(-1)} className="month-arrow">
              &lt;
            </button>
            <h2 className="current-month">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <button onClick={() => handleMonthChange(1)} className="month-arrow">
              &gt;
            </button>
          </div>
        </header>

        {/* Overview Cards */}
        <section className="overview-cards">
          <div className="overview-card income-card">
            <div className="card-icon">
              <FiArrowUp />
            </div>
            <div className="card-content">
              <h3>Total Income</h3>
              <p className="card-amount">₹{income.toLocaleString("en-IN")}</p>
            </div>
          </div>

          <div className="overview-card expense-card">
            <div className="card-icon">
              <FiArrowDown />
            </div>
            <div className="card-content">
              <h3>Total Expenses</h3>
              <p className="card-amount">₹{expenses.toLocaleString("en-IN")}</p>
            </div>
          </div>

          <div className={`overview-card balance-card ${balance < 0 ? 'negative' : ''}`}>
            <div className="card-icon rupee">
              ₹ 
            </div>
            <div className="card-content">
              <h3>Balance</h3>
              <p className="card-amount">₹{balance.toLocaleString("en-IN")}</p>
              <p className="card-budget-status">
                {balance >= 0 ? "Within budget" : "Over budget"}
              </p>
            </div>
          </div>
        </section>

        {/* Transaction Form */}
        <section className="transaction-form-section">
          <h2>{isEditing ? "Edit Transaction" : "Add New Transaction"}</h2>
          <form onSubmit={handleSubmit} className="transaction-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input
                  type="text"
                  id="title"
                  placeholder="Salary, Rent, etc."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="amount">Amount (₹)</label>
                <input
                  type="number"
                  id="amount"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="type">Type</label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value);
                    setCategory("");
                  }}
                  required
                >
                  <option value="">Select Type</option>
                  <option value="Income">Income</option>
                  <option value="Expense">Expense</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  disabled={!type}
                >
                  <option value="">Select Category</option>
                  {type &&
                    categories[type].map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="date">Date</label>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className="form-group submit-group">
                <button type="submit" className="submit-btn">
                  {isEditing ? "Update Transaction" : "Add Transaction"}
                </button>
                {isEditing && (
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => {
                      setIsEditing(false);
                      setEditId(null);
                      setTitle("");
                      setAmount("");
                      setType("");
                      setCategory("");
                      setDate(new Date().toISOString().split("T")[0]);
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </form>
        </section>

        {/* Transaction History */}
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading transactions...</p>
          </div>
        ) : (
          <section className="transaction-history">
            <div className="section-header">
            <h2>Transaction History</h2>
            <div className="transaction-controls">
              <div className="search-box">
                <FiSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="filter-group">
                <div className="filter-select">
                  <FiFilter className="filter-icon" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="All">All Types</option>
                    <option value="Income">Income</option>
                    <option value="Expense">Expense</option>
                  </select>
                </div>
                <div className="filter-select">
                  <FiFilter className="filter-icon" />
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    disabled={filterType === "All"}
                  >
                    <option value="All">All Categories</option>
                    {filterType !== "All" &&
                      categories[filterType].map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"></div>
              <p>No transactions found for the selected filters.</p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterType("All");
                  setFilterCategory("All");
                }}
                className="reset-filters-btn"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <>
              <div className="transaction-summary">
                <p>
                  Showing {filteredTransactions.length} of {transactions.length}{" "}
                  transactions
                </p>
              </div>
              <ul className="transaction-list">
                {filteredTransactions.map((txn) => (
                  <li
                    key={txn.id}
                    className={`transaction-item ${txn.type.toLowerCase()}`}
                  >
                    <div className="transaction-main">
                      <div className="transaction-icon">
                        {txn.type === "Income" ? (
                          <FiArrowUp />
                        ) : (
                          <FiArrowDown />
                        )}
                      </div>
                      <div className="transaction-info">
                        <h4 className="transaction-title">{txn.title}</h4>
                        <div className="transaction-meta">
                          <span className="transaction-category">
                            {txn.category}
                          </span>
                          <span className="transaction-date">
                            <FiCalendar />{" "}
                            {new Date(txn.date || txn.id).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="transaction-amount">
                      <span className={`amount ${txn.type.toLowerCase()}`}>
                        {txn.type === "Income" ? "+" : "-"}₹
                        {txn.amount.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="transaction-actions">
                      <button
                        onClick={() => handleEdit(txn)}
                        className="action-btn edit-btn"
                        aria-label="Edit transaction"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        onClick={() => handleDelete(txn.id)}
                        className="action-btn delete-btn"
                        aria-label="Delete transaction"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
          </section>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
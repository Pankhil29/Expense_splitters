import { useState, useEffect, useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import Login from "./components/Login";
import Register from "./components/Register";
import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api/`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function App() {
  const [groups, setGroups] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [groupPassword, setGroupPassword] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [unlockedGroups, setUnlockedGroups] = useState({}); // Session locking state
  const [passwordPromptId, setPasswordPromptId] = useState(null);
  const [enteredPassword, setEnteredPassword] = useState("");

  // Search bar States 🔍
  const [groupSearchQuery, setGroupSearchQuery] = useState("");
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  const [balances, setBalances] = useState(null);
  const [paidById, setPaidById] = useState("");
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [allSystemUsers, setAllSystemUsers] = useState([]);
  const [memberToAddId, setMemberToAddId] = useState("");
  const [uiError, setUiError] = useState("");

  const { user, logout: contextLogout } = useContext(AuthContext);
  const [showRegister, setShowRegister] = useState(false);

  // 🛠️ BUG FIX 1: Custom Logout Secure Reset Function
  const handleSecureLogout = () => {
    setGroups([]);
    setSelectedGroupId(null);
    setUnlockedGroups({}); // Clear all group unlock locks from session memory 🧠
    setPasswordPromptId(null);
    setBalances(null);
    setEnteredPassword("");
    setGroupSearchQuery("");
    setMemberSearchQuery("");
    contextLogout(); // Call original auth context logout
  };

  useEffect(() => {
    if (uiError) {
      const timer = setTimeout(() => setUiError(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [uiError]);

  const fetchGroup = async () => {
    try {
      const response = await api.get("/groups/");
      setGroups(response.data);
    } catch (err) {
      if (err.response?.status === 401) handleSecureLogout();
    }
  };

  useEffect(() => {
    if (user) {
      fetchGroup();
      api
        .get("/users/")
        .then((res) => setAllSystemUsers(res.data))
        .catch((err) => console.error(err));
    }
  }, [user]);

  const fetchBalancesSecure = async (groupId, passToVerify) => {
    try {
      const response = await api.post(`/groups/${groupId}/balances/`, {
        group_password: passToVerify,
      });
      setBalances(response.data);
      // Save to unlocked state if successful
      setUnlockedGroups((prev) => ({ ...prev, [groupId]: passToVerify }));
      setPasswordPromptId(null);
      setEnteredPassword("");
    } catch (err) {
      if (err.response?.data?.error === "WRONG_PASSWORD") {
        setUiError("Galat Password hai bhai! Dobara try karo.");
        setBalances(null);
      } else {
        setUiError(err.response?.data?.error || "Kuch gadbad hui!");
      }
    }
  };

  const handleGroupClick = (group) => {
    setSelectedGroupId(group.id);
    if (unlockedGroups[group.id]) {
      fetchBalancesSecure(group.id, unlockedGroups[group.id]);
    } else {
      setBalances(null);
      setPasswordPromptId(group.id);
    }
  };

  const verifyPasswordSubmit = (e) => {
    e.preventDefault();
    if (!enteredPassword) return setUiError("Password khali nahi ho sakta!");
    fetchBalancesSecure(passwordPromptId, enteredPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim() || !groupPassword.trim()) {
      return setUiError("Name aur Privacy Password dono fill karo!");
    }

    try {
      const response = await api.post("/groups/create/", {
        name: groupName,
        password: groupPassword,
      });
      if (response.status === 201) {
        setGroupName("");
        setGroupPassword("");
        fetchGroup();
      }
    } catch (err) {
      setUiError(err.response?.data?.error || "Group banane me dikkat aayi.");
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    const currentPass = unlockedGroups[selectedGroupId];
    try {
      await api.post("/expenses/add/", {
        group: selectedGroupId,
        title: expenseTitle,
        amount: parseInt(expenseAmount),
        paid_by: parseInt(paidById),
      });
      setExpenseAmount("");
      setExpenseTitle("");
      setPaidById("");
      fetchBalancesSecure(selectedGroupId, currentPass);
    } catch (err) {
      setUiError(err.response?.data?.error || "Expense add nahi ho paya.");
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberToAddId)
      return setUiError("Pehle niche filter se koi friend select karo!");
    const currentPass = unlockedGroups[selectedGroupId];

    try {
      await api.post(`/groups/${selectedGroupId}/add-member/`, {
        user_id: parseInt(memberToAddId),
      });
      setMemberToAddId("");
      setMemberSearchQuery("");
      fetchBalancesSecure(selectedGroupId, currentPass);
    } catch (err) {
      setUiError(err.response?.data?.error || "Member nahi jodh paye.");
    }
  };

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(groupSearchQuery.toLowerCase()),
  );

  const filteredUsers = allSystemUsers.filter(
    (u) =>
      u.username.toLowerCase().includes(memberSearchQuery.toLowerCase()) &&
      !balances?.members?.some((m) => m.id === u.id),
  );

  if (!user) {
    if (showRegister)
      return <Register onSwitchToLogin={() => setShowRegister(false)} />;
    return <Login onSwitchToRegister={() => setShowRegister(true)} />;
  }

  return (
    <div
      style={{
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
        padding: "24px 16px",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {uiError && (
          <div
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              backgroundColor: "#fef2f2",
              color: "#b91c1c",
              padding: "14px 24px",
              borderRadius: "12px",
              boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
              borderLeft: "4px solid #ef4444",
              fontWeight: "600",
              zIndex: 1000,
            }}
          >
            ⚠️ {uiError}
          </div>
        )}

        {/* Top Navbar */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#ffffff",
            padding: "16px 28px",
            borderRadius: "16px",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)",
            marginBottom: "28px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                background: "linear-gradient(135deg, #4f46e5, #6366f1)",
                padding: "10px",
                borderRadius: "12px",
                color: "white",
                fontSize: "20px",
              }}
            >
              💸
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: "20px",
                color: "#0f172a",
                fontWeight: "700",
              }}
            >
              Splitwise Secure Pro
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ fontSize: "14px", color: "#475569" }}>
              Hi, <strong style={{ color: "#4f46e5" }}>{user}</strong> ✨
            </span>
            <button
              onClick={handleSecureLogout}
              style={{
                padding: "8px 16px",
                backgroundColor: "#fecaca",
                color: "#991b1b",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Logout
            </button>
          </div>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.5fr",
            gap: "28px",
          }}
        >
          {/* Left Block: Groups Panel */}
          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "24px",
              borderRadius: "16px",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)",
              height: "fit-content",
            }}
          >
            <h2
              style={{
                margin: "0 0 16px 0",
                fontSize: "16px",
                color: "#0f172a",
                fontWeight: "700",
              }}
            >
              🔒 Secure Group Create
            </h2>
            <form
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                marginBottom: "28px",
              }}
            >
              <input
                type="text"
                placeholder="Group Name (e.g., Goa Trip)"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                style={{
                  padding: "10px 14px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  fontSize: "14px",
                  outline: "none",
                  backgroundColor: "#f8fafc",
                }}
              />
              <input
                type="password"
                placeholder="Set Access Password"
                value={groupPassword}
                onChange={(e) => setGroupPassword(e.target.value)}
                style={{
                  padding: "10px 14px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  fontSize: "14px",
                  outline: "none",
                  backgroundColor: "#f8fafc",
                }}
              />
              <button
                type="submit"
                style={{
                  padding: "12px",
                  backgroundColor: "#4f46e5",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Create Secured Group
              </button>
            </form>

            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: "700",
                  color: "#64748b",
                  textTransform: "uppercase",
                }}
              >
                🔍 Search My Groups
              </label>
              <input
                type="text"
                placeholder="Type group name to filter..."
                value={groupSearchQuery}
                onChange={(e) => setGroupSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  marginTop: "6px",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>

            <h3
              style={{
                fontSize: "14px",
                color: "#64748b",
                fontWeight: "600",
                marginBottom: "12px",
              }}
            >
              Active Groups ({filteredGroups.length})
            </h3>
            <ul style={{ paddingLeft: 0, listStyle: "none", margin: 0 }}>
              {filteredGroups.map((group) => {
                const isSelected = selectedGroupId === group.id;
                const isUnlocked = !!unlockedGroups[group.id];
                return (
                  <li
                    key={group.id}
                    onClick={() => handleGroupClick(group)}
                    style={{
                      cursor: "pointer",
                      padding: "14px",
                      background: isSelected ? "#eff6ff" : "#ffffff",
                      border: "1px solid",
                      borderColor: isSelected ? "#bfdbfe" : "#e2e8f0",
                      borderRadius: "12px",
                      marginBottom: "8px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontWeight: "600",
                          color: "#334155",
                          fontSize: "14px",
                        }}
                      >
                        {isUnlocked ? "🔓" : "🔒"} {group.name}
                      </span>
                      {/* 🎯 BUG FIX 2: Dynamic Creator Badge rendering instead of default user string */}
                      <span
                        style={{
                          marginLeft: "8px",
                          fontSize: "11px",
                          backgroundColor: "#e0e7ff",
                          color: "#4338ca",
                          padding: "2px 8px",
                          borderRadius: "6px",
                          fontWeight: "600",
                        }}
                      >
                        👑{" "}
                        {group.created_by_username ||
                          group.created_by ||
                          "Admin"}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "12px",
                        color: isSelected ? "#2563eb" : "#94a3b8",
                      }}
                    >
                      {isSelected ? "Active" : "View"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Right Block: Details Workspace */}
          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "24px",
              borderRadius: "16px",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)",
              minHeight: "450px",
            }}
          >
            {passwordPromptId ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  paddingTop: "60px",
                }}
              >
                <span style={{ fontSize: "36px", marginBottom: "12px" }}>
                  🔐
                </span>
                <h3 style={{ margin: 0, color: "#0f172a" }}>
                  This Group is Encrypted
                </h3>
                <p
                  style={{
                    color: "#64748b",
                    fontSize: "14px",
                    textAlign: "center",
                    maxWidth: "280px",
                    margin: "6px 0 20px 0",
                  }}
                >
                  Is group ka ledger dekhne ke liye creator ka set kiya hua
                  password daalein.
                </p>
                <form
                  onSubmit={verifyPasswordSubmit}
                  style={{
                    display: "flex",
                    gap: "8px",
                    width: "100%",
                    maxWidth: "300px",
                  }}
                >
                  <input
                    type="password"
                    placeholder="Enter Group Password"
                    value={enteredPassword}
                    onChange={(e) => setEnteredPassword(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "10px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "10px",
                      outline: "none",
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: "10px 16px",
                      backgroundColor: "#0f172a",
                      color: "white",
                      border: "none",
                      borderRadius: "10px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    Unlock
                  </button>
                </form>
              </div>
            ) : balances ? (
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                    borderBottom: "1px solid #f1f5f9",
                    paddingBottom: "16px",
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "18px",
                      color: "#0f172a",
                      fontWeight: "700",
                    }}
                  >
                    ⚡ {balances.group_name}
                  </h2>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <span
                      style={{
                        backgroundColor: "#f0fdf4",
                        color: "#166534",
                        padding: "6px 14px",
                        borderRadius: "9999px",
                        fontSize: "13px",
                        fontWeight: "600",
                      }}
                    >
                      Total: ₹{balances.total_expense}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    background: "#f8fafc",
                    padding: "16px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    marginBottom: "24px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: "700",
                      color: "#475569",
                    }}
                  >
                    👥 Add New Member to Group
                  </span>
                  <input
                    type="text"
                    placeholder="Type friend's name to search system..."
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      marginTop: "6px",
                      marginBottom: "12px",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />

                  {memberSearchQuery && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        backgroundColor: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        maxHeight: "150px",
                        overflowY: "auto",
                        padding: "6px",
                      }}
                    >
                      {filteredUsers.length === 0 ? (
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#94a3b8",
                            padding: "6px",
                          }}
                        >
                          No users found matching "{memberSearchQuery}"
                        </span>
                      ) : (
                        filteredUsers.map((u) => (
                          <div
                            key={u.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "6px 8px",
                              borderRadius: "6px",
                              backgroundColor:
                                memberToAddId === u.id
                                  ? "#eff6ff"
                                  : "transparent",
                            }}
                          >
                            <span
                              style={{ fontSize: "13px", fontWeight: "500" }}
                            >
                              👤 {u.username}
                            </span>
                            <button
                              onClick={() => setMemberToAddId(u.id)}
                              style={{
                                padding: "4px 10px",
                                backgroundColor:
                                  memberToAddId === u.id
                                    ? "#2563eb"
                                    : "#0f172a",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                fontSize: "11px",
                                cursor: "pointer",
                              }}
                            >
                              {memberToAddId === u.id ? "Selected" : "Select"}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {memberToAddId && (
                    <button
                      onClick={handleAddMember}
                      style={{
                        marginTop: "10px",
                        width: "100%",
                        padding: "10px",
                        backgroundColor: "#10b981",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: "600",
                        cursor: "pointer",
                        fontSize: "13px",
                      }}
                    >
                      Confirm Adding Selected Friend
                    </button>
                  )}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.1fr 1fr",
                    gap: "24px",
                  }}
                >
                  <div>
                    <h3
                      style={{
                        fontSize: "14px",
                        color: "#0f172a",
                        fontWeight: "700",
                        margin: "0 0 12px 0",
                      }}
                    >
                      ➕ Add New Bill Expense
                    </h3>
                    <form
                      onSubmit={handleExpenseSubmit}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      <select
                        value={paidById}
                        onChange={(e) => setPaidById(e.target.value)}
                        style={{
                          padding: "10px",
                          border: "1px solid #e2e8f0",
                          borderRadius: "10px",
                          fontSize: "14px",
                          outline: "none",
                          backgroundColor: "#f8fafc",
                        }}
                      >
                        <option value="">Who paid?</option>
                        {balances?.members?.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.username}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Title (e.g. Dinner, Cab)"
                        value={expenseTitle}
                        onChange={(e) => setExpenseTitle(e.target.value)}
                        style={{
                          padding: "10px",
                          border: "1px solid #e2e8f0",
                          borderRadius: "10px",
                          fontSize: "14px",
                          outline: "none",
                          backgroundColor: "#f8fafc",
                        }}
                      />
                      <input
                        type="number"
                        placeholder="Amount (₹)"
                        value={expenseAmount}
                        onChange={(e) => setExpenseAmount(e.target.value)}
                        style={{
                          padding: "10px",
                          border: "1px solid #e2e8f0",
                          borderRadius: "10px",
                          fontSize: "14px",
                          outline: "none",
                          backgroundColor: "#f8fafc",
                        }}
                      />
                      <button
                        type="submit"
                        style={{
                          padding: "12px",
                          backgroundColor: "#10b981",
                          color: "white",
                          border: "none",
                          borderRadius: "10px",
                          fontWeight: "600",
                          cursor: "pointer",
                        }}
                      >
                        Add Expense
                      </button>
                    </form>
                  </div>

                  <div>
                    <h3
                      style={{
                        fontSize: "14px",
                        color: "#0f172a",
                        fontWeight: "700",
                        margin: "0 0 12px 0",
                      }}
                    >
                      📋 Group Settlement Status
                    </h3>
                    <ul
                      style={{
                        listStyleType: "none",
                        paddingLeft: 0,
                        margin: 0,
                      }}
                    >
                      {balances?.users_breakdown?.map((member, index) => {
                        const isOwed = member.net_balance > 0;
                        const isEven = member.net_balance === 0;
                        return (
                          <li
                            key={index}
                            style={{
                              padding: "10px 12px",
                              background: isEven
                                ? "#f8fafc"
                                : isOwed
                                  ? "#f0fdf4"
                                  : "#fef2f2",
                              borderRadius: "10px",
                              marginBottom: "8px",
                              display: "flex",
                              flexDirection: "column",
                              border: "1px solid",
                              borderColor: isEven
                                ? "#e2e8f0"
                                : isOwed
                                  ? "#bbf7d0"
                                  : "#fecaca",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                fontSize: "13px",
                              }}
                            >
                              <strong style={{ color: "#334155" }}>
                                {member.username}
                              </strong>
                              <span
                                style={{
                                  fontWeight: "700",
                                  color: isEven
                                    ? "#64748b"
                                    : isOwed
                                      ? "#15803d"
                                      : "#b91c1c",
                                }}
                              >
                                {isEven
                                  ? "Settled"
                                  : `${isOwed ? "+" : ""}₹${member.net_balance.toFixed(2)}`}
                              </span>
                            </div>
                            <span
                              style={{
                                fontSize: "11px",
                                color: "#64748b",
                                marginTop: "2px",
                              }}
                            >
                              {member.status}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  color: "#94a3b8",
                  paddingTop: "100px",
                }}
              >
                <span style={{ fontSize: "40px", marginBottom: "8px" }}>
                  👈
                </span>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    textAlign: "center",
                  }}
                >
                  Baayein se koi group select karke authorized password enter
                  karein ledger dekhne ke liye!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

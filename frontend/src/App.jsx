import { useState, useEffect } from "react";

function App() {
  const [groups, setGroups] = useState([]);
  // form data na input
  const [groupName, setGroupName] = useState("");
  const [paidById, setPaidById] = useState("");
  // for expense
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [balances, setBalances] = useState(null);
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");

  const [allSystemUsers, setAllSystemUsers] = useState([]); // System ke saare users
  const [memberToAddId, setMemberToAddId] = useState(""); // Jo member add karna hai uski ID
  //  for member
  const [memberInput, setmemberInput] = useState("");

  const fetchGroup = () => {
    fetch("http://127.0.0.1:8000/api/groups/")
      .then((res) => res.json())
      .then((data) => setGroups(data))
      .catch((err) => console.error("error Fetching: ", err));
  };

  useEffect(() => {
    fetchGroup();
    fetch("http://127.0.0.1:8000/api/users/")
      .then((res) => res.json())
      .then((data) => setAllSystemUsers(data));
  }, []);

  //  for balance leva mate
  const fetchBalances = (groupId) => {
    fetch(`http://127.0.0.1:8000/api/groups/${groupId}/balances/`)
      .then((res) => res.json())
      .then((data) => setBalances(data))
      .catch((err) => console.error("error in fetching balance", err));
  };

  useEffect(() => {
    if (selectedGroupId) {
      fetchBalances(selectedGroupId);
    }
  }, [selectedGroupId]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!groupName) return alert("Name to likho bhai !!!");

    fetch("http://127.0.0.1:8000/api/groups/create/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: groupName,
        created_by: 1,
        members: memberInput.split(",").map((m) => m.trim()),
      }),
    })
      .then((res) => {
        if (res.status === 201) {
          alert("Group bani gayo");
          setGroupName("");
          fetchGroup();
        } else {
          alert("kuch gadbad hai !!!");
        }
      })
      .catch((err) => console.error("Error creating group: ", err));
  };

  const handleExpenseSubmit = (e) => {
    e.preventDefault();

    if (!expenseAmount || !expenseTitle)
      return alert("Fields abhi bhi khali hai");

    fetch("http://127.0.0.1:8000/api/expenses/add/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        group: selectedGroupId,
        title: expenseTitle,
        amount: parseInt(expenseAmount),
        paid_by: parseInt(paidById),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        alert("Kharcha jud gaya");
        setExpenseAmount("");
        setExpenseTitle("");
        fetchBalances(selectedGroupId);
      });
  };

  const handleAddMember = (e) => {
    e.preventDefault();
    if (!memberToAddId) return alert("Kisi user ko toh select karo bhai!");

    fetch(`http://127.0.0.1:8000/api/groups/${selectedGroupId}/add-member/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: parseInt(memberToAddId) }),
    }).then((res) => {
      if (res.status === 200) {
        alert("Member jud gaya!");
        setMemberToAddId("");
        fetchBalances(selectedGroupId); // Live update: Balance list ko refresh kiya taaki naya member wahan dikhe!
      }
    });
  };

  const handleDeleteGroup = (groupId, e) => {
    e.stopPropagation();

    if (!window.confirm("do you really delete this Group  ??")) return;

    fetch(`http://127.0.0.1:8000/api/groups/${groupId}/delete/`, {
      method: "DELETE",
    })
      .then((res) => {
        if (res.status === 200) {
          alert("Group delete ho gaya");
          setGroups((prevGroups) => prevGroups.filter((g) => g.id !== groupId));
          setSelectedGroupId(null);
        }
      })
      .catch((err) => console.error(err));
  };
  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "sans-serif",
        maxWidth: "800px",
        margin: "0 auto",
        display: "flex",
        gap: "40px",
      }}
    >
      {/* LEFT SIDE: GROUPS MANAGEMENT */}
      <div style={{ flex: 1 }}>
        <h1>Splitwise Mini</h1>
        <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
          <input
            type="text"
            placeholder="Naya Group..."
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
          <button type="submit">Create</button>
        </form>

        <h3>My Groups</h3>
        <ul>
          {groups.map((group) => (
            <li
              key={group.id}
              onClick={() => setSelectedGroupId(group.id)} // Click karne par group select hoga
              style={{
                cursor: "pointer",
                padding: "10px",
                background:
                  selectedGroupId === group.id ? "#e0e0e0" : "transparent",
                borderRadius: "5px",
              }}
            >
              📁 {group.name}
              <button
                onClick={(e) => handleDeleteGroup(group.id, e)}
                style={{
                  background: "red",
                  color: "white",
                  border: "none",
                  borderRadius: "3px",
                  cursor: "pointer",
                  padding: "2px 6px",
                }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* RIGHT SIDE: EXPENSES & CALCULATION (Sirf tab dikhega jab koi group select hoga) */}
      <div
        style={{ flex: 1, borderLeft: "1px solid #ccc", paddingLeft: "20px" }}
      >
        {selectedGroupId ? (
          <div>
            <form
              onSubmit={handleAddMember}
              style={{
                marginBottom: "20px",
                padding: "10px",
                background: "#f0f0f0",
                borderRadius: "5px",
              }}
            >
              <h4>Add Existing User to Group</h4>
              <select
                value={memberToAddId}
                onChange={(e) => setMemberToAddId(e.target.value)}
                style={{ padding: "5px", marginRight: "10px" }}
              >
                <option value="">User Chuno</option>
                {allSystemUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.username}
                  </option>
                ))}
              </select>
              <button type="submit">Add to Group</button>
            </form>
            <h2>Group Details {balances && `- ${balances.group_name}`}</h2>

            {/* Calculation Card */}
            {balances && (
              <div
                style={{
                  background: "#f9f9f9",
                  padding: "15px",
                  borderRadius: "5px",
                  marginBottom: "20px",
                }}
              >
                <p>
                  💰 <strong>Total Spending:</strong> ₹{balances.total_expense}
                </p>
                <p>
                  👤{" "}
                  <strong>
                    Share Per Person ({balances.total_members} Members):
                  </strong>{" "}
                  ₹{balances.share_per_person}
                </p>
              </div>
            )}

            {/* Expense Add Form */}
            <form
              onSubmit={handleExpenseSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              <h4>Add New Expense</h4>
              <select
                value={paidById}
                onChange={(e) => setPaidById(e.target.value)}
                style={{ padding: "8px", marginBottom: "10px" }}
              >
                <option value="">Kisne paise diye? Select karo</option>
                {balances &&
                  balances.members &&
                  balances.members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.username}
                    </option>
                  ))}
              </select>
              <input
                type="text"
                placeholder="Kharch ka naam (e.g. Dinner)"
                value={expenseTitle}
                onChange={(e) => setExpenseTitle(e.target.value)}
              />
              <input
                type="number"
                placeholder="Amount (₹)"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
              />
              <button type="submit">Add Expense</button>
            </form>
          </div>
        ) : (
          <p style={{ color: "#777", marginTop: "50px" }}>
            Koi group select karo baayein se hisab dekhne ke liye!
          </p>
        )}

        {balances && balances.users_breakdown && (
          <div
            style={{
              marginTop: "15px",
              borderTop: "1px solid #ddd",
              paddingTop: "10px",
            }}
          >
            <h4>Group Ka Hisab-Kitab (Who owes whom):</h4>
            <ul style={{ listStyleType: "none", paddingLeft: 0 }}>
              {balances.users_breakdown.map((user, index) => (
                <li
                  key={index}
                  style={{
                    padding: "5px",
                    color:
                      user.net_balance > 0
                        ? "green"
                        : user.net_balance < 0
                          ? "red"
                          : "gray",
                  }}
                >
                  👤 <strong>{user.username}</strong> {user.status} (Total Paid:
                  ₹{user.paid})
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

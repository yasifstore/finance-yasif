const PROFIT_PER_CUP = 2500;
const STORAGE_KEY = "finance-yasif-transactions";

let transactions = loadTransactions();
let activeFilter = "today";

const balanceAmount = document.getElementById("balanceAmount");
const cupCount = document.getElementById("cupCount");
const cupProfit = document.getElementById("cupProfit");
const todayIncome = document.getElementById("todayIncome");
const todayExpense = document.getElementById("todayExpense");
const historyList = document.getElementById("historyList");
const historyTitle = document.getElementById("historyTitle");
const monthName = document.getElementById("monthName");
const monthIncome = document.getElementById("monthIncome");
const monthExpense = document.getElementById("monthExpense");
const monthNet = document.getElementById("monthNet");

const modal = document.getElementById("transactionModal");
const modalTitle = document.getElementById("modalTitle");
const closeModalBtn = document.getElementById("closeModalBtn");

const transactionForm = document.getElementById("transactionForm");
const transactionType = document.getElementById("transactionType");

const amountGroup = document.getElementById("amountGroup");
const amountInput = document.getElementById("amountInput");

const cupGroup = document.getElementById("cupGroup");
const cupInput = document.getElementById("cupInput");

const noteInput = document.getElementById("noteInput");

const openIncomeBtn = document.getElementById("openIncomeBtn");
const openExpenseBtn = document.getElementById("openExpenseBtn");
const openSalesBtn = document.getElementById("openSalesBtn");

const filterTodayBtn = document.getElementById("filterTodayBtn");
const filterAllBtn = document.getElementById("filterAllBtn");
const clearDataBtn = document.getElementById("clearDataBtn");
const exportDataBtn = document.getElementById("exportDataBtn");

function formatRupiah(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(number);
}

function getTodayDate() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const date = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${date}`;
}

function formatDate(dateString) {
  const date = new Date(dateString);

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}
function getCurrentMonthKey() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

function getCurrentMonthName() {
  const today = new Date();

  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric"
  }).format(today);
}

function loadTransactions() {
  const savedData = localStorage.getItem(STORAGE_KEY);

  if (!savedData) {
    return [];
  }

  return JSON.parse(savedData);
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function escapeHTML(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function openModal(type) {
  transactionType.value = type;
  transactionForm.reset();

  if (type === "income") {
    modalTitle.textContent = "Tambah Pemasukan";
    amountGroup.classList.remove("hidden");
    cupGroup.classList.add("hidden");
  }

  if (type === "expense") {
    modalTitle.textContent = "Tambah Pengeluaran";
    amountGroup.classList.remove("hidden");
    cupGroup.classList.add("hidden");
  }

  if (type === "sales") {
    modalTitle.textContent = "Tambah Penjualan Cup";
    amountGroup.classList.add("hidden");
    cupGroup.classList.remove("hidden");
  }

  modal.classList.remove("hidden");
}

function closeModal() {
  modal.classList.add("hidden");
}

function addTransaction(event) {
  event.preventDefault();

  const type = transactionType.value;
  const note = noteInput.value.trim();

  let amount = 0;
  let cup = 0;
  let finalNote = note;

  if (type === "sales") {
    cup = Number(cupInput.value);
    amount = cup * PROFIT_PER_CUP;

    if (cup <= 0) {
      alert("Jumlah cup harus lebih dari 0.");
      return;
    }

    if (!finalNote) {
      finalNote = `Penjualan ${cup} cup`;
    }
  } else {
    amount = Number(amountInput.value);

    if (amount <= 0) {
      alert("Nominal harus lebih dari 0.");
      return;
    }

    if (!finalNote) {
      finalNote = type === "income" ? "Pemasukan" : "Pengeluaran";
    }
  }

  const transaction = {
    id: Date.now(),
    date: getTodayDate(),
    type: type,
    amount: amount,
    note: finalNote,
    cup: cup
  };

  transactions.unshift(transaction);

  saveTransactions();
  renderDashboard();
  closeModal();
}
function clearAllData() {
  const confirmClear = confirm("Hapus semua data transaksi?");

  if (!confirmClear) {
    return;
  }

  const confirmAgain = confirm("Yakin? Semua saldo dan riwayat akan kosong.");

  if (!confirmAgain) {
    return;
  }

  transactions = [];

  saveTransactions();
  renderDashboard();
}
function csvSafe(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function getTypeLabel(type) {
  if (type === "income") {
    return "Pemasukan";
  }

  if (type === "expense") {
    return "Pengeluaran";
  }

  if (type === "sales") {
    return "Penjualan Cup";
  }

  return type;
}

function exportToCSV() {
  if (transactions.length === 0) {
    alert("Belum ada data untuk diexport.");
    return;
  }

  const headers = [
    "Tanggal",
    "Jenis",
    "Nominal",
    "Keterangan",
    "Jumlah Cup",
    "Profit Per Cup"
  ];

  const rows = transactions.map((item) => {
    return [
      item.date,
      getTypeLabel(item.type),
      item.amount,
      item.note,
      item.cup || "",
      item.type === "sales" ? PROFIT_PER_CUP : ""
    ];
  });

  const csvContent = [
    headers.map(csvSafe).join(","),
    ...rows.map((row) => row.map(csvSafe).join(","))
  ].join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);

  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = "finance-yasif-transactions.csv";
  downloadLink.click();

  URL.revokeObjectURL(url);
}

function deleteTransaction(id) {
  const confirmDelete = confirm("Hapus transaksi ini?");

  if (!confirmDelete) {
    return;
  }

  transactions = transactions.filter((item) => {
    return item.id !== id;
  });

  saveTransactions();
  renderDashboard();
}

function setFilter(filterName) {
  activeFilter = filterName;

  if (filterName === "today") {
    filterTodayBtn.classList.add("active");
    filterAllBtn.classList.remove("active");
    historyTitle.textContent = "Transaksi Hari Ini";
  }

  if (filterName === "all") {
    filterAllBtn.classList.add("active");
    filterTodayBtn.classList.remove("active");
    historyTitle.textContent = "Semua Transaksi";
  }

  renderDashboard();
}

function renderDashboard() {
  const today = getTodayDate();

  const todayTransactions = transactions.filter((item) => {
    return item.date === today;
  });
  const currentMonth = getCurrentMonthKey();

const monthTransactions = transactions.filter((item) => {
  return item.date.startsWith(currentMonth);
});

  const balance = transactions.reduce((total, item) => {
    if (item.type === "expense") {
      return total - item.amount;
    }

    return total + item.amount;
  }, 0);

  const totalCup = todayTransactions.reduce((total, item) => {
    return total + item.cup;
  }, 0);

  const totalCupProfit = totalCup * PROFIT_PER_CUP;

  const incomeToday = todayTransactions.reduce((total, item) => {
    if (item.type === "income" || item.type === "sales") {
      return total + item.amount;
    }

    return total;
  }, 0);
  const incomeMonth = monthTransactions.reduce((total, item) => {
  if (item.type === "income" || item.type === "sales") {
    return total + item.amount;
  }

  return total;
}, 0);

const expenseMonth = monthTransactions.reduce((total, item) => {
  if (item.type === "expense") {
    return total + item.amount;
  }

  return total;
}, 0);

const netMonth = incomeMonth - expenseMonth;

  const expenseToday = todayTransactions.reduce((total, item) => {
    if (item.type === "expense") {
      return total + item.amount;
    }

    return total;
  }, 0);

  balanceAmount.textContent = formatRupiah(balance);
  cupCount.textContent = `${totalCup} cup`;
  cupProfit.textContent = formatRupiah(totalCupProfit);
  todayIncome.textContent = formatRupiah(incomeToday);
  todayExpense.textContent = formatRupiah(expenseToday);
  monthName.textContent = getCurrentMonthName();
monthIncome.textContent = formatRupiah(incomeMonth);
monthExpense.textContent = formatRupiah(expenseMonth);
monthNet.textContent = formatRupiah(netMonth);

  const listTransactions = activeFilter === "today"
    ? todayTransactions
    : transactions;

  renderHistory(listTransactions);
}

function renderHistory(listTransactions) {
  if (listTransactions.length === 0) {
    const emptyText = activeFilter === "today"
      ? "Belum ada transaksi hari ini."
      : "Belum ada transaksi tersimpan.";

    historyList.innerHTML = `
      <div class="empty-state">
        ${emptyText}
      </div>
    `;

    return;
  }

  historyList.innerHTML = listTransactions.map((item) => {
    const isExpense = item.type === "expense";
    const amountClass = isExpense ? "minus" : "plus";
    const symbol = isExpense ? "-" : "+";
    const detailText = item.type === "sales"
      ? `${item.cup} cup × Rp2.500`
      : "Transaksi manual";

    const dateText = activeFilter === "all"
      ? `<span class="transaction-date">${formatDate(item.date)}</span>`
      : "";

    return `
      <div class="transaction-item">
        <div class="transaction-info">
          <strong>${escapeHTML(item.note)}</strong>
          <span>${detailText}</span>
          ${dateText}
        </div>

        <div class="transaction-actions">
          <div class="transaction-amount ${amountClass}">
            ${symbol} ${formatRupiah(item.amount)}
          </div>

          <button class="delete-transaction-btn" data-id="${item.id}">
            Hapus
          </button>
        </div>
      </div>
    `;
  }).join("");
}

openIncomeBtn.addEventListener("click", () => openModal("income"));
openExpenseBtn.addEventListener("click", () => openModal("expense"));
openSalesBtn.addEventListener("click", () => openModal("sales"));

closeModalBtn.addEventListener("click", closeModal);
transactionForm.addEventListener("submit", addTransaction);

filterTodayBtn.addEventListener("click", () => setFilter("today"));
filterAllBtn.addEventListener("click", () => setFilter("all"));
clearDataBtn.addEventListener("click", clearAllData);
exportDataBtn.addEventListener("click", exportToCSV);

modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

historyList.addEventListener("click", (event) => {
  const deleteButton = event.target.closest(".delete-transaction-btn");

  if (!deleteButton) {
    return;
  }

  const transactionId = Number(deleteButton.dataset.id);
  deleteTransaction(transactionId);
});

renderDashboard();
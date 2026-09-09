import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/*
|--------------------------------------------------------------------------
| Firebase
|--------------------------------------------------------------------------
| Keep these values the same as the Firebase configuration already used
| by your other authenticated frontend pages.
|--------------------------------------------------------------------------
*/

const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_FIREBASE_AUTH_DOMAIN",
  projectId: "YOUR_FIREBASE_PROJECT_ID",
  storageBucket: "YOUR_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "YOUR_FIREBASE_MESSAGING_SENDER_ID",
  appId: "YOUR_FIREBASE_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

/*
|--------------------------------------------------------------------------
| Backend
|--------------------------------------------------------------------------
*/

const API_BASE = "https://novapay-server.onrender.com";

/*
|--------------------------------------------------------------------------
| DOM
|--------------------------------------------------------------------------
*/

const elements = {
  title: document.getElementById("transactionTitle"),
  status: document.getElementById("transactionStatus"),
  amount: document.getElementById("amount"),
  recipient: document.getElementById("recipient"),
  amountText: document.getElementById("amountText"),
  date: document.getElementById("date"),
  transactionId: document.getElementById("transactionId"),
  category: document.getElementById("category"),
  statusText: document.getElementById("statusText"),
  receiptIcon: document.getElementById("receiptIcon"),
  supportBtn: document.getElementById("supportBtn"),
  doneBtn: document.getElementById("doneBtn"),
  backBtn: document.getElementById("backBtn")
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function firstValue(...values) {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return value;
    }
  }

  return null;
}

function normalizeId(value) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
}

function getTransactionId(transaction) {
  return normalizeId(
    firstValue(
      transaction.id,
      transaction.transactionId,
      transaction.transaction_id,
      transaction.txId,
      transaction.tx_id,
      transaction.reference,
      transaction.referenceId,
      transaction.reference_id
    )
  );
}

function getProviderReference(transaction) {
  return normalizeId(
    firstValue(
      transaction.providerReference,
      transaction.provider_reference,
      transaction.providerTransactionId,
      transaction.provider_transaction_id,
      transaction.providerRequestId,
      transaction.provider_request_id,
      transaction.requestId,
      transaction.request_id
    )
  );
}

function getAmountNaira(transaction) {
  const koboAmount = firstValue(
    transaction.amountKobo,
    transaction.amount_kobo,
    transaction.valueKobo,
    transaction.value_kobo,
    transaction.totalKobo,
    transaction.total_kobo
  );

  if (koboAmount !== null) {
    const numericKobo = Number(koboAmount);

    if (Number.isFinite(numericKobo)) {
      return Math.abs(numericKobo) / 100;
    }
  }

  const nairaAmount = firstValue(
    transaction.amount,
    transaction.value,
    transaction.total,
    transaction.amountNaira,
    transaction.amount_naira
  );

  if (nairaAmount !== null) {
    const numericAmount = Number(nairaAmount);

    if (Number.isFinite(numericAmount)) {
      return Math.abs(numericAmount);
    }
  }

  return 0;
}

function formatCurrency(amount) {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) {
    return "₦0.00";
  }

  return `₦${numericAmount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function getTransactionDirection(transaction) {
  const values = [
    transaction.direction,
    transaction.transactionDirection,
    transaction.transaction_direction,
    transaction.type,
    transaction.transactionType,
    transaction.transaction_type,
    transaction.category,
    transaction.service
  ]
    .filter(Boolean)
    .map(value => String(value).toLowerCase());

  const creditWords = [
    "credit",
    "deposit",
    "funding",
    "fund",
    "cash in",
    "cash-in",
    "refund",
    "reversal",
    "topup",
    "top-up"
  ];

  const debitWords = [
    "debit",
    "withdraw",
    "withdrawal",
    "purchase",
    "payment",
    "data",
    "airtime",
    "electricity",
    "betting",
    "bill"
  ];

  if (values.some(value =>
    creditWords.some(word => value.includes(word))
  )) {
    return "credit";
  }

  if (values.some(value =>
    debitWords.some(word => value.includes(word))
  )) {
    return "debit";
  }

  const rawAmount = firstValue(
    transaction.amountKobo,
    transaction.amount_kobo,
    transaction.amount,
    transaction.value,
    transaction.total
  );

  if (typeof rawAmount === "number" && rawAmount < 0) {
    return "debit";
  }

  if (typeof rawAmount === "string" && rawAmount.trim().startsWith("-")) {
    return "debit";
  }

  return "debit";
}

function getStatus(transaction) {
  return String(
    firstValue(
      transaction.status,
      transaction.transactionStatus,
      transaction.transaction_status,
      "pending"
    )
  ).toLowerCase();
}

function isSuccessful(status) {
  return [
    "successful",
    "success",
    "completed",
    "completed-api",
    "complete",
    "paid",
    "approved"
  ].some(value => status.includes(value));
}

function isFailed(status) {
  return [
    "failed",
    "failure",
    "cancelled",
    "canceled",
    "refunded",
    "rejected",
    "declined"
  ].some(value => status.includes(value));
}

function getDisplayStatus(status) {
  if (isSuccessful(status)) {
    return "Successful";
  }

  if (isFailed(status)) {
    return "Failed";
  }

  return "Pending";
}

function getTransactionTitle(transaction) {
  const explicitTitle = firstValue(
    transaction.title,
    transaction.transactionTitle,
    transaction.transaction_title,
    transaction.description
  );

  if (explicitTitle) {
    return String(explicitTitle);
  }

  const type = String(
    firstValue(
      transaction.transactionType,
      transaction.transaction_type,
      transaction.type,
      transaction.category,
      transaction.service,
      "Transaction"
    )
  ).toLowerCase();

  if (type.includes("deposit")) {
    return "Deposit";
  }

  if (type.includes("data")) {
    return "Data";
  }

  if (type.includes("airtime")) {
    return "Airtime";
  }

  if (type.includes("electric")) {
    return "Electricity";
  }

  if (type.includes("bet")) {
    return "Betting";
  }

  if (type.includes("withdraw")) {
    return "Withdrawal";
  }

  if (type.includes("refund")) {
    return "Refund";
  }

  return "Transaction";
}

function getRecipient(transaction) {
  return String(
    firstValue(
      transaction.recipientName,
      transaction.recipient_name,
      transaction.recipient,
      transaction.customerName,
      transaction.customer_name,
      transaction.customerId,
      transaction.customer_id,
      transaction.phoneNumber,
      transaction.phone,
      transaction.mobile,
      transaction.beneficiary,
      transaction.description,
      "—"
    )
  );
}

function getCategory(transaction) {
  const category = firstValue(
    transaction.category,
    transaction.service,
    transaction.transactionType,
    transaction.transaction_type,
    transaction.type
  );

  if (!category) {
    return "General";
  }

  return String(category)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

function parseDateValue(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "object") {
    if (typeof value.toDate === "function") {
      return value.toDate();
    }

    if (typeof value.seconds === "number") {
      return new Date(value.seconds * 1000);
    }

    if (typeof value._seconds === "number") {
      return new Date(value._seconds * 1000);
    }
  }

  if (typeof value === "number") {
    // Firestore timestamps can occasionally arrive as milliseconds.
    if (value < 10000000000) {
      return new Date(value * 1000);
    }

    return new Date(value);
  }

  const parsed = new Date(value);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  return null;
}

function getTransactionDate(transaction) {
  return firstValue(
    transaction.createdAt,
    transaction.created_at,
    transaction.timestamp,
    transaction.date,
    transaction.transactionDate,
    transaction.transaction_date,
    transaction.completedAt,
    transaction.completed_at
  );
}

function formatDate(value) {
  const date = parseDateValue(value);

  if (!date) {
    return "—";
  }

  return date.toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

/*
|--------------------------------------------------------------------------
| URL transaction ID
|--------------------------------------------------------------------------
*/

function getRequestedTransactionId() {
  const params = new URLSearchParams(window.location.search);

  return normalizeId(
    firstValue(
      params.get("transactionId"),
      params.get("transaction_id"),
      params.get("txId"),
      params.get("tx_id"),
      params.get("id"),
      params.get("reference")
    )
  );
}

/*
|--------------------------------------------------------------------------
| API
|--------------------------------------------------------------------------
*/

async function getFirebaseToken(user) {
  return user.getIdToken(true);
}

async function fetchTransactions(token) {
  const response = await fetch(
    `${API_BASE}/api/transactions?limit=50`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json"
      }
    }
  );

  if (!response.ok) {
    throw new Error(
      `Unable to load transactions. Server returned ${response.status}.`
    );
  }

  const payload = await response.json();

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.transactions)) {
    return payload.transactions;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (payload.data && Array.isArray(payload.data.transactions)) {
    return payload.data.transactions;
  }

  return [];
}

function findTransaction(transactions, requestedId) {
  if (!requestedId) {
    return null;
  }

  const wanted = requestedId.toLowerCase();

  return (
    transactions.find(transaction => {
      const id = getTransactionId(transaction);

      return id && id.toLowerCase() === wanted;
    }) ||
    transactions.find(transaction => {
      const providerReference = getProviderReference(transaction);

      return (
        providerReference &&
        providerReference.toLowerCase() === wanted
      );
    }) ||
    null
  );
}

/*
|--------------------------------------------------------------------------
| UI state
|--------------------------------------------------------------------------
*/

function setLoadingState() {
  elements.title.textContent = "Loading transaction";
  elements.status.textContent = "Please wait";
  elements.amount.textContent = "₦0.00";

  elements.recipient.textContent = "Loading...";
  elements.amountText.textContent = "Loading...";
  elements.date.textContent = "Loading...";
  elements.transactionId.textContent = "Loading...";
  elements.category.textContent = "Loading...";
  elements.statusText.textContent = "Loading...";

  elements.receiptIcon.className = "receipt-icon pending";
}

function setErrorState(message) {
  elements.title.textContent = "Transaction unavailable";
  elements.status.textContent = "Unable to load";
  elements.amount.textContent = "₦0.00";

  elements.recipient.textContent = "—";
  elements.amountText.textContent = "—";
  elements.date.textContent = "—";
  elements.transactionId.textContent = "Not available";
  elements.category.textContent = "—";
  elements.statusText.textContent = "Unavailable";

  elements.receiptIcon.className = "receipt-icon failed";

  console.error(message);
}

function renderTransaction(transaction) {
  const amount = getAmountNaira(transaction);
  const direction = getTransactionDirection(transaction);
  const rawStatus = getStatus(transaction);
  const displayStatus = getDisplayStatus(rawStatus);

  const title = getTransactionTitle(transaction);
  const recipient = getRecipient(transaction);
  const category = getCategory(transaction);
  const date = formatDate(getTransactionDate(transaction));

  const transactionId = getTransactionId(transaction);
  const providerReference = getProviderReference(transaction);

  /*
  * The actual NovaPay transaction ID is preferred.
  * Provider reference is only used as a fallback if the local
  * transaction ID is genuinely absent.
  */
  const reference = transactionId || providerReference || "Not available";

  elements.title.textContent = title;
  elements.status.textContent = displayStatus;

  const prefix = direction === "credit" ? "+" : "-";

  elements.amount.textContent =
    `${prefix}${formatCurrency(amount)}`;

  elements.amount.classList.remove(
    "credit-amount",
    "debit-amount",
    "pending-amount"
  );

  if (displayStatus === "Pending") {
    elements.amount.classList.add("pending-amount");
  } else if (direction === "credit") {
    elements.amount.classList.add("credit-amount");
  } else {
    elements.amount.classList.add("debit-amount");
  }

  elements.recipient.textContent = recipient;
  elements.amountText.textContent =
    `${prefix}${formatCurrency(amount)}`;
  elements.date.textContent = date;
  elements.transactionId.textContent = reference;
  elements.category.textContent = category;
  elements.statusText.textContent = displayStatus;

  elements.receiptIcon.classList.remove(
    "success",
    "failed",
    "pending"
  );

  if (displayStatus === "Successful") {
    elements.receiptIcon.classList.add("success");
  } else if (displayStatus === "Failed") {
    elements.receiptIcon.classList.add("failed");
  } else {
    elements.receiptIcon.classList.add("pending");
  }

  /*
  * If your icon element is an <i>, Font Awesome classes can be changed
  * here without affecting the rest of the receipt.
  */
  if (elements.receiptIcon.tagName === "I") {
    elements.receiptIcon.className =
      "receipt-icon " +
      (displayStatus === "Successful"
        ? "success"
        : displayStatus === "Failed"
          ? "failed"
          : "pending");
  }
}

/*
|--------------------------------------------------------------------------
| Buttons
|--------------------------------------------------------------------------
*/

function setupButtons() {
  if (elements.doneBtn) {
    elements.doneBtn.addEventListener("click", () => {
      window.location.href = "dashboard.html";
    });
  }

  if (elements.backBtn) {
    elements.backBtn.addEventListener("click", () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = "dashboard.html";
      }
    });
  }

  if (elements.supportBtn) {
    elements.supportBtn.addEventListener("click", () => {
      const requestedId = getRequestedTransactionId();

      const subject = encodeURIComponent(
        "NovaPay transaction support"
      );

      const body = encodeURIComponent(
        requestedId
          ? `I need help with transaction ${requestedId}.`
          : "I need help with a transaction."
      );

      window.location.href =
        `mailto:support@novapay.com?subject=${subject}&body=${body}`;
    });
  }
}

/*
|--------------------------------------------------------------------------
| Main
|--------------------------------------------------------------------------
*/

async function loadReceipt(user) {
  setLoadingState();

  try {
    const requestedId = getRequestedTransactionId();

    if (!requestedId) {
      throw new Error(
        "No transaction ID was supplied to the receipt page."
      );
    }

    const token = await getFirebaseToken(user);
    const transactions = await fetchTransactions(token);

    const transaction = findTransaction(
      transactions,
      requestedId
    );

    if (!transaction) {
      throw new Error(
        `Transaction "${requestedId}" was not found in the user's transactions.`
      );
    }

    renderTransaction(transaction);
  } catch (error) {
    setErrorState(error.message);
  }
}

/*
|--------------------------------------------------------------------------
| Start
|--------------------------------------------------------------------------
*/

setupButtons();

onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  loadReceipt(user);
});
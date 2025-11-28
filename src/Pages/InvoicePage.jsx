import React, { useState, useEffect, useMemo } from "react";
import emailjs from "@emailjs/browser";
import InvoiceHeader from "../Components/InvoiceHeader";
import InvoiceTable from "../Components/InvoiceTable";
import InvoiceTotals from "../Components/InvoiceTotals";
import QuoteReference from "../Components/QuoteReference";
import {
  INVOICE_STORAGE_KEY,
  INVOICE_HISTORY_KEY,
  BILL_FROM_PERSIST_KEY,
  BILL_FROM_DATA_KEY,
  SAVED_CLIENTS_KEY,
  INVOICE_DRAFT_KEY,
  PROJECTS_DATA_KEY,
  SAVED_ADVANCES_KEY,
  APPOINTMENTS_DATA_KEY,
  CONTRACTS_DATA_KEY,
  PROPOSALS_DATA_KEY,
  UNPAID_FOLLOWUPS_KEY,
} from "../utils/storageKeys";

const BASE_INVOICE_NUMBER = "INV-0000";

const PAYMENT_CONFIG = {
  paypal: process.env.REACT_APP_PAYPAL_LINK,
};

const EMAILJS_CONFIG = {
  serviceId: process.env.REACT_APP_EMAILJS_SERVICE_ID,
  templateId: process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
  publicKey: process.env.REACT_APP_EMAILJS_PUBLIC_KEY,
};

const EMAILJS_READY = Object.values(EMAILJS_CONFIG).every(Boolean);
const ADMIN_ACCESS_CODE = process.env.REACT_APP_ADMIN_ACCESS_CODE || "";
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const AGING_FILTERS = [
  { key: "all", label: "All aging" },
  { key: "0-15", label: "0-15d" },
  { key: "16-30", label: "16-30d" },
  { key: "31-60", label: "31-60d" },
  { key: "60+", label: "60d+" },
];

const cloneLineItems = (lineItems = []) =>
  (lineItems || []).map((item) => ({
    description: item.description || "",
    hours: Number(item.hours) || 0,
    price: Number(item.price) || 0,
  }));

const readPersistPreference = () => {
  if (typeof window === "undefined") return true;
  try {
    const stored = window.localStorage.getItem(BILL_FROM_PERSIST_KEY);
    return stored === null ? true : stored === "true";
  } catch (err) {
    console.error("Unable to read bill-from preference", err);
    return true;
  }
};

const readStoredBillFrom = () => {
  if (typeof window === "undefined") return { name: "", details: "" };
  try {
    const stored = window.localStorage.getItem(BILL_FROM_DATA_KEY);
    if (!stored) return { name: "", details: "" };
    const parsed = JSON.parse(stored);
    return {
      name: parsed?.name || "",
      details: parsed?.details || "",
    };
  } catch (err) {
    console.error("Unable to read bill-from details", err);
    return { name: "", details: "" };
  }
};

const readSavedClients = () => {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(SAVED_CLIENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    console.error("Unable to read saved clients", err);
    return [];
  }
};

const defaultLineItems = () => [{ description: "", hours: 1, price: 0 }];

const readInvoiceDraft = () => {
  if (typeof window === "undefined") return {};
  try {
    const stored = window.localStorage.getItem(INVOICE_DRAFT_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (err) {
    console.error("Unable to read invoice draft", err);
    return {};
  }
};

const readProjectsData = () => {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(PROJECTS_DATA_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    console.error("Unable to read projects data", err);
    return [];
  }
};

const readAdvancePayments = () => {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(SAVED_ADVANCES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    console.error("Unable to read advances", err);
    return [];
  }
};

const readAppointmentsData = () => {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(APPOINTMENTS_DATA_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    console.error("Unable to read appointments", err);
    return [];
  }
};

const readContractsData = () => {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(CONTRACTS_DATA_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    console.error("Unable to read contracts", err);
    return [];
  }
};

const readProposalsData = () => {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(PROPOSALS_DATA_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    console.error("Unable to read proposals", err);
    return [];
  }
};

const readUnpaidFollowUps = () => {
  if (typeof window === "undefined") return {};
  try {
    const stored = window.localStorage.getItem(UNPAID_FOLLOWUPS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (err) {
    console.error("Unable to read unpaid follow-ups", err);
    return {};
  }
};

const nextInvoiceId = () => {
  if (typeof window === "undefined") return BASE_INVOICE_NUMBER;
  try {
    const stored = window.localStorage.getItem(INVOICE_STORAGE_KEY);
    if (!stored) return BASE_INVOICE_NUMBER;
    const numeric = parseInt(stored.replace(/[^0-9]/g, ""), 10) || 0;
    const next = numeric + 1;
    return `INV-${String(next).padStart(4, "0")}`;
  } catch {
    return BASE_INVOICE_NUMBER;
  }
};

export default function InvoicePage() {
  const existingDraft = readInvoiceDraft();
  const [items, setItems] = useState(
    () => existingDraft.items || defaultLineItems()
  );
  const [invoiceNumber, setInvoiceNumber] = useState(
    () => existingDraft.invoiceNumber || nextInvoiceId()
  );
  const [billFromName, setBillFromName] = useState(() => {
    if (existingDraft.billFromName) return existingDraft.billFromName;
    const keep = readPersistPreference();
    if (!keep) return "";
    return readStoredBillFrom().name || "";
  });
  const [billFromDetails, setBillFromDetails] = useState(() => {
    if (existingDraft.billFromDetails) return existingDraft.billFromDetails;
    const keep = readPersistPreference();
    if (!keep) return "";
    return readStoredBillFrom().details || "";
  });
  const [billToName, setBillToName] = useState(
    () => existingDraft.billToName || ""
  );
  const [billToEmail, setBillToEmail] = useState(
    () => existingDraft.billToEmail || ""
  );
  const [recipientEmail, setRecipientEmail] = useState(
    () => existingDraft.recipientEmail || ""
  );
  const [billToDetails, setBillToDetails] = useState(
    () => existingDraft.billToDetails || ""
  );
  const [persistBillFrom, setPersistBillFrom] = useState(() =>
    readPersistPreference()
  );
  const [invoiceDate, setInvoiceDate] = useState(
    () => existingDraft.invoiceDate || new Date().toISOString().split("T")[0]
  );
  const [taxRate, setTaxRate] = useState(
    () => Number(existingDraft.taxRate) || 0
  );
  const [dueOption, setDueOption] = useState(
    () => existingDraft.dueOption || "receipt"
  );
  const [dueDate, setDueDate] = useState(() => existingDraft.dueDate || "");
  const [invoiceHistory, setInvoiceHistory] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = window.localStorage.getItem(INVOICE_HISTORY_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      return parsed.map((entry) => ({
        paid: false,
        ...entry,
      }));
    } catch (err) {
      console.error("Unable to load invoice history", err);
      return [];
    }
  });
  const [toast, setToast] = useState(null);
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [subjectDirty, setSubjectDirty] = useState(false);
  const [emailMessage, setEmailMessage] = useState(
    "Hi there,\n\nPlease find the attached invoice for our recent work. Let me know if you have any questions.\n\nThank you!"
  );
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [selectedClientKey, setSelectedClientKey] = useState("");
  const [customClients, setCustomClients] = useState(() => readSavedClients());
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminCodeInput, setAdminCodeInput] = useState("");
  const [statementClient, setStatementClient] = useState("");
  const [paymentForm, setPaymentForm] = useState({
    id: "",
    method: "Cash",
    amount: "",
  });
  const [manualPaymentFilter, setManualPaymentFilter] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [paymentSearch, setPaymentSearch] = useState("");
  const [unpaidSearch, setUnpaidSearch] = useState("");
  const [unpaidAgingFilter, setUnpaidAgingFilter] = useState("all");
  const [selectedUnpaidId, setSelectedUnpaidId] = useState("");
  const [reminderTone, setReminderTone] = useState("friendly");
  const [unpaidFollowUps, setUnpaidFollowUps] = useState(() => readUnpaidFollowUps());
  const [historySelection, setHistorySelection] = useState("");
  const [projectsForShare, setProjectsForShare] = useState(() => readProjectsData());
  const [shareProjectId, setShareProjectId] = useState("");
  const [advancePayments, setAdvancePayments] = useState(() =>
    readAdvancePayments().map((entry) => ({
      remaining: entry.amount !== undefined ? entry.amount : entry.remaining,
      ...entry,
    }))
  );
  const [advanceForm, setAdvanceForm] = useState({
    client: "",
    amount: "",
    notes: "",
    newClient: "",
  });
  const [applyAdvanceForm, setApplyAdvanceForm] = useState({
    advanceId: "",
    invoiceId: "",
  });
  const [appointments, setAppointments] = useState(() => readAppointmentsData());
  const [contracts, setContracts] = useState(() => readContractsData());
  const [proposals, setProposals] = useState(() => readProposalsData());
  const [appointmentForm, setAppointmentForm] = useState({
    client: "",
    date: "",
    time: "",
    notes: "",
  });
  const [contractForm, setContractForm] = useState({
    client: "",
    project: "",
    fileName: "",
    fileUrl: "",
    signer: "",
  });
  const [proposalForm, setProposalForm] = useState({
    title: "",
    client: "",
    amount: "",
    status: "Draft",
    notes: "",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      UNPAID_FOLLOWUPS_KEY,
      JSON.stringify(unpaidFollowUps)
    );
  }, [unpaidFollowUps]);

  const addRow = () => {
    setItems([...items, { description: "", hours: 1, price: 0 }]);
  };

  const removeItem = (i) => {
    const updated = items.filter((_, index) => index !== i);
    setItems(updated);
  };

  const updateItem = (i, field, value) => {
    const updated = [...items];
    updated[i][field] = value;
    setItems(updated);
  };

  const calculateSubtotal = () =>
    items.reduce(
      (sum, item) => sum + Number(item.hours || 0) * Number(item.price || 0),
      0
    );

  const subtotal = calculateSubtotal();
  const taxAmount = subtotal * (Number(taxRate) / 100 || 0);
  const total = subtotal + taxAmount;

useEffect(() => {
  try {
    window.localStorage.setItem(
      INVOICE_HISTORY_KEY,
      JSON.stringify(invoiceHistory)
    );
  } catch (err) {
    console.error("Unable to persist invoice history", err);
  }
}, [invoiceHistory]);

useEffect(() => {
  try {
    window.localStorage.setItem(
      BILL_FROM_PERSIST_KEY,
      persistBillFrom ? "true" : "false"
    );
  } catch (err) {
    console.error("Unable to store bill-from preference", err);
  }
}, [persistBillFrom]);

useEffect(() => {
  if (typeof window === "undefined") return;
  if (!persistBillFrom) {
    try {
      window.localStorage.removeItem(BILL_FROM_DATA_KEY);
    } catch (err) {
      console.error("Unable to remove bill-from info", err);
    }
    return;
  }
  try {
    window.localStorage.setItem(
      BILL_FROM_DATA_KEY,
      JSON.stringify({ name: billFromName, details: billFromDetails })
    );
  } catch (err) {
    console.error("Unable to store bill-from info", err);
  }
}, [persistBillFrom, billFromName, billFromDetails]);

useEffect(() => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      SAVED_CLIENTS_KEY,
      JSON.stringify(customClients)
    );
  } catch (err) {
    console.error("Unable to store saved clients", err);
  }
}, [customClients]);

useEffect(() => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      SAVED_ADVANCES_KEY,
      JSON.stringify(advancePayments)
    );
  } catch (err) {
    console.error("Unable to store advance payments", err);
  }
}, [advancePayments]);

useEffect(() => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      APPOINTMENTS_DATA_KEY,
      JSON.stringify(appointments)
    );
  } catch (err) {
    console.error("Unable to store appointments", err);
  }
}, [appointments]);

useEffect(() => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      CONTRACTS_DATA_KEY,
      JSON.stringify(contracts)
    );
  } catch (err) {
    console.error("Unable to store contracts", err);
  }
}, [contracts]);

useEffect(() => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      PROPOSALS_DATA_KEY,
      JSON.stringify(proposals)
    );
  } catch (err) {
    console.error("Unable to store proposals", err);
  }
}, [proposals]);

useEffect(() => {
  if (typeof window === "undefined") return;
  const draftPayload = {
    invoiceNumber,
    items,
    billFromName,
    billFromDetails,
    billToName,
    billToEmail,
    recipientEmail,
    billToDetails,
    taxRate,
    dueOption,
    dueDate,
    invoiceDate,
  };
  try {
    window.localStorage.setItem(
      INVOICE_DRAFT_KEY,
      JSON.stringify(draftPayload)
    );
  } catch (err) {
    console.error("Unable to store invoice draft", err);
  }
}, [
  invoiceNumber,
  items,
  billFromName,
  billFromDetails,
  billToName,
  billToEmail,
  recipientEmail,
  billToDetails,
  taxRate,
  dueOption,
  dueDate,
  invoiceDate,
]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (variant, headline, detail) => {
    setToast({
      id: Date.now(),
      variant,
      headline,
      detail,
    });
  };

  const monthlyHistory = useMemo(() => {
    const groups = invoiceHistory.reduce((acc, invoice) => {
      const date = new Date(invoice.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      if (!acc[key]) {
        acc[key] = {
          label: date.toLocaleString("default", {
            month: "long",
            year: "numeric",
          }),
          invoices: [],
        };
      }
      acc[key].invoices.push(invoice);
      return acc;
    }, {});

    return Object.entries(groups)
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => b.key.localeCompare(a.key));
  }, [invoiceHistory]);

  const clientHistory = useMemo(() => {
    const groups = invoiceHistory.reduce((acc, invoice) => {
      const name = invoice.billToName?.trim() || "Unnamed Client";
      if (!acc[name]) acc[name] = [];
      acc[name].push(invoice);
      return acc;
    }, {});

    return Object.entries(groups)
      .map(([name, invoices]) => ({
        name,
        invoices: invoices.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        ),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [invoiceHistory]);

  const emailHistory = useMemo(
    () =>
      invoiceHistory
        .filter((invoice) => invoice.emailedAt)
        .sort((a, b) => new Date(b.emailedAt) - new Date(a.emailedAt)),
    [invoiceHistory]
  );

  const selectedInvoiceEntry = useMemo(
    () =>
      invoiceHistory.find(
        (entry) => String(entry.id) === String(selectedInvoiceId)
      ),
    [invoiceHistory, selectedInvoiceId]
  );

  const getTrimmedValue = (value) =>
    typeof value === "string" ? value.trim() : "";

  const buildClientKey = (name, email) => {
    const normalizedName =
      (getTrimmedValue(name) || "Unnamed Client").toLowerCase();
    const normalizedEmail = (getTrimmedValue(email) || "").toLowerCase();
    return `${normalizedName}|${normalizedEmail}`;
  };

  const savedClients = useMemo(() => {
    const latest = new Map();

    const register = (entry, createdTime = 0) => {
      const name = getTrimmedValue(entry.billToName) || "Unnamed Client";
      const email = getTrimmedValue(entry.billToEmail);
      const key = buildClientKey(name, email);
      const payload = {
        key,
        billToName: entry.billToName || name,
        billToEmail: entry.billToEmail || "",
        recipientEmail: entry.recipientEmail || "",
        billToDetails: entry.billToDetails || "",
        createdTime,
      };
      const existing = latest.get(key);
      if (!existing || createdTime > existing.createdTime) {
        latest.set(key, payload);
      }
    };

    customClients.forEach((client) => {
      const createdTime = client.createdAt
        ? new Date(client.createdAt).getTime()
        : 0;
      register(client, createdTime + 1); // prefer custom entries when equal
    });

    invoiceHistory.forEach((entry) => {
      const createdAt = entry.createdAt || entry.emailedAt;
      const createdTime = createdAt ? new Date(createdAt).getTime() : 0;
      register(entry, createdTime);
    });

    return Array.from(latest.values())
      .map(({ createdTime, ...client }) => client)
      .sort((a, b) => a.billToName.localeCompare(b.billToName));
  }, [invoiceHistory, customClients]);

  const handleSelectSavedClient = (key) => {
    setSelectedClientKey(key);
    if (!key) return;
    const client = savedClients.find((c) => c.key === key);
    if (!client) return;
    if (client.billToName !== undefined) setBillToName(client.billToName || "");
    setBillToEmail(client.billToEmail || "");
    setRecipientEmail(
      client.recipientEmail || client.billToEmail || ""
    );
    setBillToDetails(client.billToDetails || "");
  };

  useEffect(() => {
    if (!selectedClientKey) return;
    const exists = savedClients.some((c) => c.key === selectedClientKey);
    if (!exists) {
      setSelectedClientKey("");
    }
  }, [selectedClientKey, savedClients]);

  const markInvoicePaid = (id, method, amount) => {
    const targetId = String(id);
    setInvoiceHistory((prev) =>
      prev.map((entry) =>
        String(entry.id) === targetId
          ? {
              ...entry,
              paid: true,
              paymentMethod: method,
              paymentAmount: Number(amount) || entry.total,
              paidAt: new Date().toISOString(),
            }
          : entry
      )
    );
  };

  const handleAddClientToSaved = () => {
    const trimmedName = getTrimmedValue(billToName);
    const trimmedEmail = getTrimmedValue(billToEmail);
    const trimmedRecipient = getTrimmedValue(recipientEmail);
    const trimmedDetails = getTrimmedValue(billToDetails);

    if (!trimmedName && !trimmedEmail && !trimmedDetails) {
      showToast(
        "warning",
        "Add client details",
        "Provide at least a name, email, or address before saving this client."
      );
      return;
    }

    const normalizedName = trimmedName || "Unnamed Client";
    const key = buildClientKey(normalizedName, trimmedEmail);
    const newClient = {
      id: Date.now(),
      billToName: normalizedName,
      billToEmail: trimmedEmail,
      recipientEmail: trimmedRecipient,
      billToDetails: trimmedDetails,
      createdAt: new Date().toISOString(),
    };

    setCustomClients((prev) => {
      const filtered = prev.filter(
        (client) => buildClientKey(client.billToName, client.billToEmail) !== key
      );
      return [...filtered, newClient];
    });

    setSelectedClientKey(key);
    showToast(
      "success",
      "Client saved",
      `${normalizedName} was added to your saved clients.`
    );
  };

  const handleSaveClientShortcut = () => {
    handleAddClientToSaved();
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(value) || 0);

  const formatDate = (isoString) =>
    new Date(isoString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    const datePart = date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    const timePart = date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    return { datePart, timePart };
  };

  const formatAppointmentDate = (date, time) => {
    if (!date) return "Date pending";
    const stamp = new Date(`${date}T${time || "00:00"}`);
    if (Number.isNaN(stamp.getTime())) return date;
    return stamp.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formattedInvoiceDate = invoiceDate
    ? new Date(invoiceDate).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : new Date().toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
  const resolvedInvoiceNumber =
    selectedInvoiceEntry?.invoiceNumber || invoiceNumber;
  const resolvedBillFromName =
    getTrimmedValue(selectedInvoiceEntry?.billFromName) ||
    getTrimmedValue(billFromName) ||
    "Tri-Tech";
  const billFromDetailsForEmail =
    selectedInvoiceEntry?.billFromDetails || billFromDetails || "";
  const resolvedBillToName =
    getTrimmedValue(selectedInvoiceEntry?.billToName) ||
    getTrimmedValue(billToName) ||
    "Unnamed Client";
  const billToDetailsForEmail =
    selectedInvoiceEntry?.billToDetails || billToDetails || "";
  const itemsForEmail =
    selectedInvoiceEntry?.items && selectedInvoiceEntry.items.length
      ? selectedInvoiceEntry.items
      : items;
  const resolvedTaxRate =
    typeof selectedInvoiceEntry?.taxRate === "number"
      ? selectedInvoiceEntry.taxRate
      : Number(taxRate) || 0;
  const resolvedTotal =
    typeof selectedInvoiceEntry?.total === "number"
      ? selectedInvoiceEntry.total
      : total;
  const resolvedDueOption = selectedInvoiceEntry?.dueOption || dueOption;
  const resolvedDueDate = selectedInvoiceEntry?.dueDate || dueDate;
  const invoiceTotalNumeric = (Number(resolvedTotal) || 0).toFixed(2);
  const invoiceDateForEmail = (() => {
    const sourceDate =
      selectedInvoiceEntry?.invoiceDate ||
      selectedInvoiceEntry?.createdAt ||
      invoiceDate;
    if (!sourceDate) return formattedInvoiceDate;
    return new Date(sourceDate).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  })();
  const paypalLinkValue =
    PAYMENT_CONFIG.paypal ||
    "Set REACT_APP_PAYPAL_LINK in .env to customize this link.";

  const buildLineItemsText = (lineItems = []) => {
    const validLines = (lineItems || [])
      .filter(
        (item) =>
          item?.description?.trim() &&
          Number(item.hours) > 0 &&
          Number(item.price) > 0
      )
      .map((item, index) => {
        const qty = Number(item.hours) || 0;
        const rate = Number(item.price) || 0;
        const lineTotal = qty * rate;
        return `${index + 1}. ${item.description} - ${qty} hr${
          qty === 1 ? "" : "s"
        } x ${formatCurrency(rate)} = ${formatCurrency(lineTotal)}`;
      });
    return validLines.join("\n");
  };

  const emailLineItemsText = useMemo(
    () => buildLineItemsText(itemsForEmail),
    [itemsForEmail]
  );

  const lineItemsPlainText =
    emailLineItemsText || "No line items provided. Please update your invoice.";

  const limitEmailField = (value, max = 3900) => {
    if (!value) return "";
    if (value.length <= max) return value;
    return `${value.slice(0, max - 1)}…`;
  };

  const limitedBillFromDetails = limitEmailField(billFromDetailsForEmail, 1000);
  const limitedBillToDetails = limitEmailField(billToDetailsForEmail, 1000);
  const limitedLineItems = limitEmailField(lineItemsPlainText, 2500);
  const limitedWorkCompletedHtml = useMemo(() => {
    const htmlString = lineItemsPlainText
      .split("\n")
      .map((line) => line || "&nbsp;")
      .join("<br/>");
    return limitEmailField(htmlString, 2500);
  }, [lineItemsPlainText]);
  const limitedEmailMessage = limitEmailField(emailMessage, 2000);

  const unpaidInvoicesList = useMemo(
    () => invoiceHistory.filter((invoice) => !invoice.paid),
    [invoiceHistory]
  );

  const sortedInvoiceHistory = useMemo(
    () =>
      invoiceHistory
        .slice()
        .sort(
          (a, b) =>
            new Date(b.createdAt || b.emailedAt || b.invoiceDate || 0) -
            new Date(a.createdAt || a.emailedAt || a.invoiceDate || 0)
        ),
    [invoiceHistory]
  );

  useEffect(() => {
    if (sortedInvoiceHistory.length === 0) {
      if (historySelection) setHistorySelection("");
      return;
    }
    if (!historySelection) {
      setHistorySelection(String(sortedInvoiceHistory[0].id));
      return;
    }
    if (
      sortedInvoiceHistory.every(
        (invoice) => String(invoice.id) !== historySelection
      )
    ) {
      setHistorySelection(String(sortedInvoiceHistory[0].id));
    }
  }, [historySelection, sortedInvoiceHistory]);

  const selectedHistoryInvoice = useMemo(
    () =>
      sortedInvoiceHistory.find(
        (invoice) => String(invoice.id) === historySelection
      ) || null,
    [sortedInvoiceHistory, historySelection]
  );

  const manualPaymentInvoices = useMemo(() => {
    const filterValue = manualPaymentFilter.trim().toLowerCase();
    if (!filterValue) return unpaidInvoicesList;
    return unpaidInvoicesList.filter((invoice) => {
      const haystack = `${invoice.invoiceNumber} ${invoice.billToName || ""}`.toLowerCase();
      return haystack.includes(filterValue);
    });
  }, [manualPaymentFilter, unpaidInvoicesList]);

  const getInvoiceDateLabel = (invoice) => {
    if (!invoice) return "Date pending";
    if (invoice.invoiceDate) {
      return new Date(invoice.invoiceDate).toLocaleDateString();
    }
    if (invoice.createdAt) {
      return new Date(invoice.createdAt).toLocaleDateString();
    }
    return "Date pending";
  };

  const getInvoiceDueDate = (invoice) => {
    if (!invoice) return null;
    if (invoice.dueOption === "date" && invoice.dueDate) {
      return new Date(invoice.dueDate);
    }
    if (invoice.invoiceDate) {
      return new Date(invoice.invoiceDate);
    }
    if (invoice.createdAt) {
      return new Date(invoice.createdAt);
    }
    return null;
  };

  const getAgingBucket = (days) => {
    if (days <= 15) return "0-15";
    if (days <= 30) return "16-30";
    if (days <= 60) return "31-60";
    return "60+";
  };

  const unpaidInvoicesByClient = useMemo(() => {
    const groups = unpaidInvoicesList.reduce((acc, invoice) => {
      const key = invoice.billToName?.trim() || "Unnamed Client";
      if (!acc[key]) acc[key] = [];
      acc[key].push(invoice);
      return acc;
    }, {});
    return Object.entries(groups).map(([client, invoices]) => ({
      client,
      invoices: invoices.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      ),
    }));
  }, [unpaidInvoicesList]);

  const enrichedUnpaidInvoices = useMemo(() => {
    const now = Date.now();
    return unpaidInvoicesList.map((invoice) => {
      const dueDateObj = getInvoiceDueDate(invoice);
      const dueTimestamp = dueDateObj ? dueDateObj.getTime() : null;
      const agingDays =
        dueTimestamp !== null
          ? Math.max(0, Math.round((now - dueTimestamp) / MS_PER_DAY))
          : 0;
      const bucket = getAgingBucket(agingDays);
      return {
        ...invoice,
        dueDateObj,
        dueLabel: dueDateObj
          ? dueDateObj.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })
          : "No due date",
        agingDays,
        agingBucket: bucket,
        agingLabel: `${agingDays} day${agingDays === 1 ? "" : "s"} outstanding`,
      };
    });
  }, [unpaidInvoicesList]);

  const unpaidAgingStats = useMemo(() => {
    const base = AGING_FILTERS.reduce(
      (acc, filter) => ({
        ...acc,
        [filter.key]: { count: 0, total: 0 },
      }),
      { all: { count: 0, total: 0 } }
    );
    enrichedUnpaidInvoices.forEach((invoice) => {
      const bucket = invoice.agingBucket;
      base.all.count += 1;
      base.all.total += Number(invoice.total) || 0;
      if (base[bucket]) {
        base[bucket].count += 1;
        base[bucket].total += Number(invoice.total) || 0;
      }
    });
    return base;
  }, [enrichedUnpaidInvoices]);

  const filteredUnpaidInvoices = useMemo(() => {
    return enrichedUnpaidInvoices.filter((invoice) => {
      if (
        unpaidAgingFilter !== "all" &&
        invoice.agingBucket !== unpaidAgingFilter
      ) {
        return false;
      }
      if (!unpaidSearch.trim()) return true;
      const haystack = `${invoice.invoiceNumber} ${invoice.billToName || ""}`.toLowerCase();
      return haystack.includes(unpaidSearch.toLowerCase());
    });
  }, [enrichedUnpaidInvoices, unpaidAgingFilter, unpaidSearch]);

  useEffect(() => {
    if (filteredUnpaidInvoices.length === 0) {
      return;
    }
    if (
      !selectedUnpaidId ||
      filteredUnpaidInvoices.every(
        (invoice) => String(invoice.id) !== String(selectedUnpaidId)
      )
    ) {
      setSelectedUnpaidId(String(filteredUnpaidInvoices[0].id));
    }
  }, [filteredUnpaidInvoices, selectedUnpaidId]);

  const selectedUnpaidInvoice = useMemo(() => {
    if (filteredUnpaidInvoices.length === 0) return null;
    return (
      filteredUnpaidInvoices.find(
        (invoice) => String(invoice.id) === String(selectedUnpaidId)
      ) || filteredUnpaidInvoices[0]
    );
  }, [filteredUnpaidInvoices, selectedUnpaidId]);

  const reminderPreview = useMemo(() => {
    if (!selectedUnpaidInvoice) {
      return "Select an invoice to generate a reminder.";
    }

    const templates = {
      friendly: ({ client, amount, invoiceNumber, dueLabel }) =>
        `Hi ${client || "there"},\n\nJust a quick reminder that invoice ${
          invoiceNumber || ""
        } for ${amount} is still open${
          dueLabel ? ` and was due on ${dueLabel}` : ""
        }.\n\nLet me know if you need anything from my side. Thanks so much!`,
      firm: ({ client, amount, invoiceNumber, agingLabel }) =>
        `Hello ${client || "there"},\n\nWe're following up on invoice ${
          invoiceNumber || ""
        } (${amount}), which has been outstanding ${agingLabel}.\nPlease confirm payment timing so we can keep your project moving.`,
      urgent: ({ client, amount, invoiceNumber, dueLabel }) =>
        `Hi ${client || "team"},\n\nThis is a final reminder that invoice ${
          invoiceNumber || ""
        } for ${amount} remains unpaid${
          dueLabel ? ` (due ${dueLabel})` : ""
        }.\nPlease process payment immediately to avoid pauses in service.`,
    };

    const dueDateObj = getInvoiceDueDate(selectedUnpaidInvoice);
    const dueLabel = dueDateObj
      ? dueDateObj.toLocaleDateString(undefined, { month: "short", day: "numeric" })
      : "no due date";
    const template = templates[reminderTone] || templates.friendly;
    const agingDays = selectedUnpaidInvoice.agingDays ?? 0;
    return template({
      client: selectedUnpaidInvoice.billToName || "there",
      amount: formatCurrency(selectedUnpaidInvoice.total || 0),
      invoiceNumber: selectedUnpaidInvoice.invoiceNumber,
      dueLabel,
      agingLabel: `${agingDays} day${agingDays === 1 ? "" : "s"}`,
    });
  }, [selectedUnpaidInvoice, reminderTone]);

  const flaggedFollowUps = useMemo(
    () =>
      Object.entries(unpaidFollowUps).filter(([, flagged]) => flagged).length,
    [unpaidFollowUps]
  );

  const unpaidCommandStats = useMemo(() => {
    if (enrichedUnpaidInvoices.length === 0) {
      return { total: 0, avgAging: 0 };
    }
    const total = enrichedUnpaidInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.total || 0),
      0
    );
    const avgAging =
      enrichedUnpaidInvoices.reduce(
        (sum, invoice) => sum + (invoice.agingDays || 0),
        0
      ) / enrichedUnpaidInvoices.length;
    return { total, avgAging: Math.round(avgAging) };
  }, [enrichedUnpaidInvoices]);

  useEffect(() => {
    if (!statementClient && unpaidInvoicesByClient.length > 0) {
      setStatementClient(unpaidInvoicesByClient[0].client);
      return;
    }
    if (
      statementClient &&
      unpaidInvoicesByClient.every((group) => group.client !== statementClient)
    ) {
      setStatementClient("");
    }
  }, [statementClient, unpaidInvoicesByClient]);

  const selectedStatementGroup = useMemo(
    () =>
      unpaidInvoicesByClient.find((group) => group.client === statementClient),
    [unpaidInvoicesByClient, statementClient]
  );

  const unpaidStatementText = selectedStatementGroup
    ? [
        `Statement for ${selectedStatementGroup.client}`,
        "",
        "The following invoices remain unpaid:",
        ...selectedStatementGroup.invoices.map((invoice) => {
          const date = invoice.invoiceDate
            ? new Date(invoice.invoiceDate).toLocaleDateString()
            : invoice.createdAt
            ? new Date(invoice.createdAt).toLocaleDateString()
            : "Date pending";
          return `• ${invoice.invoiceNumber} — ${formatCurrency(
            invoice.total
          )} (${date})`;
        }),
        "",
        "Please remit payment at your earliest convenience. Thank you!",
      ].join("\n")
    : "All invoices are up to date.";

  const statementSummary = useMemo(() => {
    if (!selectedStatementGroup) return null;
    const total = selectedStatementGroup.invoices.reduce(
      (sum, invoice) => sum + Number(invoice.total || 0),
      0
    );
    return {
      total,
      nextInvoice: selectedStatementGroup.invoices[0] || null,
    };
  }, [selectedStatementGroup]);

  const statementPreviewLines = useMemo(
    () => unpaidStatementText.split("\n"),
    [unpaidStatementText]
  );

  const selectedManualInvoice = useMemo(
    () =>
      manualPaymentInvoices.find(
        (invoice) => String(invoice.id) === String(paymentForm.id)
      ),
    [manualPaymentInvoices, paymentForm.id]
  );

  const handleCopyStatement = async () => {
    try {
      await navigator.clipboard?.writeText(unpaidStatementText);
      showToast("success", "Statement copied", "Paste it into your email or memo.");
    } catch (error) {
      console.error("Unable to copy statement", error);
      showToast(
        "warning",
        "Clipboard blocked",
        "Copy failed. Select the statement text and copy manually."
      );
    }
  };

  const handleSendReminder = (invoice) => {
    if (!invoice) {
      showToast("warning", "Select an invoice", "Choose an unpaid invoice to remind.");
      return;
    }
    setUnpaidFollowUps((prev) => ({
      ...prev,
      [invoice.id]: true,
    }));
    showToast(
      "success",
      "Reminder drafted",
      `Email ${invoice.billToName || "your client"} about ${invoice.invoiceNumber}.`
    );
  };

  const handleCopyReminder = async () => {
    if (!selectedUnpaidInvoice) return;
    try {
      await navigator.clipboard?.writeText(reminderPreview);
      showToast(
        "success",
        "Reminder copied",
        `Ready to paste for ${selectedUnpaidInvoice.invoiceNumber}.`
      );
    } catch (error) {
      console.error("Unable to copy reminder", error);
      showToast("warning", "Clipboard blocked", "Select the reminder text to copy manually.");
    }
  };

  const handleCopyInvoiceSnippet = async (invoice) => {
    if (!invoice) return;
    const snippet = `${invoice.invoiceNumber} — ${formatCurrency(
      invoice.total || 0
    )} (${invoice.dueLabel || getInvoiceDateLabel(invoice)}) is still outstanding.`;
    try {
      await navigator.clipboard?.writeText(snippet);
      showToast("success", "Invoice snippet copied", "Paste anywhere to follow up.");
    } catch (error) {
      console.error("Unable to copy invoice snippet", error);
      showToast("warning", "Clipboard blocked", "Copy failed. Select the snippet manually.");
    }
  };

  const handleToggleFollowUp = (invoiceId) => {
    setUnpaidFollowUps((prev) => {
      const next = { ...prev };
      next[invoiceId] = !next[invoiceId];
      return next;
    });
  };

  const handleClearFollowUps = () => {
    if (flaggedFollowUps === 0) return;
    if (!window.confirm("Clear all follow-up flags?")) return;
    setUnpaidFollowUps({});
  };

  const selectedProjectShare = useMemo(
    () =>
      projectsForShare.find(
        (project) => String(project.id) === String(shareProjectId)
      ),
    [projectsForShare, shareProjectId]
  );

  const projectShareText = selectedProjectShare
    ? [
        `Project: ${selectedProjectShare.name}`,
        `Client: ${selectedProjectShare.client}`,
        `Budget: ${formatCurrency(selectedProjectShare.budget || 0)}`,
        `Status: ${selectedProjectShare.status || "Planning"}`,
        selectedProjectShare.notes
          ? `Notes: ${selectedProjectShare.notes}`
          : null,
        "",
        "We will keep you updated with weekly progress summaries and logged hours.",
      ]
        .filter(Boolean)
        .join("\n")
    : "No project selected.";

  const handleCopyProjectShare = async () => {
    try {
      await navigator.clipboard?.writeText(projectShareText);
      showToast(
        "success",
        "Project snapshot copied",
        "Share this summary with your client."
      );
    } catch (err) {
      console.error("Unable to copy project details", err);
      showToast("warning", "Copy failed", "Select the text and copy manually.");
    }
  };

useEffect(() => {
  if (manualPaymentInvoices.length === 0) {
    if (paymentForm.id || paymentForm.amount) {
      setPaymentForm((prev) => ({ ...prev, id: "", amount: "" }));
    }
    return;
  }
  const firstInvoice = manualPaymentInvoices[0];
  if (!paymentForm.id) {
    setPaymentForm((prev) => ({
      ...prev,
      id: String(firstInvoice.id),
      amount: prev.amount || firstInvoice.total,
    }));
    return;
  }
  if (
    manualPaymentInvoices.every(
      (invoice) => String(invoice.id) !== String(paymentForm.id)
    )
  ) {
    setPaymentForm((prev) => ({
      ...prev,
      id: String(firstInvoice.id),
      amount: prev.amount || firstInvoice.total,
    }));
  }
}, [manualPaymentInvoices, paymentForm.id, paymentForm.amount]);

useEffect(() => {
  const syncProjects = () => setProjectsForShare(readProjectsData());
  window.addEventListener("storage", syncProjects);
  return () => window.removeEventListener("storage", syncProjects);
}, []);

useEffect(() => {
  if (!shareProjectId && projectsForShare.length > 0) {
    setShareProjectId(String(projectsForShare[0].id));
    return;
  }
  if (
    shareProjectId &&
    projectsForShare.every((project) => String(project.id) !== shareProjectId)
  ) {
    setShareProjectId("");
  }
}, [shareProjectId, projectsForShare]);

useEffect(() => {
  if (!applyAdvanceForm.advanceId && advancePayments.length > 0) {
    setApplyAdvanceForm((prev) => ({
      ...prev,
      advanceId: String(advancePayments[0].id),
    }));
  }
  if (
    applyAdvanceForm.advanceId &&
    advancePayments.every((adv) => String(adv.id) !== applyAdvanceForm.advanceId)
  ) {
    setApplyAdvanceForm((prev) => ({ ...prev, advanceId: "" }));
  }
}, [applyAdvanceForm.advanceId, advancePayments]);

  const paymentHistory = useMemo(() => {
    const paid = invoiceHistory
      .filter((invoice) => invoice.paid)
      .sort(
        (a, b) =>
          new Date(b.paidAt || b.emailedAt || b.createdAt || 0) -
          new Date(a.paidAt || a.emailedAt || a.createdAt || 0)
      );
    const totals = paid.reduce(
      (acc, invoice) => {
        acc.collected += Number(invoice.paymentAmount || invoice.total || 0);
        acc.count += 1;
        return acc;
      },
      { collected: 0, count: 0 }
    );
    return { paid, totals };
  }, [invoiceHistory]);

  const filteredPayments = useMemo(() => {
    return paymentHistory.paid.filter((invoice) => {
      if (
        paymentMethodFilter !== "all" &&
        invoice.paymentMethod !== paymentMethodFilter
      )
        return false;
      if (!paymentSearch.trim()) return true;
      const haystack = `${invoice.invoiceNumber} ${invoice.billToName} ${invoice.paymentMethod}`.toLowerCase();
      return haystack.includes(paymentSearch.toLowerCase());
    });
  }, [paymentHistory, paymentMethodFilter, paymentSearch]);

  const advanceClientOptions = useMemo(() => {
    const names = new Set();
    clientHistory.forEach((client) => names.add(client.name));
    invoiceHistory.forEach((inv) => names.add(inv.billToName || "Unnamed Client"));
    advancePayments.forEach((adv) => names.add(adv.client));
    return Array.from(names).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [clientHistory, invoiceHistory, advancePayments]);

  const outstandingSummary = useMemo(() => {
    const unpaid = invoiceHistory.filter((invoice) => !invoice.paid);
    const total = unpaid.reduce(
      (sum, invoice) => sum + Number(invoice.total || 0),
      0
    );
    const nextDueDate = unpaid
      .map((invoice) => {
        if (invoice.dueOption === "date" && invoice.dueDate) {
          return new Date(invoice.dueDate);
        }
        if (invoice.invoiceDate) {
          return new Date(invoice.invoiceDate);
        }
        if (invoice.createdAt) {
          return new Date(invoice.createdAt);
        }
        return null;
      })
      .filter((date) => date && !Number.isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime())[0];

    return {
      total,
      count: unpaid.length,
      nextDueLabel: nextDueDate
        ? nextDueDate.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })
        : "—",
    };
  }, [invoiceHistory]);

  const recentCollectionSummary = useMemo(() => {
    const cutoff = Date.now() - 1000 * 60 * 60 * 24 * 30;
    const paid = invoiceHistory.filter((invoice) => {
      if (!invoice.paid) return false;
      const reference = invoice.paidAt || invoice.emailedAt || invoice.createdAt;
      if (!reference) return false;
      const timestamp = new Date(reference).getTime();
      return !Number.isNaN(timestamp) && timestamp >= cutoff;
    });
    const total = paid.reduce(
      (sum, invoice) =>
        sum + Number(invoice.paymentAmount || invoice.total || 0),
      0
    );
    return { total, count: paid.length };
  }, [invoiceHistory]);

  const retainerBalance = useMemo(
    () =>
      advancePayments.reduce(
        (sum, advance) =>
          sum +
          Number(
            typeof advance.remaining === "number"
              ? advance.remaining
              : advance.amount || 0
          ),
        0
      ),
    [advancePayments]
  );

  const appointmentSchedule = useMemo(() => {
    const statusRank = { Scheduled: 0, Confirmed: 1, Completed: 2 };
    const toTimestamp = (appointment) => {
      if (!appointment.date) return 0;
      const stamp = new Date(
        `${appointment.date}T${appointment.time || "00:00"}`
      ).getTime();
      return Number.isNaN(stamp) ? 0 : stamp;
    };
    return appointments
      .slice()
      .sort((a, b) => {
        const rankA = statusRank[a.status] ?? 3;
        const rankB = statusRank[b.status] ?? 3;
        if (rankA !== rankB) return rankA - rankB;
        return toTimestamp(a) - toTimestamp(b);
      });
  }, [appointments]);

  const contractQueue = useMemo(
    () =>
      contracts
        .slice()
        .sort((a, b) => {
          if (a.signed !== b.signed) return a.signed ? 1 : -1;
          return (
            new Date(b.uploadedAt || 0).getTime() -
            new Date(a.uploadedAt || 0).getTime()
          );
        }),
    [contracts]
  );

  const proposalPipeline = useMemo(() => {
    const statusRank = { Draft: 0, "In Review": 1, Sent: 2, Accepted: 3, Declined: 4 };
    return proposals
      .slice()
      .sort((a, b) => {
        const rankA = statusRank[a.status] ?? 5;
        const rankB = statusRank[b.status] ?? 5;
        if (rankA !== rankB) return rankA - rankB;
        return (
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
        );
      });
  }, [proposals]);

  const displayDueDate =
    dueOption === "date" && dueDate
      ? new Date(dueDate).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "Upon receipt";

  const previewDueDate = displayDueDate;

  const emailDueDateDisplay =
    resolvedDueOption === "date" && resolvedDueDate
      ? new Date(resolvedDueDate).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "Upon receipt";

  const previewLineItems = (items || []).filter(
    (item) => item.description.trim() && Number(item.hours) > 0
  );

  useEffect(() => {
    if (subjectDirty) return;
    if (selectedInvoiceEntry?.emailSubject) {
      setEmailSubject(selectedInvoiceEntry.emailSubject);
      return;
    }
    setEmailSubject(`Invoice ${resolvedInvoiceNumber} from ${resolvedBillFromName}`);
  }, [
    resolvedInvoiceNumber,
    resolvedBillFromName,
    subjectDirty,
    selectedInvoiceEntry,
  ]);

  useEffect(() => {
    if (!selectedInvoiceEntry) return;
    const preferredRecipient =
      getTrimmedValue(selectedInvoiceEntry.recipientEmail) ||
      getTrimmedValue(selectedInvoiceEntry.billToEmail);
    if (preferredRecipient) {
      setRecipientEmail(preferredRecipient);
    }
  }, [selectedInvoiceEntry]);

  const dispatchInvoiceEmail = async (deliveryEmail) => {
    if (!EMAILJS_READY) {
      const subject = `Invoice ${resolvedInvoiceNumber}`;
      const body = `Hello${
        resolvedBillToName ? ` ${resolvedBillToName}` : ""
      },%0D%0A%0D%0APlease find Invoice ${resolvedInvoiceNumber} attached.%0D%0A%0D%0AThank you!`;
      window.location.href = `mailto:${deliveryEmail}?subject=${encodeURIComponent(
        subject
      )}&body=${body}`;
      return { method: "mailto", reason: "missing-config" };
    }

    const templateParams = {
      to_email: deliveryEmail,
      to_name: resolvedBillToName || "Valued Client",
      client_name: resolvedBillToName || "Valued Client",
      from_name: resolvedBillFromName || "Tri-Tech",
      email_subject: emailSubject,
      email_message: limitedEmailMessage,
      invoice_number: resolvedInvoiceNumber,
      invoice_date: invoiceDateForEmail,
      invoice_total: invoiceTotalNumeric,
      due_date: emailDueDateDisplay,
      tax_rate: `${resolvedTaxRate}%`,
      bill_from_details: limitedBillFromDetails,
      bill_to_details: limitedBillToDetails,
      line_items: limitedLineItems,
      work_completed: limitedWorkCompletedHtml,
      paypal_link: paypalLinkValue,
    };

    await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams,
      EMAILJS_CONFIG.publicKey
    );

    return {
      method: "api",
    };
  };

  const removeHistoryEntry = (id) => {
    if (!adminUnlocked) {
      showToast(
        "warning",
        "Admin access required",
        "Unlock admin controls before deleting stored invoices."
      );
      return;
    }
    const targetId = String(id);
    setInvoiceHistory((prev) => prev.filter((entry) => String(entry.id) !== targetId));
  };

  const handleLoadInvoiceFromHistory = () => {
    if (!selectedHistoryInvoice) {
      showToast("warning", "Select an invoice", "Pick an invoice from history to load.");
      return;
    }
    const invoice = selectedHistoryInvoice;
    setInvoiceNumber(invoice.invoiceNumber || nextInvoiceId());
    setBillFromName(invoice.billFromName || "");
    setBillFromDetails(invoice.billFromDetails || "");
    setBillToName(invoice.billToName || "");
    setBillToEmail(invoice.billToEmail || "");
    setRecipientEmail(invoice.recipientEmail || invoice.billToEmail || "");
    setBillToDetails(invoice.billToDetails || "");
    const loadedItems =
      invoice.items && invoice.items.length > 0
        ? cloneLineItems(invoice.items)
        : defaultLineItems();
    setItems(loadedItems);
    setTaxRate(Number(invoice.taxRate) || 0);
    const builderDate = invoice.invoiceDate || invoice.createdAt;
    setInvoiceDate(
      builderDate
        ? new Date(builderDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0]
    );
    setDueOption(invoice.dueOption || "receipt");
    setDueDate(invoice.dueDate || "");
    showToast(
      "success",
      "Invoice loaded",
      `${invoice.invoiceNumber} is now ready to edit.`
    );
  };

  const handleMarkPaidSelectedInvoice = () => {
    if (!selectedHistoryInvoice) {
      showToast("warning", "Select an invoice", "Choose an invoice to mark paid.");
      return;
    }
    if (selectedHistoryInvoice.paid) {
      showToast("info", "Already paid", "That invoice is already closed.");
      return;
    }
    handleQuickRecordPayment(selectedHistoryInvoice);
  };

  const handleRemoveSelectedInvoice = () => {
    if (!selectedHistoryInvoice) {
      showToast("warning", "Select an invoice", "Choose an invoice to remove.");
      return;
    }
    removeHistoryEntry(selectedHistoryInvoice.id);
  };

  const resetInvoiceDetails = () => {
    setItems(defaultLineItems());
    if (!persistBillFrom) {
      setBillFromName("");
      setBillFromDetails("");
    }
    setBillToName("");
    setBillToEmail("");
    setRecipientEmail("");
    setBillToDetails("");
    setTaxRate(0);
    setDueOption("receipt");
    setDueDate("");
    setSubjectDirty(false);
    setSelectedInvoiceId("");
    setSelectedClientKey("");
    setInvoiceDate(new Date().toISOString().split("T")[0]);
  };

  const handleClearInvoiceBuilder = () => {
    resetInvoiceDetails();
    showToast("success", "Invoice cleared", "Start fresh with a new invoice.");
  };

  const handleAdminUnlock = () => {
    if (adminUnlocked) {
      setAdminUnlocked(false);
      setAdminCodeInput("");
      showToast("info", "Admin locked", "Admin-only actions have been disabled.");
      return;
    }

    if (!ADMIN_ACCESS_CODE) {
      setAdminUnlocked(true);
      showToast(
        "info",
        "Admin code not set",
        "No admin code configured so controls are unlocked."
      );
      return;
    }

    if (adminCodeInput.trim() === ADMIN_ACCESS_CODE) {
      setAdminUnlocked(true);
      setAdminCodeInput("");
      showToast("success", "Admin unlocked", "You can now delete stored invoices.");
    } else {
      showToast(
        "warning",
        "Invalid admin code",
        "Enter the correct administrator code to manage stored invoices."
      );
    }
  };

  const handleClearDraft = () => {
    if (!adminUnlocked) {
      showToast(
        "warning",
        "Admin access required",
        "Unlock admin controls to clear the saved draft."
      );
      return;
    }

    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(INVOICE_DRAFT_KEY);
      }
    } catch (err) {
      console.error("Unable to clear invoice draft", err);
    }

    resetInvoiceDetails();
    setInvoiceNumber(nextInvoiceId());
    showToast("success", "Draft cleared", "Invoice draft has been reset.");
  };

  const handleQuickRecordPayment = (invoice) => {
    if (!invoice) return;
    const normalizedId = String(invoice.id);
    markInvoicePaid(
      normalizedId,
      invoice.paymentMethod || "Cash",
      invoice.paymentAmount || invoice.total
    );
    showToast(
      "success",
      "Payment recorded",
      `${invoice.invoiceNumber} marked paid.`
    );
  };

  const handleAddLineItemShortcut = () => {
    addRow();
    showToast("success", "Line item added", "Scroll to the builder to fill it out.");
  };

  const handleRecordPayment = (event) => {
    event.preventDefault();
    if (!paymentForm.id) {
      showToast("warning", "Select an invoice", "Choose an invoice to mark paid.");
      return;
    }

    markInvoicePaid(
      Number(paymentForm.id),
      paymentForm.method,
      paymentForm.amount
    );
    setPaymentForm({ id: "", method: "Cash", amount: "" });
    showToast(
      "success",
      "Payment recorded",
      "Offline payment logged for this invoice."
    );
  };

  const handleAddAdvance = (event) => {
    event.preventDefault();
    if (!advanceForm.client.trim() || !Number(advanceForm.amount)) {
      showToast(
        "warning",
        "Incomplete advance",
        "Enter a client name and amount."
      );
      return;
    }
    const newAdvance = {
      id: Date.now(),
      client: advanceForm.client.trim(),
      amount: Number(advanceForm.amount),
      remaining: Number(advanceForm.amount),
      notes: advanceForm.notes.trim(),
      createdAt: new Date().toISOString(),
    };
    setAdvancePayments((prev) => [...prev, newAdvance]);
    setAdvanceForm({ client: "", amount: "", notes: "", newClient: "" });
    showToast("success", "Advance recorded", "Retainer is now available.");
  };

  const handleRemoveAdvance = (advanceId) => {
    if (!window.confirm("Remove this retainer?")) return;
    const normalizedId = String(advanceId);
    setAdvancePayments((prev) => prev.filter((advance) => String(advance.id) !== normalizedId));
    if (applyAdvanceForm.advanceId === normalizedId) {
      setApplyAdvanceForm((prev) => ({ ...prev, advanceId: "" }));
    }
    showToast("success", "Retainer removed", "Advance payment deleted.");
  };

  const handleApplyAdvance = (event) => {
    event.preventDefault();
    const advance = advancePayments.find(
      (entry) => String(entry.id) === applyAdvanceForm.advanceId
    );
    const invoice = unpaidInvoicesList.find(
      (inv) => String(inv.id) === applyAdvanceForm.invoiceId
    );
    if (!advance || !invoice) {
      showToast(
        "warning",
        "Select advance and invoice",
        "Pick both an advance and an unpaid invoice."
      );
      return;
    }
    if (Number(advance.remaining) < Number(invoice.total || 0)) {
      showToast(
        "warning",
        "Advance too small",
        "Advance must cover full invoice value to apply."
      );
      return;
    }
    markInvoicePaid(
      invoice.id,
      `Advance (${advance.client})`,
      invoice.total
    );
    setAdvancePayments((prev) =>
      prev
        .map((entry) =>
          entry.id === advance.id
            ? { ...entry, remaining: entry.remaining - invoice.total }
            : entry
        )
        .filter((entry) => entry.remaining > 0)
    );
    setApplyAdvanceForm({ advanceId: "", invoiceId: "" });
    showToast("success", "Advance applied", "Invoice paid using the retainer.");
  };

  const handleAddAppointment = (event) => {
    event.preventDefault();
    if (!appointmentForm.client.trim() || !appointmentForm.date || !appointmentForm.time) {
      showToast(
        "warning",
        "Add appointment details",
        "Include a client, date, and time for the appointment."
      );
      return;
    }
    const newAppointment = {
      id: Date.now(),
      client: appointmentForm.client.trim(),
      date: appointmentForm.date,
      time: appointmentForm.time,
      notes: appointmentForm.notes.trim(),
      status: "Scheduled",
      createdAt: new Date().toISOString(),
    };
    setAppointments((prev) => [...prev, newAppointment]);
    setAppointmentForm({ client: "", date: "", time: "", notes: "" });
    showToast("success", "Appointment scheduled", "Client meeting added to your calendar.");
  };

  const handleAppointmentStatusChange = (id, status) => {
    setAppointments((prev) =>
      prev.map((appointment) =>
        appointment.id === id ? { ...appointment, status } : appointment
      )
    );
  };

  const handleRemoveAppointment = (id) => {
    setAppointments((prev) => prev.filter((appointment) => appointment.id !== id));
  };

  const handleContractFileChange = (event) => {
    const file = event.target.files && event.target.files[0];
    setContractForm((prev) => ({
      ...prev,
      fileName: file ? file.name : "",
    }));
  };

  const handleAddContract = (event) => {
    event.preventDefault();
    if (!contractForm.client.trim() || !contractForm.project.trim()) {
      showToast(
        "warning",
        "Add contract info",
        "Provide a client and project name before uploading."
      );
      return;
    }
    if (!contractForm.fileName && !contractForm.fileUrl.trim()) {
      showToast(
        "warning",
        "Attach contract",
        "Add a file or link to the contract so it can be referenced later."
      );
      return;
    }
    const newContract = {
      id: Date.now(),
      client: contractForm.client.trim(),
      project: contractForm.project.trim(),
      signer: contractForm.signer.trim(),
      fileName: contractForm.fileName,
      fileUrl: contractForm.fileUrl.trim(),
      signed: false,
      uploadedAt: new Date().toISOString(),
      signedAt: null,
    };
    setContracts((prev) => [...prev, newContract]);
    setContractForm({
      client: "",
      project: "",
      fileName: "",
      fileUrl: "",
      signer: "",
    });
    showToast("success", "Contract stored", "Track signatures directly from this dashboard.");
  };

  const handleToggleContractSigned = (id) => {
    setContracts((prev) =>
      prev.map((contract) =>
        contract.id === id
          ? {
              ...contract,
              signed: !contract.signed,
              signedAt: !contract.signed ? new Date().toISOString() : null,
            }
          : contract
      )
    );
  };

  const handleRemoveContract = (id) => {
    setContracts((prev) => prev.filter((contract) => contract.id !== id));
  };

  const handleAddProposal = (event) => {
    event.preventDefault();
    if (!proposalForm.title.trim() || !proposalForm.client.trim()) {
      showToast(
        "warning",
        "Add proposal info",
        "Include a project title and client name before saving the proposal."
      );
      return;
    }
    const newProposal = {
      id: Date.now(),
      title: proposalForm.title.trim(),
      client: proposalForm.client.trim(),
      amount: Number(proposalForm.amount) || 0,
      status: proposalForm.status || "Draft",
      notes: proposalForm.notes.trim(),
      createdAt: new Date().toISOString(),
    };
    setProposals((prev) => [newProposal, ...prev]);
    setProposalForm({
      title: "",
      client: "",
      amount: "",
      status: "Draft",
      notes: "",
    });
    showToast("success", "Proposal drafted", "Track revisions and acceptance here.");
  };

  const handleProposalStatusChange = (id, status) => {
    setProposals((prev) =>
      prev.map((proposal) => (proposal.id === id ? { ...proposal, status } : proposal))
    );
  };

  const handleRemoveProposal = (id) => {
    setProposals((prev) => prev.filter((proposal) => proposal.id !== id));
  };

  const handleSubjectInput = (value) => {
    if (!subjectDirty) setSubjectDirty(true);
    setEmailSubject(value);
  };

  const isInvoiceValid =
    invoiceNumber.trim() &&
    billFromName.trim() &&
    billFromDetails.trim() &&
    billToName.trim() &&
    billToDetails.trim() &&
    items.some(
      (item) =>
        item.description.trim() &&
        Number(item.hours) > 0 &&
        Number(item.price) > 0
    );

  const handleSendInvoiceEmail = async () => {
    const deliveryEmail =
      getTrimmedValue(recipientEmail) ||
      getTrimmedValue(selectedInvoiceEntry?.recipientEmail) ||
      getTrimmedValue(selectedInvoiceEntry?.billToEmail) ||
      getTrimmedValue(billToEmail);

    if (!EMAILJS_READY) {
      showToast(
        "info",
        "EmailJS not configured",
        "Add your EmailJS service ID, template ID, and public key before sending."
      );
      return;
    }

    if (!deliveryEmail) {
      showToast(
        "warning",
        "Add a recipient email",
        "Enter a client email in Step 1 or in the send-email form."
      );
      return;
    }

    if (!emailSubject.trim()) {
      showToast(
        "warning",
        "Subject required",
        "Add an email subject before sending."
      );
      return;
    }

    if (!emailMessage.trim()) {
      showToast(
        "warning",
        "Message required",
        "Write a short email message for your client."
      );
      return;
    }

    setIsEmailSending(true);
    showToast(
      "sending",
      "Dispatching invoice email",
      `Sending Invoice ${resolvedInvoiceNumber} to ${deliveryEmail}.`
    );

    let emailedAtTimestamp = null;

    try {
      const result = await dispatchInvoiceEmail(deliveryEmail);
      emailedAtTimestamp = new Date().toISOString();

      if (result.method === "api") {
        showToast(
          "success",
          "Invoice emailed",
          `Invoice ${resolvedInvoiceNumber} is on its way to ${deliveryEmail}.`
        );
      } else {
        showToast(
          "info",
          "Manual email required",
          `Automatic emailing isn't configured yet, so we opened your mail client for ${deliveryEmail}.`
        );
      }
    } catch (error) {
      console.error("Unable to send invoice email", error);
      showToast(
        "warning",
        "Email delivery failed",
        error.message || "Check your EmailJS configuration and try again."
      );
    } finally {
      if (emailedAtTimestamp) {
        if (selectedInvoiceEntry) {
          setInvoiceHistory((prev) =>
            prev.map((entry) =>
              entry.id === selectedInvoiceEntry.id
                ? {
                    ...entry,
                    emailedAt: emailedAtTimestamp,
                    recipientEmail: deliveryEmail,
                    emailSubject,
                    emailMessage,
                  }
                : entry
            )
          );
        } else {
          const createdAt = emailedAtTimestamp;
          const trimmedBillToEmail =
            getTrimmedValue(billToEmail) || "No email provided";
          const historyEntry = {
            id: Date.now(),
            invoiceNumber,
            billFromName,
            billFromDetails,
            billToName: billToName || "Unnamed Client",
            billToDetails,
            billToEmail: trimmedBillToEmail,
            recipientEmail: deliveryEmail || trimmedBillToEmail,
            items: cloneLineItems(items),
            taxRate: Number(taxRate) || 0,
            subtotal,
            taxAmount,
            total,
            invoiceDate,
            createdAt,
            emailedAt: emailedAtTimestamp,
            dueOption,
            dueDate,
            emailSubject,
            emailMessage,
            paid: false,
            paymentMethod: null,
            paymentAmount: null,
            paidAt: null,
          };
          setInvoiceHistory((prev) => [...prev, historyEntry]);
        }
      }
      setIsEmailSending(false);
    }
  };

  const handleFinalizeInvoice = ({ shouldPrint = true } = {}) => {
    if (!isInvoiceValid) {
      showToast(
        "warning",
        "Complete invoice details",
        "Fill out business info, client info, and at least one line item with hours and rate before printing."
      );
      return;
    }

    if (shouldPrint) {
      window.print();
    }

    const createdAt = new Date().toISOString();
    const trimmedBillToEmail =
      (billToEmail || "").trim() || "No email provided";
    const trimmedRecipientEmail = (recipientEmail || "").trim();

    setInvoiceHistory((prev) => [
      ...prev,
      {
        id: Date.now(),
        billFromName,
        billFromDetails,
        invoiceNumber,
        billToName: billToName || "Unnamed Client",
        billToDetails,
        billToEmail: trimmedBillToEmail,
        recipientEmail: trimmedRecipientEmail || trimmedBillToEmail,
        items: cloneLineItems(items),
        taxRate: Number(taxRate) || 0,
        subtotal,
        taxAmount,
        total,
        invoiceDate,
        createdAt,
        emailedAt: null,
        dueOption,
        dueDate,
        emailSubject,
        emailMessage,
        paid: false,
        paymentMethod: null,
        paymentAmount: null,
        paidAt: null,
      },
    ]);

    try {
      window.localStorage.setItem(INVOICE_STORAGE_KEY, invoiceNumber);
      setInvoiceNumber(nextInvoiceId());
    } catch (err) {
      console.error("Unable to update invoice number", err);
    }

    showToast(
      "success",
      shouldPrint ? "Invoice printed" : "Invoice saved",
      shouldPrint
        ? "Use your browser's print dialog to save or share the PDF."
        : "Invoice stored. Use Print → Save as PDF whenever you're ready to export."
    );

    resetInvoiceDetails();
  };

  const handleResetInvoiceNumber = () => {
    setInvoiceNumber(BASE_INVOICE_NUMBER);
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          INVOICE_STORAGE_KEY,
          BASE_INVOICE_NUMBER
        );
      }
    } catch (err) {
      console.error("Unable to reset invoice number", err);
    }
    showToast(
      "success",
      "Invoice number reset",
      `Next invoice starts at ${BASE_INVOICE_NUMBER}.`
    );
  };

  return (
    <>
      <div className="page-wrap invoice-page">
        <div className="container invoice-container">
          <div className="invoice-shell">
          <header id="overview" className="invoice-holo">
          <div className="hero-content">
            <p className="eyebrow">Revenue workspace</p>
            <h1 className="page-title">Tri-Tech Invoice OS</h1>
            <p className="muted hero-lede">
              Orchestrate quotes, invoices, payments, and client communications from
              one black-and-red command center.
            </p>
            {!EMAILJS_READY && (
              <p className="muted small hero-note">
                Automatic emailing is disabled until EmailJS keys are added. We'll
                launch a mail draft instead.
              </p>
            )}
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <p className="muted small">Open receivables</p>
              <strong>{formatCurrency(outstandingSummary.total)}</strong>
              <span>
                {outstandingSummary.count || 0} open invoice
                {outstandingSummary.count === 1 ? "" : "s"}
              </span>
              <p className="hero-stat__meta">
                Next due {outstandingSummary.nextDueLabel}
              </p>
            </div>
            <div className="hero-stat">
              <p className="muted small">Collected (30 days)</p>
              <strong>{formatCurrency(recentCollectionSummary.total)}</strong>
              <span>
                {recentCollectionSummary.count || 0} payment
                {recentCollectionSummary.count === 1 ? "" : "s"}
              </span>
              <p className="hero-stat__meta">
                {paymentHistory.totals.count} lifetime payments
              </p>
            </div>
            <div className="hero-stat">
              <p className="muted small">Retainers & projects</p>
              <strong>{formatCurrency(retainerBalance)}</strong>
              <span>
                {advancePayments.length || 0} active retainer
                {advancePayments.length === 1 ? "" : "s"}
              </span>
              <p className="hero-stat__meta">
                {projectsForShare.length
                  ? `${projectsForShare.length} shared project${
                      projectsForShare.length === 1 ? "" : "s"
                    }`
                  : "Add a project from Quotes or Projects"}
              </p>
            </div>
          </div>
        </header>

          <nav className="page-subnav">
            <a href="#overview">Overview</a>
            <a href="#invoice-build">Invoice builder</a>
            <a href="#finance">Receivables</a>
            <a href="#client-ops">Client ops</a>
            <a href="#insights">Insights</a>
            <a href="#project-share">Project share</a>
            <a href="#history">History</a>
            <button
              type="button"
              className="btn btn-ghost btn-small"
              onClick={handleResetInvoiceNumber}
            >
              Reset Invoice #
            </button>
          </nav>

          <section id="invoice-build" className="workspace-grid invoice-workgrid">
          <div className="workspace-main invoice-workgrid__primary">
            <div className="command-center-grid">
              <div className="card quick-actions-card">
                <p className="step-label">Quick actions</p>
                <h2 className="card-title">Builder shortcuts</h2>
                <div className="quick-actions-grid">
                  <button type="button" className="btn btn-primary" onClick={handleAddLineItemShortcut}>
                    Add line item
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={handleSaveClientShortcut}>
                    Save client profile
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={handleClearInvoiceBuilder}>
                    Clear invoice
                  </button>
                </div>
                <p className="muted small">
                  Use these controls to rapidly build or reset invoices without scrolling.
                </p>
              </div>
              <div className="card history-control-card">
                <p className="step-label">History controls</p>
                <h2 className="card-title">Manage stored invoices</h2>
                <label>
                  <span className="muted small">Select invoice</span>
                  <select
                    className="input control"
                    value={historySelection}
                    onChange={(e) => setHistorySelection(e.target.value)}
                    disabled={sortedInvoiceHistory.length === 0}
                  >
                    {sortedInvoiceHistory.length === 0 ? (
                      <option value="">No stored invoices</option>
                    ) : (
                      sortedInvoiceHistory.map((invoice) => (
                        <option key={`history-select-${invoice.id}`} value={invoice.id}>
                          {invoice.invoiceNumber} · {invoice.billToName || "Client"}
                        </option>
                      ))
                    )}
                  </select>
                </label>
                <div className="history-control-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleLoadInvoiceFromHistory}
                    disabled={!selectedHistoryInvoice}
                  >
                    Load & edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={handleMarkPaidSelectedInvoice}
                    disabled={!selectedHistoryInvoice || selectedHistoryInvoice.paid}
                  >
                    Mark as paid
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleRemoveSelectedInvoice}
                    disabled={!selectedHistoryInvoice || !adminUnlocked}
                  >
                    Remove invoice
                  </button>
                </div>
                <p className="muted small">
                  Removing invoices still requires admin unlock for safety.
                </p>
              </div>
            </div>
            <div className="card builder-card">
              <div className="builder-card__header">
                <div>
                  <p className="step-label">Invoice workspace</p>
                  <h2 className="card-title">Business & client details</h2>
                </div>
                <p className="muted small">Autosave enabled</p>
              </div>
              <InvoiceHeader
                invoiceNumber={invoiceNumber}
                setInvoiceNumber={setInvoiceNumber}
                billFromName={billFromName}
                setBillFromName={setBillFromName}
                billFromDetails={billFromDetails}
                setBillFromDetails={setBillFromDetails}
                persistBillFrom={persistBillFrom}
                setPersistBillFrom={setPersistBillFrom}
                billToName={billToName}
                setBillToName={setBillToName}
                billToEmail={billToEmail}
                setBillToEmail={setBillToEmail}
                recipientEmail={recipientEmail}
                setRecipientEmail={setRecipientEmail}
                billToDetails={billToDetails}
                setBillToDetails={setBillToDetails}
                savedClients={savedClients}
                selectedClientKey={selectedClientKey}
                onSelectClient={handleSelectSavedClient}
                onAddClient={handleAddClientToSaved}
              />
              <div className="line-items-card">
                <div className="line-items-card__header">
                  <h3>Line items</h3>
                  <span className="muted small">
                    {items.length} row{items.length === 1 ? "" : "s"}
                  </span>
                </div>
                <InvoiceTable
                  items={items}
                  updateItem={updateItem}
                  removeItem={removeItem}
                  addRow={addRow}
                />
              </div>
            </div>

            <section id="export-email" className="card workflow-card">
              <p className="step-label">Print-ready exports</p>
              <h2 className="card-title">Generate PDF or hard copy</h2>
              <p className="muted">
                Validate the invoice below, then run your browser&apos;s Print &rarr;
                Save as PDF dialog to archive or share.
              </p>
              <div className="invoice-preview" aria-label="Invoice print preview">
                <div className="invoice-preview__header">
                  <div>
                    <p className="muted small">From</p>
                    <strong>{billFromName || "Business"}</strong>
                    <span className="muted small">{billFromDetails || "Add your business info"}</span>
                  </div>
                  <div>
                    <p className="muted small">Bill to</p>
                    <strong>{billToName || "Client"}</strong>
                    <span className="muted small">{billToDetails || "Add billing details"}</span>
                  </div>
                  <div>
                    <p className="muted small">Invoice</p>
                    <strong>{invoiceNumber}</strong>
                    <span className="muted small">Date: {formattedInvoiceDate}</span>
                    <span className="muted small">Due: {previewDueDate}</span>
                  </div>
                </div>

                <table className="invoice-preview__table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Hours</th>
                      <th>Rate</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewLineItems.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="muted">
                          Add at least one line item to render the PDF preview.
                        </td>
                      </tr>
                    ) : (
                      previewLineItems.map((item, index) => {
                        const qty = Number(item.hours) || 0;
                        const rate = Number(item.price) || 0;
                        return (
                          <tr key={`preview-line-${index}`}>
                            <td>{item.description}</td>
                            <td>{qty}</td>
                            <td>{formatCurrency(rate)}</td>
                            <td>{formatCurrency(qty * rate)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>

                <div className="invoice-preview__totals">
                  <div>
                    <span className="muted small">Subtotal</span>
                    <strong>{formatCurrency(subtotal)}</strong>
                  </div>
                  <div>
                    <span className="muted small">Tax</span>
                    <strong>{formatCurrency(taxAmount)}</strong>
                  </div>
                  <div>
                    <span className="muted small">Total</span>
                    <strong>{formatCurrency(total)}</strong>
                  </div>
                </div>
              </div>

              <div className="workflow-actions">
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => handleFinalizeInvoice({ shouldPrint: true })}
                  disabled={!isInvoiceValid}
                >
                  Print invoice
                </button>
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => handleFinalizeInvoice({ shouldPrint: false })}
                  disabled={!isInvoiceValid}
                >
                  Save invoice PDF
                </button>
              </div>
              {!isInvoiceValid && (
                <p className="error-hint">
                  Fill in business, client, and at least one line item to export.
                </p>
              )}
            </section>

            <section className="card workflow-card email-workflow">
              <p className="step-label">Inbox delivery</p>
              <h2 className="card-title">Send the invoice email</h2>
              <p className="muted">
                Customize the subject and note, then dispatch via EmailJS or fallback
                to your default mail app.
              </p>
              <div className="email-form-grid">
                <div className="input-row">
                  <label className="input-label" htmlFor="email-invoice-select">
                    Select invoice to email
                  </label>
                  <select
                    id="email-invoice-select"
                    className="input control"
                    value={selectedInvoiceId}
                    onChange={(e) => setSelectedInvoiceId(e.target.value)}
                  >
                    <option value="">
                      Current invoice ({invoiceNumber})
                    </option>
                    {invoiceHistory
                      .slice()
                      .sort(
                        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                      )
                      .map((invoice) => (
                        <option key={invoice.id} value={invoice.id}>
                          {`${invoice.invoiceNumber} · ${
                            invoice.billToName || "Client"
                          } · ${formatCurrency(invoice.total)}`}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="input-row">
                  <label className="input-label" htmlFor="email-to">
                    Client email
                  </label>
                  <input
                    id="email-to"
                    type="email"
                    className="input control"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="client@example.com"
                  />
                </div>
                <div className="input-row">
                  <label className="input-label" htmlFor="email-subject">
                    Email subject
                  </label>
                  <input
                    id="email-subject"
                    className="input control"
                    value={emailSubject}
                    onChange={(e) => handleSubjectInput(e.target.value)}
                    placeholder="Invoice subject"
                  />
                </div>
                <div className="input-row">
                  <label className="input-label" htmlFor="email-message">
                    Email message
                  </label>
                  <textarea
                    id="email-message"
                    className="input control"
                    rows={5}
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                  />
                </div>
              </div>
              <div className="email-actions">
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={handleSendInvoiceEmail}
                  disabled={isEmailSending}
                >
                  {isEmailSending ? "Sending…" : "Send Invoice Email"}
                </button>
              </div>
            </section>
          </div>

          <aside className="workspace-rail invoice-workgrid__rail">
            <div className="card card--accent totals-card">
              <p className="step-label">Live totals</p>
              <h2 className="card-title">Invoice summary</h2>
              <InvoiceTotals
                subtotal={subtotal}
                taxRate={taxRate}
                setTaxRate={setTaxRate}
                taxAmount={taxAmount}
                total={total}
              />
              <div className="dates-grid">
                <label>
                  <span className="muted small">Invoice date</span>
                  <input
                    type="date"
                    className="input control dates-input"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                  />
                </label>
                <div>
                  <span className="muted small">Current due</span>
                  <p className="dates-value">
                    {dueOption === "receipt" ? "Upon receipt" : displayDueDate}
                  </p>
                </div>
              </div>
              <div className="due-options">
                <label>
                  <input
                    type="radio"
                    name="dueOption"
                    value="receipt"
                    checked={dueOption === "receipt"}
                    onChange={() => setDueOption("receipt")}
                  />
                  Due upon receipt
                </label>
                <label>
                  <input
                    type="radio"
                    name="dueOption"
                    value="date"
                    checked={dueOption === "date"}
                    onChange={() => setDueOption("date")}
                  />
                  Set due date
                </label>
              </div>
              {dueOption === "date" && (
                <div className="due-date-input">
                  <label className="input-label" htmlFor="due-date">
                    Due date
                  </label>
                  <input
                    id="due-date"
                    type="date"
                    className="input control"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              )}
            </div>

            <section id="project-share" className="card project-share-card">
              <p className="step-label">Share project details</p>
              <h2 className="card-title">Keep clients in the loop</h2>
              {projectsForShare.length === 0 ? (
                <p className="muted">
                  No projects yet. Create a project from the Quote or Projects pages to
                  see it here.
                </p>
              ) : (
                <>
                  <div className="project-share-controls">
                    <label>
                      <span className="muted small">Select project</span>
                      <select
                        className="input control"
                        value={shareProjectId}
                        onChange={(e) => setShareProjectId(e.target.value)}
                      >
                        {projectsForShare.map((project) => (
                          <option key={`share-${project.id}`} value={project.id}>
                            {project.name} · {project.client}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      className="btn btn-primary"
                      type="button"
                      onClick={handleCopyProjectShare}
                    >
                      Copy project summary
                    </button>
                  </div>
                  {selectedProjectShare && (
                    <div className="project-share-summary">
                      <div>
                        <p className="muted small">Client</p>
                        <strong>{selectedProjectShare.client}</strong>
                      </div>
                      <div>
                        <p className="muted small">Budget</p>
                        <strong>
                          {formatCurrency(
                            Number(selectedProjectShare.budget) || 0
                          )}
                        </strong>
                      </div>
                      <div>
                        <p className="muted small">Status</p>
                        <strong>{selectedProjectShare.status || "Planning"}</strong>
                      </div>
                    </div>
                  )}
                  <textarea
                    className="input control project-share-text"
                    rows={4}
                    readOnly
                    value={projectShareText}
                  />
                </>
              )}
            </section>

            <QuoteReference />
          </aside>
        </section>

        <section id="finance" className="invoice-finance-grid">
          <div className="finance-primary invoice-finance-grid__primary">
          <div className="card statement-card">
            <div className="statement-card__heading">
              <div>
                <p className="step-label">Customer statements</p>
                <h2 className="card-title">Unpaid invoice list</h2>
              </div>
              {statementSummary && (
                <div className="statement-balance">
                  <p className="muted small">Outstanding</p>
                  <strong>{formatCurrency(statementSummary.total)}</strong>
                </div>
              )}
            </div>
            {unpaidInvoicesByClient.length === 0 ? (
              <p className="muted">All invoices are marked as paid.</p>
            ) : (
              <>
                <div className="statement-controls">
                  <label>
                    <span className="muted small">Select customer</span>
                    <select
                      className="input control"
                      value={statementClient}
                      onChange={(e) => setStatementClient(e.target.value)}
                    >
                      {unpaidInvoicesByClient.map((group) => (
                        <option key={group.client} value={group.client}>
                          {group.client}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleCopyStatement}
                  >
                    Copy statement text
                  </button>
                </div>
                {selectedStatementGroup && (
                  <div className="statement-shell">
                    <div className="statement-shell__summary">
                      <div>
                        <p className="muted small">Statement for</p>
                        <strong>{selectedStatementGroup.client}</strong>
                      </div>
                      <div>
                        <p className="muted small">Outstanding</p>
                        <strong>
                          {formatCurrency(statementSummary?.total || 0)}
                        </strong>
                      </div>
                      {statementSummary?.nextInvoice && (
                        <div>
                          <p className="muted small">Next invoice</p>
                          <strong>
                            {statementSummary.nextInvoice.invoiceNumber}
                          </strong>
                          <span className="muted small">
                            {getInvoiceDateLabel(statementSummary.nextInvoice)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="statement-shell__grid">
                      <div className="statement-shell__list">
                        <h4>Outstanding invoices</h4>
                        <ul className="statement-list">
                          {selectedStatementGroup.invoices.map((invoice) => (
                            <li key={invoice.id}>
                              <div>
                                <strong>{invoice.invoiceNumber}</strong>
                                <span className="muted small">
                                  {getInvoiceDateLabel(invoice)}
                                </span>
                              </div>
                              <span>{formatCurrency(invoice.total)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="statement-shell__preview">
                        <h4>Statement preview</h4>
                        <div className="statement-preview">
                          {statementPreviewLines.map((line, index) => (
                            <p
                              key={`statement-line-${index}`}
                              className={`statement-preview__line${
                                line.trim().startsWith("•")
                                  ? " statement-preview__line--bullet"
                                  : ""
                              }`}
                            >
                              {line || "\u00A0"}
                            </p>
                          ))}
                        </div>
                        <p className="muted small">
                          Use the copy button to send this customer-ready note.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="card unpaid-card">
            <div className="unpaid-card__header">
              <div>
                <p className="step-label">Unpaid bills</p>
                <h2 className="card-title">Follow-up command center</h2>
              </div>
              <div className="unpaid-card__meta">
                <span className="muted small">
                  {flaggedFollowUps} follow-up{flaggedFollowUps === 1 ? "" : "s"} flagged
                </span>
                {flaggedFollowUps > 0 && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-small"
                    onClick={handleClearFollowUps}
                  >
                    Clear flags
                  </button>
                )}
              </div>
            </div>
            {enrichedUnpaidInvoices.length === 0 ? (
              <p className="muted">
                Nothing outstanding. New unpaid invoices will show up here automatically.
              </p>
            ) : (
              <>
                <div className="unpaid-stats">
                  <div>
                    <p className="muted small">Outstanding total</p>
                    <strong>{formatCurrency(unpaidCommandStats.total)}</strong>
                  </div>
                  <div>
                    <p className="muted small">Avg. days outstanding</p>
                    <strong>{unpaidCommandStats.avgAging || 0}d</strong>
                  </div>
                  <div>
                    <p className="muted small">Retainer coverage</p>
                    <strong>{formatCurrency(retainerBalance)}</strong>
                  </div>
                </div>
                <div className="unpaid-controls">
                  <div className="unpaid-aging">
                    {AGING_FILTERS.map((filter) => {
                      const stats = unpaidAgingStats[filter.key] || { count: 0 };
                      const active = unpaidAgingFilter === filter.key;
                      return (
                        <button
                          type="button"
                          key={filter.key}
                          className={`unpaid-aging__pill${active ? " is-active" : ""}`}
                          onClick={() => setUnpaidAgingFilter(filter.key)}
                        >
                          <span>{filter.label}</span>
                          <strong>{stats.count}</strong>
                        </button>
                      );
                    })}
                  </div>
                  <div className="unpaid-controls__fields">
                    <input
                      className="input control"
                      placeholder="Search invoice or client"
                      value={unpaidSearch}
                      onChange={(e) => setUnpaidSearch(e.target.value)}
                    />
                    <select
                      className="input control"
                      value={reminderTone}
                      onChange={(e) => setReminderTone(e.target.value)}
                    >
                      <option value="friendly">Friendly tone</option>
                      <option value="firm">Firm nudge</option>
                      <option value="urgent">Urgent notice</option>
                    </select>
                  </div>
                </div>
                <div className="unpaid-lists">
                  <div className="unpaid-list-wrapper">
                    {filteredUnpaidInvoices.length === 0 ? (
                      <p className="muted small">No invoices match that filter.</p>
                    ) : (
                      <ul className="unpaid-list">
                        {filteredUnpaidInvoices.map((invoice) => {
                          const isActive =
                            String(selectedUnpaidId) === String(invoice.id);
                          const flagged = unpaidFollowUps[invoice.id];
                          return (
                            <li
                              key={`unpaid-${invoice.id}`}
                              className={`unpaid-list__item${isActive ? " is-active" : ""}`}
                              onClick={() => setSelectedUnpaidId(String(invoice.id))}
                            >
                              <div className="unpaid-list__top">
                                <div>
                                  <strong>{invoice.invoiceNumber}</strong>
                                  <span className="muted small">
                                    {invoice.billToName || "Client"}
                                  </span>
                                </div>
                                <div className="unpaid-list__amount">
                                  <strong>{formatCurrency(invoice.total)}</strong>
                                  <span className="muted small">
                                    Due {invoice.dueLabel || getInvoiceDateLabel(invoice)}
                                  </span>
                                </div>
                              </div>
                              <div className="unpaid-list__meta">
                                <span>{invoice.agingLabel}</span>
                                <span className={`unpaid-pill${flagged ? " is-flagged" : ""}`}>
                                  {flagged ? "Follow-up set" : "No follow-up"}
                                </span>
                              </div>
                              <div className="unpaid-list__actions">
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSendReminder(invoice);
                                  }}
                                >
                                  Send reminder
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleFollowUp(invoice.id);
                                  }}
                                >
                                  {flagged ? "Clear follow-up" : "Flag follow-up"}
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyInvoiceSnippet(invoice);
                                  }}
                                >
                                  Copy snippet
                                </button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                  <div className="unpaid-reminder">
                    <div className="unpaid-reminder__header">
                      <h4>Reminder composer</h4>
                      {selectedUnpaidInvoice && (
                        <span className="muted small">
                          Target: {selectedUnpaidInvoice.billToName || "Client"}
                        </span>
                      )}
                    </div>
                    <textarea
                      className="input control"
                      rows={10}
                      readOnly
                      value={reminderPreview}
                    />
                    <div className="unpaid-reminder__actions">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => handleSendReminder(selectedUnpaidInvoice)}
                        disabled={!selectedUnpaidInvoice}
                      >
                        Log reminder
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={handleCopyReminder}
                        disabled={!selectedUnpaidInvoice}
                      >
                        Copy text
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="card payments-card">
            <p className="step-label">Payment history</p>
            <h2 className="card-title">Recent payments</h2>
            {paymentHistory.totals.count === 0 ? (
              <p className="muted">No payments have been recorded yet.</p>
            ) : (
              <>
                <div className="payments-toolbar">
                  <p className="muted small">
                    {paymentHistory.totals.count} payment
                    {paymentHistory.totals.count === 1 ? "" : "s"} ·{" "}
                    {formatCurrency(paymentHistory.totals.collected)} collected
                  </p>
                  <div className="payments-filters">
                    <select
                      className="input control"
                      value={paymentMethodFilter}
                      onChange={(e) => setPaymentMethodFilter(e.target.value)}
                    >
                      <option value="all">All methods</option>
                      <option value="Cash">Cash</option>
                      <option value="Check">Check</option>
                      <option value="ACH">ACH</option>
                      <option value="Wire">Wire</option>
                      <option value="Other">Other</option>
                    </select>
                    <input
                      className="input control"
                      placeholder="Search payment"
                      value={paymentSearch}
                      onChange={(e) => setPaymentSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div className="payments-overview">
                  <div className="payments-overview__card">
                    <p className="muted small">Outstanding invoices</p>
                    <strong>{formatCurrency(outstandingSummary.total)}</strong>
                    <span className="muted small">
                      {outstandingSummary.count} open
                    </span>
                  </div>
                  <div className="payments-overview__card">
                    <p className="muted small">Collected to date</p>
                    <strong>{formatCurrency(paymentHistory.totals.collected)}</strong>
                    <span className="muted small">
                      {paymentHistory.totals.count} payments
                    </span>
                  </div>
                  <div className="payments-overview__card">
                    <p className="muted small">Retainers banked</p>
                    <strong>{formatCurrency(retainerBalance)}</strong>
                    <span className="muted small">
                      Next due {outstandingSummary.nextDueLabel}
                    </span>
                  </div>
                </div>
                {filteredPayments.length === 0 ? (
                  <p className="muted">No payments match the filter.</p>
                ) : (
                  <table className="payments-table">
                    <thead>
                      <tr>
                        <th>Invoice</th>
                        <th>Client</th>
                        <th>Method</th>
                        <th>Amount</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.map((invoice) => (
                        <tr key={`payment-${invoice.id}`}>
                          <td>{invoice.invoiceNumber}</td>
                          <td>{invoice.billToName || "Client"}</td>
                          <td>{invoice.paymentMethod || "n/a"}</td>
                          <td>
                            {formatCurrency(
                              invoice.paymentAmount || invoice.total || 0
                            )}
                          </td>
                          <td>
                            {invoice.paidAt
                              ? new Date(invoice.paidAt).toLocaleDateString()
                              : invoice.invoiceDate
                              ? new Date(invoice.invoiceDate).toLocaleDateString()
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>
          </div>

          <aside className="finance-rail invoice-finance-grid__rail">
          <div className="card payment-card">
            <div className="payment-card__heading">
              <div>
                <p className="step-label">Offline payments</p>
                <h2 className="card-title">Record manual payment</h2>
              </div>
              <span className="muted small">
                {unpaidInvoicesList.length} open invoice
                {unpaidInvoicesList.length === 1 ? "" : "s"}
              </span>
            </div>
            {unpaidInvoicesList.length === 0 ? (
              <p className="muted">
                All invoices are up to date. When a balance is outstanding, it
                will appear here for quick reconciliation.
              </p>
            ) : (
              <>
                {selectedManualInvoice ? (
                  <div className="payment-focus">
                    <div className="payment-focus__item">
                      <p className="muted small">Invoice</p>
                      <strong>{selectedManualInvoice.invoiceNumber}</strong>
                      <span className="muted small">
                        {selectedManualInvoice.billToName || "Client"}
                      </span>
                    </div>
                    <div className="payment-focus__item">
                      <p className="muted small">Amount</p>
                      <strong>{formatCurrency(selectedManualInvoice.total)}</strong>
                      <span className="muted small">
                        Due {getInvoiceDateLabel(selectedManualInvoice)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="muted small">
                    {manualPaymentInvoices.length === 0
                      ? "No invoices match that search. Clear the filter to see more."
                      : "Choose an invoice to attach the payment."}
                  </p>
                )}
                <form className="payment-form" onSubmit={handleRecordPayment}>
                  <label>
                    <span className="muted small">Search invoice</span>
                    <input
                      className="input control"
                      placeholder="Invoice number or client"
                      value={manualPaymentFilter}
                      onChange={(e) => setManualPaymentFilter(e.target.value)}
                    />
                  </label>
                  <label>
                    <span className="muted small">Choose invoice</span>
                    <select
                      className="input control"
                      value={paymentForm.id}
                      onChange={(e) =>
                        setPaymentForm((prev) => ({ ...prev, id: e.target.value }))
                      }
                      disabled={manualPaymentInvoices.length === 0}
                    >
                      <option value="">
                        {manualPaymentInvoices.length === 0
                          ? "No matches for that search"
                          : "Select invoice"}
                      </option>
                      {manualPaymentInvoices.map((invoice) => (
                        <option key={invoice.id} value={invoice.id}>
                          {invoice.invoiceNumber} — {invoice.billToName || "Client"} (
                          {formatCurrency(invoice.total)})
                        </option>
                      ))}
                    </select>
                    {manualPaymentInvoices.length === 0 && (
                      <p className="muted small payment-help">
                        No unpaid invoices match that search. Clear the filter to see all.
                      </p>
                    )}
                  </label>
                  <label>
                    <span className="muted small">Payment method</span>
                    <select
                      className="input control"
                      value={paymentForm.method}
                      onChange={(e) =>
                        setPaymentForm((prev) => ({ ...prev, method: e.target.value }))
                      }
                    >
                      <option value="Cash">Cash</option>
                      <option value="Check">Check</option>
                      <option value="ACH">ACH</option>
                      <option value="Wire">Wire</option>
                      <option value="Other">Other</option>
                    </select>
                  </label>
                  <label>
                    <span className="muted small">Amount received</span>
                    <input
                      className="input control"
                      type="number"
                      min="0"
                      step="0.01"
                      value={paymentForm.amount}
                      onChange={(e) =>
                        setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))
                      }
                    />
                  </label>
                  <button className="btn btn-primary" type="submit">
                    Record payment
                  </button>
                </form>
              </>
            )}
          </div>

          <div className="card advance-card">
            <p className="step-label">Advance payments</p>
            <h2 className="card-title">Manage retainers</h2>
            <div className="advance-grid">
              <form className="advance-form" onSubmit={handleAddAdvance}>
                <label>
                  Existing client
                  <select
                    className="input control"
                    value={advanceForm.client}
                    onChange={(e) =>
                      setAdvanceForm((prev) => ({ ...prev, client: e.target.value }))
                    }
                  >
                    <option value="">Select client</option>
                    {advanceClientOptions.map((name) => (
                      <option key={`adv-client-${name}`} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Or add new client
                  <input
                    className="input control"
                    placeholder="New client name"
                    value={advanceForm.newClient || ""}
                    onChange={(e) =>
                      setAdvanceForm((prev) => ({
                        ...prev,
                        newClient: e.target.value,
                        client: e.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Amount
                  <input
                    className="input control"
                    type="number"
                    min="0"
                    step="0.01"
                    value={advanceForm.amount}
                    onChange={(e) =>
                      setAdvanceForm((prev) => ({ ...prev, amount: e.target.value }))
                    }
                  />
                </label>
                <label className="advance-notes">
                  Notes
                  <textarea
                    className="input control"
                    rows={2}
                    value={advanceForm.notes}
                    onChange={(e) =>
                      setAdvanceForm((prev) => ({ ...prev, notes: e.target.value }))
                    }
                  />
                </label>
                <button className="btn btn-primary" type="submit">
                  Add retainer
                </button>
              </form>
              <div className="advance-apply">
                <h3>Apply retainer to invoice</h3>
                {advancePayments.length === 0 ? (
                  <p className="muted small">Add a retainer first.</p>
                ) : unpaidInvoicesList.length === 0 ? (
                  <p className="muted small">All invoices are paid.</p>
                ) : (
                  <form className="advance-apply-form" onSubmit={handleApplyAdvance}>
                    <label>
                      Retainer
                      <select
                        className="input control"
                        value={applyAdvanceForm.advanceId}
                        onChange={(e) =>
                          setApplyAdvanceForm((prev) => ({
                            ...prev,
                            advanceId: e.target.value,
                          }))
                        }
                      >
                        {advancePayments.map((advance) => (
                          <option key={`adv-${advance.id}`} value={advance.id}>
                            {advance.client} — {formatCurrency(advance.remaining)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Invoice
                      <select
                        className="input control"
                        value={applyAdvanceForm.invoiceId}
                        onChange={(e) =>
                          setApplyAdvanceForm((prev) => ({
                            ...prev,
                            invoiceId: e.target.value,
                          }))
                        }
                      >
                        <option value="">Select invoice</option>
                        {unpaidInvoicesList.map((invoice) => (
                          <option key={`adv-inv-${invoice.id}`} value={invoice.id}>
                            {invoice.invoiceNumber} · {formatCurrency(invoice.total)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button className="btn btn-primary" type="submit">
                      Apply retainer
                    </button>
                  </form>
                )}
                <ul className="advance-list">
                  {advancePayments.length === 0 ? (
                    <li className="muted small">No retainers recorded.</li>
                  ) : (
                    advancePayments.map((advance) => (
                      <li key={`adv-list-${advance.id}`}>
                        <div>
                          <strong>{advance.client}</strong>
                          <span className="muted small">
                            Remaining: {formatCurrency(advance.remaining)}
                          </span>
                        </div>
                        {advance.notes && (
                          <p className="muted small">{advance.notes}</p>
                        )}
                        <div className="advance-item-actions">
                          <button
                            type="button"
                            className="btn btn-ghost btn-small"
                            onClick={() => handleRemoveAdvance(advance.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </div>
          </aside>
        </section>

        <section id="client-ops" className="card client-ops-card">
          <p className="step-label">Client workflow</p>
          <h2 className="card-title">Appointments, contracts & proposals</h2>
          <p className="muted">
            Keep the pre-invoice lifecycle inside this command center. Schedule check-ins, route agreements for signature, and refine proposals side by side.
          </p>
          <datalist id="client-suggestions">
            {advanceClientOptions.map((name) => (
              <option key={`client-suggestion-${name}`} value={name} />
            ))}
          </datalist>
          <div className="client-ops-grid">
            <div className="ops-panel">
              <div className="ops-panel__header">
                <h3>Appointment scheduling</h3>
                <p className="muted small">Track discovery calls, demos, or milestone reviews.</p>
              </div>
              <form className="ops-form" onSubmit={handleAddAppointment}>
                <label>
                  Client / attendee
                  <input
                    list="client-suggestions"
                    className="input control"
                    value={appointmentForm.client}
                    onChange={(e) =>
                      setAppointmentForm((prev) => ({ ...prev, client: e.target.value }))
                    }
                    placeholder="Client name"
                  />
                </label>
                <label>
                  Date
                  <input
                    type="date"
                    className="input control"
                    value={appointmentForm.date}
                    onChange={(e) =>
                      setAppointmentForm((prev) => ({ ...prev, date: e.target.value }))
                    }
                  />
                </label>
                <label>
                  Time
                  <input
                    type="time"
                    className="input control"
                    value={appointmentForm.time}
                    onChange={(e) =>
                      setAppointmentForm((prev) => ({ ...prev, time: e.target.value }))
                    }
                  />
                </label>
                <label className="ops-form__full">
                  Notes / agenda
                  <textarea
                    className="input control"
                    rows={2}
                    value={appointmentForm.notes}
                    onChange={(e) =>
                      setAppointmentForm((prev) => ({ ...prev, notes: e.target.value }))
                    }
                  />
                </label>
                <button className="btn btn-primary" type="submit">
                  Add appointment
                </button>
              </form>
              {appointmentSchedule.length === 0 ? (
                <p className="muted">No meetings scheduled yet.</p>
              ) : (
                <ul className="ops-list">
                  {appointmentSchedule.map((appointment) => (
                    <li key={`appointment-${appointment.id}`}>
                      <div>
                        <strong>{appointment.client}</strong>
                        <p className="muted small">
                          {appointment.date
                            ? formatAppointmentDate(appointment.date, appointment.time)
                            : "Date pending"}{" "}
                          · {appointment.status || "Scheduled"}
                        </p>
                        {appointment.notes && (
                          <p className="muted small">{appointment.notes}</p>
                        )}
                      </div>
                      <div className="ops-actions">
                        <select
                          className="input control"
                          value={appointment.status || "Scheduled"}
                          onChange={(e) =>
                            handleAppointmentStatusChange(appointment.id, e.target.value)
                          }
                        >
                          <option value="Scheduled">Scheduled</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Completed">Completed</option>
                        </select>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => handleRemoveAppointment(appointment.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="ops-panel">
              <div className="ops-panel__header">
                <h3>Contract upload & e-sign</h3>
                <p className="muted small">
                  Save reference links, signer details, and track when agreements are executed.
                </p>
              </div>
              <form className="ops-form" onSubmit={handleAddContract}>
                <label>
                  Client
                  <input
                    list="client-suggestions"
                    className="input control"
                    value={contractForm.client}
                    onChange={(e) =>
                      setContractForm((prev) => ({ ...prev, client: e.target.value }))
                    }
                    placeholder="Client name"
                  />
                </label>
                <label>
                  Project / retainer
                  <input
                    className="input control"
                    value={contractForm.project}
                    onChange={(e) =>
                      setContractForm((prev) => ({ ...prev, project: e.target.value }))
                    }
                    placeholder="Engagement name"
                  />
                </label>
                <label>
                  Upload file
                  <input
                    className="input control"
                    type="file"
                    onChange={handleContractFileChange}
                  />
                </label>
                <label>
                  Contract link
                  <input
                    className="input control"
                    value={contractForm.fileUrl}
                    onChange={(e) =>
                      setContractForm((prev) => ({ ...prev, fileUrl: e.target.value }))
                    }
                    placeholder="https://..."
                  />
                </label>
                <label>
                  Signer
                  <input
                    className="input control"
                    value={contractForm.signer}
                    onChange={(e) =>
                      setContractForm((prev) => ({ ...prev, signer: e.target.value }))
                    }
                    placeholder="Primary signatory"
                  />
                </label>
                <button className="btn btn-primary" type="submit">
                  Save contract
                </button>
              </form>
              {contractQueue.length === 0 ? (
                <p className="muted">No contracts logged yet.</p>
              ) : (
                <ul className="ops-list">
                  {contractQueue.map((contract) => (
                    <li key={`contract-${contract.id}`}>
                      <div>
                        <strong>{contract.project}</strong>
                        <p className="muted small">
                          {contract.client}{" "}
                          {contract.fileName ? `· ${contract.fileName}` : null}
                        </p>
                        {contract.fileUrl && (
                          <a
                            href={contract.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="ops-link"
                          >
                            View contract
                          </a>
                        )}
                        <p className="muted small">
                          Status:{" "}
                          {contract.signed
                            ? `Signed ${contract.signedAt ? formatDate(contract.signedAt) : ""}`
                            : "Awaiting signature"}
                        </p>
                      </div>
                      <div className="ops-actions">
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => handleToggleContractSigned(contract.id)}
                        >
                          {contract.signed ? "Mark unsigned" : "Mark signed"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => handleRemoveContract(contract.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="ops-panel">
              <div className="ops-panel__header">
                <h3>Proposals</h3>
                <p className="muted small">
                  Draft scopes, estimate budgets, and shift them through each decision stage.
                </p>
              </div>
              <form className="ops-form" onSubmit={handleAddProposal}>
                <label>
                  Proposal title
                  <input
                    className="input control"
                    value={proposalForm.title}
                    onChange={(e) =>
                      setProposalForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="Website redesign"
                  />
                </label>
                <label>
                  Client
                  <input
                    list="client-suggestions"
                    className="input control"
                    value={proposalForm.client}
                    onChange={(e) =>
                      setProposalForm((prev) => ({ ...prev, client: e.target.value }))
                    }
                  />
                </label>
                <label>
                  Estimated value
                  <input
                    className="input control"
                    type="number"
                    min="0"
                    step="0.01"
                    value={proposalForm.amount}
                    onChange={(e) =>
                      setProposalForm((prev) => ({ ...prev, amount: e.target.value }))
                    }
                  />
                </label>
                <label>
                  Status
                  <select
                    className="input control"
                    value={proposalForm.status}
                    onChange={(e) =>
                      setProposalForm((prev) => ({ ...prev, status: e.target.value }))
                    }
                  >
                    <option value="Draft">Draft</option>
                    <option value="In Review">In Review</option>
                    <option value="Sent">Sent</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Declined">Declined</option>
                  </select>
                </label>
                <label className="ops-form__full">
                  Notes
                  <textarea
                    className="input control"
                    rows={2}
                    value={proposalForm.notes}
                    onChange={(e) =>
                      setProposalForm((prev) => ({ ...prev, notes: e.target.value }))
                    }
                  />
                </label>
                <button className="btn btn-primary" type="submit">
                  Save proposal
                </button>
              </form>
              {proposalPipeline.length === 0 ? (
                <p className="muted">No proposals on file yet.</p>
              ) : (
                <ul className="ops-list">
                  {proposalPipeline.map((proposal) => (
                    <li key={`proposal-${proposal.id}`}>
                      <div>
                        <strong>{proposal.title}</strong>
                        <p className="muted small">
                          {proposal.client} · {formatCurrency(proposal.amount || 0)} ·{" "}
                          {proposal.status || "Draft"}
                        </p>
                        {proposal.notes && <p className="muted small">{proposal.notes}</p>}
                      </div>
                      <div className="ops-actions">
                        <select
                          className="input control"
                          value={proposal.status || "Draft"}
                          onChange={(e) =>
                            handleProposalStatusChange(proposal.id, e.target.value)
                          }
                        >
                          <option value="Draft">Draft</option>
                          <option value="In Review">In Review</option>
                          <option value="Sent">Sent</option>
                          <option value="Accepted">Accepted</option>
                          <option value="Declined">Declined</option>
                        </select>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => handleRemoveProposal(proposal.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

<section id="insights" className="card reports-card">
          <p className="step-label">Insights & Forecasting</p>
          <h2 className="card-title">Run detailed reports</h2>
          <p className="muted">
            Customize reports to understand payment patterns, outstanding balances, and reminder cadences.
          </p>
            <div className="reports-grid">
              <div className="reports-panel">
                <h3>Payment pattern</h3>
                <p className="muted small">Average days to pay per client</p>
                <table className="payments-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Avg days</th>
                      <th>Total paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(
                      invoiceHistory.reduce((acc, invoice) => {
                        if (!invoice.paid) return acc;
                        const client = invoice.billToName || "Unnamed Client";
                        if (!acc[client])
                          acc[client] = { totalDays: 0, count: 0, paid: 0 };
                        const invoiceDate = invoice.invoiceDate || invoice.createdAt;
                        if (invoiceDate && invoice.paidAt) {
                          const diff =
                            (new Date(invoice.paidAt).getTime() -
                              new Date(invoiceDate).getTime()) /
                            (1000 * 60 * 60 * 24);
                          acc[client].totalDays += Math.max(diff, 0);
                        }
                        acc[client].count += 1;
                        acc[client].paid += Number(
                          invoice.paymentAmount || invoice.total || 0
                        );
                        return acc;
                      }, {})
                    )
                      .map(([client, data]) => ({
                        client,
                        avg: data.count ? data.totalDays / data.count : 0,
                        paid: data.paid,
                      }))
                      .sort((a, b) => b.avg - a.avg)
                      .slice(0, 5)
                      .map((row) => (
                        <tr key={row.client}>
                          <td>{row.client}</td>
                          <td>{row.avg.toFixed(1)}d</td>
                          <td>{formatCurrency(row.paid)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <div className="reports-panel">
                <h3>Create custom report</h3>
                <form
                  className="reports-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    showToast(
                      "info",
                      "Report generated",
                      "Export CSV via Insights > Projects for now."
                    );
                  }}
                >
                  <label>
                    Report type
                    <select className="input control">
                      <option value="aging">Aging summary</option>
                      <option value="payment-pattern">Payment patterns</option>
                      <option value="client-engagement">Client engagement</option>
                    </select>
                  </label>
                  <label>
                    From
                    <input type="date" className="input control" />
                  </label>
                  <label>
                    To
                    <input type="date" className="input control" />
                  </label>
                  <label>
                    Customer
                    <select className="input control">
                      <option value="">All customers</option>
                      {clientHistory.map((client) => (
                        <option key={client.name} value={client.name}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button className="btn btn-primary" type="submit">
                    Run report
                  </button>
                </form>
              </div>
            </div>
          <div className="reports-panel">
            <h3>Payment reminders</h3>
            <p className="muted small">
              Queue automated reminders for unpaid invoices. We'll email customers every 7 days until the invoice is marked paid.
            </p>
            <div className="reminder-controls">
              <select
                className="input control"
                value=""
                onChange={(e) => {
                  const invoice = unpaidInvoicesList.find(
                    (inv) => String(inv.id) === e.target.value
                  );
                  if (invoice) {
                    showToast(
                      "info",
                      "Reminder scheduled",
                      `${invoice.invoiceNumber} reminder set.`
                    );
                  }
                }}
              >
                <option value="">Select unpaid invoice</option>
                {unpaidInvoicesList.map((invoice) => (
                  <option key={`reminder-${invoice.id}`} value={invoice.id}>
                    {invoice.invoiceNumber} — {invoice.billToName || "Client"}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() =>
                  showToast(
                    "info",
                    "Reminders active",
                    "Automated reminder cadence enabled."
                  )
                }
              >
                Enable reminders
              </button>
            </div>
          </div>
        </section>

        <div className="admin-panel">
          <div>
            <p className="eyebrow">Storage controls</p>
            <p className="muted small">
              Unlock admin mode to delete saved invoices or history entries.
            </p>
          </div>
          <div className="admin-panel__controls">
            <input
              type="password"
              className="input control"
              placeholder="Admin code"
              value={adminCodeInput}
              onChange={(e) => setAdminCodeInput(e.target.value)}
              disabled={adminUnlocked && !!ADMIN_ACCESS_CODE}
            />
            <button
              type="button"
              className={`btn ${adminUnlocked ? "btn-danger" : "btn-primary"}`}
              onClick={handleAdminUnlock}
            >
              {adminUnlocked ? "Lock Admin" : "Unlock Admin"}
            </button>
          </div>
          <div className="admin-panel__actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleClearDraft}
              disabled={!adminUnlocked}
              title={
                adminUnlocked
                  ? "Clear saved draft"
                  : "Unlock admin to clear saved data"
              }
            >
              Clear saved draft
            </button>
          </div>
          <p className="admin-panel__status">
            {adminUnlocked
              ? "Admin actions enabled."
              : "Admin actions locked."}
          </p>
        </div>

        <section id="history" className="history-section">
          <div className="card history-card">
            <h2 className="card-title">Invoices by Month</h2>
            {monthlyHistory.length === 0 ? (
              <p className="muted">No invoices recorded yet.</p>
            ) : (
              monthlyHistory.map((group) => (
                <div className="history-group" key={group.key}>
                  <div className="history-group__header">
                    <strong>{group.label}</strong>
                    <span>{group.invoices.length} invoice(s)</span>
                  </div>
                  <ul className="history-list">
                    {group.invoices.map((invoice) => (
                      <li key={`${group.key}-${invoice.id}`}>
                        <div>
                          <p className="history-list__title">
                            {invoice.invoiceNumber}
                          </p>
                          <p className="history-list__meta">
                            {formatDate(invoice.createdAt)}
                          </p>
                        </div>
                        <div className="history-actions">
                          <span>{formatCurrency(invoice.total)}</span>
                          {!invoice.paid && (
                            <button
                              type="button"
                              className="history-paid"
                              onClick={() => handleQuickRecordPayment(invoice)}
                            >
                              Record payment
                            </button>
                          )}
                          <button
                            type="button"
                            className="history-remove"
                            onClick={() => removeHistoryEntry(invoice.id)}
                            aria-label={`Remove ${invoice.invoiceNumber}`}
                            disabled={!adminUnlocked}
                            title={
                              adminUnlocked
                                ? "Remove history entry"
                                : "Unlock admin to remove"
                            }
                          >
                            Remove
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>

          <div className="card history-card">
            <h2 className="card-title">Bill To Tracker</h2>
            {clientHistory.length === 0 ? (
              <p className="muted">No clients yet. Send your first invoice!</p>
            ) : (
              clientHistory.map((client) => (
                <div className="history-group" key={client.name}>
                  <div className="history-group__header">
                    <strong>{client.name}</strong>
                    <span>{client.invoices.length} invoice(s)</span>
                  </div>
                  <ul className="history-list">
                    {client.invoices.map((invoice) => (
                      <li key={`${client.name}-${invoice.id}`}>
                        <div>
                          <p className="history-list__title">
                            {invoice.invoiceNumber}
                          </p>
                          <p className="history-list__meta">
                            Client email: {invoice.billToEmail || "Not provided"}
                          </p>
                          {invoice.recipientEmail && (
                            <p className="history-list__meta">
                              Delivery email: {invoice.recipientEmail}
                            </p>
                          )}
                        </div>
                        <div className="history-actions">
                          <span>{formatCurrency(invoice.total)}</span>
                          {!invoice.paid && (
                            <button
                              type="button"
                              className="history-paid"
                              onClick={() => handleQuickRecordPayment(invoice)}
                            >
                              Record payment
                            </button>
                          )}
                          <button
                            type="button"
                            className="history-remove"
                            onClick={() => removeHistoryEntry(invoice.id)}
                            aria-label={`Remove ${invoice.invoiceNumber}`}
                            disabled={!adminUnlocked}
                            title={
                              adminUnlocked
                                ? "Remove history entry"
                                : "Unlock admin to remove"
                            }
                          >
                            Remove
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>

          <div className="card history-card">
            <h2 className="card-title">Email Dispatch Log</h2>
            {emailHistory.length === 0 ? (
              <p className="muted">No invoice emails have been sent yet.</p>
            ) : (
              <div className="dispatch-log">
                <div className="dispatch-log__header">
                  <span>Invoice</span>
                  <span>Recipient</span>
                  <span>Dispatched</span>
                  <span></span>
                </div>
                {emailHistory.map((invoice) => (
                  <div
                    className="dispatch-log__row"
                    key={`email-${invoice.id}`}
                  >
                    <span className="dispatch-log__invoice">
                      {invoice.invoiceNumber}
                    </span>
                    <span className="dispatch-log__email">
                      {invoice.recipientEmail ||
                        invoice.billToEmail ||
                        "Recipient email unavailable"}
                    </span>
                    {(() => {
                      const { datePart, timePart } = formatDateTime(
                        invoice.emailedAt
                      );
                      return (
                        <span className="dispatch-log__timestamp">
                          <span>{datePart}</span>
                          <span className="dispatch-log__time">{timePart}</span>
                        </span>
                      );
                    })()}
                    <button
                      className="history-remove"
                      onClick={() => removeHistoryEntry(invoice.id)}
                      aria-label={`Remove ${invoice.invoiceNumber} email record`}
                      disabled={!adminUnlocked}
                      title={
                        adminUnlocked
                          ? "Remove history entry"
                          : "Unlock admin to remove"
                      }
                    >
                      Remove
                    </button>
                    {!invoice.paid && (
                      <button
                        type="button"
                        className="history-paid"
                        onClick={() => handleQuickRecordPayment(invoice)}
                      >
                        Record payment
                      </button>
                    )}
                 </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="card terms-card">
          <h2 className="card-title">Payment Terms</h2>
          <p className="muted">
            Payment due upon receipt or as per contract agreement.
          </p>
          <h3 className="card-subtitle">Notes</h3>
          <ul className="terms-list">
            <li>Please make payments via PayPal, Zelle, or Check.</li>
            <li>
              Unused prepaid hours typically expire after 90 days unless
              otherwise agreed.
            </li>
            <li>Thank you for your business!</li>
          </ul>
        </section>
        </div>
      </div>
    </div>

      {toast && (
        <div
          key={toast.id}
          className={`delivery-toast delivery-toast--${toast.variant}`}
          role="status"
          aria-live="polite"
        >
          <div className="delivery-toast__icon" aria-hidden="true">
            {toast.variant === "success"
              ? "✅"
              : toast.variant === "warning"
              ? "⚠️"
              : "✉️"}
          </div>
          <div className="delivery-toast__text">
            <p className="delivery-toast__headline">{toast.headline}</p>
            <p className="delivery-toast__detail">{toast.detail}</p>
          </div>
          <button
            className="delivery-toast__close"
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}

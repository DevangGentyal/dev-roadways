import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "hi";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<Language, string>> = {
  // Navigation & Header
  "Admin": { en: "Admin", hi: "एडमिन" },
  "Operations": { en: "Operations", hi: "ऑपरेशंस" },
  "Coordinator": { en: "Coordinator", hi: "कोऑर्डिनेटर" },
  "Driver": { en: "Driver", hi: "ड्राइवर" },
  "Super Admin": { en: "Super Admin", hi: "सुपर एडमिन" },
  "Viewing as": { en: "Viewing as", hi: "व्यू कर रहे हैं" },
  "Overview": { en: "Overview", hi: "ओवरव्यू" },
  "Trips": { en: "Trips", hi: "ट्रिप" },
  "Active": { en: "Active", hi: "एक्टिव" },
  "Fuel": { en: "Fuel", hi: "फ्यूल" },
  "Cash": { en: "Cash", hi: "कैश" },
  "Approvals": { en: "Approvals", hi: "अप्रूवल" },
  "Follow-ups": { en: "Follow-ups", hi: "फॉलो-अप" },
  "Trip Operations Report": { en: "Trip Operations Report", hi: "ट्रिप ऑपरेशंस रिपोर्ट" },
  "Fuel & Extra Fuel Reports": { en: "Fuel & Extra Fuel Reports", hi: "फ्यूल & एक्स्ट्रा फ्यूल रिपोर्ट" },
  "Cash Advances Report": { en: "Cash Advances Report", hi: "कैश एडवांस रिपोर्ट" },
  "Super Admin Approvals": { en: "Super Admin Approvals", hi: "सुपर एडमिन अप्रूवल" },
  "Fuel Transactions": { en: "Fuel Transactions", hi: "फ्यूल ट्रांज़ैक्शन" },

  // Common Actions & Buttons
  "Import Excel": { en: "Import Excel", hi: "इम्पोर्ट Excel" },
  "New trip": { en: "New trip", hi: "न्यू ट्रिप" },
  "Download": { en: "Download", hi: "डाउनलोड" },
  "Search": { en: "Search", hi: "सर्च" },
  "Filters": { en: "Filters", hi: "फ़िल्टर" },
  "Clear All": { en: "Clear All", hi: "क्लियर ऑल" },
  "Apply Filters": { en: "Apply Filters", hi: "अप्लाई फ़िल्टर" },
  "Reset All": { en: "Reset All", hi: "रीसेट ऑल" },
  "Close": { en: "Close", hi: "क्लोज़" },
  "Cancel": { en: "Cancel", hi: "कैंसिल" },
  "Save": { en: "Save", hi: "सेव" },
  "Back": { en: "Back", hi: "बैक" },
  "Back to trips": { en: "Back to trips", hi: "बैक टू ट्रिप" },
  "Accept": { en: "Accept", hi: "एक्सेप्ट" },
  "Reject": { en: "Reject", hi: "रिजेक्ट" },
  "Upload": { en: "Upload", hi: "अपलोड" },
  "Call": { en: "Call", hi: "कॉल" },
  "Send to pump": { en: "Send to pump", hi: "पम्प को भेजें" },
  "Resend": { en: "Resend", hi: "रीसेंड" },
  "New Follow-up": { en: "New Follow-up", hi: "न्यू फॉलो-अप" },
  "Verify & Complete Trip": { en: "Verify & Complete Trip", hi: "वेरिफ़ाय & कम्पलीट ट्रिप" },
  "Complete Trip (All Verified)": { en: "Complete Trip (All Verified)", hi: "कम्पलीट ट्रिप (ऑल वेरिफाइड)" },
  "Start Trip": { en: "Start Trip", hi: "स्टार्ट ट्रिप" },
  "Resume Trip": { en: "Resume Trip", hi: "रिज़्यूम ट्रिप" },
  "Put Trip On Hold": { en: "Put Trip On Hold", hi: "पुट ट्रिप ऑन होल्ड" },
  "Mark as Reached": { en: "Mark as Reached", hi: "मार्क एज़ रीच्ड" },
  "Mark as Delivered": { en: "Mark as Delivered", hi: "मार्क एज़ डिलीवर्ड" },
  "Upload Stamped Document": { en: "Upload Stamped Document", hi: "अपलोड स्टैम्प्ड डॉक्यूमेंट" },
  "Upload document": { en: "Upload document", hi: "अपलोड डॉक्यूमेंट" },
  "Upload trip document": { en: "Upload trip document", hi: "अपलोड ट्रिप डॉक्यूमेंट" },
  "Start Preparing": { en: "Start Preparing", hi: "स्टार्ट प्रिपेयरिंग" },
  "Mark Ready to Depart": { en: "Mark Ready to Depart", hi: "मार्क रेडी टू डिपार्ट" },

  // Statuses & Filter Options
  "All": { en: "All", hi: "ऑल" },
  "New": { en: "New", hi: "न्यू" },
  "Driver Pending": { en: "Driver Pending", hi: "ड्राइवर पेंडिंग" },
  "Accepted": { en: "Accepted", hi: "एक्सेप्टेड" },
  "Docs Uploaded": { en: "Docs Uploaded", hi: "डॉक्स अपलोडेड" },
  "Not Started": { en: "Not Started", hi: "नॉट स्टार्टेड" },
  "In Transit": { en: "In Transit", hi: "इन ट्रांज़िट" },
  "Reached": { en: "Reached", hi: "रीच्ड" },
  "Stamped Docs": { en: "Stamped Docs", hi: "स्टैम्प्ड डॉक्स" },
  "Complete": { en: "Complete", hi: "कम्पलीट" },
  "Completed": { en: "Completed", hi: "कम्पलीटेड" },
  "Rejected (Ops)": { en: "Rejected (Ops)", hi: "रिजेक्टेड (ऑप्स)" },
  "Rejected (Driver)": { en: "Rejected (Driver)", hi: "रिजेक्टेड (ड्राइवर)" },
  "Pending": { en: "Pending", hi: "पेंडिंग" },
  "Sent": { en: "Sent", hi: "सेंट" },
  "Submitted": { en: "Submitted", hi: "सबमिटेड" },
  "Approved": { en: "Approved", hi: "अप्रूव्ड" },
  "Rejected": { en: "Rejected", hi: "रिजेक्टेड" },
  "Open": { en: "Open", hi: "ओपन" },
  "Done": { en: "Done", hi: "डन" },

  // Dashboard Stats Labels
  "New Trips": { en: "New Trips", hi: "न्यू ट्रिप्स" },
  "Pending Fuel Assignments": { en: "Pending Fuel Assignments", hi: "पेंडिंग फ्यूल असाइनमेंट्स" },
  "Pending Approvals": { en: "Pending Approvals", hi: "पेंडिंग अप्रूवल्स" },
  "Active Trips": { en: "Active Trips", hi: "एक्टिव ट्रिप्स" },

  // Table Column Headers
  "Date": { en: "Date", hi: "डेट" },
  "Reference & Customer": { en: "Reference & Customer", hi: "रेफरेंस & कस्टमर" },
  "Route": { en: "Route", hi: "रूट" },
  "Status": { en: "Status", hi: "स्टेटस" },
  "Action": { en: "Action", hi: "एक्शन" },
  "Trip Ref": { en: "Trip Ref", hi: "ट्रिप रेफरेंस" },
  "Pump Station": { en: "Pump Station", hi: "पम्प स्टेशन" },
  "Litres": { en: "Litres", hi: "लीटर" },
  "Amount": { en: "Amount", hi: "अमाउंट" },
  "Payment Mode": { en: "Payment Mode", hi: "पेमेंट मोड" },
  "Requested Date": { en: "Requested Date", hi: "रिक्वेस्टेड डेट" },
  "Expense Type": { en: "Expense Type", hi: "एक्सपेंस टाइप" },
  "Requested By": { en: "Requested By", hi: "रिक्वेस्टेड बाय" },
  "Follow-up Note": { en: "Follow-up Note", hi: "फॉलो-अप नोट" },
  "Due Date & Time": { en: "Due Date & Time", hi: "ड्यू डेट & टाइम" },
  "Vehicle Number": { en: "Vehicle Number", hi: "व्हीकल नंबर" },
  "Driver Name": { en: "Driver Name", hi: "ड्राइवर नेम" },
  "Phone Number": { en: "Phone Number", hi: "फोन नंबर" },

  // Miscellaneous / Helper labels
  "Offline mode": { en: "Offline mode", hi: "ऑफलाइन मोड" },
  "TRIP STATUS": { en: "TRIP STATUS", hi: "ट्रिप स्टेटस" },
  "STATUS": { en: "STATUS", hi: "स्टेटस" },
  "EXPENSE TYPE": { en: "EXPENSE TYPE", hi: "एक्सपेंस टाइप" },
  "Date Range": { en: "Date Range", hi: "डेट रेंज" },
  "From Date": { en: "From Date", hi: "फ्रॉम डेट" },
  "To Date": { en: "To Date", hi: "टू डेट" },
  "Active Filters": { en: "Active Filters", hi: "एक्टिव फ़िल्टर" },
};

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>("en");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("app_lang") as Language;
      if (saved === "en" || saved === "hi") {
        setLang(saved);
      }
    }
  }, []);

  const handleSetLang = (newLang: Language) => {
    setLang(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("app_lang", newLang);
    }
  };

  const t = (key: string): string => {
    if (!key) return "";
    if (translations[key] && translations[key][lang]) {
      return translations[key][lang];
    }
    return key;
  };

  return React.createElement(
    LanguageContext.Provider,
    { value: { lang, setLang: handleSetLang, t } },
    children
  );
};

export const useLang = () => useContext(LanguageContext);

export function getTransliteratedStatus(status: string, lang: Language): string {
  if (lang === "en") return status;
  const map: Record<string, string> = {
    "New": "न्यू",
    "Driver Pending": "ड्राइवर पेंडिंग",
    "Rejected (Ops)": "रिजेक्टेड (ऑप्स)",
    "Accepted": "एक्सेप्टेड",
    "Rejected (Driver)": "रिजेक्टेड (ड्राइवर)",
    "Docs Uploaded": "डॉक्स अपलोडेड",
    "Stamped Docs": "स्टैम्प्ड डॉक्स",
    "Not Started": "नॉट स्टार्टेड",
    "In Transit": "इन ट्रांज़िट",
    "Reached": "रीच्ड",
    "Complete": "कम्पलीट",
    "Completed": "कम्पलीटेड",
    "Pending": "पेंडिंग",
    "Sent": "सेंट",
    "Resent": "रीसेंट",
    "Approved": "अप्रूव्ड",
    "Rejected": "रिजेक्टेड",
    "Submitted": "सबमिटेड",
    "Open": "ओपन",
    "Done": "डन"
  };
  return map[status] || status;
}

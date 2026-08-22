import { Language } from "./types";

export const ENTITY_DICTIONARY: Record<string, { hi: string; mr: string; en: string }> = {
  // Clients / Companies
  "UltraTech Cement": { hi: "अल्ट्राटेक सीमेंट", mr: "अल्ट्राटेक सिमेंट", en: "UltraTech Cement" },
  "Ultratech Cement": { hi: "अल्ट्राटेक सीमेंट", mr: "अल्ट्राटेक सिमेंट", en: "Ultratech Cement" },
  "Chettinad Cement": { hi: "चेट्टीनाड सीमेंट", mr: "चेट्टीनाड सिमेंट", en: "Chettinad Cement" },
  "Dalmia Cement": { hi: "डालमिया सीमेंट", mr: "डालमिया सिमेंट", en: "Dalmia Cement" },
  "Shree Cement": { hi: "श्री सीमेंट", mr: "श्री सिमेंट", en: "Shree Cement" },
  "ACC Limited": { hi: "एसीसी लिमिटेड", mr: "एसीसी लिमिटेड", en: "ACC Limited" },
  "Ambuja Cement": { hi: "अंबुजा सीमेंट", mr: "अंबुजा सिमेंट", en: "Ambuja Cement" },

  // Sources & Cities / Towns / Locations
  "Solapur": { hi: "सोलापुर", mr: "सोलापूर", en: "Solapur" },
  "Akkalkot": { hi: "अक्कलकोट", mr: "अक्कलकोट", en: "Akkalkot" },
  "Nashik": { hi: "नाशिक", mr: "नाशिक", en: "Nashik" },
  "Bhubaneswar": { hi: "भुवनेश्वर", mr: "भुवनेश्वर", en: "Bhubaneswar" },
  "Ariyalur": { hi: "अरियालुर", mr: "अरियालुर", en: "Ariyalur" },
  "Beawar": { hi: "ब्यावर", mr: "ब्यावर", en: "Beawar" },
  "Coimbatore": { hi: "कोयंबटूर", mr: "कोईम्बतूर", en: "Coimbatore" },
  "Jaipur": { hi: "जयपुर", mr: "जयपूर", en: "Jaipur" },
  "Pune": { hi: "पुणे", mr: "पुणे", en: "Pune" },
  "Wadgaon": { hi: "वडगांव", mr: "वडगाव", en: "Wadgaon" },
  "Navi Mumbai": { hi: "नवी मुंबई", mr: "नवी मुंबई", en: "Navi Mumbai" },
  "Mohol": { hi: "मोहोळ", mr: "मोहोळ", en: "Mohol" },
  "Solapur, Maharashtra": { hi: "सोलापुर, महाराष्ट्र", mr: "सोलापूर, महाराष्ट्र", en: "Solapur, Maharashtra" },
  "Akkalkot, Maharashtra": { hi: "अक्कलकोट, महाराष्ट्र", mr: "अक्कलकोट, महाराष्ट्र", en: "Akkalkot, Maharashtra" },
  "Nashik, Maharashtra": { hi: "नाशिक, महाराष्ट्र", mr: "नाशिक, महाराष्ट्र", en: "Nashik, Maharashtra" },
  "Bhubaneswar, Odisha": { hi: "भुवनेश्वर, ओडिशा", mr: "भुवनेश्वर, ओडिशा", en: "Bhubaneswar, Odisha" },
  "Ariyalur, Tamil Nadu": { hi: "अरियालुर, तमिलनाडु", mr: "अरियालुर, तामिळनाडू", en: "Ariyalur, Tamil Nadu" },
  "Beawar, Rajasthan": { hi: "ब्यावर, राजस्थान", mr: "ब्यावर, राजस्थान", en: "Beawar, Rajasthan" },
  "Coimbatore, Tamil Nadu": { hi: "कोयंबटूर, तमिलनाडु", mr: "कोईम्बतूर, तामिळनाडू", en: "Coimbatore, Tamil Nadu" },
  "Jaipur, Rajasthan": { hi: "जयपुर, राजस्थान", mr: "जयपूर, राजस्थान", en: "Jaipur, Rajasthan" },
  "Wadgaon, Pune": { hi: "वडगांव, पुणे", mr: "वडगाव, पुणे", en: "Wadgaon, Pune" },
  "Hotgi Road, Solapur": { hi: "होटगी रोड, सोलापुर", mr: "होटगी रोड, सोलापूर", en: "Hotgi Road, Solapur" },
  "Chakan MIDC, Pune": { hi: "चाकण एमआईडीसी, पुणे", mr: "चाकण एमआयडीसी, पुणे", en: "Chakan MIDC, Pune" },
  "Kalamboli, Navi Mumbai": { hi: "कलंबोली, नवी मुंबई", mr: "कळंबोली, नवी मुंबई", en: "Kalamboli, Navi Mumbai" },
  "Nashik MIDC": { hi: "नाशिक एमआईडीसी", mr: "नाशिक एमआयडीसी", en: "Nashik MIDC" },
  "Solapur MIDC": { hi: "सोलापुर एमआईडीसी", mr: "सोलापूर एमआयडीसी", en: "Solapur MIDC" },
  "Ariyalur Plant": { hi: "अरियालुर प्लांट", mr: "अरियालुर प्लांट", en: "Ariyalur Plant" },
  "Rajgangpur Plant": { hi: "राजगांगपुर प्लांट", mr: "राजगांगपूर प्लांट", en: "Rajgangpur Plant" },
  "Beawar Plant": { hi: "ब्यावर प्लांट", mr: "ब्यावर प्लांट", en: "Beawar Plant" },

  // Materials & Cargo
  "Cement": { hi: "सीमेंट", mr: "सिमेंट", en: "Cement" },
  "Fly Ash": { hi: "फ्लाई ऐश", mr: "फ्लाय अ‍ॅश", en: "Fly Ash" },
  "Clinker": { hi: "क्लिंकर", mr: "क्लिंकर", en: "Clinker" },
  "Gypsum": { hi: "जिप्सम", mr: "जिप्सम", en: "Gypsum" },
  "Bagged": { hi: "बैग्ड (बोरी)", mr: "बॅग्ड (पोती)", en: "Bagged" },
  "Loose": { hi: "लूज (बल्क)", mr: "लूज (बल्क)", en: "Loose" },

  // Truck Types & Specs
  "Body": { hi: "बॉडी", mr: "बॉडी", en: "Body" },
  "Trailer": { hi: "ट्रेलर", mr: "ट्रेलर", en: "Trailer" },
  "Tanker": { hi: "टैंकर", mr: "टँकर", en: "Tanker" },
  "Bulker": { hi: "बल्कर", mr: "बल्कर", en: "Bulker" },
  "Tata Motors": { hi: "टाटा मोटर्स", mr: "टाटा मोटर्स", en: "Tata Motors" },
  "Ashok Leyland": { hi: "अशोक लेलैंड", mr: "अशोक लेलँड", en: "Ashok Leyland" },
  "BharatBenz": { hi: "भारतबेंज", mr: "भारतबेंझ", en: "BharatBenz" },
  "Eicher": { hi: "आयशर", mr: "आयशर", en: "Eicher" },
  "Mahindra": { hi: "महिंद्रा", mr: "महिंद्रा", en: "Mahindra" },
  "12 tyre": { hi: "12 टायर", mr: "12 टायर", en: "12 tyre" },
  "10 tyre": { hi: "10 टायर", mr: "10 टायर", en: "10 tyre" },
  "14 tyre": { hi: "14 टायर", mr: "14 टायर", en: "14 tyre" },
  "16 tyre": { hi: "16 टायर", mr: "16 टायर", en: "16 tyre" },

  // Pump Stations
  "IOCL Pump - Solapur": { hi: "आईओसीएल पंप - सोलापुर", mr: "आयओसीएल पंप - सोलापूर", en: "IOCL Pump - Solapur" },
  "BPCL Pump - Mohol": { hi: "बीपीसीएल पंप - मोहोळ", mr: "बीपीसीएल पंप - मोहोळ", en: "BPCL Pump - Mohol" },
  "HPCL Pump - Pune": { hi: "एचपीसीएल पंप - पुणे", mr: "एचपीसीएल पंप - पुणे", en: "HPCL Pump - Pune" },
  "IndianOil Pump": { hi: "इंडियन ऑयल पंप", mr: "इंडियन ऑइल पंप", en: "IndianOil Pump" },

  // Drivers
  "Rahul": { hi: "राहुल", mr: "राहुल", en: "Rahul" },
  "Rahul Shinde": { hi: "राहुल शिंदे", mr: "राहुल शिंदे", en: "Rahul Shinde" },
  "Amit": { hi: "अमित", mr: "अमित", en: "Amit" },
  "Amit Patil": { hi: "अमित पाटील", mr: "अमित पाटील", en: "Amit Patil" },
  "Sagar": { hi: "सागर", mr: "सागर", en: "Sagar" },
  "Sagar Jadhav": { hi: "सागर जाधव", mr: "सागर जाधव", en: "Sagar Jadhav" },
  "Ramesh": { hi: "रमेश", mr: "रमेश", en: "Ramesh" },
  "Suresh": { hi: "सुरेश", mr: "सुरेश", en: "Suresh" },
  "Vikas": { hi: "विकास", mr: "विकास", en: "Vikas" },
  "Prakash": { hi: "प्रकाश", mr: "प्रकाश", en: "Prakash" },

  // Payment Modes
  "Bank Transfer": { hi: "बैंक ट्रांसफर", mr: "बँक ट्रान्सफर", en: "Bank Transfer" },
  "Cash": { hi: "कैश", mr: "कॅश", en: "Cash" },
  "UPI": { hi: "यूपीआई", mr: "यूपीआय", en: "UPI" },
  "Fuel Card": { hi: "फ्यूल कार्ड", mr: "फ्युएल कार्ड", en: "Fuel Card" },

  // Document Types
  "LR": { hi: "एलआर (LR)", mr: "एलआर (LR)", en: "LR" },
  "WB": { hi: "डब्ल्यूबी (WB)", mr: "डब्ल्यूबी (WB)", en: "WB" },
  "Invoice": { hi: "इनवॉइस", mr: "इनव्हॉइस", en: "Invoice" },
  "Other": { hi: "अन्य", mr: "इतर", en: "Other" },
  "Fuel": { hi: "फ्यूल", mr: "फ्युएल", en: "Fuel" },
  "AdBlue": { hi: "ऐडब्लू", mr: "अ‍ॅडब्लू", en: "AdBlue" },
};

/**
 * Translates/transliterates an entity name (client, source, city, material, driver, etc.)
 * based on the active language (Hindi, Marathi, or English).
 */
export function localizeName(name: string | undefined | null, language: Language = "hi"): string {
  if (!name) return "";
  if (language === "en") return name;

  // Direct match
  const directMatch = ENTITY_DICTIONARY[name.trim()];
  if (directMatch && directMatch[language]) {
    return directMatch[language];
  }

  // Case insensitive match
  const lower = name.trim().toLowerCase();
  for (const [key, val] of Object.entries(ENTITY_DICTIONARY)) {
    if (key.toLowerCase() === lower && val[language]) {
      return val[language];
    }
  }

  // Substring replacement for compound location strings (e.g. "Solapur MIDC, Pune")
  let result = name;
  for (const [key, val] of Object.entries(ENTITY_DICTIONARY)) {
    if (result.includes(key) && val[language]) {
      result = result.split(key).join(val[language]);
    }
  }

  return result;
}

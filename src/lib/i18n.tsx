import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Languages } from "lucide-react";

import { APP_PHRASES } from "@/lib/i18n-app";

export type Lang = "en" | "am" | "om";
const KEY = "agrisense-language";

const dict = {
  en: {
    about: "About", features: "Features", help: "Help", getStarted: "Get Started", createAccount: "Create an Account",
    heroA: "Your Farm.", heroB: "Our Satellite", heroC: "Intelligence.",
    heroSub: "Make smarter farming decisions with NASA satellite observations.",
    aboutTitle: "About AgriSense",
    mission: "Mission", missionText: "Give every Ethiopian farmer clear, timely guidance to protect harvests from climate risk.",
    vision: "Vision", visionText: "A climate-resilient Ethiopia where satellite insight reaches every field and cooperative.",
    tech: "Technology", techText: "NASA Earth observations (Landsat, MODIS, SMAP, GPM) combined with AI advice in plain language.",
    helpTitle: "Help Center", helpSub: "Answers to common questions about using AgriSense.", back: "Back to home",
    q1: "How do I start?", a1: "Choose Get Started, create an account, then register your first plot with its crop and size.",
    q2: "Where does the data come from?", a2: "From NASA satellites that measure crop health, rainfall, soil moisture and temperature.",
    q3: "Can I change the language?", a3: "Yes. Use the language menu at the top of the page.",
    q4: "Is my farm data private?", a4: "Yes. Only you can see and edit your own plots.",
    scLabel: "WHAT MAKES AGRISENSE DIFFERENT",
    scTitle: "From Satellite Observations to Smarter Farming Decisions.",
    scDesc: "AgriSense combines satellite intelligence, geospatial technology, and artificial intelligence to help agricultural communities understand their land, monitor environmental changes, and make better farming decisions.",
    f1Title: "Intelligent Farm Mapping", f1Desc: "Define agricultural field boundaries using interactive polygon mapping, organize farm locations, and automatically calculate land areas.",
    f2Title: "Satellite Earth Monitoring", f2Desc: "Explore vegetation health, rainfall patterns, soil moisture, and land surface temperatures through Earth observation datasets.",
    f3Title: "AI Agricultural Intelligence", f3Desc: "Transform environmental observations into practical insights about planting, irrigation, drought risks, and harvesting.",
    nasaLabel: "POWERED BY NASA EARTH SCIENCE", nasaTitle: "Understanding Earth. Empowering Agriculture.",
    nasaDesc: "AgriSense brings together trusted Earth observation datasets to monitor vegetation conditions, rainfall, soil moisture, and environmental changes that influence agricultural productivity.",
    nasaCta: "Explore Our Technology", nasaCaption: "Illustrative imagery — not live monitoring data.",
    helpSupport: "Help & Support", tagline: "Turning satellite observations into smarter harvests",
  },
  am: {
    about: "ስለ እኛ", features: "ባህሪያት", help: "እገዛ", getStarted: "ይጀምሩ", createAccount: "መለያ ይፍጠሩ",
    heroA: "የእርስዎ እርሻ።", heroB: "የእኛ የሳተላይት", heroC: "ብልህነት።",
    heroSub: "በናሳ የሳተላይት ምልከታዎች የተሻሉ የእርሻ ውሳኔዎችን ይወስኑ።",
    aboutTitle: "ስለ AgriSense",
    mission: "ተልዕኮ", missionText: "ለእያንዳንዱ ኢትዮጵያዊ አርሶ አደር ምርቱን ከአየር ንብረት አደጋ የሚጠብቅ ግልጽና ወቅታዊ ምክር መስጠት።",
    vision: "ራዕይ", visionText: "የሳተላይት መረጃ ወደ እያንዳንዱ ማሳ የሚደርስባት የአየር ንብረትን የምትቋቋም ኢትዮጵያ።",
    tech: "ቴክኖሎጂ", techText: "የናሳ የምድር ምልከታዎች ከቀላል ቋንቋ የAI ምክር ጋር።",
    helpTitle: "የእገዛ ማዕከል", helpSub: "AgriSenseን ስለመጠቀም ለተለመዱ ጥያቄዎች መልሶች።", back: "ወደ መነሻ ተመለስ",
    q1: "እንዴት እጀምራለሁ?", a1: "ይጀምሩ የሚለውን ይምረጡ፣ መለያ ይፍጠሩ፣ ከዚያ የመጀመሪያ ማሳዎን ይመዝግቡ።",
    q2: "መረጃው ከየት ይመጣል?", a2: "የሰብል ጤናን፣ ዝናብን፣ የአፈር እርጥበትንና ሙቀትን ከሚለኩ የናሳ ሳተላይቶች።",
    q3: "ቋንቋ መቀየር እችላለሁ?", a3: "አዎ። ከገጹ አናት ያለውን የቋንቋ ምናሌ ይጠቀሙ።",
    q4: "የእርሻ መረጃዬ የግል ነው?", a4: "አዎ። ማሳዎችዎን ማየትና ማስተካከል የሚችሉት እርስዎ ብቻ ነዎት።",
  },
  om: {
    about: "Waa'ee", features: "Amaloota", help: "Gargaarsa", getStarted: "Jalqabi", createAccount: "Herrega Uumi",
    heroA: "Qonnaa Kee.", heroB: "Beekumsa Saatalaayitii", heroC: "Keenya.",
    heroSub: "Daawwannaa saatalaayitii NASA'tiin murtee qonnaa caalu murteessi.",
    aboutTitle: "Waa'ee AgriSense",
    mission: "Ergama", missionText: "Qonnaan bulaa Itoophiyaa hundaaf qajeelfama ifaa fi yeroo isaa eeggate kennuu.",
    vision: "Mul'ata", visionText: "Itoophiyaa jijjiirama qilleensaa danda'uu, odeeffannoon saatalaayitii lafa qonnaa hunda bira ga'u.",
    tech: "Teeknooloojii", techText: "Daawwannaa lafaa NASA fi gorsa AI afaan salphaan.",
    helpTitle: "Wiirtuu Gargaarsaa", helpSub: "Deebii gaaffilee waliigalaa AgriSense fayyadamuu irratti.", back: "Gara jalqabaatti deebi'i",
    q1: "Akkamittan jalqaba?", a1: "Jalqabi filadhu, herrega uumi, achiis lafa qonnaa kee isa jalqabaa galmeessi.",
    q2: "Daataan eessaa dhufa?", a2: "Saatalaayitii NASA fayyaa midhaanii, rooba, jiidhina biyyoo fi ho'a safaran irraa.",
    q3: "Afaan jijjiiruu nan danda'aa?", a3: "Eeyyee. Baafata afaanii gubbaa fuulaa fayyadami.",
    q4: "Daataan qonnaa koo dhuunfaadhaa?", a4: "Eeyyee. Lafa kee kan arguu fi gulaaluu dandeessu si qofa.",
  },
} as const;

export type TKey = keyof typeof dict.en;
const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: "en", setLang: () => {} });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    try {
      const s = localStorage.getItem(KEY);
      if (s === "en" || s === "am" || s === "om") setLang(s);
    } catch { /* optional */ }
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const update = (l: Lang) => {
    setLang(l);
    try { localStorage.setItem(KEY, l); } catch { /* optional */ }
  };
  return <Ctx.Provider value={{ lang, setLang: update }}>{children}</Ctx.Provider>;
}

export function useT() {
  const { lang } = useContext(Ctx);
  return (k: TKey) => (dict[lang] as Partial<Record<TKey, string>>)[k] ?? dict.en[k];
}

export function LanguageSelector() {
  const { lang, setLang } = useContext(Ctx);
  return (
    <label className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-app-line bg-app-surface px-2 py-1.5 text-app-ink">
      <Languages className="size-4 shrink-0 text-app-success" aria-hidden="true" />
      <select
        aria-label="Language"
        value={lang}
        onChange={(e) => setLang(e.target.value as Lang)}
        className="min-w-0 bg-app-surface text-xs font-semibold text-app-ink"
      >
        <option value="en">English</option>
        <option value="am">አማርኛ</option>
        <option value="om">Afaan Oromoo</option>
      </select>
    </label>
  );
}

// Phrase-based translations keyed by the English text, for strings outside the key dictionary.
const phrases: Record<Exclude<Lang, "en">, Record<string, string>> = {
  am: {
    "Powered by": "የሚደገፈው በ", "NASA Earth Observations": "የናሳ የምድር ምልከታዎች", "Smart Farming": "ብልህ እርሻ", "Climate Resilience": "የአየር ንብረት ተቋቋሚነት",
    "AGRISENSE ETHIOPIA": "AgriSense ኢትዮጵያ", "Rooted in the field.": "በማሳ ላይ የተመሠረተ።", "Connected to the future.": "ከወደፊቱ ጋር የተገናኘ።",
    "FIELD INSIGHTS": "የማሳ ግንዛቤዎች", "A closer connection to your field": "ከማሳዎ ጋር የቀረበ ግንኙነት",
    "CROP HEALTH": "የሰብል ጤና", "Every crop. Every season.": "እያንዳንዱ ሰብል። እያንዳንዱ ወቅት።",
    "CONNECTED FARMING": "የተገናኘ እርሻ", "Smarter decisions, together": "በጋራ የተሻሉ ውሳኔዎች",
    "WORKING TOGETHER": "በጋራ መሥራት", "From field to community": "ከማሳ እስከ ማህበረሰብ",
    "WHAT MAKES AGRISENSE DIFFERENT": "AgriSenseን ልዩ የሚያደርገው", "From Satellite Observations to Smarter Farming Decisions.": "ከሳተላይት ምልከታዎች ወደ ብልህ የእርሻ ውሳኔዎች።",
    "Intelligent Farm Mapping": "ብልህ የእርሻ ካርታ", "Satellite Earth Monitoring": "የሳተላይት የምድር ክትትል", "AI Agricultural Intelligence": "የAI የግብርና ብልህነት",
    "POWERED BY NASA EARTH SCIENCE": "በናሳ የምድር ሳይንስ የሚደገፍ", "Understanding Earth. Empowering Agriculture.": "ምድርን መረዳት። ግብርናን ማብቃት።",
    "Explore Our Technology": "ቴክኖሎጂያችንን ያስሱ", "Illustrative imagery — not live monitoring data.": "ገላጭ ምስል — የቀጥታ ክትትል መረጃ አይደለም።",
    "Help & Support": "እገዛ እና ድጋፍ", "Turning satellite observations into smarter harvests": "የሳተላይት ምልከታዎችን ወደ የተሻለ ምርት መቀየር",
    "Vegetation Monitoring": "የዕፅዋት ክትትል", "Vegetation Health": "የዕፅዋት ጤና", "Soil Moisture": "የአፈር እርጥበት", "Precipitation Measurements": "የዝናብ መለኪያዎች",
    "AgriSense combines satellite intelligence, geospatial technology, and artificial intelligence to help agricultural communities understand their land, monitor environmental changes, and make better farming decisions.": "AgriSense የሳተላይት መረጃን፣ የጂኦስፓሻል ቴክኖሎጂንና ሰው ሰራሽ አስተውሎትን በማጣመር የግብርና ማህበረሰቦች መሬታቸውን እንዲረዱ፣ የአካባቢ ለውጦችን እንዲከታተሉና የተሻለ ውሳኔ እንዲወስኑ ይረዳል።",
    "Define agricultural field boundaries using interactive polygon mapping, organize farm locations, and automatically calculate land areas.": "በይነተገናኝ ካርታ የማሳ ወሰኖችን ይወስኑ፣ የእርሻ ቦታዎችን ያደራጁ፣ የመሬት ስፋትን በራስ-ሰር ያስሉ።",
    "Explore vegetation health, rainfall patterns, soil moisture, and land surface temperatures through Earth observation datasets.": "የዕፅዋት ጤናን፣ የዝናብ ሁኔታን፣ የአፈር እርጥበትንና የመሬት ሙቀትን በምድር ምልከታ መረጃዎች ያስሱ።",
    "Transform environmental observations into practical insights about planting, irrigation, drought risks, and harvesting.": "የአካባቢ ምልከታዎችን ስለ መዝራት፣ መስኖ፣ ድርቅ እና ምርት ስብሰባ ወደ ተግባራዊ ምክር ይቀይሩ።",
    "AgriSense brings together trusted Earth observation datasets to monitor vegetation conditions, rainfall, soil moisture, and environmental changes that influence agricultural productivity.": "AgriSense የዕፅዋት ሁኔታን፣ ዝናብን፣ የአፈር እርጥበትንና ምርታማነትን የሚነኩ የአካባቢ ለውጦችን ለመከታተል የታመኑ የምድር ምልከታ መረጃዎችን ያሰባስባል።",
    "Welcome back": "እንኳን ደህና መጡ", "Create your account": "መለያዎን ይፍጠሩ", "Reset your password": "የይለፍ ቃልዎን ይቀይሩ",
    "Sign in to see your plots, alerts and satellite reports.": "ማሳዎችዎን፣ ማንቂያዎችንና የሳተላይት ሪፖርቶችን ለማየት ይግቡ።",
    "Join Ethiopia's satellite climate-tech network.": "የኢትዮጵያን የሳተላይት የአየር ንብረት ቴክኖሎጂ መረብ ይቀላቀሉ።",
    "We will email you a link to choose a new password.": "አዲስ የይለፍ ቃል ለመምረጥ ሊንክ በኢሜይል እንልክልዎታለን።",
    "Continue with Google": "በGoogle ይቀጥሉ", "or use your email": "ወይም ኢሜይልዎን ይጠቀሙ", "Full Name": "ሙሉ ስም", "Email": "ኢሜይል",
    "Password": "የይለፍ ቃል", "Confirm Password": "የይለፍ ቃል ያረጋግጡ", "At least 8 characters": "ቢያንስ 8 ቁምፊዎች",
    "Sign in": "ይግቡ", "Create account": "መለያ ይፍጠሩ", "Send reset link": "የመቀየሪያ ሊንክ ይላኩ", "Forgot password?": "የይለፍ ቃል ረሱ?",
    "Create an account": "መለያ ይፍጠሩ", "Back to sign in": "ወደ መግቢያ ተመለስ", "Confirm your email": "ኢሜይልዎን ያረጋግጡ", "Back": "ተመለስ",
    "We sent a confirmation link to your email. Open it to activate your account — your plots and alerts are then created automatically.": "ወደ ኢሜይልዎ የማረጋገጫ ሊንክ ልከናል። መለያዎን ለማንቃት ይክፈቱት — ማሳዎችዎና ማንቂያዎችዎ በራስ-ሰር ይፈጠራሉ።",
    "Choose a new password": "አዲስ የይለፍ ቃል ይምረጡ", "New Password": "አዲስ የይለፍ ቃል", "Save new password": "አዲሱን የይለፍ ቃል ያስቀምጡ",
    "Dashboard": "ዳሽቦርድ", "My Farms": "የእኔ እርሻዎች", "Satellite Intel": "የሳተላይት መረጃ", "Climate Monitoring": "የአየር ንብረት ክትትል",
    "AI Advisor": "የAI አማካሪ", "Alerts": "ማንቂያዎች", "Reports": "ሪፖርቶች", "Home": "መነሻ", "Farms": "እርሻዎች", "Satellite": "ሳተላይት",
    "AI Chat": "የAI ውይይት", "Settings": "ቅንብሮች", "Sign out": "ውጣ", "Ask AI Advisor": "የAI አማካሪን ይጠይቁ", "No plots yet": "እስካሁን ማሳ የለም", "Surface Reflectance": "የገጽ ነጸብራቅ", "Vegetation Index (NDVI)": "የዕፅዋት መለኪያ (NDVI)", "Your reset link worked. Set a password you will remember.": "የመቀየሪያ ሊንክዎ ሰርቷል። የሚያስታውሱትን የይለፍ ቃል ያስገቡ።", "Open the reset link from your email to continue.": "ለመቀጠል ከኢሜይልዎ የመቀየሪያ ሊንኩን ይክፈቱ።",
  },
  om: {
    "Powered by": "Kan deeggarame", "NASA Earth Observations": "Daawwannaa Lafaa NASA", "Smart Farming": "Qonna Ogummaa", "Climate Resilience": "Jijjiirama Qilleensaa Danda'uu",
    "AGRISENSE ETHIOPIA": "AgriSense Itoophiyaa", "Rooted in the field.": "Lafa qonnaa keessatti hundeeffame.", "Connected to the future.": "Gara fuulduraatti walqabate.",
    "FIELD INSIGHTS": "Hubannoo Lafa Qonnaa", "A closer connection to your field": "Walitti dhufeenya lafa kee waliin dhihoo",
    "CROP HEALTH": "Fayyaa Midhaanii", "Every crop. Every season.": "Midhaan hunda. Waqtii hunda.",
    "CONNECTED FARMING": "Qonna Walqabate", "Smarter decisions, together": "Murtee caalu, waliin",
    "WORKING TOGETHER": "Waliin Hojjechuu", "From field to community": "Lafa qonnaa irraa hanga hawaasaatti",
    "WHAT MAKES AGRISENSE DIFFERENT": "Wanti AgriSense addaa taasisu", "From Satellite Observations to Smarter Farming Decisions.": "Daawwannaa Saatalaayitii irraa gara Murtee Qonnaa Caaluutti.",
    "Intelligent Farm Mapping": "Kaartaa Qonnaa Ogummaa", "Satellite Earth Monitoring": "Hordoffii Lafaa Saatalaayitii", "AI Agricultural Intelligence": "Beekumsa Qonnaa AI",
    "POWERED BY NASA EARTH SCIENCE": "SAAYINSII LAFAA NASA'N KAN DEEGGARAME", "Understanding Earth. Empowering Agriculture.": "Lafa Hubachuu. Qonna Cimsuu.",
    "Explore Our Technology": "Teeknooloojii Keenya Ilaali", "Illustrative imagery — not live monitoring data.": "Fakkii ibsaa — daataa hordoffii kallattii miti.",
    "Help & Support": "Gargaarsa fi Deeggarsa", "Turning satellite observations into smarter harvests": "Daawwannaa saatalaayitii gara oomisha caaluutti jijjiiruu",
    "Vegetation Monitoring": "Hordoffii Biqiltootaa", "Vegetation Health": "Fayyaa Biqiltootaa", "Soil Moisture": "Jiidhina Biyyoo", "Precipitation Measurements": "Safartuu Roobaa",
    "AgriSense combines satellite intelligence, geospatial technology, and artificial intelligence to help agricultural communities understand their land, monitor environmental changes, and make better farming decisions.": "AgriSense beekumsa saatalaayitii, teeknooloojii jiooispaashaalaa fi AI walitti fiduun hawaasni qonnaa lafa isaanii akka hubatan, jijjiirama naannoo akka hordofanii fi murtee qonnaa caalu akka murteessan gargaara.",
    "Define agricultural field boundaries using interactive polygon mapping, organize farm locations, and automatically calculate land areas.": "Kaartaa walqunnamtiin daangaa lafa qonnaa murteessi, bakka qonnaa qindeessi, bal'ina lafaa ofumaan herregi.",
    "Explore vegetation health, rainfall patterns, soil moisture, and land surface temperatures through Earth observation datasets.": "Daataa daawwannaa lafaatiin fayyaa biqiltootaa, haala roobaa, jiidhina biyyoo fi ho'a lafaa ilaali.",
    "Transform environmental observations into practical insights about planting, irrigation, drought risks, and harvesting.": "Daawwannaa naannoo gara gorsa hojii facaasuu, jallisii, balaa hongee fi sassaabbii irratti jijjiiri.",
    "AgriSense brings together trusted Earth observation datasets to monitor vegetation conditions, rainfall, soil moisture, and environmental changes that influence agricultural productivity.": "AgriSense haala biqiltootaa, rooba, jiidhina biyyoo fi jijjiirama naannoo oomishtummaa qonnaa irratti dhiibbaa qabu hordofuuf daataa daawwannaa lafaa amanamoo walitti fida.",
    "Welcome back": "Baga deebitee dhufte", "Create your account": "Herrega kee uumi", "Reset your password": "Jecha icciitii kee haaromsi",
    "Sign in to see your plots, alerts and satellite reports.": "Lafa kee, akeekkachiisaa fi gabaasa saatalaayitii ilaaluuf seeni.",
    "Join Ethiopia's satellite climate-tech network.": "Toora teeknooloojii qilleensaa saatalaayitii Itoophiyaatti makami.",
    "We will email you a link to choose a new password.": "Jecha icciitii haaraa filachuuf liinkii imeeliin siif ergina.",
    "Continue with Google": "Google'n itti fufi", "or use your email": "ykn imeelii kee fayyadami", "Full Name": "Maqaa Guutuu", "Email": "Imeelii",
    "Password": "Jecha Icciitii", "Confirm Password": "Jecha Icciitii Mirkaneessi", "At least 8 characters": "Yoo xiqqaate qubee 8",
    "Sign in": "Seeni", "Create account": "Herrega uumi", "Send reset link": "Liinkii haaromsaa ergi", "Forgot password?": "Jecha icciitii irraanfatte?",
    "Create an account": "Herrega uumi", "Back to sign in": "Gara seensaatti deebi'i", "Confirm your email": "Imeelii kee mirkaneessi", "Back": "Deebi'i",
    "We sent a confirmation link to your email. Open it to activate your account — your plots and alerts are then created automatically.": "Liinkii mirkaneessaa imeelii keetti ergineerra. Herrega kee hojiirra oolchuuf bani — lafti kee fi akeekkachiisni ofumaan uumamu.",
    "Choose a new password": "Jecha icciitii haaraa filadhu", "New Password": "Jecha Icciitii Haaraa", "Save new password": "Jecha icciitii haaraa olkaa'i",
    "Dashboard": "Daashboordii", "My Farms": "Qonnaa Koo", "Satellite Intel": "Odeeffannoo Saatalaayitii", "Climate Monitoring": "Hordoffii Qilleensaa",
    "AI Advisor": "Gorsaa AI", "Alerts": "Akeekkachiisa", "Reports": "Gabaasa", "Home": "Jalqaba", "Farms": "Qonnaa", "Satellite": "Saatalaayitii",
    "AI Chat": "Haasawa AI", "Settings": "Qindaa'ina", "Sign out": "Ba'i", "Ask AI Advisor": "Gorsaa AI gaafadhu", "No plots yet": "Ammaaf lafti hin jiru", "Surface Reflectance": "Calaqqee Gubbaa", "Vegetation Index (NDVI)": "Agarsiisaa Biqiltootaa (NDVI)", "Your reset link worked. Set a password you will remember.": "Liinkiin haaromsaa hojjeteera. Jecha icciitii yaadattu galchi.", "Open the reset link from your email to continue.": "Itti fufuuf liinkii imeelii kee keessaa bani.",
  },
};

export function translate(lang: Lang, s: string, vars?: Record<string, string | number>) {
  const base = lang === "en" ? s : (phrases[lang][s] ?? APP_PHRASES[lang][s] ?? s);
  if (!vars) return base;
  return base.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

/** Translate an English phrase; `{name}` placeholders are filled from `vars`. */
export function useTx() {
  const { lang } = useContext(Ctx);
  return (s: string, vars?: Record<string, string | number>) => translate(lang, s, vars);
}

export function useLang() {
  return useContext(Ctx);
}

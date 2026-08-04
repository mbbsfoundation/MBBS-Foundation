"use client";

import { useState, useEffect, useRef } from "react";
import {
  ZONES,
  STATES_AND_ZONES,
  ZoneName,
  lookupLocationByPinCode,
} from "@/lib/indiaLocationMap";
import { getRandomQuizQuestions } from "@/lib/esanjeevaniQuizPool";
import ESanjeevaniAnalyticsModal from "./ESanjeevaniAnalyticsModal";

type UserProfile = {
  fullName: string;
  email: string;
  mobile: string;
  pinCode: string;
  zone: ZoneName;
  state: string;
  district: string;
  city: string;
  category: string;
  registeredAt: string;
};

type CategoryGroup = {
  groupLabelEn: string;
  groupLabelHi: string;
  options: { labelEn: string; labelHi: string; value: string }[];
};

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    groupLabelEn: "🩺 Medical Cadre",
    groupLabelHi: "🩺 मेडिकल कैडर (Medical Cadre)",
    options: [
      { labelEn: "MBBS Student", labelHi: "एमबीबीएस छात्र (MBBS Student)", value: "MBBS Student" },
      { labelEn: "Medical Intern", labelHi: "मेडिकल इंटर्न (Medical Intern)", value: "Medical Intern" },
      { labelEn: "Resident Doctor / PG Trainee", labelHi: "रेजिडेंट डॉक्टर / पीजी (Resident Doctor)", value: "Resident Doctor / PG Trainee" },
      { labelEn: "Consultant / Practicing Doctor", labelHi: "कंसल्टेंट / डॉक्टर (Consultant Doctor)", value: "Consultant / Practicing Doctor" },
      { labelEn: "Medical College Faculty", labelHi: "मेडिकल कॉलेज फैकल्टी (Medical Faculty)", value: "Medical College Faculty" },
    ],
  },
  {
    groupLabelEn: "💉 Nursing Cadre",
    groupLabelHi: "💉 नर्सिंग कैडर (Nursing Cadre)",
    options: [
      { labelEn: "Nursing Student", labelHi: "नर्सिंग छात्र (Nursing Student)", value: "Nursing Student" },
      { labelEn: "Nursing Officer (Serving Nurse)", labelHi: "नर्सिंग ऑफिसर (Serving Nurse)", value: "Nursing Officer (Serving Nurse)" },
      { labelEn: "Nursing Tutor / Faculty", labelHi: "नर्सिंग ट्यूटर / फैकल्टी (Nursing Faculty)", value: "Nursing Tutor / Faculty" },
    ],
  },
  {
    groupLabelEn: "🏥 Other Healthcare Cadre",
    groupLabelHi: "🏥 अन्य स्वास्थ्य कार्यकर्ता (Other Healthcare Cadre)",
    options: [
      { labelEn: "Physiotherapist", labelHi: "फिजियोथेरेपिस्ट (Physiotherapist)", value: "Physiotherapist" },
      { labelEn: "Paramedical / Lab Technician", labelHi: "पैरामेडिकल / लैब तकनीशियन (Technician)", value: "Paramedical / Lab Technician" },
      { labelEn: "Pharmacist", labelHi: "फार्मासिस्ट (Pharmacist)", value: "Pharmacist" },
      { labelEn: "Allied Healthcare Worker", labelHi: "एलाइड हेल्थकेयर वर्कर (Allied Healthcare)", value: "Allied Healthcare Worker" },
    ],
  },
  {
    groupLabelEn: "👥 Non-Healthcare & General Public",
    groupLabelHi: "👥 गैर-स्वास्थ्य संवर्ग एवं नागरिक (Non-Healthcare)",
    options: [
      { labelEn: "School Student", labelHi: "स्कूल छात्र (School Student)", value: "School Student" },
      { labelEn: "College Student (Non-Medical)", labelHi: "कॉलेज छात्र (Non-Medical Student)", value: "College Student (Non-Medical)" },
      { labelEn: "School / College Teacher", labelHi: "शिक्षक / अध्यापिका (Teacher / Educator)", value: "School / College Teacher" },
      { labelEn: "Police / Defense / First Responder", labelHi: "पुलिस / रक्षा कर्मी (Police / Defense)", value: "Police / Defense / First Responder" },
      { labelEn: "RWA / Community Member", labelHi: "आरडब्ल्यूए / नागरिक (RWA / Resident)", value: "RWA / Community Member" },
      { labelEn: "Corporate Employee", labelHi: "कॉर्पोरेट कर्मचारी (Corporate Employee)", value: "Corporate Employee" },
      { labelEn: "NGO Volunteer", labelHi: "एनजीओ स्वयंसेवक (NGO Volunteer)", value: "NGO Volunteer" },
      { labelEn: "IAP Member", labelHi: "आईएपी सदस्य (IAP Member)", value: "IAP Member" },
      { labelEn: "Other", labelHi: "अन्य (Other)", value: "Other" },
    ],
  },
];

export default function CPReSanjeevaniSection() {
  const [lang, setLang] = useState<"english" | "hindi">("english");
  const [activeTab, setActiveTab] = useState<"auth" | "video" | "quiz" | "feedback" | "certificate">("auth");
  const [videoLang, setVideoLang] = useState<"hindi" | "english">("hindi");
  const [authMode, setAuthMode] = useState<"register" | "login">("register");

  // Registration & Location Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [zone, setZone] = useState<ZoneName>("North Zone");
  const [stateName, setStateName] = useState("Delhi");
  const [district, setDistrict] = useState("New Delhi");
  const [customDistrict, setCustomDistrict] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("Community Member");

  // Analytics Modal State
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

  // User Session State
  const [user, setUser] = useState<UserProfile | null>(null);

  // Video Watch Tracking State
  const [videoWatched, setVideoWatched] = useState(false);
  const [watchProgress, setWatchProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSeekWarning, setShowSeekWarning] = useState(false);

  const playerRef = useRef<any>(null);
  const maxWatchedRef = useRef<number>(0);
  const actualPlayTimeRef = useRef<number>(0);

  // Randomized Quiz State
  const [questions, setQuestions] = useState<ReturnType<typeof getRandomQuizQuestions>>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [attemptsCount, setAttemptsCount] = useState(1);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [hasPassed, setHasPassed] = useState(false);

  // Feedback State
  const [rating, setRating] = useState<number>(5);
  const [feedback, setFeedback] = useState("");
  const [suggestions, setSuggestions] = useState("");

  // Certificate State
  const [certificateId, setCertificateId] = useState<string | null>(null);
  const [declarationChecked, setDeclarationChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-detect location when 6-digit PIN Code is typed
  const handlePinCodeChange = (val: string) => {
    const clean = val.trim();
    setPinCode(clean);

    if (clean.length >= 2) {
      const match = lookupLocationByPinCode(clean);
      if (match) {
        setZone(match.zone);
        setStateName(match.state);
        setDistrict(match.district);
        setCustomDistrict("");
      }
    }
  };

  // Available States filtered by selected Zone
  const availableStates = STATES_AND_ZONES.filter((s) => s.zone === zone);

  // Available Districts filtered by selected State (with "Other" appended at the last position)
  const currentSelectedStateItem = STATES_AND_ZONES.find((s) => s.name === stateName);
  const baseDistricts = currentSelectedStateItem ? currentSelectedStateItem.districts : [];
  const availableDistricts = baseDistricts.includes("Other") ? baseDistricts : [...baseDistricts, "Other"];

  // When Zone changes, pick first State in that Zone
  const handleZoneChange = (newZone: ZoneName) => {
    setZone(newZone);
    const firstState = STATES_AND_ZONES.find((s) => s.zone === newZone);
    if (firstState) {
      setStateName(firstState.name);
      setDistrict(firstState.districts[0] || "Other");
      setCustomDistrict("");
    }
  };

  // When State changes, pick first District in that State
  const handleStateChange = (newState: string) => {
    setStateName(newState);
    const item = STATES_AND_ZONES.find((s) => s.name === newState);
    if (item) {
      if (item.zone !== zone) setZone(item.zone);
      setDistrict(item.districts[0] || "Other");
      setCustomDistrict("");
    }
  };

  // Generate fresh random 5 questions whenever entering quiz or retrying
  const initRandomQuiz = () => {
    const qList = getRandomQuizQuestions(5, lang);
    setQuestions(qList);
    setQuizAnswers({});
    setQuizScore(null);
    setHasPassed(false);
    setErrorMsg(null);
  };

  useEffect(() => {
    if (activeTab === "quiz" && questions.length === 0) {
      initRandomQuiz();
    }
  }, [activeTab]);

  // YouTube IFrame API Integration & Anti-Skip Guard
  useEffect(() => {
    if (activeTab !== "video") return;

    maxWatchedRef.current = 0;
    actualPlayTimeRef.current = 0;
    setWatchProgress(0);

    if (typeof window !== "undefined" && !(window as any).YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    }

    const attachPlayer = () => {
      const YT = (window as any).YT;
      if (YT && YT.Player) {
        const playerFrameId = videoLang === "hindi" ? "youtube-player-hindi" : "youtube-player-english";
        try {
          playerRef.current = new YT.Player(playerFrameId, {
            events: {
              onStateChange: (event: any) => {
                if (event.data === 1) setIsPlaying(true);
                else setIsPlaying(false);

                if (event.data === 0) {
                  const duration = playerRef.current?.getDuration() || 0;
                  if (duration > 0 && actualPlayTimeRef.current >= Math.floor(duration * 0.85)) {
                    setVideoWatched(true);
                    setWatchProgress(100);
                  } else if (duration > 0) {
                    playerRef.current?.seekTo(maxWatchedRef.current, true);
                    setShowSeekWarning(true);
                  }
                }
              },
            },
          });
        } catch (e) {}
      }
    };

    if ((window as any).YT && (window as any).YT.Player) {
      attachPlayer();
    } else {
      (window as any).onYouTubeIframeAPIReady = () => {
        attachPlayer();
      };
    }

    return () => {
      setIsPlaying(false);
      if (playerRef.current && playerRef.current.destroy) {
        try {
          playerRef.current.destroy();
        } catch (e) {}
      }
      playerRef.current = null;
    };
  }, [activeTab, videoLang]);

  // Anti-Seek & Real Playback Polling Interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (activeTab === "video" && !videoWatched) {
      interval = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === "function") {
          try {
            const currentTime = playerRef.current.getCurrentTime();
            const duration = playerRef.current.getDuration();

            if (duration && duration > 0) {
              if (currentTime > maxWatchedRef.current + 2.5) {
                playerRef.current.seekTo(maxWatchedRef.current, true);
                setShowSeekWarning(true);
                setTimeout(() => setShowSeekWarning(false), 4000);
              } else {
                if (currentTime > maxWatchedRef.current) {
                  maxWatchedRef.current = currentTime;
                }
              }

              const playerState = playerRef.current.getPlayerState ? playerRef.current.getPlayerState() : -1;
              if (playerState === 1) {
                actualPlayTimeRef.current += 0.4;
              }

              const pct = Math.min(100, Math.floor((maxWatchedRef.current / duration) * 100));
              setWatchProgress(pct);

              if (maxWatchedRef.current >= duration - 2 && actualPlayTimeRef.current >= Math.floor(duration * 0.85)) {
                setVideoWatched(true);
                setWatchProgress(100);
              }
            }
          } catch (e) {}
        }
      }, 400);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTab, videoWatched]);

  // Load existing session from localStorage
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("cpr_esanjeevani_user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setFullName(parsed.fullName);
        setEmail(parsed.email);
        setMobile(parsed.mobile);
        setPinCode(parsed.pinCode || "");
        setZone(parsed.zone || "North Zone");
        setStateName(parsed.state || "Delhi");
        setDistrict(parsed.district || "New Delhi");
        setCity(parsed.city || "");
        setCategory(parsed.category || "Community Member");
        setActiveTab("video");
      }
    } catch (e) {}
  }, []);

  // Handle Registration
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg(lang === "hindi" ? "कृपया अपना पूरा नाम दर्ज करें।" : "Please enter your full name.");
      return;
    }
    if (!email.trim() || !mobile.trim()) {
      setErrorMsg(lang === "hindi" ? "कृपया अपना ईमेल और मोबाइल नंबर दर्ज करें।" : "Please provide email and mobile number.");
      return;
    }

    const finalDistrict = district === "Other" ? (customDistrict.trim() || "Other") : district;

    const profile: UserProfile = {
      fullName: fullName.trim(),
      email: email.trim(),
      mobile: mobile.trim(),
      pinCode: pinCode.trim(),
      zone,
      state: stateName,
      district: finalDistrict,
      city: city.trim(),
      category,
      registeredAt: new Date().toISOString(),
    };

    setUser(profile);
    localStorage.setItem("cpr_esanjeevani_user", JSON.stringify(profile));
    setErrorMsg(null);
    setActiveTab("video");
  };

  // Handle Quiz Submission & Evaluate 3/5 Passing Score
  const handleQuizEvaluate = (e: React.FormEvent) => {
    e.preventDefault();

    if (Object.keys(quizAnswers).length < questions.length) {
      setErrorMsg(
        lang === "hindi"
          ? "कृपया सबमिट करने से पहले सभी 5 प्रश्नों के उत्तर दें।"
          : "Please answer all 5 questions before submitting."
      );
      return;
    }

    let score = 0;
    questions.forEach((q) => {
      if (quizAnswers[q.id] === q.correctIndex) score++;
    });

    setQuizScore(score);
    setErrorMsg(null);

    if (score >= 3) {
      setHasPassed(true);
      setActiveTab("feedback");
    } else {
      setHasPassed(false);
    }
  };

  // Handle Final Submission (Feedback + Save to Server API)
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!declarationChecked) {
      setErrorMsg(
        lang === "hindi"
          ? "कृपया घोषणा (Declaration) बॉक्स पर टिक करें।"
          : "Please check the declaration box to proceed."
      );
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const payload = {
        fullName: user?.fullName || fullName,
        email: user?.email || email,
        mobile: user?.mobile || mobile,
        pinCode: user?.pinCode || pinCode,
        zone: user?.zone || zone,
        state: user?.state || stateName,
        district: user?.district || district,
        city: user?.city || city,
        category: user?.category || category,
        videoLanguage: videoLang,
        quizScore: quizScore || 3,
        totalQuestions: 5,
        attemptsCount,
        rating,
        feedback,
        suggestions,
      };

      const res = await fetch("/api/cprday/esanjeevani/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        setCertificateId(json.certificateId);
        setActiveTab("certificate");
      } else {
        setErrorMsg(json.error || "Failed to submit module.");
      }
    } catch (err) {
      console.error("Error submitting eSanjeevani:", err);
      setErrorMsg("Failed to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Print Certificate Modal Window
  const handlePrintCertificate = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const certName = user?.fullName || fullName || "Participant";
    const certDate = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>CPR Aware Citizen Certificate - ${certName}</title>
          <style>
            @page { size: landscape; margin: 0; }
            body {
              font-family: 'Helvetica Neue', Arial, sans-serif;
              margin: 0;
              padding: 40px;
              background-color: #fff;
              color: #0f172a;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              box-sizing: border-box;
            }
            .cert-border {
              border: 10px double #dc2626;
              padding: 35px 45px;
              max-width: 900px;
              width: 100%;
              text-align: center;
              background: linear-gradient(135deg, #ffffff 0%, #fff1f2 100%);
              border-radius: 12px;
            }
            .iap-badge {
              color: #b91c1c;
              font-size: 13px;
              font-weight: 800;
              letter-spacing: 3px;
              text-transform: uppercase;
            }
            h1 { font-size: 34px; margin: 5px 0; color: #0f172a; text-transform: uppercase; }
            .title-sub { font-size: 22px; color: #dc2626; font-weight: bold; margin-bottom: 20px; }
            .name { font-size: 38px; font-weight: bold; color: #1e1b4b; margin: 15px 0; border-bottom: 2px solid #cbd5e1; display: inline-block; padding-bottom: 8px; }
            .desc { font-size: 16px; color: #334155; max-width: 720px; margin: 10px auto 25px auto; line-height: 1.6; }
            .meta-box { display: flex; justify-content: space-around; margin-top: 25px; padding-top: 15px; border-top: 1px solid #e2e8f0; }
            .meta-lbl { font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; }
            .meta-val { font-size: 14px; font-weight: bold; color: #0f172a; margin-top: 4px; }
            .signatures { display: flex; justify-content: space-between; margin-top: 35px; padding: 0 40px; }
            .sig-line { border-top: 1px dashed #64748b; width: 180px; margin: 0 auto 5px auto; }
            .sig-title { font-size: 13px; font-weight: bold; color: #1e293b; }
          </style>
        </head>
        <body>
          <div class="cert-border">
            <div class="iap-badge">Indian Academy of Pediatrics</div>
            <h1>CPR SANJEEVANI</h1>
            <div class="title-sub">CPR Aware Citizen Certificate</div>
            <p style="font-size: 16px; color: #475569; font-style: italic;">This is to officially certify that</p>
            <div class="name">${certName}</div>
            <p class="desc">
              has successfully completed the CPR eSANJEEVANI online CPR awareness module, watched the hands-on instructional video, passed the 5-question CPR evaluation quiz, and earned recognition as an official <strong>CPR Aware Citizen</strong>.
            </p>
            <div class="meta-box">
              <div>
                <div class="meta-lbl">Unique Certificate ID</div>
                <div class="meta-val">${certificateId}</div>
              </div>
              <div>
                <div class="meta-lbl">Location</div>
                <div class="meta-val">${user?.district || district}, ${user?.state || stateName} (${user?.zone || zone})</div>
              </div>
              <div>
                <div class="meta-lbl">Issue Date</div>
                <div class="meta-val">${certDate}</div>
              </div>
            </div>
            <div class="signatures">
              <div>
                <div class="sig-line"></div>
                <div class="sig-title">CPR Sanjeevani Team</div>
              </div>
              <div>
                <div class="sig-line"></div>
                <div class="sig-title">Indian Academy of Pediatrics</div>
              </div>
            </div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <section id="cpr-esanjeevani" className="scroll-mt-24 bg-gradient-to-b from-sky-50/80 via-purple-50/60 to-white px-6 py-20 text-slate-900 border-t border-sky-200">
      <div className="mx-auto max-w-5xl">
        {/* Top Header & Language Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-block rounded-full bg-sky-100 border border-sky-300 px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.2em] text-sky-800">
              {lang === "hindi" ? "ऑनलाइन सीपीआर शिक्षण मॉड्यूल" : "Online CPR Learning Module"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switcher Button */}
            <div className="flex rounded-xl border border-purple-200 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setLang("english")}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                  lang === "english" ? "bg-purple-600 text-white shadow-sm" : "text-slate-600 hover:text-purple-800"
                }`}
              >
                🌐 English
              </button>
              <button
                type="button"
                onClick={() => setLang("hindi")}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                  lang === "hindi" ? "bg-purple-600 text-white shadow-sm" : "text-slate-600 hover:text-purple-800"
                }`}
              >
                🇮🇳 हिंदी
              </button>
            </div>
          </div>
        </div>

        {/* Hero Title */}
        <div className="mt-4 text-center">
          <h2 className="text-3xl font-black tracking-tight sm:text-5xl text-slate-900">
            CPR eSANJEEVANI
          </h2>
          <p className="mt-2 text-xl font-bold text-purple-700">
            {lang === "hindi" ? "सीपीआर अवेयर सिटीजन ऑनलाइन ट्रेनिंग मॉड्यूल" : "CPR Aware Citizen Online Module"}
          </p>
          <p className="mx-auto mt-4 max-w-3xl text-base text-slate-600 leading-relaxed">
            {lang === "hindi"
              ? "सीपीआर वीडियो देखें, 5 प्रश्नों की रैंडम क्विज़ हल करें (कम से कम 3/5 अंक आवश्यक), और तुरंत अपना आधिकारिक सीपीआर अवेयर सिटीजन प्रमाणपत्र डाउनलोड करें।"
              : "Watch the CPR Lay Rescuer training video, followed by a CPR quiz of 5 questions to earn your 'CPR Aware Citizen' Certificate."}
          </p>
        </div>

        {/* User Session Banner */}
        {user && (
          <div className="mt-8 flex flex-wrap items-center justify-between rounded-2xl border border-purple-200 bg-white/90 px-6 py-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-sky-600 to-purple-600 font-bold text-white shadow-sm">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{user.fullName}</p>
                <p className="text-xs text-slate-500">
                  {user.district}, {user.state} ({user.zone}) • {user.category}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setUser(null);
                localStorage.removeItem("cpr_esanjeevani_user");
                setActiveTab("auth");
              }}
              className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-800 hover:bg-purple-100 transition mt-2 sm:mt-0"
            >
              {lang === "hindi" ? "उपयोगकर्ता बदलें" : "Sign Out / Switch User"}
            </button>
          </div>
        )}

        {/* Step Navigation Tabs */}
        <div className="mt-8 flex rounded-2xl border border-sky-200 bg-white p-1.5 shadow-sm overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("auth")}
            className={`flex-1 rounded-xl py-3 px-3 text-xs sm:text-sm font-bold transition whitespace-nowrap ${
              activeTab === "auth" ? "bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 text-white shadow-md" : "text-slate-600 hover:text-purple-700"
            }`}
          >
            1. {lang === "hindi" ? "पंजीकरण / विवरण" : "Registration / Profile"}
          </button>

          <button
            type="button"
            disabled={!user}
            onClick={() => user && setActiveTab("video")}
            className={`flex-1 rounded-xl py-3 px-3 text-xs sm:text-sm font-bold transition whitespace-nowrap ${
              activeTab === "video"
                ? "bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 text-white shadow-md"
                : !user
                ? "text-slate-400 cursor-not-allowed opacity-60"
                : "text-slate-600 hover:text-purple-700"
            }`}
          >
            2. {lang === "hindi" ? "वीडियो देखें" : "Watch Video"}
          </button>

          <button
            type="button"
            disabled={!user || !videoWatched}
            onClick={() => user && videoWatched && setActiveTab("quiz")}
            className={`flex-1 rounded-xl py-3 px-3 text-xs sm:text-sm font-bold transition whitespace-nowrap ${
              activeTab === "quiz"
                ? "bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 text-white shadow-md"
                : !user || !videoWatched
                ? "text-slate-400 cursor-not-allowed opacity-60"
                : "text-slate-600 hover:text-purple-700"
            }`}
          >
            3. {lang === "hindi" ? "सीपीआर क्विज़ (5 प्रश्न)" : "CPR Quiz"} {!videoWatched && "🔒"}
          </button>

          {hasPassed && (
            <button
              type="button"
              onClick={() => setActiveTab("feedback")}
              className={`flex-1 rounded-xl py-3 px-3 text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeTab === "feedback" ? "bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 text-white shadow-md" : "text-purple-700 hover:text-purple-900"
              }`}
            >
              4. {lang === "hindi" ? "प्रतिक्रिया (Feedback)" : "Feedback"}
            </button>
          )}

          {certificateId && (
            <button
              type="button"
              onClick={() => setActiveTab("certificate")}
              className={`flex-1 rounded-xl py-3 px-3 text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeTab === "certificate" ? "bg-emerald-600 text-white shadow-md" : "text-emerald-700 hover:text-emerald-900"
              }`}
            >
              5. {lang === "hindi" ? "प्रमाणपत्र" : "Certificate"}
            </button>
          )}
        </div>

        {/* Main Content Box */}
        <div className="mt-6 rounded-3xl border border-purple-200/80 bg-white p-6 sm:p-10 shadow-xl">
          {/* TAB 1: REGISTRATION & LOCATION SELECTION */}
          {activeTab === "auth" && (
            <div>
              <div className="border-b border-sky-100 pb-5">
                <h3 className="text-2xl font-bold text-slate-900">
                  {lang === "hindi" ? "प्रतिभागी विवरण एवं स्थान जानकारी" : "Participant Information & Location"}
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  {lang === "hindi"
                    ? "पिन कोड (PIN Code) दर्ज करें जिससे क्षेत्र (Zone), राज्य और जिला स्वतः मैप हो जाएंगे।"
                    : "Enter your PIN code to auto-detect your Zone, State, and District for official records."}
                </p>
              </div>

              {errorMsg && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleRegister} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="reg-name" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    {lang === "hindi" ? "पूरा नाम (प्रमाणपत्र हेतु) *" : "Full Name (As required on Certificate) *"}
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={lang === "hindi" ? "उदा. डॉ. राजेश शर्मा" : "e.g. Dr. Rajesh Sharma"}
                    className="mt-2 w-full rounded-xl border border-sky-200 bg-slate-50/50 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="reg-email" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      {lang === "hindi" ? "ईमेल आईडी *" : "Email Address *"}
                    </label>
                    <input
                      id="reg-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="participant@example.com"
                      className="mt-2 w-full rounded-xl border border-sky-200 bg-slate-50/50 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="reg-mobile" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      {lang === "hindi" ? "मोबाइल नंबर *" : "Mobile Number *"}
                    </label>
                    <input
                      id="reg-mobile"
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="9876543210"
                      className="mt-2 w-full rounded-xl border border-sky-200 bg-slate-50/50 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      required
                    />
                  </div>
                </div>

                {/* PIN Code & Auto-Location Section */}
                <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-200/80 pb-3">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-purple-900">
                      📍 {lang === "hindi" ? "स्थान मैपिंग (PIN Code Auto-Detect)" : "Location Hierarchy Mapping"}
                    </span>
                    <span className="text-xs text-purple-700">
                      {lang === "hindi" ? "पिन कोड दर्ज करें या मैन्युअल चुनें" : "Enter PIN code or adjust dropdowns"}
                    </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-4">
                    {/* PIN Code */}
                    <div>
                      <label htmlFor="reg-pincode" className="block text-xs font-bold uppercase text-slate-700">
                        {lang === "hindi" ? "पिन कोड (PIN) *" : "PIN Code *"}
                      </label>
                      <input
                        id="reg-pincode"
                        type="text"
                        maxLength={6}
                        value={pinCode}
                        onChange={(e) => handlePinCodeChange(e.target.value)}
                        placeholder="e.g. 110001"
                        className="mt-1.5 w-full rounded-xl border border-purple-300 bg-white px-3.5 py-2.5 font-mono text-slate-900 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                        required
                      />
                    </div>

                    {/* Zone Selector */}
                    <div>
                      <label htmlFor="reg-zone" className="block text-xs font-bold uppercase text-slate-700">
                        {lang === "hindi" ? "क्षेत्र (Zone) *" : "Zone *"}
                      </label>
                      <select
                        id="reg-zone"
                        value={zone}
                        onChange={(e) => handleZoneChange(e.target.value as ZoneName)}
                        className="mt-1.5 w-full rounded-xl border border-purple-300 bg-white px-3 py-2.5 text-xs font-bold text-slate-900 focus:border-purple-600 focus:outline-none"
                      >
                        {ZONES.map((z) => (
                          <option key={z} value={z}>
                            {z}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* State Selector */}
                    <div>
                      <label htmlFor="reg-state" className="block text-xs font-bold uppercase text-slate-700">
                        {lang === "hindi" ? "राज्य (State) *" : "State *"}
                      </label>
                      <select
                        id="reg-state"
                        value={stateName}
                        onChange={(e) => handleStateChange(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-purple-300 bg-white px-3 py-2.5 text-xs font-bold text-slate-900 focus:border-purple-600 focus:outline-none"
                      >
                        {availableStates.map((s) => (
                          <option key={s.name} value={s.name}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* District Selector */}
                    <div>
                      <label htmlFor="reg-district" className="block text-xs font-bold uppercase text-slate-700">
                        {lang === "hindi" ? "ज़िला (District) *" : "District *"}
                      </label>
                      <select
                        id="reg-district"
                        value={district}
                        onChange={(e) => {
                          setDistrict(e.target.value);
                          if (e.target.value !== "Other") {
                            setCustomDistrict("");
                          }
                        }}
                        className="mt-1.5 w-full rounded-xl border border-purple-300 bg-white px-3 py-2.5 text-xs font-bold text-slate-900 focus:border-purple-600 focus:outline-none"
                      >
                        {availableDistricts.map((d) => (
                          <option key={d} value={d}>
                            {d === "Other" ? (lang === "hindi" ? "अन्य (Other District)" : "Other District") : d}
                          </option>
                        ))}
                      </select>

                      {district === "Other" && (
                        <input
                          type="text"
                          value={customDistrict}
                          onChange={(e) => setCustomDistrict(e.target.value)}
                          placeholder={lang === "hindi" ? "ज़िले का नाम दर्ज करें *" : "Enter district name *"}
                          className="mt-2 w-full rounded-xl border border-purple-400 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none"
                          required
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="reg-city" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      {lang === "hindi" ? "शहर / कस्बा (City / Town)" : "City / Town"}
                    </label>
                    <input
                      id="reg-city"
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. New Delhi"
                      className="mt-2 w-full rounded-xl border border-sky-200 bg-slate-50/50 px-4 py-3 text-slate-900 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>

                  <div>
                    <label htmlFor="reg-category" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      {lang === "hindi" ? "प्रतिभागी श्रेणी (Category) *" : "Participant Category *"}
                    </label>
                    <select
                      id="reg-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-sky-200 bg-slate-50/50 px-4 py-3 text-slate-900 font-semibold focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-xs sm:text-sm"
                    >
                      {CATEGORY_GROUPS.map((group) => (
                        <optgroup
                          key={group.groupLabelEn}
                          label={lang === "hindi" ? group.groupLabelHi : group.groupLabelEn}
                        >
                          {group.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {lang === "hindi" ? opt.labelHi : opt.labelEn}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  id="btn-register-esanjeevani"
                  type="submit"
                  className="mt-4 w-full rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 py-4 font-bold text-white shadow-lg hover:from-sky-700 hover:to-purple-700 transition text-base flex items-center justify-center gap-2"
                >
                  {lang === "hindi" ? "पंजीकृत करें एवं वीडियो शुरू करें →" : "Register & Start CPR Module →"}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: WATCH CPR SANJEEVANI VIDEOS */}
          {activeTab === "video" && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-sky-100 pb-5">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <span className="flex h-3 w-3 rounded-full bg-sky-500 animate-pulse"></span>
                    {lang === "hindi" ? "सीपीआर संजीवनी प्रशिक्षण वीडियो देखें" : "Watch CPR Sanjeevani Video for Lay Rescuers"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {lang === "hindi"
                      ? "क्विज़ अनलॉक करने के लिए आपको पूरा वीडियो बिना स्किप किए देखना होगा।"
                      : "You must watch the complete instructional video to unlock the 5-question evaluation quiz."}
                  </p>
                </div>

                {/* Video Language Selector */}
                <div className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 p-1">
                  <button
                    type="button"
                    onClick={() => setVideoLang("hindi")}
                    className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                      videoLang === "hindi" ? "bg-purple-600 text-white shadow-sm" : "text-slate-600 hover:text-purple-800"
                    }`}
                  >
                    🇮🇳 Hindi (हिंदी)
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoLang("english")}
                    className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                      videoLang === "english" ? "bg-purple-600 text-white shadow-sm" : "text-slate-600 hover:text-purple-800"
                    }`}
                  >
                    🌐 English
                  </button>
                </div>
              </div>

              {/* Progress Tracker */}
              <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50/70 p-4">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-800 flex items-center gap-2">
                    {videoWatched ? (
                      <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                        <svg className="h-4 w-4 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {lang === "hindi" ? "वीडियो पूर्ण हुआ!" : "Video Watch Complete!"}
                      </span>
                    ) : isPlaying ? (
                      <span className="text-purple-800 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-purple-600 animate-ping"></span>
                        {lang === "hindi" ? "वीडियो जारी है..." : "Watching Video in Progress..."}
                      </span>
                    ) : (
                      <span className="text-amber-800 flex items-center gap-1">
                        ▶ {lang === "hindi" ? "वीडियो शुरू करने के लिए प्ले पर क्लिक करें" : "Click play on video below to start watching"}
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-purple-900">{watchProgress}% Completed</span>
                </div>
                <div className="mt-2.5 h-3 w-full overflow-hidden rounded-full bg-sky-200">
                  <div
                    className={`h-full transition-all duration-500 ${
                      videoWatched ? "bg-emerald-500" : "bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600"
                    }`}
                    style={{ width: `${watchProgress}%` }}
                  ></div>
                </div>
              </div>

              {/* Seek Warning */}
              {showSeekWarning && (
                <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900 font-bold flex items-center gap-2 shadow-sm animate-bounce">
                  <svg className="h-5 w-5 shrink-0 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 10-2 0 1 1 0 002 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>
                    {lang === "hindi"
                      ? "⚠️ वीडियो को आगे बढ़ाना (Fast Forward/Skip) वर्जित है! क्विज़ अनलॉक करने के लिए पूरा वीडियो क्रमानुसार देखें।"
                      : "⚠️ Fast-forwarding or skipping the video is disabled! Please watch the CPR training video sequentially."}
                  </span>
                </div>
              )}

              {/* Video Player Frame */}
              <div className="mt-6 overflow-hidden rounded-2xl border-2 border-sky-200 bg-black shadow-xl">
                <div className="relative aspect-video w-full">
                  {videoLang === "hindi" ? (
                    <iframe
                      id="youtube-player-hindi"
                      src="https://www.youtube.com/embed/7uRByuHmUnI?enablejsapi=1&rel=0&controls=1"
                      title="CPR Sanjeevani Training Video - Hindi"
                      className="absolute inset-0 h-full w-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <iframe
                      id="youtube-player-english"
                      src="https://www.youtube.com/embed/NyB_M8ndZho?enablejsapi=1&rel=0&controls=1"
                      title="CPR Sanjeevani Training Video - English"
                      className="absolute inset-0 h-full w-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    ></iframe>
                  )}
                </div>
              </div>

              {/* Direct YouTube Watch & Fallback Action Bar */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-200 bg-sky-50/80 p-4 text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-2">
                  <span>📺 {lang === "hindi" ? "वीडियो प्ले नहीं हो रहा?" : "Video not playing in frame?"}</span>
                  <a
                    href={videoLang === "hindi" ? "https://www.youtube.com/watch?v=7uRByuHmUnI" : "https://www.youtube.com/watch?v=NyB_M8ndZho"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-red-600 underline hover:text-red-800 transition"
                  >
                    ▶ {lang === "hindi" ? "यूट्यूब पर सीधे देखें (Open YouTube)" : "Watch directly on YouTube"}
                  </a>
                </div>

                {!videoWatched && (
                  <button
                    type="button"
                    onClick={() => {
                      setVideoWatched(true);
                      setWatchProgress(100);
                    }}
                    className="rounded-xl border border-emerald-300 bg-emerald-100 px-3.5 py-1.5 font-bold text-emerald-900 hover:bg-emerald-200 transition flex items-center gap-1 shadow-sm"
                  >
                    ✓ {lang === "hindi" ? "वीडियो देखा गया (Mark as Watched)" : "Mark Video as Watched"}
                  </button>
                )}
              </div>

              {/* Next Step unlock button */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-purple-200 bg-purple-50/60 p-5">
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {videoWatched
                      ? (lang === "hindi" ? "वीडियो पूर्ण हुआ!" : "Video Watch Completed!")
                      : (lang === "hindi" ? "🔒 वीडियो देखना अनिवार्य (Locked)" : "🔒 Video Watch Required (Locked)")}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    {videoWatched
                      ? (lang === "hindi" ? "आगे बढ़ने के लिए सीपीआर क्विज़ पर क्लिक करें।" : "Click below to proceed to the CPR quiz.")
                      : (lang === "hindi" ? "क्विज़ अनलॉक करने के लिए पूरा वीडियो देखें।" : "Watch the full video to unlock the 5-question evaluation quiz.")}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!videoWatched}
                  onClick={() => {
                    if (videoWatched) setActiveTab("quiz");
                  }}
                  className={`rounded-xl px-6 py-3.5 font-bold transition text-sm shadow-md flex items-center justify-center gap-2 ${
                    videoWatched
                      ? "bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 text-white hover:from-sky-700 hover:to-purple-700 cursor-pointer"
                      : "bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300 opacity-80"
                  }`}
                >
                  {videoWatched
                    ? (lang === "hindi" ? "सीपीआर क्विज़ शुरू करें →" : "Proceed to CPR Quiz →")
                    : `🔒 Locked (${watchProgress}%)`}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: RANDOMIZED QUIZ (50 Questions Pool, 3/5 Passing Threshold) */}
          {activeTab === "quiz" && (
            <div>
              <div className="border-b border-sky-100 pb-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-2xl font-bold text-slate-900">
                    {lang === "hindi" ? "सीपीआर मूल्यांकन क्विज़ (5 प्रश्न)" : "CPR Evaluation Quiz (5 Random Questions)"}
                  </h3>
                  <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-extrabold text-purple-800">
                    {lang === "hindi" ? `प्रयास: ${attemptsCount}` : `Attempt #${attemptsCount}`}
                  </span>
                </div>

                {/* Eligibility criteria banner */}
                <div className="mt-4 rounded-xl border border-sky-300 bg-sky-50 p-4 text-xs text-sky-950 font-bold flex items-center gap-3">
                  <svg className="h-5 w-5 shrink-0 text-sky-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>
                    {lang === "hindi"
                      ? "🎯 प्रमाण पत्र पात्रता मानदंड: प्रमाण पत्र अर्जित करने के लिए 5 में से कम से कम 3 प्रश्नों (60%) का सही उत्तर दें। आप जितनी बार चाहें प्रयास कर सकते हैं।"
                      : "🎯 Pass Criteria: Answer at least 3 out of 5 questions correctly (60%) to earn your CPR Aware Citizen Certificate. Unlimited attempts allowed."}
                  </span>
                </div>
              </div>

              {errorMsg && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 font-semibold">
                  {errorMsg}
                </div>
              )}

              {/* If Quiz Completed & Failed (< 3/5 Score) -> Retry Banner */}
              {quizScore !== null && !hasPassed && (
                <div className="my-6 rounded-2xl border-2 border-amber-300 bg-amber-50 p-6 text-center shadow-md">
                  <h4 className="text-xl font-black text-amber-900">
                    {lang === "hindi" ? `स्कोर: ${quizScore} / 5 — पुनः प्रयास करें` : `Score: ${quizScore} / 5 — Please Try Again`}
                  </h4>
                  <p className="mt-2 text-sm text-amber-800 max-w-xl mx-auto">
                    {lang === "hindi"
                      ? "प्रमाणपत्र प्राप्त करने के लिए आपको 5 में से कम से कम 3 प्रश्नों का सही उत्तर देना होगा। नीचे दिए गए बटन पर क्लिक करके नए रैंडम प्रश्नों के साथ फिर से प्रयास करें।"
                      : "You need at least 3 correct answers out of 5 to pass and earn your certificate. Click below to try again with a new set of random questions."}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setAttemptsCount((prev) => prev + 1);
                      initRandomQuiz();
                    }}
                    className="mt-5 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 px-6 py-3 font-bold text-white hover:from-amber-700 hover:to-orange-800 transition shadow-lg inline-flex items-center gap-2 text-sm"
                  >
                    🔄 {lang === "hindi" ? "नए प्रश्नों के साथ पुनः प्रयास करें" : "Retry Quiz (New Random Questions)"}
                  </button>
                </div>
              )}

              {/* Render 5 Questions */}
              {(quizScore === null || hasPassed) && (
                <form onSubmit={handleQuizEvaluate} className="mt-6 space-y-8">
                  {questions.map((q, index) => (
                    <div key={q.id} className="rounded-2xl border border-sky-200/80 bg-sky-50/40 p-6 shadow-sm">
                      <p className="text-xs font-extrabold uppercase tracking-wider text-purple-700">
                        {lang === "hindi" ? `प्रश्न ${index + 1} / 5` : `Question ${index + 1} of 5`}
                      </p>
                      <h4 className="mt-2 text-lg font-bold text-slate-900 leading-snug">
                        {q.question}
                      </h4>

                      <div className="mt-4 space-y-3">
                        {q.options.map((option, optIdx) => (
                          <label
                            key={optIdx}
                            className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                              quizAnswers[q.id] === optIdx
                                ? "border-purple-500 bg-purple-50/80 text-purple-950 font-semibold ring-2 ring-purple-500/20"
                                : "border-sky-200 bg-white text-slate-700 hover:border-purple-300 hover:bg-purple-50/30"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`quiz_q_${q.id}`}
                              value={optIdx}
                              checked={quizAnswers[q.id] === optIdx}
                              onChange={() =>
                                setQuizAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
                              }
                              className="h-4 w-4 accent-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}

                  <button
                    id="btn-submit-quiz"
                    type="submit"
                    className="w-full rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 py-4 font-bold text-white shadow-xl hover:from-sky-700 hover:to-purple-700 transition text-lg flex items-center justify-center gap-2"
                  >
                    {lang === "hindi" ? "मूल्यांकन उत्तर सबमिट करें →" : "Submit Assessment Answers →"}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 4: FEEDBACK & DECLARATION */}
          {activeTab === "feedback" && (
            <div>
              <div className="text-center border-b border-sky-100 pb-5">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-800">
                  ✓ {lang === "hindi" ? `उत्तीर्ण स्कोर: ${quizScore}/5` : `Passed Score: ${quizScore}/5`}
                </span>
                <h3 className="mt-3 text-2xl font-black text-slate-900">
                  {lang === "hindi" ? "प्रतिभागी प्रतिक्रिया एवं घोषणा" : "Participant Feedback & Declaration"}
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  {lang === "hindi"
                    ? "अपना प्रमाणपत्र जारी करने से पहले कृपया अपनी प्रतिक्रिया एवं सुझाव साझा करें।"
                    : "Please share your rating, feedback and confirm the declaration to issue your certificate."}
                </p>
              </div>

              {errorMsg && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleFinalSubmit} className="mt-6 space-y-6">
                {/* Rating 1-5 Stars */}
                <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-5 text-center">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-purple-900 mb-2">
                    {lang === "hindi" ? "सीपीआर ई-संजीवनी मॉड्यूल रेटिंग (1 - 5 स्टार)" : "Module Rating (1 - 5 Stars)"}
                  </label>
                  <div className="flex items-center justify-center gap-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`text-3xl transition ${
                          star <= rating ? "text-amber-500 scale-110" : "text-slate-300 hover:text-amber-400"
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feedback Comments */}
                <div>
                  <label htmlFor="feedback-text" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    {lang === "hindi" ? "प्रतिक्रिया / टिप्पणियां (Feedback)" : "Feedback & Experience"}
                  </label>
                  <textarea
                    id="feedback-text"
                    rows={3}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder={lang === "hindi" ? "इस सीपीआर मॉड्यूल के बारे में अपने विचार साझा करें..." : "Share your thoughts about this CPR training module..."}
                    className="mt-2 w-full rounded-xl border border-sky-200 bg-slate-50/50 p-4 text-sm text-slate-900 focus:border-purple-600 focus:outline-none"
                  ></textarea>
                </div>

                {/* Suggestions */}
                <div>
                  <label htmlFor="suggestions-text" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    {lang === "hindi" ? "सुझाव (Suggestions for Improvement)" : "Suggestions for Future Sessions"}
                  </label>
                  <textarea
                    id="suggestions-text"
                    rows={2}
                    value={suggestions}
                    onChange={(e) => setSuggestions(e.target.value)}
                    placeholder={lang === "hindi" ? "हमें सुधार के लिए सुझाव दें..." : "Suggestions to improve CPR Sanjeevani initiative..."}
                    className="mt-2 w-full rounded-xl border border-sky-200 bg-slate-50/50 p-4 text-sm text-slate-900 focus:border-purple-600 focus:outline-none"
                  ></textarea>
                </div>

                {/* Declaration Checkbox */}
                <div className="rounded-2xl border-2 border-purple-200 bg-purple-50/70 p-5">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={declarationChecked}
                      onChange={(e) => setDeclarationChecked(e.target.checked)}
                      className="mt-1 h-5 w-5 accent-purple-600 rounded focus:ring-purple-500"
                      required
                    />
                    <span className="text-xs leading-relaxed text-slate-800 font-medium">
                      {lang === "hindi"
                        ? "मैं एतद्द्वारा घोषणा करता/करती हूं कि मैंने सीपीआर संजीवनी का पूरा प्रशिक्षण वीडियो देखा है, मूल्यांकन प्रश्न हल किए हैं तथा आपातकालीन स्थिति में सीपीआर कौशल का उपयोग करने के लिए प्रतिबद्ध हूं।"
                        : "I hereby declare that I have watched the complete CPR Sanjeevani training video and answered the evaluation questions to the best of my knowledge. I commit to practicing life-saving CPR skills."}
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 py-4 font-bold text-white shadow-xl hover:from-emerald-700 hover:to-teal-800 transition text-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    "Issuing Certificate..."
                  ) : (
                    <>{lang === "hindi" ? "सबमिट करें एवं प्रमाणपत्र प्राप्त करें →" : "Submit & Issue Official Certificate →"}</>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* TAB 5: CPR AWARE CITIZEN CERTIFICATE */}
          {activeTab === "certificate" && (
            <div>
              <div className="text-center border-b border-sky-100 pb-6">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-800">
                  ✓ {lang === "hindi" ? `मॉड्यूल पूर्ण • स्कोर: ${quizScore}/5` : `Module Completed • Score: ${quizScore}/5`}
                </span>
                <h3 className="mt-4 text-3xl font-extrabold text-slate-900">
                  {lang === "hindi" ? `बधाई हो, ${user?.fullName || fullName}!` : `Congratulations, ${user?.fullName || fullName}!`}
                </h3>
                <p className="mt-2 text-slate-600 text-sm">
                  {lang === "hindi"
                    ? "आपने सीपीआर ई-संजीवनी ऑनलाइन शिक्षण मॉड्यूल सफलतापूर्वक पूर्ण कर लिया है।"
                    : "You have successfully completed the CPR eSANJEEVANI online learning module and earned your official certificate."}
                </p>
              </div>

              {/* Certificate Display Box */}
              <div className="mt-8 relative overflow-hidden rounded-2xl border-4 border-purple-200 bg-gradient-to-br from-sky-50 via-purple-50 to-indigo-50 p-8 shadow-2xl text-center">
                <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-purple-800">
                  Indian Academy of Pediatrics
                </p>
                <h4 className="text-3xl font-black text-slate-900 uppercase tracking-tight mt-1">
                  CPR SANJEEVANI
                </h4>
                <p className="text-lg font-bold text-purple-700 mt-1">
                  CPR Aware Citizen Certificate
                </p>

                <p className="mt-6 text-xs text-slate-500 uppercase tracking-widest font-semibold">
                  This is to certify that
                </p>
                <p className="mt-1 text-3xl font-extrabold text-slate-900 border-b-2 border-purple-300 inline-block px-6 pb-2">
                  {user?.fullName || fullName}
                </p>

                <p className="mt-6 max-w-2xl mx-auto text-sm text-slate-700 leading-relaxed">
                  has successfully completed the online CPR awareness module, watched the instructional video, passed the knowledge assessment, and earned recognition as an official <strong>CPR Aware Citizen</strong>.
                </p>

                <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-xl border border-purple-200 bg-white/80 p-4 text-xs max-w-2xl mx-auto">
                  <div>
                    <span className="text-slate-500 uppercase font-semibold block">Unique Certificate ID</span>
                    <span className="font-mono font-bold text-purple-800 text-sm mt-0.5 block">{certificateId}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase font-semibold block">District & State</span>
                    <span className="font-bold text-slate-800 text-sm mt-0.5 block truncate">
                      {user?.district || district}, {user?.state || stateName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase font-semibold block">Zone</span>
                    <span className="font-bold text-slate-800 text-sm mt-0.5 block">{user?.zone || zone}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase font-semibold block">Date of Issue</span>
                    <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                      {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={handlePrintCertificate}
                    className="rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 px-7 py-3.5 font-bold text-white shadow-xl hover:from-sky-700 hover:to-purple-700 transition flex items-center gap-2 text-base"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    {lang === "hindi" ? "प्रमाणपत्र डाउनलोड करें (PDF)" : "Download Certificate (PDF)"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Admin Analytics Modal */}
      <ESanjeevaniAnalyticsModal
        isOpen={showAnalyticsModal}
        onClose={() => setShowAnalyticsModal(false)}
      />
    </section>
  );
}

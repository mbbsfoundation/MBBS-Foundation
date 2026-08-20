"use client";

import React, { useState } from "react";
import { trackNeetEvent } from "@/lib/analytics";

export interface CollegeData {
  name: string;
  city: string;
  state: string;
  type: "Government" | "Private" | "Deemed" | "Other" | "";
  university: string;
  recognitionChecked: "Yes" | "Not yet verified" | "";
  yearEstablished: string;

  // Factor Ratings
  costEstimated: string;
  costAffordability: "comfortable" | "manageable" | "difficult" | "";

  bondRating: "no-bond" | "acceptable" | "not-verified" | "concern" | "";
  bondDuration: string;
  bondPenalty: string;

  clinicalRating: "strong" | "adequate" | "needs-info" | "concern" | "";
  clinicalNotes: string;

  academicRating: "strong" | "adequate" | "needs-info" | "concern" | "";
  academicNotes: string;

  hostelRating: "good-fit" | "acceptable" | "not-verified" | "concern" | "";
  hostelNotes: string;

  locationRating: "convenient" | "manageable" | "difficult" | "";
  locationNotes: string;

  distanceValue: string;
  distanceRating: "comfortable" | "manageable" | "concern" | "";

  pgRating: "strong" | "adequate" | "needs-info" | "not-important" | "";
  personalPreferenceRating: number; // 1 to 5
}

const DEFAULT_COLLEGE: CollegeData = {
  name: "",
  city: "",
  state: "",
  type: "",
  university: "",
  recognitionChecked: "",
  yearEstablished: "",

  costEstimated: "",
  costAffordability: "",

  bondRating: "",
  bondDuration: "",
  bondPenalty: "",

  clinicalRating: "",
  clinicalNotes: "",

  academicRating: "",
  academicNotes: "",

  hostelRating: "",
  hostelNotes: "",

  locationRating: "",
  locationNotes: "",

  distanceValue: "",
  distanceRating: "",

  pgRating: "",
  personalPreferenceRating: 3,
};

const COLLEGE_PLACEHOLDERS = [
  {
    name: "e.g. Govt Medical College, Nagpur",
    city: "e.g. Nagpur",
    state: "e.g. Maharashtra",
  },
  {
    name: "e.g. Bangalore Medical College & Research Institute",
    city: "e.g. Bengaluru",
    state: "e.g. Karnataka",
  },
  {
    name: "e.g. King George's Medical University",
    city: "e.g. Lucknow",
    state: "e.g. Uttar Pradesh",
  },
];

type PriorityWeight = "3" | "2" | "1"; // 3 = Very Important, 2 = Important, 1 = Less Important

interface PrioritySettings {
  affordability: PriorityWeight;
  clinicalExposure: PriorityWeight;
  teachingHospital: PriorityWeight;
  academicEcosystem: PriorityWeight;
  bondObligation: PriorityWeight;
  hostelCampus: PriorityWeight;
  locationConnectivity: PriorityWeight;
  distanceFromHome: PriorityWeight;
  pgOpportunities: PriorityWeight;
  personalPreference: PriorityWeight;
}

const DEFAULT_PRIORITIES: PrioritySettings = {
  affordability: "3",
  clinicalExposure: "3",
  teachingHospital: "3",
  academicEcosystem: "2",
  bondObligation: "2",
  hostelCampus: "2",
  locationConnectivity: "2",
  distanceFromHome: "2",
  pgOpportunities: "2",
  personalPreference: "3",
};

interface CityStateLocation {
  city: string;
  state: string;
}

// Major Indian Medical College Cities & States (Current official state names only: Uttarakhand, Odisha, etc.)
const INDIAN_MEDICAL_CITIES: CityStateLocation[] = [
  // Delhi NCR
  { city: "New Delhi", state: "Delhi" },
  { city: "Delhi", state: "Delhi" },
  { city: "Noida", state: "Uttar Pradesh" },
  { city: "Greater Noida", state: "Uttar Pradesh" },
  { city: "Ghaziabad", state: "Uttar Pradesh" },
  { city: "Gurugram", state: "Haryana" },
  { city: "Faridabad", state: "Haryana" },

  // Maharashtra
  { city: "Mumbai", state: "Maharashtra" },
  { city: "Pune", state: "Maharashtra" },
  { city: "Nagpur", state: "Maharashtra" },
  { city: "Nashik", state: "Maharashtra" },
  { city: "Aurangabad (Chhatrapati Sambhajinagar)", state: "Maharashtra" },
  { city: "Solapur", state: "Maharashtra" },
  { city: "Kolhapur", state: "Maharashtra" },
  { city: "Navi Mumbai", state: "Maharashtra" },
  { city: "Thane", state: "Maharashtra" },
  { city: "Nanded", state: "Maharashtra" },
  { city: "Miraj", state: "Maharashtra" },
  { city: "Latur", state: "Maharashtra" },
  { city: "Dhule", state: "Maharashtra" },
  { city: "Amravati", state: "Maharashtra" },
  { city: "Akola", state: "Maharashtra" },
  { city: "Wardha", state: "Maharashtra" },
  { city: "Jalgaon", state: "Maharashtra" },
  { city: "Karad", state: "Maharashtra" },

  // Karnataka
  { city: "Bengaluru", state: "Karnataka" },
  { city: "Mysuru", state: "Karnataka" },
  { city: "Mangaluru", state: "Karnataka" },
  { city: "Belagavi", state: "Karnataka" },
  { city: "Hubballi", state: "Karnataka" },
  { city: "Dharwad", state: "Karnataka" },
  { city: "Kalaburagi", state: "Karnataka" },
  { city: "Davangere", state: "Karnataka" },
  { city: "Shivamogga", state: "Karnataka" },
  { city: "Ballari", state: "Karnataka" },
  { city: "Manipal", state: "Karnataka" },
  { city: "Kolar", state: "Karnataka" },
  { city: "Tumakuru", state: "Karnataka" },

  // Tamil Nadu
  { city: "Chennai", state: "Tamil Nadu" },
  { city: "Coimbatore", state: "Tamil Nadu" },
  { city: "Madurai", state: "Tamil Nadu" },
  { city: "Tiruchirappalli", state: "Tamil Nadu" },
  { city: "Salem", state: "Tamil Nadu" },
  { city: "Vellore", state: "Tamil Nadu" },
  { city: "Tirunelveli", state: "Tamil Nadu" },
  { city: "Thanjavur", state: "Tamil Nadu" },
  { city: "Chengalpattu", state: "Tamil Nadu" },
  { city: "Kanchipuram", state: "Tamil Nadu" },
  { city: "Erode", state: "Tamil Nadu" },

  // Uttar Pradesh
  { city: "Lucknow", state: "Uttar Pradesh" },
  { city: "Kanpur", state: "Uttar Pradesh" },
  { city: "Varanasi", state: "Uttar Pradesh" },
  { city: "Agra", state: "Uttar Pradesh" },
  { city: "Prayagraj", state: "Uttar Pradesh" },
  { city: "Gorakhpur", state: "Uttar Pradesh" },
  { city: "Meerut", state: "Uttar Pradesh" },
  { city: "Bareilly", state: "Uttar Pradesh" },
  { city: "Aligarh", state: "Uttar Pradesh" },
  { city: "Jhansi", state: "Uttar Pradesh" },
  { city: "Ayodhya", state: "Uttar Pradesh" },
  { city: "Saifai", state: "Uttar Pradesh" },
  { city: "Banda", state: "Uttar Pradesh" },
  { city: "Saharanpur", state: "Uttar Pradesh" },
  { city: "Muzaffarnagar", state: "Uttar Pradesh" },

  // Uttarakhand (Official Name: Uttarakhand, NOT Uttaranchal)
  { city: "Rishikesh", state: "Uttarakhand" },
  { city: "Dehradun", state: "Uttarakhand" },
  { city: "Haldwani", state: "Uttarakhand" },
  { city: "Srinagar (Garhwal)", state: "Uttarakhand" },
  { city: "Almora", state: "Uttarakhand" },

  // Rajasthan
  { city: "Jaipur", state: "Rajasthan" },
  { city: "Jodhpur", state: "Rajasthan" },
  { city: "Udaipur", state: "Rajasthan" },
  { city: "Kota", state: "Rajasthan" },
  { city: "Bikaner", state: "Rajasthan" },
  { city: "Ajmer", state: "Rajasthan" },
  { city: "Alwar", state: "Rajasthan" },
  { city: "Bharatpur", state: "Rajasthan" },
  { city: "Bhilwara", state: "Rajasthan" },
  { city: "Pali", state: "Rajasthan" },
  { city: "Sikar", state: "Rajasthan" },
  { city: "Barmer", state: "Rajasthan" },

  // Gujarat
  { city: "Ahmedabad", state: "Gujarat" },
  { city: "Vadodara", state: "Gujarat" },
  { city: "Surat", state: "Gujarat" },
  { city: "Rajkot", state: "Gujarat" },
  { city: "Bhavnagar", state: "Gujarat" },
  { city: "Jamnagar", state: "Gujarat" },
  { city: "Gandhinagar", state: "Gujarat" },
  { city: "Bhuj", state: "Gujarat" },
  { city: "Himmatnagar", state: "Gujarat" },
  { city: "Morbi", state: "Gujarat" },

  // West Bengal
  { city: "Kolkata", state: "West Bengal" },
  { city: "Siliguri", state: "West Bengal" },
  { city: "Kalyani", state: "West Bengal" },
  { city: "Burdwan (Bardhaman)", state: "West Bengal" },
  { city: "Bankura", state: "West Bengal" },
  { city: "Midnapore (Medinipur)", state: "West Bengal" },
  { city: "Malda", state: "West Bengal" },
  { city: "Murshidabad", state: "West Bengal" },
  { city: "Cooch Behar", state: "West Bengal" },

  // Kerala
  { city: "Thiruvananthapuram", state: "Kerala" },
  { city: "Kochi", state: "Kerala" },
  { city: "Kozhikode", state: "Kerala" },
  { city: "Thrissur", state: "Kerala" },
  { city: "Kottayam", state: "Kerala" },
  { city: "Alappuzha", state: "Kerala" },
  { city: "Kannur", state: "Kerala" },
  { city: "Manjeri", state: "Kerala" },
  { city: "Kollam", state: "Kerala" },
  { city: "Palakkad", state: "Kerala" },

  // Telangana
  { city: "Hyderabad", state: "Telangana" },
  { city: "Warangal", state: "Telangana" },
  { city: "Nizamabad", state: "Telangana" },
  { city: "Karimnagar", state: "Telangana" },
  { city: "Khammam", state: "Telangana" },
  { city: "Mahabubnagar", state: "Telangana" },
  { city: "Bibinagar", state: "Telangana" },

  // Andhra Pradesh
  { city: "Visakhapatnam", state: "Andhra Pradesh" },
  { city: "Vijayawada", state: "Andhra Pradesh" },
  { city: "Guntur", state: "Andhra Pradesh" },
  { city: "Tirupati", state: "Andhra Pradesh" },
  { city: "Kurnool", state: "Andhra Pradesh" },
  { city: "Kakinada", state: "Andhra Pradesh" },
  { city: "Nellore", state: "Andhra Pradesh" },
  { city: "Kadapa", state: "Andhra Pradesh" },
  { city: "Anantapur", state: "Andhra Pradesh" },
  { city: "Mangalagiri", state: "Andhra Pradesh" },

  // Madhya Pradesh
  { city: "Bhopal", state: "Madhya Pradesh" },
  { city: "Indore", state: "Madhya Pradesh" },
  { city: "Gwalior", state: "Madhya Pradesh" },
  { city: "Jabalpur", state: "Madhya Pradesh" },
  { city: "Rewa", state: "Madhya Pradesh" },
  { city: "Sagar", state: "Madhya Pradesh" },
  { city: "Ujjain", state: "Madhya Pradesh" },
  { city: "Ratlam", state: "Madhya Pradesh" },
  { city: "Vidisha", state: "Madhya Pradesh" },
  { city: "Khandwa", state: "Madhya Pradesh" },
  { city: "Shivpuri", state: "Madhya Pradesh" },

  // Bihar
  { city: "Patna", state: "Bihar" },
  { city: "Gaya", state: "Bihar" },
  { city: "Muzaffarpur", state: "Bihar" },
  { city: "Darbhanga", state: "Bihar" },
  { city: "Bhagalpur", state: "Bihar" },
  { city: "Pawapuri (Nalanda)", state: "Bihar" },
  { city: "Bettiah", state: "Bihar" },
  { city: "Madhepura", state: "Bihar" },

  // Odisha (Official Name: Odisha, NOT Orissa)
  { city: "Bhubaneswar", state: "Odisha" },
  { city: "Cuttack", state: "Odisha" },
  { city: "Berhampur", state: "Odisha" },
  { city: "Burla (Sambalpur)", state: "Odisha" },
  { city: "Rourkela", state: "Odisha" },
  { city: "Balasore", state: "Odisha" },
  { city: "Baripada", state: "Odisha" },
  { city: "Koraput", state: "Odisha" },
  { city: "Balangir", state: "Odisha" },
  { city: "Puri", state: "Odisha" },

  // Punjab, Haryana & Chandigarh
  { city: "Chandigarh", state: "Chandigarh" },
  { city: "Amritsar", state: "Punjab" },
  { city: "Ludhiana", state: "Punjab" },
  { city: "Patiala", state: "Punjab" },
  { city: "Bathinda", state: "Punjab" },
  { city: "Jalandhar", state: "Punjab" },
  { city: "Faridkot", state: "Punjab" },
  { city: "Rohtak", state: "Haryana" },
  { city: "Karnal", state: "Haryana" },
  { city: "Sonipat", state: "Haryana" },
  { city: "Agroha", state: "Haryana" },
  { city: "Mewat (Nuh)", state: "Haryana" },

  // Jammu & Kashmir and Ladakh
  { city: "Srinagar", state: "Jammu and Kashmir" },
  { city: "Jammu", state: "Jammu and Kashmir" },
  { city: "Anantnag", state: "Jammu and Kashmir" },
  { city: "Baramulla", state: "Jammu and Kashmir" },
  { city: "Kathua", state: "Jammu and Kashmir" },
  { city: "Rajouri", state: "Jammu and Kashmir" },
  { city: "Doda", state: "Jammu and Kashmir" },

  // Himachal Pradesh
  { city: "Shimla", state: "Himachal Pradesh" },
  { city: "Tanda (Kangra)", state: "Himachal Pradesh" },
  { city: "Bilaspur", state: "Himachal Pradesh" },
  { city: "Mandi (Nerchowk)", state: "Himachal Pradesh" },
  { city: "Nahan (Sirmour)", state: "Himachal Pradesh" },
  { city: "Chamba", state: "Himachal Pradesh" },
  { city: "Hamirpur", state: "Himachal Pradesh" },

  // Chhattisgarh & Jharkhand
  { city: "Raipur", state: "Chhattisgarh" },
  { city: "Bilaspur", state: "Chhattisgarh" },
  { city: "Jagdalpur", state: "Chhattisgarh" },
  { city: "Rajnandgaon", state: "Chhattisgarh" },
  { city: "Ambikapur", state: "Chhattisgarh" },
  { city: "Ranchi", state: "Jharkhand" },
  { city: "Jamshedpur", state: "Jharkhand" },
  { city: "Dhanbad", state: "Jharkhand" },
  { city: "Deoghar", state: "Jharkhand" },
  { city: "Dumka", state: "Jharkhand" },
  { city: "Hazaribagh", state: "Jharkhand" },
  { city: "Palamu", state: "Jharkhand" },

  // Assam & North East
  { city: "Guwahati", state: "Assam" },
  { city: "Dibrugarh", state: "Assam" },
  { city: "Silchar", state: "Assam" },
  { city: "Jorhat", state: "Assam" },
  { city: "Tezpur", state: "Assam" },
  { city: "Barpeta", state: "Assam" },
  { city: "Diphu", state: "Assam" },
  { city: "Shillong", state: "Meghalaya" },
  { city: "Imphal", state: "Manipur" },
  { city: "Agartala", state: "Tripura" },
  { city: "Aizawl", state: "Mizoram" },
  { city: "Kohima", state: "Nagaland" },
  { city: "Gangtok", state: "Sikkim" },
  { city: "Naharlagun", state: "Arunachal Pradesh" },

  // Goa & Puducherry
  { city: "Bambolim (Panaji)", state: "Goa" },
  { city: "Puducherry", state: "Puducherry" },
  { city: "Karaikal", state: "Puducherry" },
];

const DECISION_FACTORS = [
  {
    key: "affordability" as const,
    num: "01",
    icon: "💰",
    title: "Affordability & True Cost",
    tint: "bg-amber-50/70 border-amber-200/90 hover:border-amber-300",
  },
  {
    key: "clinicalExposure" as const,
    num: "02",
    icon: "🩺",
    title: "Clinical Exposure & Variety",
    tint: "bg-emerald-50/70 border-emerald-200/90 hover:border-emerald-300",
  },
  {
    key: "teachingHospital" as const,
    num: "03",
    icon: "🏥",
    title: "Teaching Hospital Patient Load",
    tint: "bg-blue-50/70 border-blue-200/90 hover:border-blue-300",
  },
  {
    key: "academicEcosystem" as const,
    num: "04",
    icon: "🏛️",
    title: "Academic Ecosystem & Faculty",
    tint: "bg-indigo-50/70 border-indigo-200/90 hover:border-indigo-300",
  },
  {
    key: "bondObligation" as const,
    num: "05",
    icon: "📜",
    title: "Service Bond & Penalty",
    tint: "bg-rose-50/70 border-rose-200/90 hover:border-rose-300",
  },
  {
    key: "hostelCampus" as const,
    num: "06",
    icon: "🏢",
    title: "Hostel, Campus & Mess",
    tint: "bg-orange-50/70 border-orange-200/90 hover:border-orange-300",
  },
  {
    key: "locationConnectivity" as const,
    num: "07",
    icon: "🚆",
    title: "Location & Transport",
    tint: "bg-teal-50/70 border-teal-200/90 hover:border-teal-300",
  },
  {
    key: "distanceFromHome" as const,
    num: "08",
    icon: "📍",
    title: "Distance From Home",
    tint: "bg-violet-50/70 border-violet-200/90 hover:border-violet-300",
  },
  {
    key: "pgOpportunities" as const,
    num: "09",
    icon: "🎓",
    title: "PG Opportunities & Scope",
    tint: "bg-sky-50/70 border-sky-200/90 hover:border-sky-300",
  },
  {
    key: "personalPreference" as const,
    num: "10",
    icon: "⭐",
    title: "Personal Preference",
    tint: "bg-pink-50/70 border-pink-200/90 hover:border-pink-300",
  },
];

export type TrafficStatus = "green" | "yellow" | "red" | "neutral";

export default function InteractiveCollegeComparator() {
  // Student identification state (Local only)
  const [studentName, setStudentName] = useState("");
  const [idType, setIdType] = useState<"mobile" | "dob" | "none">("none");
  const [idValue, setIdValue] = useState("");
  const [neetRank, setNeetRank] = useState("");

  // City Autocomplete Focus State
  const [activeCityIndex, setActiveCityIndex] = useState<number | null>(null);

  // Priority weights state
  const [priorities, setPriorities] = useState<PrioritySettings>(DEFAULT_PRIORITIES);

  // 3 Colleges Data
  const [colleges, setColleges] = useState<CollegeData[]>([
    { ...DEFAULT_COLLEGE },
    { ...DEFAULT_COLLEGE },
    { ...DEFAULT_COLLEGE },
  ]);

  // Active step / tab for editing colleges (Mobile / Desktop view helper)
  const [activeCollegeTab, setActiveCollegeTab] = useState<number>(0);
  const [viewMode, setViewMode] = useState<"interactive" | "blank-worksheet">("interactive");

  // User's Manual Final Preference
  const [finalPref1, setFinalPref1] = useState<string>("");
  const [finalPref2, setFinalPref2] = useState<string>("");
  const [finalPref3, setFinalPref3] = useState<string>("");

  const updateCollege = (index: number, updates: Partial<CollegeData>) => {
    setColleges((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const handleReset = () => {
    if (window.confirm("This will clear your current college comparison entries. Continue?")) {
      setStudentName("");
      setIdType("none");
      setIdValue("");
      setNeetRank("");
      setPriorities(DEFAULT_PRIORITIES);
      setColleges([{ ...DEFAULT_COLLEGE }, { ...DEFAULT_COLLEGE }, { ...DEFAULT_COLLEGE }]);
      setFinalPref1("");
      setFinalPref2("");
      setFinalPref3("");
    }
  };

  const handlePrint = () => {
    trackNeetEvent("college_comparison_print");
    if (typeof window !== "undefined") {
      const originalTitle = document.title;
      const cleanStudentName = studentName.trim() || "Student";
      const customFileName = `${cleanStudentName}_College choice decision matrix_MBBS Foundation`;

      document.title = customFileName;
      window.print();

      // Restore document title after print dialog closes
      setTimeout(() => {
        document.title = originalTitle;
      }, 1000);
    }
  };

  // Helper to evaluate traffic light and numeric points for each factor
  const evaluateFactor = (
    factorKey: keyof PrioritySettings,
    college: CollegeData
  ): { status: TrafficStatus; label: string; points: number } => {
    switch (factorKey) {
      case "affordability": {
        if (college.costAffordability === "comfortable") return { status: "green", label: "Comfortable", points: 3 };
        if (college.costAffordability === "manageable") return { status: "yellow", label: "Manageable", points: 2 };
        if (college.costAffordability === "difficult") return { status: "red", label: "Difficult", points: 1 };
        return { status: "yellow", label: "Not entered", points: 2 };
      }
      case "clinicalExposure":
      case "teachingHospital": {
        if (college.clinicalRating === "strong") return { status: "green", label: "Strong", points: 3 };
        if (college.clinicalRating === "adequate") return { status: "yellow", label: "Adequate", points: 2 };
        if (college.clinicalRating === "needs-info") return { status: "yellow", label: "Verify", points: 2 };
        if (college.clinicalRating === "concern") return { status: "red", label: "Concern", points: 1 };
        return { status: "yellow", label: "Not entered", points: 2 };
      }
      case "academicEcosystem": {
        if (college.academicRating === "strong") return { status: "green", label: "Strong", points: 3 };
        if (college.academicRating === "adequate") return { status: "yellow", label: "Adequate", points: 2 };
        if (college.academicRating === "needs-info") return { status: "yellow", label: "Verify", points: 2 };
        if (college.academicRating === "concern") return { status: "red", label: "Concern", points: 1 };
        return { status: "yellow", label: "Not entered", points: 2 };
      }
      case "bondObligation": {
        if (college.bondRating === "no-bond" || college.bondRating === "acceptable") return { status: "green", label: "Acceptable / None", points: 3 };
        if (college.bondRating === "not-verified") return { status: "yellow", label: "Not verified", points: 2 };
        if (college.bondRating === "concern") return { status: "red", label: "Concern", points: 1 };
        return { status: "yellow", label: "Not entered", points: 2 };
      }
      case "hostelCampus": {
        if (college.hostelRating === "good-fit") return { status: "green", label: "Good fit", points: 3 };
        if (college.hostelRating === "acceptable") return { status: "yellow", label: "Acceptable", points: 2 };
        if (college.hostelRating === "not-verified") return { status: "yellow", label: "Not verified", points: 2 };
        if (college.hostelRating === "concern") return { status: "red", label: "Concern", points: 1 };
        return { status: "yellow", label: "Not entered", points: 2 };
      }
      case "locationConnectivity": {
        if (college.locationRating === "convenient") return { status: "green", label: "Convenient", points: 3 };
        if (college.locationRating === "manageable") return { status: "yellow", label: "Manageable", points: 2 };
        if (college.locationRating === "difficult") return { status: "red", label: "Difficult", points: 1 };
        return { status: "yellow", label: "Not entered", points: 2 };
      }
      case "distanceFromHome": {
        if (college.distanceRating === "comfortable") return { status: "green", label: "Comfortable", points: 3 };
        if (college.distanceRating === "manageable") return { status: "yellow", label: "Manageable", points: 2 };
        if (college.distanceRating === "concern") return { status: "red", label: "Concern", points: 1 };
        return { status: "yellow", label: "Not entered", points: 2 };
      }
      case "pgOpportunities": {
        if (college.pgRating === "strong" || college.pgRating === "not-important") return { status: "green", label: "Strong / N.A.", points: 3 };
        if (college.pgRating === "adequate") return { status: "yellow", label: "Adequate", points: 2 };
        if (college.pgRating === "needs-info") return { status: "yellow", label: "Verify", points: 2 };
        return { status: "yellow", label: "Not entered", points: 2 };
      }
      case "personalPreference": {
        if (college.personalPreferenceRating >= 4) return { status: "green", label: `${college.personalPreferenceRating}/5 High`, points: 3 };
        if (college.personalPreferenceRating === 3) return { status: "yellow", label: "3/5 Moderate", points: 2 };
        return { status: "red", label: `${college.personalPreferenceRating}/5 Low`, points: 1 };
      }
      default:
        return { status: "yellow", label: "Review", points: 2 };
    }
  };

  // Calculate weighted summary for each college
  const factorKeys: (keyof PrioritySettings)[] = [
    "affordability",
    "clinicalExposure",
    "teachingHospital",
    "academicEcosystem",
    "bondObligation",
    "hostelCampus",
    "locationConnectivity",
    "distanceFromHome",
    "pgOpportunities",
    "personalPreference",
  ];

  const collegeSummaries = colleges.map((college, idx) => {
    let totalScore = 0;
    let maxScore = 0;
    let greenCount = 0;
    let yellowCount = 0;
    let redCount = 0;

    const strongFactors: string[] = [];
    const reviewFactors: string[] = [];
    const concernFactors: string[] = [];
    const verificationTasks: string[] = [];

    const collegeTitle = college.name.trim() || `College Choice ${idx + 1}`;

    if (college.recognitionChecked === "Not yet verified") {
      verificationTasks.push(`Verify NMC recognition & intake for ${collegeTitle}`);
    }
    if (college.bondRating === "not-verified") {
      verificationTasks.push(`Confirm service bond & penalty for ${collegeTitle}`);
    }
    if (college.clinicalRating === "needs-info") {
      verificationTasks.push(`Verify hospital OPD & bed count for ${collegeTitle}`);
    }
    if (college.academicRating === "needs-info") {
      verificationTasks.push(`Check faculty strength & PG depts for ${collegeTitle}`);
    }
    if (college.hostelRating === "not-verified") {
      verificationTasks.push(`Confirm hostel availability for ${collegeTitle}`);
    }
    if (college.costAffordability === "" && college.costEstimated.trim() === "") {
      verificationTasks.push(`Check 5.5-yr total fee breakdown for ${collegeTitle}`);
    }

    factorKeys.forEach((key) => {
      const weight = parseInt(priorities[key], 10) || 2;
      const { status, points } = evaluateFactor(key, college);

      totalScore += points * weight;
      maxScore += 3 * weight;

      const factorTitle = {
        affordability: "Cost",
        clinicalExposure: "Clinical Exposure",
        teachingHospital: "Hospital Load",
        academicEcosystem: "Academics",
        bondObligation: "Bond",
        hostelCampus: "Hostel",
        locationConnectivity: "Location",
        distanceFromHome: "Distance",
        pgOpportunities: "PG Scope",
        personalPreference: "Preference",
      }[key];

      if (status === "green") {
        greenCount++;
        strongFactors.push(factorTitle);
      } else if (status === "yellow") {
        yellowCount++;
        reviewFactors.push(factorTitle);
      } else if (status === "red") {
        redCount++;
        concernFactors.push(factorTitle);
      }
    });

    const fitPercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    return {
      index: idx,
      name: collegeTitle,
      fitPercentage,
      greenCount,
      yellowCount,
      redCount,
      strongFactors,
      reviewFactors,
      concernFactors,
      verificationTasks,
    };
  });

  // Calculate suggested preference order (sorted by fit percentage)
  const sortedColleges = [...collegeSummaries].sort((a, b) => b.fitPercentage - a.fitPercentage);
  const isCloseMatch =
    sortedColleges.length >= 2 &&
    Math.abs(sortedColleges[0].fitPercentage - sortedColleges[1].fitPercentage) <= 3 &&
    sortedColleges[0].fitPercentage > 0;

  // Collect all unique verification items across the 3 colleges
  const allVerificationItems = collegeSummaries.flatMap((s) => s.verificationTasks);

  return (
    <div className="space-y-10 text-slate-800 print:space-y-0">
      {/* Print CSS: Exact 1-page A4 print with generous ~1.5x vertical proportioning */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              size: A4 portrait;
              margin: 7mm 9mm 7mm 9mm !important;
            }
            html, body {
              height: auto !important;
              background-color: #ffffff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .print-page-container {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              page-break-after: avoid !important;
              break-after: avoid !important;
            }
          }
        `
      }} />

      {/* Top Header & Mode Toggle (Screen only) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 print:hidden">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-red-100 border border-red-200 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-red-900">
            <span>⚖️</span> Interactive Comparison Tool
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Compare Three Medical Colleges
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Define your priorities, input your verified facts, and visually identify advantages and concerns.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode(viewMode === "interactive" ? "blank-worksheet" : "interactive")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <span>{viewMode === "interactive" ? "📋 Blank Template" : "✨ Interactive Mode"}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer shadow-xs"
          >
            <span>🖨️</span>
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW MODE A: BLANK PRINTABLE WORKSHEET */}
      {/* ========================================================================= */}
      {viewMode === "blank-worksheet" ? (
        <div className="space-y-6 print:hidden">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
            <span>Showing blank printable template. Click &ldquo;Interactive Mode&rdquo; to use the automated decision tool.</span>
            <button
              type="button"
              onClick={() => setViewMode("interactive")}
              className="font-bold underline cursor-pointer"
            >
              Switch to Interactive →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-900 text-white font-bold">
                  <th className="py-2.5 px-3 border border-slate-300 w-1/4">Evaluation Factor</th>
                  <th className="py-2.5 px-3 border border-slate-300 w-1/4">College Choice 1</th>
                  <th className="py-2.5 px-3 border border-slate-300 w-1/4">College Choice 2</th>
                  <th className="py-2.5 px-3 border border-slate-300 w-1/4">College Choice 3</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {[
                  "College Name, City & State",
                  "Category (Govt / Private / Deemed)",
                  "NMC Recognition Status Checked",
                  "Affiliating University",
                  "Estimated 5.5-Year Total Cost",
                  "Affordability Fit (Comfortable / Tight)",
                  "Service Bond (Years & Penalty ₹)",
                  "Teaching Hospital Bed Count & Daily OPD",
                  "Clinical Exposure & Variety",
                  "Academic Ecosystem & PG Seats",
                  "Hostel & Campus Facilities",
                  "Distance from Home & Travel Ease",
                  "Local Patient Language / Dialect",
                  "My Single Biggest Advantage",
                  "My Single Biggest Concern",
                  "Things I Still Need to Verify",
                ].map((factor, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                    <td className="py-2.5 px-3 border border-slate-300 font-bold text-slate-900 bg-slate-50">
                      {factor}
                    </td>
                    <td className="py-2.5 px-3 border border-slate-300 text-slate-400 font-mono text-[11px]">
                      &nbsp;
                    </td>
                    <td className="py-2.5 px-3 border border-slate-300 text-slate-400 font-mono text-[11px]">
                      &nbsp;
                    </td>
                    <td className="py-2.5 px-3 border border-slate-300 text-slate-400 font-mono text-[11px]">
                      &nbsp;
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* VIEW MODE B: INTERACTIVE MEDICAL COLLEGE COMPARISON TOOL */
        /* ========================================================================= */
        <div className="space-y-14 print:hidden">
          {/* 1. STUDENT IDENTIFICATION (LOCAL ONLY) */}
          <div
            className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xs space-y-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
              <div>
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-red-700">
                  Step 1 • Student Details
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
                  Who Is This Comparison Prepared For?
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                🔒 Stored Locally Only
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {/* Student Name */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  Student Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Aditi Sharma"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm sm:text-base font-medium text-slate-900 focus:bg-white focus:border-red-700 focus:outline-none transition"
                />
              </div>

              {/* Optional Identifier (Mobile or DOB) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-bold text-slate-800">
                    Optional Identifier
                  </label>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <button
                      type="button"
                      onClick={() => { setIdType("mobile"); setIdValue(""); }}
                      className={`cursor-pointer ${idType === "mobile" ? "text-red-700 font-bold underline" : "hover:text-slate-700"}`}
                    >
                      Mobile
                    </button>
                    <span>/</span>
                    <button
                      type="button"
                      onClick={() => { setIdType("dob"); setIdValue(""); }}
                      className={`cursor-pointer ${idType === "dob" ? "text-red-700 font-bold underline" : "hover:text-slate-700"}`}
                    >
                      DOB
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder={idType === "mobile" ? "Mobile Number" : idType === "dob" ? "Date of Birth (DD/MM/YYYY)" : "Mobile or DOB (optional)"}
                  value={idValue}
                  onChange={(e) => {
                    if (idType === "none") setIdType("mobile");
                    setIdValue(e.target.value);
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm sm:text-base font-medium text-slate-900 focus:bg-white focus:border-red-700 focus:outline-none transition"
                />
              </div>

              {/* NEET AIR / Rank */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  NEET AIR / Rank (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 14,250"
                  value={neetRank}
                  onChange={(e) => setNeetRank(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm sm:text-base font-medium text-slate-900 focus:bg-white focus:border-red-700 focus:outline-none transition"
                />
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-500 italic pt-1">
              Your information is used only to prepare this comparison report and is never transmitted, saved, or submitted to any server.
            </p>
          </div>

          {/* 2. PRIORITY WEIGHTS: WHAT MATTERS TO YOU? */}
          <div
            className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5 sm:p-6 space-y-4"
          >
            {/* Header & Compact Legend */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200/80 pb-3.5">
              <div className="space-y-0.5">
                <span className="text-xs font-bold uppercase tracking-wider text-red-700">
                  Step 2 • Decision Weights
                </span>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                  What Matters Most to You & Your Family?
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
                  Every family values different things. Tell us what matters most to yours—we&apos;ll use these priorities when comparing your three colleges.
                </p>
              </div>

              {/* Compact Legend */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shrink-0 shadow-2xs">
                <span className="text-red-700 font-extrabold">3×</span> Very Important
                <span className="text-slate-300">•</span>
                <span className="text-amber-700 font-extrabold">2×</span> Important
                <span className="text-slate-300">•</span>
                <span className="text-slate-600 font-extrabold">1×</span> Less Important
              </div>
            </div>

            {/* 10 Factor Vertical Cards Grid: 5 cols on lg, 3 on md, 2 on sm, 1 on mobile */}
            <div className="grid gap-2.5 sm:gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              {DECISION_FACTORS.map(({ key, num, icon, title, tint }) => (
                <div
                  key={key}
                  className={`rounded-2xl border p-3 flex flex-col justify-between space-y-2 transition shadow-2xs ${tint}`}
                >
                  {/* Top: Number & Icon */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black text-slate-500">
                      {num}
                    </span>
                    <span className="text-lg" aria-hidden="true">
                      {icon}
                    </span>
                  </div>

                  {/* Title Above Dropdown */}
                  <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 leading-snug min-h-[34px] flex items-center">
                    {title}
                  </h4>

                  {/* Dropdown Below Title */}
                  <div className="pt-0.5">
                    <select
                      value={priorities[key]}
                      onChange={(e) =>
                        setPriorities((prev) => ({
                          ...prev,
                          [key]: e.target.value as PriorityWeight,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-300/90 bg-white/95 px-2 py-1.5 text-xs sm:text-[13px] font-bold text-slate-900 focus:bg-white focus:border-red-700 focus:outline-none cursor-pointer transition shadow-2xs"
                    >
                      <option value="3">Very Important (3×)</option>
                      <option value="2">Important (2×)</option>
                      <option value="1">Less Important (1×)</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-500 italic">
              Note: Decision weights define what matters to you. This is a personalized decision-aid, not an automated AI recommendation.
            </p>
          </div>

          {/* 3. THREE SHORTLISTED COLLEGES INPUT FORM */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-red-700">
                  Step 3 • College Profiles & Verification
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  Enter Information for Your Three Shortlisted Options
                </h3>
              </div>

              {/* Mobile Tab Switcher */}
              <div className="flex items-center gap-1 sm:hidden bg-slate-100 p-1.5 rounded-xl">
                {[0, 1, 2].map((idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveCollegeTab(idx)}
                    className={`flex-1 py-2 px-3.5 text-sm font-bold rounded-lg transition cursor-pointer ${
                      activeCollegeTab === idx
                        ? "bg-red-700 text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Choice {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* 3 College Cards Grid (Stacked on mobile, 3-column on desktop) */}
            <div className="grid gap-6 lg:grid-cols-3">
              {colleges.map((college, idx) => {
                const isHiddenOnMobile = activeCollegeTab !== idx;
                const placeholder = COLLEGE_PLACEHOLDERS[idx] || COLLEGE_PLACEHOLDERS[0];

                return (
                  <div
                    key={idx}
                    className={`rounded-3xl border-2 p-5 sm:p-6 space-y-6 bg-white transition-all duration-200 ${
                      activeCollegeTab === idx ? "border-slate-800 shadow-md" : "border-slate-200 shadow-xs"
                    } ${isHiddenOnMobile ? "hidden sm:block" : "block"}`}
                  >
                    {/* College Header */}
                    <div className="border-b border-slate-100 pb-3.5 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white text-xs sm:text-sm font-black">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
                          Choice {idx + 1}
                        </span>
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-slate-500">
                        {college.name ? college.name.slice(0, 18) + "..." : "Enter details"}
                      </span>
                    </div>

                    {/* Basic Details */}
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
                          Medical College Name
                        </label>
                        <input
                          type="text"
                          placeholder={placeholder.name}
                          value={college.name}
                          onChange={(e) => updateCollege(idx, { name: e.target.value })}
                          className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3 py-2.5 text-sm font-medium text-slate-900 focus:bg-white focus:border-red-700 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="relative">
                          <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">City</label>
                          <input
                            type="text"
                            placeholder={placeholder.city}
                            value={college.city}
                            onFocus={() => setActiveCityIndex(idx)}
                            onBlur={() => setTimeout(() => setActiveCityIndex(null), 250)}
                            onChange={(e) => {
                              updateCollege(idx, { city: e.target.value });
                              setActiveCityIndex(idx);
                            }}
                            className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 focus:bg-white focus:border-red-700 focus:outline-none"
                            autoComplete="off"
                          />

                          {/* Independent City Autocomplete Suggestions */}
                          {activeCityIndex === idx && (() => {
                            const query = college.city.trim().toLowerCase();
                            if (query.length === 0) return null;

                            let matches = INDIAN_MEDICAL_CITIES.filter((item) =>
                              item.city.toLowerCase().includes(query) || item.state.toLowerCase().includes(query)
                            );

                            if (college.state.trim()) {
                              const stateQuery = college.state.trim().toLowerCase();
                              matches.sort((a, b) => {
                                const aMatch = a.state.toLowerCase().includes(stateQuery) ? 1 : 0;
                                const bMatch = b.state.toLowerCase().includes(stateQuery) ? 1 : 0;
                                return bMatch - aMatch;
                              });
                            }

                            const uniqueMatches: CityStateLocation[] = [];
                            const seen = new Set<string>();
                            for (const m of matches) {
                              const key = `${m.city}|${m.state}`;
                              if (!seen.has(key)) {
                                seen.add(key);
                                uniqueMatches.push(m);
                              }
                              if (uniqueMatches.length >= 7) break;
                            }

                            if (uniqueMatches.length === 0) return null;

                            return (
                              <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg divide-y divide-slate-100">
                                {uniqueMatches.map((item, mIdx) => (
                                  <button
                                    key={mIdx}
                                    type="button"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      updateCollege(idx, { city: item.city, state: item.state });
                                      setActiveCityIndex(null);
                                    }}
                                    className="w-full text-left rounded-lg px-2.5 py-1.5 text-xs hover:bg-red-50 hover:text-red-900 transition flex items-center justify-between cursor-pointer"
                                  >
                                    <span className="font-bold text-slate-800">{item.city}</span>
                                    <span className="text-[11px] text-slate-500 font-medium">{item.state}</span>
                                  </button>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">State</label>
                          <input
                            type="text"
                            placeholder={placeholder.state}
                            value={college.state}
                            onChange={(e) => updateCollege(idx, { state: e.target.value })}
                            className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 focus:bg-white focus:border-red-700 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">Category</label>
                          <select
                            value={college.type}
                            onChange={(e) => updateCollege(idx, { type: e.target.value as any })}
                            className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-2.5 py-2 text-xs sm:text-sm font-medium text-slate-900"
                          >
                            <option value="">Select Category</option>
                            <option value="Government">Government</option>
                            <option value="Private">Private</option>
                            <option value="Deemed">Deemed University</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">NMC Status</label>
                          <select
                            value={college.recognitionChecked}
                            onChange={(e) => updateCollege(idx, { recognitionChecked: e.target.value as any })}
                            className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-2.5 py-2 text-xs sm:text-sm font-medium text-slate-900"
                          >
                            <option value="">Recognition Status</option>
                            <option value="Yes">✓ Verified Recognised</option>
                            <option value="Not yet verified">⚠️ Not yet verified</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Factor Assessments */}
                    <div className="space-y-4 pt-3 border-t border-slate-100 text-sm">
                      {/* A. Financial Cost & Affordability */}
                      <div className="space-y-2 rounded-2xl bg-slate-50/70 border border-slate-200/80 p-3.5">
                        <span className="font-bold text-slate-900 text-sm sm:text-[15px] flex items-center justify-between">
                          <span>💰 1. Total Financial Cost</span>
                          {evaluateFactor("affordability", college).status === "green" && <span>🟢</span>}
                          {evaluateFactor("affordability", college).status === "yellow" && <span>🟡</span>}
                          {evaluateFactor("affordability", college).status === "red" && <span>🔴</span>}
                        </span>
                        <input
                          type="text"
                          placeholder="Estimated 5.5-Yr Cost (e.g. ₹6 Lakhs)"
                          value={college.costEstimated}
                          onChange={(e) => updateCollege(idx, { costEstimated: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900"
                        />
                        <select
                          value={college.costAffordability}
                          onChange={(e) => updateCollege(idx, { costAffordability: e.target.value as any })}
                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs sm:text-sm font-semibold text-slate-800"
                        >
                          <option value="">Affordability for Your Family?</option>
                          <option value="comfortable">🟢 Comfortable</option>
                          <option value="manageable">🟡 Manageable with planning</option>
                          <option value="difficult">🔴 Financially difficult / Stretch</option>
                        </select>
                      </div>

                      {/* B. Bond & Service Obligation */}
                      <div className="space-y-2 rounded-2xl bg-slate-50/70 border border-slate-200/80 p-3.5">
                        <span className="font-bold text-slate-900 text-sm sm:text-[15px] flex items-center justify-between">
                          <span>📜 2. Rural Service Bond</span>
                          {evaluateFactor("bondObligation", college).status === "green" && <span>🟢</span>}
                          {evaluateFactor("bondObligation", college).status === "yellow" && <span>🟡</span>}
                          {evaluateFactor("bondObligation", college).status === "red" && <span>🔴</span>}
                        </span>
                        <select
                          value={college.bondRating}
                          onChange={(e) => updateCollege(idx, { bondRating: e.target.value as any })}
                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs sm:text-sm font-semibold text-slate-800"
                        >
                          <option value="">Bond Obligation Fit?</option>
                          <option value="no-bond">🟢 No known bond</option>
                          <option value="acceptable">🟢 Acceptable duration & penalty</option>
                          <option value="not-verified">🟡 Not verified yet</option>
                          <option value="concern">🔴 Significant concern (High duration/penalty)</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Optional: Duration (e.g. 1 Yr) & Penalty ₹"
                          value={college.bondDuration}
                          onChange={(e) => updateCollege(idx, { bondDuration: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs sm:text-sm text-slate-800"
                        />
                      </div>

                      {/* C. Clinical Exposure & Hospital Load */}
                      <div className="space-y-2 rounded-2xl bg-slate-50/70 border border-slate-200/80 p-3.5">
                        <span className="font-bold text-slate-900 text-sm sm:text-[15px] flex items-center justify-between">
                          <span>🩺 3. Clinical & Patient Load</span>
                          {evaluateFactor("clinicalExposure", college).status === "green" && <span>🟢</span>}
                          {evaluateFactor("clinicalExposure", college).status === "yellow" && <span>🟡</span>}
                          {evaluateFactor("clinicalExposure", college).status === "red" && <span>🔴</span>}
                        </span>
                        <select
                          value={college.clinicalRating}
                          onChange={(e) => updateCollege(idx, { clinicalRating: e.target.value as any })}
                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs sm:text-sm font-semibold text-slate-800"
                        >
                          <option value="">Hospital OPD & Patient Variety?</option>
                          <option value="strong">🟢 Strong patient load & active OPD</option>
                          <option value="adequate">🟡 Adequate for basic training</option>
                          <option value="needs-info">🟡 Needs more verification / student feedback</option>
                          <option value="concern">🔴 Concern (Low patient inflow reported)</option>
                        </select>
                      </div>

                      {/* D. Academic Ecosystem */}
                      <div className="space-y-2 rounded-2xl bg-slate-50/70 border border-slate-200/80 p-3.5">
                        <span className="font-bold text-slate-900 text-sm sm:text-[15px] flex items-center justify-between">
                          <span>🏛️ 4. Academic Ecosystem</span>
                          {evaluateFactor("academicEcosystem", college).status === "green" && <span>🟢</span>}
                          {evaluateFactor("academicEcosystem", college).status === "yellow" && <span>🟡</span>}
                          {evaluateFactor("academicEcosystem", college).status === "red" && <span>🔴</span>}
                        </span>
                        <select
                          value={college.academicRating}
                          onChange={(e) => updateCollege(idx, { academicRating: e.target.value as any })}
                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs sm:text-sm font-semibold text-slate-800"
                        >
                          <option value="">Faculty, Academics & PG Depts?</option>
                          <option value="strong">🟢 Strong academic culture & PG courses</option>
                          <option value="adequate">🟡 Standard / Adequate</option>
                          <option value="needs-info">🟡 Needs more information</option>
                          <option value="concern">🔴 Concern (Faculty shortages reported)</option>
                        </select>
                      </div>

                      {/* E. Hostel & Campus */}
                      <div className="space-y-2 rounded-2xl bg-slate-50/70 border border-slate-200/80 p-3.5">
                        <span className="font-bold text-slate-900 text-sm sm:text-[15px] flex items-center justify-between">
                          <span>🏢 5. Hostel & Campus Fit</span>
                          {evaluateFactor("hostelCampus", college).status === "green" && <span>🟢</span>}
                          {evaluateFactor("hostelCampus", college).status === "yellow" && <span>🟡</span>}
                          {evaluateFactor("hostelCampus", college).status === "red" && <span>🔴</span>}
                        </span>
                        <select
                          value={college.hostelRating}
                          onChange={(e) => updateCollege(idx, { hostelRating: e.target.value as any })}
                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs sm:text-sm font-semibold text-slate-800"
                        >
                          <option value="">Hostel & Living Fit?</option>
                          <option value="good-fit">🟢 Good fit / confirmed availability</option>
                          <option value="acceptable">🟡 Acceptable / manageable</option>
                          <option value="not-verified">🟡 Not verified yet</option>
                          <option value="concern">🔴 Concern (No hostel / strict restrictions)</option>
                        </select>
                      </div>

                      {/* F. Distance & Travel Connectivity */}
                      <div className="space-y-2 rounded-2xl bg-slate-50/70 border border-slate-200/80 p-3.5">
                        <span className="font-bold text-slate-900 text-sm sm:text-[15px] flex items-center justify-between">
                          <span>🚆 6. Location & Distance</span>
                          {evaluateFactor("locationConnectivity", college).status === "green" && <span>🟢</span>}
                          {evaluateFactor("locationConnectivity", college).status === "yellow" && <span>🟡</span>}
                          {evaluateFactor("locationConnectivity", college).status === "red" && <span>🔴</span>}
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={college.locationRating}
                            onChange={(e) => updateCollege(idx, { locationRating: e.target.value as any })}
                            className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs sm:text-sm font-semibold text-slate-800"
                          >
                            <option value="">Connectivity?</option>
                            <option value="convenient">🟢 Convenient</option>
                            <option value="manageable">🟡 Manageable</option>
                            <option value="difficult">🔴 Difficult</option>
                          </select>
                          <select
                            value={college.distanceRating}
                            onChange={(e) => updateCollege(idx, { distanceRating: e.target.value as any })}
                            className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs sm:text-sm font-semibold text-slate-800"
                          >
                            <option value="">Distance Fit?</option>
                            <option value="comfortable">🟢 Comfortable</option>
                            <option value="manageable">🟡 Manageable</option>
                            <option value="concern">🔴 Concern</option>
                          </select>
                        </div>
                        <input
                          type="text"
                          placeholder="Approx km or travel hours (optional)"
                          value={college.distanceValue}
                          onChange={(e) => updateCollege(idx, { distanceValue: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs sm:text-sm text-slate-800"
                        />
                      </div>

                      {/* G. Personal Preference (1-5 Rating) */}
                      <div className="space-y-2 rounded-2xl bg-slate-50/70 border border-slate-200/80 p-3.5">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-bold text-slate-900 text-sm sm:text-[15px] whitespace-nowrap">
                            ⭐ 7. Personal Preference
                          </span>
                          <span className="inline-flex items-center justify-center min-w-[72px] px-3.5 py-1 text-sm font-extrabold text-red-700 bg-red-50 rounded-lg border border-red-200 whitespace-nowrap shrink-0 shadow-2xs">
                            {college.personalPreferenceRating} / 5
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-600">
                          If all other facts were equal, how strongly do you prefer this college?
                        </p>
                        <div className="flex items-center justify-between gap-1.5 pt-1">
                          {[1, 2, 3, 4, 5].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => updateCollege(idx, { personalPreferenceRating: val })}
                              className={`flex-1 py-2 text-xs sm:text-sm font-black rounded-lg border transition cursor-pointer ${
                                college.personalPreferenceRating === val
                                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4. TRAFFIC-LIGHT DECISION MATRIX (VISIBLE ONCE DATA IS ENTERED) */}
          {/* ========================================================================= */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-red-700">
                Step 4 • Comparative Matrix
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Side-by-Side Traffic-Light Assessment
              </h3>
              <p className="text-sm sm:text-base text-slate-600">
                🟢 Favourable (Fits your priorities) • 🟡 Review / Needs Info • 🔴 Important Concern
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-300 bg-white shadow-2xs">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold">
                    <th className="py-3.5 px-4 w-1/4 text-xs sm:text-sm uppercase tracking-wider">Evaluation Factor</th>
                    {colleges.map((c, i) => (
                      <th key={i} className="py-3.5 px-4 w-1/4">
                        <span className="block text-slate-300 font-semibold text-xs">Choice {i + 1}</span>
                        <span className="text-xs sm:text-sm font-bold">{c.name.trim() || `College Choice ${i + 1}`}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {[
                    { key: "affordability" as const, title: "Cost & Affordability" },
                    { key: "clinicalExposure" as const, title: "Clinical Exposure / OPD" },
                    { key: "teachingHospital" as const, title: "Hospital Bed Capacity" },
                    { key: "academicEcosystem" as const, title: "Academic & PG Ecosystem" },
                    { key: "bondObligation" as const, title: "Rural Service Bond" },
                    { key: "hostelCampus" as const, title: "Hostel & Living Fit" },
                    { key: "locationConnectivity" as const, title: "Location / Connectivity" },
                    { key: "distanceFromHome" as const, title: "Distance from Home" },
                    { key: "pgOpportunities" as const, title: "PG / Future Scope" },
                    { key: "personalPreference" as const, title: "Personal Preference" },
                  ].map(({ key, title }, rowIdx) => (
                    <tr key={key} className={rowIdx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                      <td className="py-3 px-4 font-bold text-slate-900 text-xs sm:text-sm bg-slate-50/90 border-r border-slate-200">
                        {title}
                      </td>
                      {colleges.map((col, colIdx) => {
                        const { status, label } = evaluateFactor(key, col);
                        return (
                          <td key={colIdx} className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-bold text-xs sm:text-sm ${
                                status === "green"
                                  ? "bg-emerald-100 text-emerald-950 border border-emerald-300"
                                  : status === "red"
                                  ? "bg-rose-100 text-rose-950 border border-rose-300"
                                  : "bg-amber-100 text-amber-950 border border-amber-300"
                              }`}
                            >
                              <span>{status === "green" ? "🟢" : status === "red" ? "🔴" : "🟡"}</span>
                              <span>{label}</span>
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 5. WEIGHTED FIT SUMMARY & COMPARISON CARDS */}
          {/* ========================================================================= */}
          <div className="space-y-6">
            <div className="space-y-1.5">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-red-700">
                Step 5 • Weighted Fit Summary
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Fit With Your Family&apos;s Priorities
              </h3>
              <p className="text-sm sm:text-base text-slate-600">
                Calculated using your weighted priority settings. High scores indicate strong alignment with what you defined as important.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              {collegeSummaries.map((summary) => (
                <div
                  key={summary.index}
                  className="rounded-3xl border-2 border-slate-800 bg-white p-6 space-y-4 shadow-sm flex flex-col justify-between"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">
                        Choice {summary.index + 1}
                      </span>
                      <span className="text-xs sm:text-sm font-black bg-slate-900 text-white px-3 py-1 rounded-full shadow-2xs">
                        Fit: {summary.fitPercentage}%
                      </span>
                    </div>

                    <h4 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                      {summary.name}
                    </h4>

                    {/* Traffic counts */}
                    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 pt-1">
                      <span className="bg-emerald-50 text-emerald-900 px-2.5 py-1 rounded-lg border border-emerald-200">
                        🟢 {summary.greenCount} Favourable
                      </span>
                      <span className="bg-amber-50 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-200">
                        🟡 {summary.yellowCount} Review
                      </span>
                      <span className="bg-rose-50 text-rose-900 px-2.5 py-1 rounded-lg border border-rose-200">
                        🔴 {summary.redCount} Concern
                      </span>
                    </div>

                    {/* Strengths & Concerns bullet lists */}
                    <div className="space-y-2.5 pt-2 text-xs sm:text-sm">
                      {summary.strongFactors.length > 0 && (
                        <div>
                          <strong className="text-emerald-900 block font-bold">Strongest Factors:</strong>
                          <p className="text-slate-700 mt-0.5 leading-relaxed font-medium">
                            {summary.strongFactors.slice(0, 3).join(", ")}
                          </p>
                        </div>
                      )}

                      {summary.reviewFactors.length > 0 && (
                        <div>
                          <strong className="text-amber-900 block font-bold">Review Before Deciding:</strong>
                          <p className="text-slate-700 mt-0.5 leading-relaxed font-medium">
                            {summary.reviewFactors.slice(0, 3).join(", ")}
                          </p>
                        </div>
                      )}

                      {summary.concernFactors.length > 0 && (
                        <div>
                          <strong className="text-rose-900 block font-bold">Important Concern:</strong>
                          <p className="text-slate-700 mt-0.5 leading-relaxed font-medium">
                            {summary.concernFactors.slice(0, 2).join(", ")}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 6. SUGGESTED COMPARISON AT A GLANCE */}
          {/* ========================================================================= */}
          <div
            className="rounded-3xl border border-slate-200 bg-slate-950 text-white p-6 sm:p-8 space-y-5"
          >
            <div className="space-y-1.5">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-red-400">
                Comparative Summary
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Your Comparison at a Glance
              </h3>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl">
                Based on the information and priorities you entered, the mathematical alignment suggests:
              </p>
            </div>

            {/* Suggested Order Cards */}
            <div className="grid gap-3.5 sm:grid-cols-3 pt-1">
              {sortedColleges.map((col, rankIdx) => (
                <div
                  key={col.index}
                  className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4.5 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white text-xs sm:text-sm font-black">
                      {rankIdx + 1}
                    </span>
                    <span className="text-sm font-extrabold text-red-400 bg-red-950/60 border border-red-800/40 px-2.5 py-0.5 rounded-full">
                      {col.fitPercentage}% Fit
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white leading-snug">
                    {col.name}
                  </h4>
                </div>
              ))}
            </div>

            {/* Tie / Close Choices Note */}
            {isCloseMatch && (
              <div className="rounded-xl bg-amber-500/10 border border-amber-400/30 p-4 text-xs sm:text-sm text-amber-200 leading-relaxed">
                ⚠️ <strong>Very Close Choices:</strong> The top choices have very close numerical scores. Review the highlighted yellow/red factors and your personal preference rather than relying only on the percentage score.
              </div>
            )}

            <div className="pt-2 border-t border-slate-800 text-slate-400 text-xs sm:text-sm leading-relaxed italic">
              Decision aid only. This is not a college quality ranking or counselling recommendation. The result directly reflects your entered priorities and data. Verify critical facts before locking your choices.
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 7. THINGS YOU STILL NEED TO CHECK (VERIFICATION FLAGS) */}
          {/* ========================================================================= */}
          {allVerificationItems.length > 0 && (
            <div
              className="rounded-3xl border border-amber-200 bg-amber-50/60 p-6 sm:p-8 space-y-4"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">⚠️</span>
                <h3 className="text-lg sm:text-xl font-bold text-amber-950">
                  Things You Still Need to Check Before Choice Locking
                </h3>
              </div>
              <p className="text-sm sm:text-base text-amber-950 leading-relaxed">
                Based on items marked &ldquo;Not yet verified&rdquo; or &ldquo;Needs more information&rdquo;, ensure you clarify these points:
              </p>

              <ul className="space-y-2.5 pl-2 text-sm sm:text-base text-slate-800 font-medium">
                {allVerificationItems.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="text-amber-700 font-bold text-base">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 8. USER'S FINAL PREFERENCE SELECTION */}
          {/* ========================================================================= */}
          <div
            className="rounded-3xl border-2 border-dashed border-red-300 bg-red-50/40 p-6 sm:p-8 space-y-4"
          >
            <div className="space-y-1.5">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-red-700">
                Step 6 • Your Decision
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                What Is Your Final Preference Order?
              </h3>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                The tool calculates mathematical fit, but your family&apos;s judgement is final. Select your final intended counselling order:
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 pt-2">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-red-950 mb-1.5">
                  1st Preference:
                </label>
                <select
                  value={finalPref1}
                  onChange={(e) => setFinalPref1(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm sm:text-base font-bold text-slate-900 focus:border-red-700 focus:outline-none"
                >
                  <option value="">Select 1st Preference</option>
                  {colleges.map((c, i) => (
                    <option key={i} value={c.name.trim() || `Choice ${i + 1}`}>
                      {c.name.trim() || `Choice ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1.5">
                  2nd Preference:
                </label>
                <select
                  value={finalPref2}
                  onChange={(e) => setFinalPref2(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm sm:text-base font-bold text-slate-900 focus:border-red-700 focus:outline-none"
                >
                  <option value="">Select 2nd Preference</option>
                  {colleges.map((c, i) => (
                    <option key={i} value={c.name.trim() || `Choice ${i + 1}`}>
                      {c.name.trim() || `Choice ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1.5">
                  3rd Preference:
                </label>
                <select
                  value={finalPref3}
                  onChange={(e) => setFinalPref3(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm sm:text-base font-bold text-slate-900 focus:border-red-700 focus:outline-none"
                >
                  <option value="">Select 3rd Preference</option>
                  {colleges.map((c, i) => (
                    <option key={i} value={c.name.trim() || `Choice ${i + 1}`}>
                      {c.name.trim() || `Choice ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 9. BOTTOM ACTION BUTTONS */}
          {/* ========================================================================= */}
          <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <span>🔄</span>
              <span>Start New Comparison</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-7 py-3.5 text-sm sm:text-base font-bold text-white shadow-md hover:bg-slate-800 transition cursor-pointer"
            >
              <span>🖨️</span>
              <span>Print / Save Comparison Report (PDF)</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. EXACT SINGLE-PAGE A4 PRINT/PDF REPORT (1.5x VERTICAL PROPORTIONING) */}
      {/* ========================================================================= */}
      <div className="hidden print:block print-page-container text-slate-900 text-[11px] leading-snug space-y-3.5">
        {/* PROMINENT HEADER */}
        <div className="flex justify-between items-end border-b-2 border-slate-900 pb-2">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-red-800">
              NEET to MBBS 2026 • Medical College Decision Tool
            </p>
            <h1 className="text-lg font-black uppercase text-slate-900 tracking-tight mt-0.5">
              Medical College Comparison Summary
            </h1>
            <p className="text-[11px] text-slate-700 font-medium pt-1">
              Prepared for: <strong className="text-slate-950 text-xs">{studentName || "Student"}</strong>
              {idValue && ` • ${idType === "mobile" ? "Mobile" : "DOB"}: ${idValue}`}
              {neetRank && ` • NEET Rank: ${neetRank}`}
            </p>
          </div>
          <div className="text-right text-[11px] text-slate-600 font-mono space-y-0.5">
            <div>Date: {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
            <div className="font-extrabold text-slate-900 text-xs">mbbsfoundation.com</div>
          </div>
        </div>

        {/* 3-COLLEGE FIT SUMMARY CARDS */}
        <div className="grid grid-cols-3 gap-3">
          {collegeSummaries.map((summary) => {
            const rawCollege = colleges[summary.index];
            return (
              <div
                key={summary.index}
                className="rounded-xl border border-slate-300 p-3 bg-slate-50/60 flex flex-col justify-between space-y-1.5"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <span className="font-extrabold text-slate-600 text-[10.5px] uppercase tracking-wider">
                      Choice {summary.index + 1}
                    </span>
                    <span className="font-black bg-slate-900 text-white px-2 py-0.5 rounded text-xs">
                      {summary.fitPercentage}% Fit
                    </span>
                  </div>
                  <h3 className="font-black text-slate-950 text-xs leading-snug pt-1 truncate">
                    {summary.name}
                  </h3>
                  <p className="text-[10.5px] text-slate-600 truncate">
                    {rawCollege.city || "—"}, {rawCollege.state || "—"} ({rawCollege.type || "Govt/Pvt"})
                  </p>
                </div>

                <div className="text-[10.5px] text-slate-800 flex gap-2 font-bold pt-1 border-t border-slate-200">
                  <span className="text-emerald-800">🟢 {summary.greenCount} Favourable</span>
                  <span className="text-amber-800">🟡 {summary.yellowCount} Review</span>
                  <span className="text-rose-800">🔴 {summary.redCount} Concern</span>
                </div>

                {(summary.strongFactors.length > 0 || summary.concernFactors.length > 0) && (
                  <div className="text-[10px] text-slate-600 pt-1 space-y-0.5 border-t border-slate-100">
                    {summary.strongFactors.length > 0 && (
                      <p className="truncate"><strong>Strength:</strong> {summary.strongFactors.slice(0, 2).join(", ")}</p>
                    )}
                    {summary.concernFactors.length > 0 && (
                      <p className="text-rose-800 truncate"><strong>Concern:</strong> {summary.concernFactors.slice(0, 1).join(", ")}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 10-FACTOR DETAILED COMPARATIVE MATRIX TABLE (Spacious 1.5x Rows) */}
        <div>
          <table className="w-full text-left text-[11px] border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-900 text-white font-bold">
                <th className="py-2 px-3 border border-slate-300 w-1/4">Evaluation Factor</th>
                {colleges.map((c, i) => (
                  <th key={i} className="py-2 px-3 border border-slate-300 w-1/4">
                    Choice {i + 1}: {c.name.trim() || `College ${i + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-900">
              {[
                { key: "affordability" as const, title: "1. Cost & True Affordability" },
                { key: "clinicalExposure" as const, title: "2. Clinical Exposure & OPD" },
                { key: "teachingHospital" as const, title: "3. Teaching Hospital Patient Load" },
                { key: "academicEcosystem" as const, title: "4. Academic & PG Ecosystem" },
                { key: "bondObligation" as const, title: "5. Rural Service Bond Obligation" },
                { key: "hostelCampus" as const, title: "6. Hostel & Living Environment" },
                { key: "locationConnectivity" as const, title: "7. Location & Connectivity" },
                { key: "distanceFromHome" as const, title: "8. Distance from Home" },
                { key: "pgOpportunities" as const, title: "9. PG Quota / Future Scope" },
                { key: "personalPreference" as const, title: "10. Personal Preference / Intuition" },
              ].map(({ key, title }, rowIdx) => (
                <tr key={key} className={rowIdx % 2 === 0 ? "bg-white" : "bg-slate-50/70"}>
                  <td className="py-1.5 px-3 font-bold text-slate-950 border border-slate-300">
                    {title}
                  </td>
                  {colleges.map((col, colIdx) => {
                    const { status, label } = evaluateFactor(key, col);
                    return (
                      <td key={colIdx} className="py-1.5 px-3 border border-slate-300 font-semibold text-[10.5px]">
                        <span>{status === "green" ? "🟢" : status === "red" ? "🔴" : "🟡"} </span>
                        <span>{label}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* BOTTOM SECTION: VERIFICATION CHECKLIST & FINAL PREFERENCE SELECTION */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Verification Checklist */}
          <div className="rounded-xl border border-amber-300 bg-amber-50/60 p-2.5 text-[10.5px] space-y-1">
            <strong className="block text-[11px] font-extrabold text-amber-950 uppercase tracking-wide">
              ⚠️ Critical Points to Verify Before Choice Locking:
            </strong>
            {allVerificationItems.length > 0 ? (
              <ul className="text-slate-800 space-y-0.5 pl-2">
                {allVerificationItems.slice(0, 3).map((item, idx) => (
                  <li key={idx}>• {item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-700 italic">All key factors marked as verified.</p>
            )}
          </div>

          {/* Student Final Choice Order */}
          <div className="rounded-xl border-2 border-slate-900 p-2.5 bg-white text-[10.5px] space-y-1.5 flex flex-col justify-between">
            <div>
              <strong className="block font-black text-slate-950 uppercase text-[11px] tracking-wide">
                Student&apos;s Intended Final Preference Order:
              </strong>
              <p className="text-slate-600 text-[9.5px] italic">
                Mathematical alignment: 1st {sortedColleges[0]?.name || "—"} ({sortedColleges[0]?.fitPercentage || 0}%) | 2nd {sortedColleges[1]?.name || "—"} | 3rd {sortedColleges[2]?.name || "—"}
              </p>
            </div>
            <div className="text-slate-950 font-black text-[11.5px] pt-1 border-t border-slate-200">
              <span>1st: {finalPref1 || "____________________"}</span>
              <span className="mx-2 text-slate-400">|</span>
              <span>2nd: {finalPref2 || "____________________"}</span>
              <span className="mx-2 text-slate-400">|</span>
              <span>3rd: {finalPref3 || "____________________"}</span>
            </div>
          </div>
        </div>

        {/* FOOTER & DISCLAIMER */}
        <div className="text-[9.5px] text-slate-500 pt-1.5 border-t border-slate-300 flex justify-between items-center italic">
          <span>Decision-support worksheet only. Verify fees, bonds, and recognition from MCC, NMC & state authorities before locking choices.</span>
          <span className="font-bold text-slate-800 not-italic">NEET to MBBS 2026 | MBBS Foundation</span>
        </div>
      </div>
    </div>
  );
}

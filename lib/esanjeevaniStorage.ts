import fs from "fs";
import path from "path";

export type ESanjeevaniSubmissionRecord = {
  id: string;
  certificateId: string;
  fullName: string;
  email: string;
  mobile: string;
  pinCode: string;
  zone: string;
  state: string;
  district: string;
  city: string;
  category: string;
  videoLanguage: string;
  quizScore: number;
  totalQuestions: number;
  attemptsCount: number;
  passed: boolean;
  rating: number;
  feedback: string;
  suggestions: string;
  createdAt: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "esanjeevani_submissions.json");

function ensureFileExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(FILE_PATH)) {
    fs.writeFileSync(FILE_PATH, JSON.stringify([]), "utf8");
  }
}

export function getAllSubmissions(): ESanjeevaniSubmissionRecord[] {
  try {
    ensureFileExists();
    const content = fs.readFileSync(FILE_PATH, "utf8");
    return JSON.parse(content || "[]");
  } catch (err) {
    console.error("Error reading eSanjeevani submissions file:", err);
    return [];
  }
}

export function saveSubmission(
  record: Omit<ESanjeevaniSubmissionRecord, "id" | "createdAt">
): ESanjeevaniSubmissionRecord {
  ensureFileExists();
  const submissions = getAllSubmissions();

  const newRecord: ESanjeevaniSubmissionRecord = {
    ...record,
    id: `ESANJ-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
    createdAt: new Date().toISOString(),
  };

  submissions.unshift(newRecord);
  fs.writeFileSync(FILE_PATH, JSON.stringify(submissions, null, 2), "utf8");

  return newRecord;
}

export function getAnalyticsSummary() {
  const submissions = getAllSubmissions();
  const totalSubmissions = submissions.length;

  if (totalSubmissions === 0) {
    return {
      totalSubmissions: 0,
      passedSubmissions: 0,
      passRatePct: 0,
      avgQuizScore: 0,
      avgRating: 0,
      categoryCounts: {} as Record<string, number>,
      zoneCounts: {} as Record<string, number>,
      stateCounts: {} as Record<string, number>,
      recentFeedbacks: [] as { fullName: string; rating: number; feedback: string; createdAt: string }[],
    };
  }

  let totalScore = 0;
  let totalRating = 0;
  let ratingCount = 0;
  let passedCount = 0;

  const categoryCounts: Record<string, number> = {};
  const zoneCounts: Record<string, number> = {};
  const stateCounts: Record<string, number> = {};
  const recentFeedbacks: { fullName: string; rating: number; feedback: string; createdAt: string }[] = [];

  for (const sub of submissions) {
    if (sub.passed) passedCount++;
    totalScore += sub.quizScore || 0;

    if (sub.rating > 0) {
      totalRating += sub.rating;
      ratingCount++;
    }

    if (sub.category) {
      categoryCounts[sub.category] = (categoryCounts[sub.category] || 0) + 1;
    }
    if (sub.zone) {
      zoneCounts[sub.zone] = (zoneCounts[sub.zone] || 0) + 1;
    }
    if (sub.state) {
      stateCounts[sub.state] = (stateCounts[sub.state] || 0) + 1;
    }

    if (sub.feedback && sub.feedback.trim()) {
      recentFeedbacks.push({
        fullName: sub.fullName,
        rating: sub.rating,
        feedback: sub.feedback,
        createdAt: sub.createdAt,
      });
    }
  }

  return {
    totalSubmissions,
    passedSubmissions: passedCount,
    passRatePct: Math.round((passedCount / totalSubmissions) * 100),
    avgQuizScore: (totalScore / totalSubmissions).toFixed(1),
    avgRating: ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : "5.0",
    categoryCounts,
    zoneCounts,
    stateCounts,
    recentFeedbacks: recentFeedbacks.slice(0, 15),
  };
}

export function generateCSVReport(): string {
  const submissions = getAllSubmissions();
  const headers = [
    "Submission ID",
    "Certificate ID",
    "Full Name",
    "Email",
    "Mobile Number",
    "PIN Code",
    "Zone",
    "State",
    "District",
    "City",
    "Category",
    "Video Language",
    "Quiz Score (out of 5)",
    "Attempts Count",
    "Passed",
    "Rating (1-5)",
    "Feedback",
    "Suggestions",
    "Submitted At",
  ];

  const rows = submissions.map((s) => [
    `"${s.id}"`,
    `"${s.certificateId}"`,
    `"${s.fullName.replace(/"/g, '""')}"`,
    `"${s.email}"`,
    `"${s.mobile}"`,
    `"${s.pinCode || ""}"`,
    `"${s.zone || ""}"`,
    `"${s.state || ""}"`,
    `"${s.district || ""}"`,
    `"${s.city || ""}"`,
    `"${s.category || ""}"`,
    `"${s.videoLanguage || ""}"`,
    s.quizScore,
    s.attemptsCount,
    s.passed ? "YES" : "NO",
    s.rating || 5,
    `"${(s.feedback || "").replace(/"/g, '""')}"`,
    `"${(s.suggestions || "").replace(/"/g, '""')}"`,
    `"${s.createdAt}"`,
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

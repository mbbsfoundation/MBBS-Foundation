export type PersonDetails = {
  name: string;
  mobile: string;
  email: string;
};

export type CourseDetails = {
  id: number;
  registeredOnIapWebsite: string;
  courseCode: string;
  startTime: string;
  endTime: string;
  participantCategories: string[];
  otherParticipantCategory: string;
  expectedParticipants: number;
  adultManikins: number;
  infantManikins: number;
  coordinator: PersonDetails;
  leadInstructor: PersonDetails;
  otherInstructors: PersonDetails[];
  cprChampions: PersonDetails[];
};

export type CPRDayEvent = {
  venueId: string;
  createdAt: string;
  status: "Draft" | "Confirmed" | "Completed";

  zone: string;
  state: string;
  city: string;
  hostInstitution: string;
  venueName: string;
  venuePinCode: string;
  iapBranchName: string;

  availableAdultManikins: number;
  availableInfantManikins: number;
  availableInstructors: number;
  availableChampions: number;

  courses: CourseDetails[];
};

const STORAGE_KEY = "iap-cprday-current-event";

function getZoneCode(zone: string): string {
  const zoneCodes: Record<string, string> = {
    "Central Zone": "CZ",
    "East Zone": "EZ",
    "North Zone": "NZ",
    "North-East Zone": "NEZ",
    "South Zone": "SZ",
    "West Zone": "WZ",
  };

  return zoneCodes[zone] || "IN";
}

export function generateVenueId(zone: string): string {
  const zoneCode = getZoneCode(zone);

  const uniqueNumber = String(Date.now()).slice(-6);

  return `CPRDAY-2026-${zoneCode}-${uniqueNumber}`;
}

export function saveCPRDayEvent(event: CPRDayEvent): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(event),
  );
}

export function getCPRDayEvent(): CPRDayEvent | null {
  if (typeof window === "undefined") {
    return null;
  }

  const savedEvent = window.localStorage.getItem(STORAGE_KEY);

  if (!savedEvent) {
    return null;
  }

  try {
    return JSON.parse(savedEvent) as CPRDayEvent;
  } catch {
    return null;
  }
}

export function removeCPRDayEvent(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}
export type ParticipantStatus =
  | "Registered"
  | "Attended"
  | "Hands-on Completed"
  | "Certificate Approved";

export type CPRDayParticipant = {
  participantId: string;
  venueId: string;
  courseId: number;
  registeredAt: string;

  fullName: string;
  mobile: string;
  email: string;
  emailNotAvailable: boolean;

  gender?: string;
  category: string;
  otherCategory: string;

  status: ParticipantStatus;
};

const PARTICIPANT_STORAGE_KEY =
  "iap-cprday-participants";

export function generateParticipantId(): string {
  const randomPart = Math.random()
    .toString(36)
    .slice(2, 7)
    .toUpperCase();

  const timePart = String(Date.now()).slice(-5);

  return `CPR-P-${timePart}-${randomPart}`;
}

export function getParticipants(): CPRDayParticipant[] {
  if (typeof window === "undefined") {
    return [];
  }

  const savedParticipants = window.localStorage.getItem(
    PARTICIPANT_STORAGE_KEY,
  );

  if (!savedParticipants) {
    return [];
  }

  try {
    return JSON.parse(
      savedParticipants,
    ) as CPRDayParticipant[];
  } catch {
    return [];
  }
}

function writeParticipants(
  participants: CPRDayParticipant[],
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    PARTICIPANT_STORAGE_KEY,
    JSON.stringify(participants),
  );
}

export function saveParticipant(
  participant: CPRDayParticipant,
): void {
  const existingParticipants = getParticipants();

  writeParticipants([
    ...existingParticipants,
    participant,
  ]);
}

export function saveParticipantsBulk(
  participants: CPRDayParticipant[],
): void {
  const existingParticipants = getParticipants();

  writeParticipants([
    ...existingParticipants,
    ...participants,
  ]);
}

export function getCourseParticipants(
  venueId: string,
  courseId: number,
): CPRDayParticipant[] {
  return getParticipants().filter(
    (participant) =>
      participant.venueId === venueId &&
      participant.courseId === courseId,
  );
}

export function isMobileAlreadyRegistered(
  venueId: string,
  courseId: number,
  mobile: string,
): boolean {
  const normalizedMobile = mobile.replace(/\D/g, "");

  return getParticipants().some(
    (participant) =>
      participant.venueId === venueId &&
      participant.courseId === courseId &&
      participant.mobile.replace(/\D/g, "") ===
        normalizedMobile,
  );
}

export function updateParticipantStatus(
  participantId: string,
  status: ParticipantStatus,
): void {
  const updatedParticipants = getParticipants().map(
    (participant) =>
      participant.participantId === participantId
        ? {
            ...participant,
            status,
          }
        : participant,
  );

  writeParticipants(updatedParticipants);
}

export function confirmAttendanceByMobiles(
  venueId: string,
  courseId: number,
  mobileNumbers: string[],
): number {
  const normalizedMobiles = new Set(
    mobileNumbers.map((mobile) =>
      mobile.replace(/\D/g, ""),
    ),
  );

  let updatedCount = 0;

  const updatedParticipants = getParticipants().map(
    (participant) => {
      const participantMobile =
        participant.mobile.replace(/\D/g, "");

      const shouldUpdate =
        participant.venueId === venueId &&
        participant.courseId === courseId &&
        normalizedMobiles.has(participantMobile);

      if (!shouldUpdate) {
        return participant;
      }

      updatedCount += 1;

      return {
        ...participant,
        status: "Attended" as ParticipantStatus,
      };
    },
  );

  writeParticipants(updatedParticipants);

  return updatedCount;
}

export function removeParticipant(
  participantId: string,
): void {
  const updatedParticipants = getParticipants().filter(
    (participant) =>
      participant.participantId !== participantId,
  );

  writeParticipants(updatedParticipants);
}
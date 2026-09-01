import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { prisma } from "../lib/prisma";

interface NirfEntry {
  nirfInstitutionId: string;
  nirfInstitutionName: string;
  city: string;
  state: string;
  nirf2025Score: number | null;
  nirf2025Rank: number;
}

function parseNirfCsv(): NirfEntry[] {
  const csvPath = path.join(process.cwd(), "mccug2026data/counselling/2026/reference/nirf_medical_2025.csv");
  const raw = fs.readFileSync(csvPath, "utf-8");
  const lines = raw.trim().split("\n").slice(1);
  const list: NirfEntry[] = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const matches = line.match(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g);
    if (!matches) continue;
    const cols = matches.map(m => {
      let v = m.startsWith(",") ? m.slice(1) : m;
      if (v.startsWith('"') && v.endsWith('"')) {
        v = v.slice(1, -1).replace(/""/g, '"');
      }
      return v.trim();
    });

    list.push({
      nirfInstitutionId: cols[0],
      nirfInstitutionName: cols[1],
      city: cols[2],
      state: cols[3],
      nirf2025Score: cols[4] ? parseFloat(cols[4]) : null,
      nirf2025Rank: parseInt(cols[5], 10),
    });
  }
  return list;
}

async function verifyAll50() {
  const nirfRecords = parseNirfCsv();

  // Explicit mappings for each of the 50 NIRF entries
  const mappings: Record<string, { slug: string; status: "EXACT" | "VERIFIED_ALIAS" | "MANUAL_VERIFIED" | "NON_COMPARABLE"; notes?: string }> = {
    "IR-D-N-15": { slug: "aiims-delhi", status: "EXACT", notes: "All India Institute of Medical Sciences, Delhi" },
    "IR-D-U-0079": { slug: "", status: "NON_COMPARABLE", notes: "PGIMER Chandigarh (PG Only)" },
    "IR-D-C-45654": { slug: "christian-medical-college-vellore", status: "EXACT", notes: "Christian Medical College Vellore" },
    "IR-D-U-0368": { slug: "jipmer-puducherry", status: "VERIFIED_ALIAS", notes: "JIPMER Puducherry" },
    "IR-D-N-33": { slug: "", status: "NON_COMPARABLE", notes: "SGPGIMS Lucknow (PG/Super-specialty Only)" },
    "IR-D-U-0500": { slug: "institute-of-medical-sciences-bhu-varansi", status: "VERIFIED_ALIAS", notes: "Banaras Hindu University / IMS BHU" },
    "IR-D-U-0236": { slug: "", status: "NON_COMPARABLE", notes: "NIMHANS Bengaluru (Neuro/Mental Health PG/Research Only)" },
    "IR-D-U-0523": { slug: "king-george-medical-university-lucknow", status: "VERIFIED_ALIAS", notes: "King George's Medical University Lucknow" },
    "IR-D-U-0436": { slug: "amrita-school-of-medicine-elamkara-kochi", status: "VERIFIED_ALIAS", notes: "Amrita Vishwa Vidyapeetham / Amrita School of Medicine Kochi" },
    "IR-D-C-7242": { slug: "kasturba-medical-college-manipal", status: "EXACT", notes: "Kasturba Medical College, Manipal" },
    "IR-D-I-1441": { slug: "saveetha-medical-college-and-hospital-kanchipuram", status: "VERIFIED_ALIAS", notes: "Saveetha Institute of Medical and Technical Sciences" },
    "IR-D-I-1110": { slug: "dr-d-y-patil-medical-college-hospital-and-research-centre-pimpri-pune", status: "VERIFIED_ALIAS", notes: "Dr. D. Y. Patil Vidyapeeth Pune" },
    "IR-D-U-0691": { slug: "aiims-uttarakhand", status: "VERIFIED_ALIAS", notes: "AIIMS Rishikesh" },
    "IR-D-U-0688": { slug: "aiims-odisha", status: "VERIFIED_ALIAS", notes: "AIIMS Bhubaneswar" },
    "IR-D-U-0363": { slug: "institute-of-medical-sciences-and-sum-hospital-bhubaneswar", status: "VERIFIED_ALIAS", notes: "Siksha 'O' Anusandhan / IMS & SUM Hospital" },
    "IR-D-C-49008": { slug: "madras-medical-college-chennai", status: "VERIFIED_ALIAS", notes: "Madras Medical College & Government General Hospital" },
    "IR-D-U-0266": { slug: "", status: "NON_COMPARABLE", notes: "Sree Chitra Tirunal Institute Thiruvananthapuram (PG/Research Only)" },
    "IR-D-U-0473": { slug: "srm-medical-college-hospital-and-research-centre-kancheepuram", status: "VERIFIED_ALIAS", notes: "S.R.M. Institute of Science and Technology" },
    "IR-D-U-0689": { slug: "aiims-rajasthan", status: "VERIFIED_ALIAS", notes: "AIIMS Jodhpur" },
    "IR-D-U-0295": { slug: "jawaharlal-nehru-medical-college-sawangi-meghe-wardha", status: "VERIFIED_ALIAS", notes: "Datta Meghe / JNMC Wardha" },
    "IR-D-I-1486": { slug: "sri-ramachandra-medical-college-and-research-institute-chennai", status: "VERIFIED_ALIAS", notes: "Sri Ramachandra Institute" },
    "IR-D-C-32922": { slug: "vardhman-mahavir-medical-college-and-safdarjung-hospital-delhi", status: "EXACT", notes: "VMMC & Safdarjung Hospital" },
    "IR-D-C-16428": { slug: "institute-of-postgraduate-medical-education-and-research-kolkata", status: "EXACT", notes: "Institute of Post Graduate Medical Education & Research (IPGMER Kolkata)" },
    "IR-D-U-0356": { slug: "kalinga-institute-of-medical-sciences-bhubaneswar", status: "VERIFIED_ALIAS", notes: "Kalinga Institute of Industrial Technology / KIMS Bhubaneswar" },
    "IR-D-U-0687": { slug: "aiims-bhopal", status: "VERIFIED_ALIAS", notes: "AIIMS Bhopal" },
    "IR-D-C-6414": { slug: "maulana-azad-medical-college-new-delhi", status: "EXACT", notes: "Maulana Azad Medical College" },
    "IR-D-U-0686": { slug: "aiims", status: "VERIFIED_ALIAS", notes: "AIIMS Patna" },
    "IR-D-U-0106": { slug: "", status: "NON_COMPARABLE", notes: "Institute of Liver and Biliary Sciences (ILBS Delhi - Super-specialty PG Only)" },
    "IR-D-U-0496": { slug: "jawaharlal-nehru-medical-college-aligarh", status: "VERIFIED_ALIAS", notes: "Aligarh Muslim University / JNMC Aligarh" },
    "IR-D-C-40453": { slug: "st-johns-medical-college-bangalore", status: "EXACT", notes: "St. John's Medical College Bangalore" },
    "IR-D-U-0690": { slug: "aiims-chhattisgarh", status: "VERIFIED_ALIAS", notes: "AIIMS Raipur" },
    "IR-D-C-22461": { slug: "lady-hardinge-medical-college-new-delhi", status: "EXACT", notes: "Lady Hardinge Medical College" },
    "IR-D-U-0168": { slug: "maharishi-markandeshwar-institute-of-medical-sciences-and-research-mullana-ambal", status: "VERIFIED_ALIAS", notes: "Maharishi Markandeshwar Ambala" },
    "IR-D-C-29442": { slug: "government-medical-college-chandigarh", status: "VERIFIED_ALIAS", notes: "Govt. Medical College & Hospital (GMCH Chandigarh)" },
    "IR-D-C-7251": { slug: "kasturba-medical-college-mangalore", status: "EXACT", notes: "Kasturba Medical College, Mangalore" },
    "IR-D-C-29255": { slug: "dayanand-medical-college-and-hospital-ludhiana", status: "VERIFIED_ALIAS", notes: "Dayanand Medical College Ludhiana" },
    "IR-D-C-35009": { slug: "jss-medical-college-mysore", status: "EXACT", notes: "JSS Medical College, Mysore" },
    "IR-D-I-1409": { slug: "university-college-of-medical-sciences-and-gtb-hospital-new-delhi", status: "VERIFIED_ALIAS", notes: "University College of Medical Sciences (UCMS Delhi)" },
    "IR-D-N-17": { slug: "sms-medical-college-jaipur", status: "VERIFIED_ALIAS", notes: "Sawai Man Singh Medical College (SMS Jaipur)" },
    "IR-D-U-0107": { slug: "hamdard-institute-of-medical-sciences-and-research-new-delhi", status: "VERIFIED_ALIAS", notes: "Jamia Hamdard / HIMSR New Delhi" },
    "IR-D-C-16424": { slug: "govt-medical-college-kolkata", status: "VERIFIED_ALIAS", notes: "Medical College Kolkata" },
    "IR-D-C-47762": { slug: "mahatma-gandhi-medical-college-and-research-institute-pondicherry", status: "VERIFIED_ALIAS", notes: "Mahatma Gandhi Medical College and Research Institute Puducherry" },
    "IR-D-C-45515": { slug: "psg-institute-of-medical-sciences-coimbatore", status: "EXACT", notes: "PSG Institute of Medical Sciences and Research" },
    "IR-D-C-5838": { slug: "", status: "NON_COMPARABLE", notes: "Gujarat Cancer & Research Institute (Super-specialty Oncology/PG Only)" },
    "IR-D-C-6051": { slug: "b-j-medical-college-ahmedabad", status: "VERIFIED_ALIAS", notes: "B. J. Medical College Ahmedabad" },
    "IR-D-C-24503": { slug: "jawaharlal-nehru-medical-college-belgaum", status: "EXACT", notes: "Jawaharlal Nehru Medical College Belagavi" },
    "IR-D-C-29209": { slug: "christian-medical-college-ludhiana", status: "VERIFIED_ALIAS", notes: "Christian Medical College Ludhiana" },
    "IR-D-C-30588": { slug: "osmania-medical-college-hyderabad", status: "EXACT", notes: "Osmania Medical College Hyderabad" },
    "IR-D-U-0451": { slug: "chettinad-hospital-and-research-institute-kanchipuram", status: "VERIFIED_ALIAS", notes: "Chettinad Academy / CHRI Kanchipuram" },
    "IR-D-C-40345": { slug: "m-s-ramaiah-medical-college-bangalore", status: "VERIFIED_ALIAS", notes: "M. S. Ramaiah Medical College Bengaluru" },
  };

  console.log("Checking every mapping against database College records...");
  let validCount = 0;
  let nonCompCount = 0;

  for (const nirf of nirfRecords) {
    const map = mappings[nirf.nirfInstitutionId];
    if (!map) {
      console.error(`❌ Missing mapping for NIRF #${nirf.nirf2025Rank} ${nirf.nirfInstitutionId} ${nirf.nirfInstitutionName}`);
      continue;
    }

    if (map.status === "NON_COMPARABLE") {
      nonCompCount++;
      console.log(`[NON_COMPARABLE] NIRF #${nirf.nirf2025Rank} (${nirf.nirfInstitutionId}): ${nirf.nirfInstitutionName} -> ${map.notes}`);
    } else {
      const col = await prisma.college.findUnique({
        where: { slug: map.slug },
        include: {
          analyticsSnapshots: true,
        },
      });

      if (!col) {
        console.error(`❌ DB SLUG NOT FOUND for NIRF #${nirf.nirf2025Rank} (${nirf.nirfInstitutionId}): ${map.slug} (${map.notes})`);
      } else {
        validCount++;
        console.log(`✅ [${map.status}] NIRF #${nirf.nirf2025Rank} (${nirf.nirfInstitutionId}) "${nirf.nirfInstitutionName}" -> DB: "${col.collegeName}" [${col.slug}] (Snapshots: ${col.analyticsSnapshots.length})`);
      }
    }
  }

  console.log("\n----------------------------------------------------------------------------------");
  console.log(`Inspection Complete: ${validCount} matched MBBS colleges, ${nonCompCount} non-comparable institutes out of 50.`);
}

verifyAll50().then(() => prisma.$disconnect());

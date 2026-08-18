import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { generatePreview, SanjeevaniInputRow, CertificateCategory } from "@/lib/sanjeevaniStorage";
import { verifyAdminRequest } from "@/lib/adminAuth";

/**
 * Fast lookup for mapped header keys.
 */
function mapHeaderKey(rawHeader: string): string {
  const h = rawHeader.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (h === "venuecode" || h === "facilitycode" || h === "vcode") return "venueCode";
  if (h.includes("coordinator")) return "courseCoordinator";
  if (h.includes("name") || h.includes("participant") || h.includes("candidate") || h.includes("student") || h.includes("champion")) return "name";
  if (h.includes("date") || h.includes("day") || h.includes("time")) return "date";
  if (h.includes("venue") || h.includes("location") || h.includes("hospital") || h.includes("school") || h.includes("college") || h.includes("institution")) return "venue";
  if (h.includes("city") || h.includes("town") || h.includes("district")) return "city";
  if (h === "statecode" || h === "stcode" || h === "scode" || h === "code") return "stateCode";
  if (h.includes("state") || h.includes("province") || h.includes("zone")) return "state";
  if (h.includes("mobile") || h.includes("phone") || h.includes("contact") || h.includes("whatsapp")) return "mobileNumber";
  if (h.includes("email") || h.includes("mail")) return "email";
  return h;
}

/**
 * Ultra-fast CSV parser for text/CSV uploads.
 */
function parseFastCSV(csvText: string): Record<string, string>[] {
  const clean = csvText.replace(/^\uFEFF/, "");
  const lines = clean.split(/\r\n|\n|\r/);
  if (lines.length <= 1) return [];

  // Parse header line
  const headerLine = lines[0];
  const rawHeaders: string[] = [];
  let cur = "";
  let inQ = false;

  for (let j = 0; j < headerLine.length; j++) {
    const ch = headerLine[j];
    if (ch === '"') inQ = !inQ;
    else if (ch === ',' && !inQ) {
      rawHeaders.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  rawHeaders.push(cur.trim());
  const mappedHeaders = rawHeaders.map(mapHeaderKey);

  const results: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || !line.trim()) continue;

    const row: Record<string, string> = {};
    let colIdx = 0;
    let cell = "";
    let insideQuotes = false;

    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        const key = mappedHeaders[colIdx];
        if (key) row[key] = cell.trim();
        cell = "";
        colIdx++;
      } else {
        cell += char;
      }
    }
    const lastKey = mappedHeaders[colIdx];
    if (lastKey) row[lastKey] = cell.trim();

    results.push(row);
  }

  return results;
}

/**
 * Parses buffer of Excel or CSV into array of mapped objects.
 */
function parseSpreadsheetBuffer(buffer: Buffer, isCsv: boolean = false): Record<string, string>[] {
  if (isCsv) {
    try {
      const text = buffer.toString("utf-8");
      return parseFastCSV(text);
    } catch {
      // Fallback to SheetJS
    }
  }

  const workbook = XLSX.read(buffer, { type: "buffer", dense: true, cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const worksheet = workbook.Sheets[sheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

  return rawRows.map((rawRow) => {
    const mapped: Record<string, string> = {};
    for (const [key, val] of Object.entries(rawRow)) {
      const canonicalKey = mapHeaderKey(key);
      let strVal = "";
      if (val instanceof Date) {
        strVal = val.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
      } else if (val !== null && val !== undefined) {
        strVal = String(val).trim();
      }
      mapped[canonicalKey] = strVal;
    }
    return mapped;
  });
}

export async function POST(request: NextRequest) {
  try {
    // Enforce Admin Authentication
    if (!verifyAdminRequest(request)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin authentication required." },
        { status: 401 }
      );
    }

    const contentType = request.headers.get("content-type") || "";
    let rawRecords: Record<string, string>[] = [];
    let fileName = "Uploaded_File";
    let forcedCategory: CertificateCategory | undefined = undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ success: false, error: "No file uploaded. Please upload a CSV or Excel file." }, { status: 400 });
      }

      const catParam = ((formData.get("category") as string) || (formData.get("moduleType") as string) || "").toUpperCase();
      if (catParam.includes("FACILITY") || catParam.includes("VENUE")) {
        forcedCategory = "CPR_FACILITY";
      } else if (catParam.includes("CHAMPION") || catParam === "CPR_CHAMPION") {
        forcedCategory = "CPR_CHAMPION";
      }

      fileName = file.name;
      const isCsv = fileName.toLowerCase().endsWith(".csv");
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      rawRecords = parseSpreadsheetBuffer(buffer, isCsv);
    } else {
      const body = await request.json();
      if (Array.isArray(body.rows)) {
        rawRecords = body.rows;
      } else if (body.csvContent) {
        rawRecords = parseFastCSV(body.csvContent);
      }
      if (body.fileName) fileName = body.fileName;
      const catParam = (body.category || body.moduleType || "").toUpperCase();
      if (catParam.includes("FACILITY") || catParam.includes("VENUE")) {
        forcedCategory = "CPR_FACILITY";
      } else if (catParam.includes("CHAMPION") || catParam === "CPR_CHAMPION") {
        forcedCategory = "CPR_CHAMPION";
      }
    }

    if (!rawRecords || rawRecords.length === 0) {
      return NextResponse.json(
        { success: false, error: "The uploaded file is empty or could not be parsed. Please check the file format." },
        { status: 400 }
      );
    }

    // Process and validate rows in a single fast pass
    const parsedRows: SanjeevaniInputRow[] = [];
    const len = rawRecords.length;

    for (let index = 0; index < len; index++) {
      const record = rawRecords[index];
      const rowNumber = index + 2; // Accounting for 1-indexed row + header row

      const name = (record.name || record.venue || "").trim();
      const date = (record.date || "21-07-2026").trim();
      const venue = (record.venue || record.name || "").trim();
      const venueCode = (record.venueCode || record.code || "").trim();
      const city = (record.city || "").trim();
      const state = (record.state || "").trim();
      const stateCode = (record.stateCode || "").trim().toUpperCase();
      const mobileNumber = (record.mobileNumber || "").trim();
      const email = (record.email || "").trim();
      const courseCoordinator = (record.courseCoordinator || "").trim();

      // Check if row is completely blank
      if (!name && !date && !venue && !city && !state && !stateCode && !venueCode) {
        continue;
      }

      const errors: string[] = [];
      if (!venue && !name) errors.push("Venue / Facility Name is required.");
      if (!city) errors.push("City is required.");
      if (!state) errors.push("State is required.");
      if (!stateCode) {
        errors.push("State Code is required (e.g. ML, DL, UP, RJ).");
      } else if (stateCode.length < 2 || stateCode.length > 4) {
        errors.push("State Code must be 2-4 uppercase letters (e.g. ML, DL, UP).");
      }

      if (forcedCategory === "CPR_FACILITY" && !venueCode) {
        errors.push("Venue Code / Certificate ID is required for Facility certificates.");
      }

      parsedRows.push({
        rowNumber,
        name: name || venue,
        date,
        venue: venue || name,
        venueCode: venueCode || undefined,
        city,
        state,
        stateCode,
        mobileNumber: mobileNumber || undefined,
        email: email || undefined,
        courseCoordinator: courseCoordinator || undefined,
        isValid: errors.length === 0,
        errors,
      });
    }

    if (parsedRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid data rows found in the uploaded file." },
        { status: 400 }
      );
    }

    // Generate preview with atomic proposed IDs and state calculations
    const previewResult = await generatePreview(parsedRows, forcedCategory);

    return NextResponse.json({
      success: true,
      fileName,
      preview: previewResult,
    });
  } catch (error: any) {
    console.error("Error in preview API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process certificate file." },
      { status: 500 }
    );
  }
}

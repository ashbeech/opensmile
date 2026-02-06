import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { safeLog } from "@/lib/server/safeLog";
import { RATE_LIMITS } from "@/lib/server/rateLimit";

// Input validation schema
const metaLeadSchema = z.object({
  leadId: z.string(),
  campaignId: z.string(),
  created_time: z.string(),
  field_data: z.array(
    z.object({
      name: z.string(),
      values: z.array(z.string()),
    })
  ),
});

export async function POST(request: NextRequest) {
  // 0. ENFORCE MAX BODY SIZE (1 MB)
  const contentLength = parseInt(
    request.headers.get("content-length") || "0",
    10
  );
  if (contentLength > 1_048_576) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  // 1. RATE LIMIT
  const sourceIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!RATE_LIMITS.webhook(sourceIp)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  // 2. GET RAW BODY (critical - must be exact bytes received)
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!signature) {
    safeLog("webhook:missing_signature", { source: sourceIp });
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  // 3. COMPUTE EXPECTED SIGNATURE (over raw bytes, not JSON)
  const secret = process.env.META_APP_SECRET;
  if (!secret) {
    console.error("META_APP_SECRET not configured");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  // 4. TIMING-SAFE COMPARISON (prevent timing attacks)
  const receivedSig = Buffer.from(signature.replace("sha256=", ""), "hex");
  const expectedSig = Buffer.from(expectedSignature, "hex");

  if (
    receivedSig.length !== expectedSig.length ||
    !crypto.timingSafeEqual(receivedSig, expectedSig)
  ) {
    safeLog("webhook:signature_mismatch", { source: sourceIp });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // 5. PARSE & VALIDATE
  let payload;
  try {
    payload = metaLeadSchema.parse(JSON.parse(rawBody));
  } catch {
    safeLog("webhook:invalid_payload", { source: sourceIp });
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // 6. IDEMPOTENCY CHECK
  const webhookEventId = `meta:${payload.leadId}`;

  try {
    await prisma.webhookEvent.create({
      data: {
        eventId: webhookEventId,
        provider: "META",
        eventType: "lead_created",
        payload: payload as unknown as Record<string, unknown>,
        processedAt: new Date(),
      },
    });
  } catch (error: unknown) {
    // Unique constraint violation = duplicate webhook
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      const existing = await prisma.webhookEvent.findUnique({
        where: { eventId: webhookEventId },
      });
      return NextResponse.json({
        status: "duplicate",
        leadId: existing?.leadId,
        processedAt: existing?.processedAt,
      });
    }
    throw error;
  }

  // 7. EXTRACT & SANITIZE INPUTS
  const name =
    payload.field_data.find((f) => f.name === "full_name")?.values[0] || "";
  const email =
    payload.field_data.find((f) => f.name === "email")?.values[0] || "";
  const phone =
    payload.field_data.find((f) => f.name === "phone_number")?.values[0] || "";

  const normalizedPhone = phone.replace(/\D/g, "");
  if (normalizedPhone.length < 10) {
    return NextResponse.json(
      { error: "Invalid phone number" },
      { status: 400 }
    );
  }

  if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  // 8. FIND CAMPAIGN AND CREATE LEAD
  const campaign = await prisma.campaign.findUnique({
    where: { id: payload.campaignId },
    include: {
      practice: {
        select: { id: true, assignedSalespersonId: true },
      },
    },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const lead = await prisma.lead.create({
    data: {
      practiceId: campaign.practiceId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: `+${normalizedPhone}`,
      source: "FACEBOOK_AD",
      campaignId: payload.campaignId,
      status: "ENQUIRY",
      assignedSalespersonId: campaign.practice.assignedSalespersonId,
      interestedTreatments: [],
      painPoints: [],
      motivations: [],
      objections: [],
    },
  });

  // 9. Update webhook event with created lead ID
  await prisma.webhookEvent.update({
    where: { eventId: webhookEventId },
    data: { leadId: lead.id },
  });

  safeLog("webhook:lead_created", {
    id: lead.id,
    practiceId: lead.practiceId,
    source: lead.source,
  });

  return NextResponse.json({ status: "created", leadId: lead.id });
}

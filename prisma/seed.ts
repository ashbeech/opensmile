import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

// CRITICAL: Only run in development
if (process.env.NODE_ENV === "production") {
  console.error("SEED SCRIPT BLOCKED: Cannot run seed in production");
  process.exit(1);
}

// Require explicit opt-in for seeding
if (process.env.ALLOW_SEEDING !== "true") {
  console.error(
    "SEED SCRIPT BLOCKED: Set ALLOW_SEEDING=true in .env to enable seeding"
  );
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "SEED BLOCKED: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log("Starting seed...");

  // Safety check: prevent weak default passwords
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const salesPassword = process.env.SEED_SALES_PASSWORD;

  if (
    !adminPassword ||
    adminPassword.trim() === "" ||
    !salesPassword ||
    salesPassword.trim() === ""
  ) {
    console.error(
      "SEED BLOCKED: SEED_ADMIN_PASSWORD and SEED_SALES_PASSWORD must be set to non-empty values"
    );
    console.error(
      "   Set explicit values in .env.local (do not use defaults or leave blank)"
    );
    process.exit(1);
  }

  // ---- Helper: Upsert Supabase Auth user (idempotent) ----
  async function upsertAuthUser(
    email: string,
    password: string,
    fullName: string
  ) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (!error) return data.user;

    // If user already exists, find and reuse them
    if (error.message?.includes("already") || error.status === 422) {
      console.log(`  Auth user ${email} already exists, reusing...`);
      const { data: listData } = await supabase.auth.admin.listUsers();
      const existing = listData?.users?.find((u) => u.email === email);
      if (!existing)
        throw new Error(`User ${email} reportedly exists but was not found`);
      return existing;
    }

    throw error;
  }

  // ---- Helper: Upsert Prisma user (idempotent) ----
  async function upsertPrismaUser(
    id: string,
    email: string,
    fullName: string,
    role: "ADMIN" | "SALESPERSON" | "PRACTICE_OWNER" | "PRACTICE_STAFF"
  ) {
    return prisma.user.upsert({
      where: { id },
      update: { email, fullName, role },
      create: { id, email, fullName, role },
    });
  }

  // 1. Create or reuse admin auth user
  console.log("Creating admin auth user...");
  const adminAuth = await upsertAuthUser(
    "admin@opensmile.local",
    adminPassword,
    "Admin User (Dev)"
  );

  // 2. Create matching Prisma user with SAME id (idempotent upsert)
  console.log("Creating admin database record...");
  const admin = await upsertPrismaUser(
    adminAuth.id,
    adminAuth.email!,
    "Admin User (Dev)",
    "ADMIN"
  );
  console.log("Admin user created/updated:", admin.email);

  // 3. Create or reuse salesperson
  console.log("Creating salesperson auth user...");
  const salesAuth = await upsertAuthUser(
    "sales@opensmile.local",
    salesPassword,
    "Sales Person (Dev)"
  );

  const salesperson = await upsertPrismaUser(
    salesAuth.id,
    salesAuth.email!,
    "Sales Person (Dev)",
    "SALESPERSON"
  );
  console.log("Salesperson created/updated:", salesperson.email);

  // 4. Create practice (idempotent: find by name or create)
  let practice = await prisma.dentalPractice.findFirst({
    where: { name: "Demo Dental Practice" },
  });

  if (!practice) {
    practice = await prisma.dentalPractice.create({
      data: {
        name: "Demo Dental Practice",
        address: "123 High Street",
        city: "London",
        postcode: "SW1A 1AA",
        country: "UK",
        email: "practice@demo.com",
        phone: "+44 20 1234 5678",
        subscriptionTier: "GROWTH",
        status: "ACTIVE",
        assignedSalespersonId: salesperson.id,
        conversionPreferences: {
          idealPatientProfile: "High-value cosmetic patients",
          pricingApproach: "Transparent upfront pricing",
          objectionHandling: [
            "Price: Focus on value",
            "Location: Highlight convenience",
          ],
        },
        onboardedAt: new Date(),
        lastActiveAt: new Date(),
      },
    });
    console.log("Practice created:", practice.name);
  } else {
    console.log("Practice already exists, skipping:", practice.name);
  }

  // 5. Create treatment types (skip if already exist for this practice)
  const existingTreatments = await prisma.treatmentType.count({
    where: { practiceId: practice.id },
  });

  if (existingTreatments === 0) {
    await prisma.treatmentType.createMany({
      data: [
        {
          practiceId: practice.id,
          name: "Invisalign",
          category: "COSMETIC",
          averagePrice: 3500,
          consultationDuration: 45,
        },
        {
          practiceId: practice.id,
          name: "Veneers",
          category: "COSMETIC",
          averagePrice: 8000,
          consultationDuration: 60,
        },
        {
          practiceId: practice.id,
          name: "Composite Bonding",
          category: "COSMETIC",
          averagePrice: 1200,
          consultationDuration: 30,
        },
      ],
    });
    console.log("Treatment types created");
  } else {
    console.log("Treatment types already exist, skipping");
  }

  // 6. Create sample leads (skip if already exists for this practice)
  const existingLead = await prisma.lead.findFirst({
    where: { practiceId: practice.id, email: "john@example.com" },
  });

  if (!existingLead) {
    await prisma.lead.create({
      data: {
        practiceId: practice.id,
        name: "John Smith",
        email: "john@example.com",
        phone: "+44 7700 900000",
        source: "FACEBOOK_AD",
        status: "NEW",
        assignedSalespersonId: salesperson.id,
        interestedTreatments: ["Invisalign"],
        urgency: "high",
        painPoints: ["Crooked teeth", "Self-conscious smile"],
        motivations: ["Upcoming wedding"],
        objections: [],
        recordingConsent: false,
      },
    });

    await prisma.lead.create({
      data: {
        practiceId: practice.id,
        name: "Sarah Johnson",
        email: "sarah@example.com",
        phone: "+44 7700 900001",
        source: "INSTAGRAM_AD",
        status: "CONTACTED",
        assignedSalespersonId: salesperson.id,
        interestedTreatments: ["Veneers", "Composite Bonding"],
        urgency: "medium",
        painPoints: ["Discolored teeth"],
        motivations: ["Confidence boost"],
        objections: ["Price concern"],
        recordingConsent: true,
        recordingConsentDate: new Date(),
        recordingConsentMethod: "form_submission",
      },
    });

    console.log("Sample leads created");
  } else {
    console.log("Sample leads already exist, skipping");
  }

  console.log("\nSeed completed successfully! (safe to rerun)");
  console.log("\nSeeded users:");
  console.log("- Admin:", adminAuth.email);
  console.log("- Salesperson:", salesAuth.email);

  if (process.env.PRINT_SEED_CREDS === "true") {
    console.log("\nPasswords (only visible because PRINT_SEED_CREDS=true):");
    console.log("- Admin:", adminPassword);
    console.log("- Salesperson:", salesPassword);
  } else {
    console.log(
      "\nPasswords set from SEED_ADMIN_PASSWORD and SEED_SALES_PASSWORD env vars"
    );
    console.log("   (Set PRINT_SEED_CREDS=true to display them)");
  }
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { and, desc, eq, gte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  aiControls,
  auditLogs,
  billPlans,
  bills,
  contacts,
  escalations,
  InsertUser,
  notifications,
  profiles,
  transactions,
  users,
} from "../drizzle/schema";
import { authEventFor, canSendWithinDailyLimit, isWithinBillGuardrail } from "../shared/demoRules";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  values.lastSignedIn ??= new Date();
  if (!Object.keys(updateSet).length) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

async function seedDemoRows(userId: number, displayName?: string) {
  const db = await getDb();
  if (!db) return;

  const existingProfile = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  if (!existingProfile.length) {
    const base = (displayName || "Alex Morgan").toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "") || "alex.morgan";
    const handle = `${base}@momentum`;
    await db.insert(profiles).values({
      userId,
      phone: "+1 (415) 555-0182",
      handle,
      dob: "1994-08-16",
      kycStatus: "simulated",
      linkedBank: "Demo Community Bank",
      balanceCents: 284000,
      pinConfigured: 1,
      biometricEnabled: 1,
    });
  }

  const existingControls = await db.select().from(aiControls).where(eq(aiControls.userId, userId)).limit(1);
  if (!existingControls.length) {
    await db.insert(aiControls).values({ userId, autoSwitchEnabled: 0, maxMonthlySavingsCents: 0, maxPriceIncreaseCents: 0 });
  }

  const existingContacts = await db.select().from(contacts).where(eq(contacts.userId, userId)).limit(1);
  if (!existingContacts.length) {
    await db.insert(contacts).values([
      { userId, displayName: "Ali Rahman", handle: "ali.rahman@momentum", phone: "+1 (415) 555-0137", relationship: "Dinner club", color: "#a7e9d1" },
      { userId, displayName: "Maya Chen", handle: "maya.chen@momentum", phone: "+1 (312) 555-0199", relationship: "Roommate", color: "#c7b8ff" },
      { userId, displayName: "Jordan Bell", handle: "jordan.bell@momentum", phone: "+1 (212) 555-0148", relationship: "Coworker", color: "#ffd7a1" },
    ]);
  }

  const existingBills = await db.select().from(bills).where(eq(bills.userId, userId)).limit(1);
  if (!existingBills.length) {
    const inserted = await db.insert(bills).values([
      { userId, category: "utility", provider: "Pacific Grid", amountCents: 14200, dueDate: "Sep 28", usageMetric: "312 kWh · 18% below neighborhood average", currentPlan: "Flex Saver 12" },
      { userId, category: "phone", provider: "Northstar Mobile", amountCents: 6800, dueDate: "Oct 02", usageMetric: "18.4 GB · 7 GB rollover unused", currentPlan: "Unlimited Plus" },
      { userId, category: "insurance", provider: "Harbor Auto", amountCents: 11800, dueDate: "Oct 08", usageMetric: "6,840 miles/year · low-mileage eligible", currentPlan: "Standard Drive" },
    ]).$returningId();
    const billIds = inserted.map(item => item.id);
    if (billIds.length >= 3) {
      await db.insert(billPlans).values([
        { billId: billIds[0], provider: "Pacific Grid", planName: "Time-of-Use Green", monthlyCents: 12700, savingsCents: 1500, usageFit: 94, contractLabel: "No contract" },
        { billId: billIds[0], provider: "Pacific Grid", planName: "Fixed Calm", monthlyCents: 13600, savingsCents: 600, usageFit: 81, contractLabel: "12 months" },
        { billId: billIds[1], provider: "Northstar Mobile", planName: "Shared 30 GB", monthlyCents: 5400, savingsCents: 1400, usageFit: 91, contractLabel: "Month to month" },
        { billId: billIds[1], provider: "Northstar Mobile", planName: "Unlimited Plus", monthlyCents: 6800, savingsCents: 0, usageFit: 100, contractLabel: "Current plan" },
        { billId: billIds[2], provider: "Harbor Auto", planName: "Low-mileage Flex", monthlyCents: 10100, savingsCents: 1700, usageFit: 89, contractLabel: "No contract" },
        { billId: billIds[2], provider: "Harbor Auto", planName: "Standard Drive", monthlyCents: 11800, savingsCents: 0, usageFit: 100, contractLabel: "Current plan" },
      ]);
    }
  }

  const existingTransactions = await db.select().from(transactions).where(eq(transactions.userId, userId)).limit(1);
  if (!existingTransactions.length) {
    await db.insert(transactions).values([
      { userId, counterpartyName: "Maya Chen", counterpartyHandle: "maya.chen@momentum", type: "p2p", direction: "out", amountCents: 3200, feeCents: 0, note: "Tuesday groceries", authMethod: "biometric", authEvent: "biometric_unlock_recorded", createdAt: new Date(Date.now() - 1000 * 60 * 45) },
      { userId, counterpartyName: "Bodega 17", counterpartyHandle: "merchant@bodega17", type: "merchant", direction: "out", amountCents: 1875, feeCents: 0, note: "Coffee + bagel", authMethod: "pin", authEvent: "pin_verified", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20) },
      { userId, counterpartyName: "Ali Rahman", counterpartyHandle: "ali.rahman@momentum", type: "p2p", direction: "in", amountCents: 4500, feeCents: 0, note: "Dinner split", authMethod: "system", authEvent: "recipient_notification_ack", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 31) },
      { userId, counterpartyName: "CTA Ventra", counterpartyHandle: "transit@cta", type: "transit", direction: "out", amountCents: 250, feeCents: 0, note: "Tap-to-ride · Chicago", authMethod: "biometric", authEvent: "contactless_tap_recorded", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 50) },
    ]);
  }
}

export async function getDashboardSnapshot(userId: number, displayName?: string) {
  await seedDemoRows(userId, displayName);
  const db = await getDb();
  if (!db) return null;
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  const rows = await db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.createdAt)).limit(8);
  const [controls] = await db.select().from(aiControls).where(eq(aiControls.userId, userId)).limit(1);
  const notificationsRows = await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(6);
  return { profile, transactions: rows, controls, notifications: notificationsRows };
}

export async function getContacts(userId: number, displayName?: string) {
  await seedDemoRows(userId, displayName);
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contacts).where(eq(contacts.userId, userId));
}

export async function resolveRecipient(userId: number, query: string, displayName?: string) {
  const all = await getContacts(userId, displayName);
  const normalized = query.trim().toLowerCase();
  const found = all.find(contact => contact.displayName.toLowerCase() === normalized || contact.handle.toLowerCase() === normalized || contact.phone === query.trim());
  return found ?? null;
}

export async function createTransfer(params: {
  userId: number;
  recipientName: string;
  recipientHandle?: string;
  amountCents: number;
  note?: string;
  authMethod: "pin" | "biometric";
}) {
  const { userId, recipientName, recipientHandle, amountCents, note, authMethod } = params;
  if (amountCents <= 0) throw new Error("Amount must be greater than zero");
  if (amountCents > 250000) throw new Error("Daily limit hard block: this demo transfer exceeds the $2,500 daily limit.");
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await seedDemoRows(userId);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const [sum] = await db.select({ total: sql<number>`COALESCE(SUM(${transactions.amountCents}), 0)` }).from(transactions).where(and(eq(transactions.userId, userId), eq(transactions.direction, "out"), gte(transactions.createdAt, start)));
  if (!canSendWithinDailyLimit(Number(sum?.total ?? 0), amountCents)) throw new Error("Daily limit hard block: no override is available.");
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  if (!profile || profile.balanceCents < amountCents) throw new Error("Insufficient simulated balance.");
  const authEvent = authEventFor(authMethod);
  const [inserted] = await db.insert(transactions).values({ userId, counterpartyName: recipientName, counterpartyHandle: recipientHandle, type: "p2p", direction: "out", amountCents, feeCents: 0, note, authMethod, authEvent }).$returningId();
  await db.update(profiles).set({ balanceCents: profile.balanceCents - amountCents }).where(eq(profiles.userId, userId));
  await addNotificationFanout(userId, "Payment sent", `Sent $${(amountCents / 100).toFixed(2)} to ${recipientName}.`, "transaction", inserted.id);
  await db.insert(auditLogs).values({ userId, agent: "system", action: "p2p_transfer", decision: "settled", reasoning: `Recipient matched as ${recipientName}. Daily outgoing total remained below the $2,500 hard limit. ${authMethod === "biometric" ? "Biometric unlock was recorded as a PIN-equivalent server event." : "Server-side PIN verification event recorded."}`, dataJson: JSON.stringify({ amountCents, recipientName, authMethod, simulated: true }) });
  return { id: inserted.id, status: "settled", feeCents: 0, authEvent };
}

export async function createMerchantPayment(params: { userId: number; merchantName: string; amountCents: number; crossPlatform?: boolean; authMethod: "pin" | "biometric"; }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await seedDemoRows(params.userId);
  const feeCents = params.crossPlatform ? 1 : 0;
  const authEvent = authEventFor(params.authMethod);
  const [inserted] = await db.insert(transactions).values({ userId: params.userId, counterpartyName: params.merchantName, counterpartyHandle: "merchant@demo", type: "merchant", direction: "out", amountCents: params.amountCents, feeCents, note: "QR/NFC merchant payment", authMethod: params.authMethod, authEvent }).$returningId();
  await addNotificationFanout(params.userId, "Merchant payment complete", `Paid ${params.merchantName} $${(params.amountCents / 100).toFixed(2)}.`, "transaction", inserted.id);
  await db.insert(auditLogs).values({ userId: params.userId, agent: "system", action: "merchant_payment", decision: "settled", reasoning: `Verified merchant ${params.merchantName}. ${params.crossPlatform ? "Applied the $0.01 cross-platform demo fee." : "Standard merchant payment is free."} ${params.authMethod === "biometric" ? "Biometric unlock was recorded as a PIN-equivalent server event." : "Server-side PIN verification event recorded."}`, dataJson: JSON.stringify({ simulated: true, feeCents }) });
  return { id: inserted.id, feeCents, status: "settled" };
}

export async function getBillsSnapshot(userId: number, displayName?: string) {
  await seedDemoRows(userId, displayName);
  const db = await getDb();
  if (!db) return { bills: [], plans: [], escalations: [] };
  const billsRows = await db.select().from(bills).where(eq(bills.userId, userId));
  const billIds = billsRows.map(bill => bill.id);
  const plans = billIds.length ? await db.select().from(billPlans).where(sql`${billPlans.billId} IN (${sql.join(billIds.map(id => sql`${id}`), sql`, `)})`) : [];
  const escalationRows = await db.select().from(escalations).where(eq(escalations.userId, userId)).orderBy(desc(escalations.createdAt)).limit(8);
  return { bills: billsRows, plans, escalations: escalationRows };
}

export async function getControls(userId: number, displayName?: string) {
  await seedDemoRows(userId, displayName);
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(aiControls).where(eq(aiControls.userId, userId)).limit(1);
  return row;
}

export async function updateControls(userId: number, input: { autoSwitchEnabled: boolean; maxMonthlySavingsCents: number; maxPriceIncreaseCents: number; notifyPush: boolean; notifyEmail: boolean; notifySms: boolean; }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await seedDemoRows(userId);
  await db.update(aiControls).set({ autoSwitchEnabled: input.autoSwitchEnabled ? 1 : 0, maxMonthlySavingsCents: input.maxMonthlySavingsCents, maxPriceIncreaseCents: input.maxPriceIncreaseCents, notifyPush: input.notifyPush ? 1 : 0, notifyEmail: input.notifyEmail ? 1 : 0, notifySms: input.notifySms ? 1 : 0 }).where(eq(aiControls.userId, userId));
  return getControls(userId);
}

export async function addNotificationFanout(userId: number, title: string, body: string, relatedType?: string, relatedId?: number) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values([
    { userId, channel: "push", title, body, relatedType, relatedId },
    { userId, channel: "email", title, body, relatedType, relatedId },
    { userId, channel: "in_app", title, body, relatedType, relatedId },
    { userId, channel: "sms", title, body: `${body} SMS is simulated/logged in demo mode.`, status: "simulated", relatedType, relatedId },
  ]);
}

export async function getNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(24);
}

export async function getAuditLogs(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditLogs).where(eq(auditLogs.userId, userId)).orderBy(desc(auditLogs.createdAt)).limit(30);
}

export async function recordAudit(userId: number, agent: "yuna" | "bill_advisor" | "commute" | "system", action: string, decision: string, reasoning: string, data?: unknown) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLogs).values({ userId, agent, action, decision, reasoning, dataJson: data ? JSON.stringify(data) : undefined });
}

export async function runBillScanForUser(userId: number) {
  const snapshot = await getBillsSnapshot(userId);
  const controls = await getControls(userId);
  const db = await getDb();
  if (!db || !controls) return { processed: 0, autoExecuted: 0, escalated: 0 };
  let autoExecuted = 0;
  let escalated = 0;
  for (const bill of snapshot.bills) {
    const options = snapshot.plans.filter(plan => plan.billId === bill.id && plan.savingsCents > 0).sort((a, b) => b.usageFit - a.usageFit || b.savingsCents - a.savingsCents);
    const best = options[0];
    if (!best) continue;
    const priceIncrease = best.monthlyCents - bill.amountCents;
    const withinGuardrails = isWithinBillGuardrail({ autoSwitchEnabled: Boolean(controls.autoSwitchEnabled), savingsCents: best.savingsCents, maxMonthlySavingsCents: controls.maxMonthlySavingsCents, priceIncreaseCents: priceIncrease, maxPriceIncreaseCents: controls.maxPriceIncreaseCents });
    if (withinGuardrails) {
      await db.update(bills).set({ amountCents: best.monthlyCents, currentPlan: best.planName }).where(eq(bills.id, bill.id));
      await addNotificationFanout(userId, "Bill plan switched", `${bill.provider} moved to ${best.planName}, saving $${(best.savingsCents / 100).toFixed(2)}/month.`, "bill", bill.id);
      await recordAudit(userId, "bill_advisor", "monthly_bill_scan", "auto-executed", `Compared ${bill.provider} against ${options.length} market options. ${best.planName} matched ${best.usageFit}% of the observed usage pattern and saved $${(best.savingsCents / 100).toFixed(2)}/month. The result was inside the configured guardrail.`, { billId: bill.id, plan: best.planName, savingsCents: best.savingsCents, simulated: true });
      autoExecuted++;
    } else {
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const [created] = await db.insert(escalations).values({ userId, billId: bill.id, prompt: `Switch ${bill.provider} to ${best.planName} for $${(best.monthlyCents / 100).toFixed(2)}/month and save $${(best.savingsCents / 100).toFixed(2)}?`, expiresAt }).$returningId();
      await addNotificationFanout(userId, "Bill decision needed", `${bill.provider}: ${best.planName} could save $${(best.savingsCents / 100).toFixed(2)}/month. This escalation expires in 48 hours.`, "escalation", created.id);
      await recordAudit(userId, "bill_advisor", "monthly_bill_scan", "escalated", `Compared ${bill.provider} against ${options.length} market options. The best fit was ${best.planName} at ${best.usageFit}% usage match, but the agent did not act because auto-switching is ${controls.autoSwitchEnabled ? "outside the configured savings guardrail" : "disabled / not configured"}.`, { billId: bill.id, plan: best.planName, expiresAt, simulated: true });
      escalated++;
    }
  }
  return { processed: snapshot.bills.length, autoExecuted, escalated };
}

export async function getAllProfileUserIds() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ userId: profiles.userId }).from(profiles);
  return rows.map(row => row.userId);
}

export async function getCommuteGuide(userId: number, city: string) {
  const normalized = city.trim().toLowerCase();
  const systems: Record<string, { city: string; system: string; copy: string; accent: string }> = {
    chicago: { city: "Chicago", system: "CTA", copy: "CTA accepts contactless tap at supported rail stations and buses. Just tap your existing Momentum card at the reader — no separate ticket flow needed.", accent: "#8de0c1" },
    "new york": { city: "New York", system: "OMNY", copy: "OMNY supports contactless tap across subway and bus readers. Use the same Momentum contactless card you already have.", accent: "#ffcf99" },
    "san francisco": { city: "San Francisco", system: "Clipper", copy: "Clipper supports open-loop contactless payment at supported Bay Area readers. Tap the Momentum card and keep moving.", accent: "#c7b8ff" },
    "washington dc": { city: "Washington, DC", system: "SmarTrip", copy: "SmarTrip readers accept contactless cards at supported Metro gates. Tap the existing Momentum card at the turnstile.", accent: "#9ac7ff" },
  };
  const guide = systems[normalized] ?? systems.chicago;
  await recordAudit(userId, "commute", "city_transit_guidance", "guided", `Demo geolocation placed the user in ${guide.city}. The agent matched the city to ${guide.system} and reused the existing contactless payment capability for guidance only.`, { city: guide.city, system: guide.system, simulatedGeolocation: true });
  return { ...guide, simulated: true };
}

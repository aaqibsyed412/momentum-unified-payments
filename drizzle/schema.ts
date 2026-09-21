import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core Manus-authenticated user table. All financial-looking records below are
 * demo-only records and never connect to real banks, merchants, or money rails.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const profiles = mysqlTable("profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  phone: varchar("phone", { length: 32 }).notNull(),
  handle: varchar("handle", { length: 80 }).notNull().unique(),
  dob: varchar("dob", { length: 32 }),
  kycStatus: varchar("kycStatus", { length: 32 }).default("simulated").notNull(),
  linkedBank: varchar("linkedBank", { length: 120 }).default("Demo Community Bank").notNull(),
  balanceCents: int("balanceCents").default(284000).notNull(),
  pinConfigured: int("pinConfigured").default(1).notNull(),
  biometricEnabled: int("biometricEnabled").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const contacts = mysqlTable("contacts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  displayName: varchar("displayName", { length: 120 }).notNull(),
  handle: varchar("handle", { length: 80 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  relationship: varchar("relationship", { length: 48 }),
  color: varchar("color", { length: 16 }).default("#8de0c1").notNull(),
});

export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  counterpartyName: varchar("counterpartyName", { length: 120 }).notNull(),
  counterpartyHandle: varchar("counterpartyHandle", { length: 80 }),
  type: mysqlEnum("type", ["p2p", "merchant", "transit"]).notNull(),
  direction: mysqlEnum("direction", ["in", "out"]).notNull(),
  amountCents: int("amountCents").notNull(),
  feeCents: int("feeCents").default(0).notNull(),
  note: text("note"),
  status: varchar("status", { length: 32 }).default("settled").notNull(),
  authMethod: varchar("authMethod", { length: 32 }).notNull(),
  authEvent: varchar("authEvent", { length: 160 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const bills = mysqlTable("bills", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  category: mysqlEnum("category", ["utility", "phone", "insurance"]).notNull(),
  provider: varchar("provider", { length: 120 }).notNull(),
  amountCents: int("amountCents").notNull(),
  dueDate: varchar("dueDate", { length: 32 }).notNull(),
  usageMetric: varchar("usageMetric", { length: 120 }).notNull(),
  currentPlan: varchar("currentPlan", { length: 120 }).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const billPlans = mysqlTable("billPlans", {
  id: int("id").autoincrement().primaryKey(),
  billId: int("billId").notNull(),
  provider: varchar("provider", { length: 120 }).notNull(),
  planName: varchar("planName", { length: 120 }).notNull(),
  monthlyCents: int("monthlyCents").notNull(),
  savingsCents: int("savingsCents").notNull(),
  usageFit: int("usageFit").notNull(),
  contractLabel: varchar("contractLabel", { length: 80 }).notNull(),
});

export const aiControls = mysqlTable("aiControls", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  autoSwitchEnabled: int("autoSwitchEnabled").default(0).notNull(),
  maxMonthlySavingsCents: int("maxMonthlySavingsCents").default(0).notNull(),
  maxPriceIncreaseCents: int("maxPriceIncreaseCents").default(0).notNull(),
  notifyPush: int("notifyPush").default(1).notNull(),
  notifyEmail: int("notifyEmail").default(1).notNull(),
  notifySms: int("notifySms").default(1).notNull(),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const escalations = mysqlTable("escalations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  billId: int("billId").notNull(),
  prompt: text("prompt").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "declined", "expired"]).default("pending").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  channel: mysqlEnum("channel", ["push", "email", "in_app", "sms"]).notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  body: text("body").notNull(),
  status: varchar("status", { length: 32 }).default("delivered").notNull(),
  relatedType: varchar("relatedType", { length: 48 }),
  relatedId: int("relatedId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  agent: mysqlEnum("agent", ["yuna", "bill_advisor", "commute", "system"]).notNull(),
  action: varchar("action", { length: 120 }).notNull(),
  decision: varchar("decision", { length: 48 }).notNull(),
  reasoning: text("reasoning").notNull(),
  dataJson: text("dataJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Bill = typeof bills.$inferSelect;
export type AiControls = typeof aiControls.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;

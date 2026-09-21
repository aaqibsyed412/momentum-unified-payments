import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { transcribeAudio } from "./_core/voiceTranscription";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { storageGetSignedUrl, storagePut } from "./storage";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

const demoIntentSchema = {
  type: "object",
  properties: {
    action: { type: "string", enum: ["send_money", "pay_merchant", "check_balance", "unknown"] },
    recipient: { type: "string" },
    amountCents: { type: "integer" },
    note: { type: "string" },
    merchant: { type: "string" },
  },
  required: ["action", "recipient", "amountCents", "note", "merchant"],
  additionalProperties: false,
} as const;

function requireUserId(ctx: { user: NonNullable<unknown> & { id: number } }) {
  return ctx.user.id;
}

export const appRouter = router({
  system: router({
    health: publicProcedure.query(() => ({ ok: true, simulatedRails: true })),
  }),
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  dashboard: router({
    snapshot: protectedProcedure.query(({ ctx }) => db.getDashboardSnapshot(requireUserId(ctx), ctx.user.name ?? undefined)),
    contacts: protectedProcedure.query(({ ctx }) => db.getContacts(requireUserId(ctx), ctx.user.name ?? undefined)),
    notifications: protectedProcedure.query(({ ctx }) => db.getNotifications(requireUserId(ctx))),
    audit: protectedProcedure.query(({ ctx }) => db.getAuditLogs(requireUserId(ctx))),
  }),
  profile: router({
    update: protectedProcedure.input(z.object({ phone: z.string().min(7).max(32), handle: z.string().min(3).max(80), dob: z.string().optional() })).mutation(async ({ ctx, input }) => {
      const userId = requireUserId(ctx);
      const current = await db.getDashboardSnapshot(userId, ctx.user.name ?? undefined);
      if (!current?.profile) throw new TRPCError({ code: "NOT_FOUND", message: "Profile not found" });
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const { profiles } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      await database.update(profiles).set({ phone: input.phone, handle: input.handle, dob: input.dob ?? current.profile.dob }).where(eq(profiles.userId, userId));
      await db.recordAudit(userId, "system", "profile_update", "saved", "Profile details were updated. KYC and bank-link states remain clearly simulated.", { simulated: true });
      return db.getDashboardSnapshot(userId, ctx.user.name ?? undefined);
    }),
  }),
  payments: router({
    resolveRecipient: protectedProcedure.input(z.object({ query: z.string().min(2) })).query(({ ctx, input }) => db.resolveRecipient(requireUserId(ctx), input.query, ctx.user.name ?? undefined)),
    send: protectedProcedure.input(z.object({ recipientName: z.string().min(2), recipientHandle: z.string().optional(), amountCents: z.number().int().positive(), note: z.string().max(120).optional(), authMethod: z.enum(["pin", "biometric"]) })).mutation(({ ctx, input }) => db.createTransfer({ userId: requireUserId(ctx), ...input })),
    merchant: protectedProcedure.input(z.object({ merchantName: z.string().min(2), amountCents: z.number().int().positive(), crossPlatform: z.boolean().default(false), authMethod: z.enum(["pin", "biometric"]) })).mutation(({ ctx, input }) => db.createMerchantPayment({ userId: requireUserId(ctx), ...input })),
  }),
  voice: router({
    transcribe: protectedProcedure.input(z.object({ audioBase64: z.string().min(10).max(22_000_000), mimeType: z.string().default("audio/webm") })).mutation(async ({ input }) => {
      // Real speech-to-text path: audio is uploaded to the platform storage, then sent to Whisper.
      const buffer = Buffer.from(input.audioBase64, "base64");
      const stored = await storagePut(`yuna/${Date.now()}.webm`, buffer, input.mimeType);
      const signedUrl = await storageGetSignedUrl(stored.key);
      const result = await transcribeAudio({ audioUrl: signedUrl, language: "en", prompt: "Transcribe a concise U.S. payments command. Preserve names, dollar amounts, and the note." });
      if ("error" in result) throw new TRPCError({ code: "BAD_REQUEST", message: result.error, cause: result });
      return { text: result.text, language: result.language, duration: result.duration };
    }),
    parseIntent: protectedProcedure.input(z.object({ transcript: z.string().min(2).max(800) })).mutation(async ({ ctx, input }) => {
      const contacts = await db.getContacts(requireUserId(ctx), ctx.user.name ?? undefined);
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are Yuna, a voice assistant inside a demo payments app. Extract a single payment intent. The user must say a full contact name up front. Never invent a contact or ask a follow-up question. If the transcript is not a clear payment request, return unknown. All money is simulated." },
          { role: "user", content: `Known contacts: ${contacts.map(contact => `${contact.displayName} (${contact.handle})`).join(", ")}\nTranscript: ${input.transcript}` },
        ],
        response_format: { type: "json_schema", json_schema: { name: "yuna_intent", strict: true, schema: demoIntentSchema } },
      });
      const content = response.choices[0]?.message.content;
      const parsed = JSON.parse(typeof content === "string" ? content : "{}");
      const matched = parsed.recipient ? contacts.find(contact => contact.displayName.toLowerCase() === String(parsed.recipient).toLowerCase()) : undefined;
      await db.recordAudit(requireUserId(ctx), "yuna", "voice_intent_parse", parsed.action === "send_money" && matched ? "ready_for_confirmation" : "needs_manual_review", `Yuna transcribed the request and parsed a structured intent. Contact matching was ${matched ? "successful" : "not resolved"}; nothing executes until the user reviews and confirms, then uses PIN or biometric auth.`, { transcript: input.transcript, parsed, matched: matched?.displayName, realSpeechToText: true, realLLMParsing: true });
      return { ...parsed, matchedContact: matched ?? null, confirmationText: parsed.action === "send_money" && matched ? `Send $${(Number(parsed.amountCents || 0) / 100).toFixed(2)} to ${matched.displayName}${parsed.note ? `, note: ${parsed.note}` : ""} — confirm?` : "I need a full contact name and a clear amount before I can prepare that." };
    }),
  }),
  bills: router({
    snapshot: protectedProcedure.query(({ ctx }) => db.getBillsSnapshot(requireUserId(ctx), ctx.user.name ?? undefined)),
    runScan: protectedProcedure.mutation(({ ctx }) => db.runBillScanForUser(requireUserId(ctx))),
    decision: protectedProcedure.input(z.object({ escalationId: z.number().int(), decision: z.enum(["approved", "declined"]) })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const { escalations } = await import("../drizzle/schema");
      const { and, eq } = await import("drizzle-orm");
      await database.update(escalations).set({ status: input.decision }).where(and(eq(escalations.id, input.escalationId), eq(escalations.userId, requireUserId(ctx))));
      await db.recordAudit(requireUserId(ctx), "bill_advisor", "escalation_decision", input.decision, `The user ${input.decision}d the proposed bill-plan switch. The demo records the decision and does not contact a real provider.`, { escalationId: input.escalationId, simulated: true });
      return { ok: true };
    }),
  }),
  controls: router({
    get: protectedProcedure.query(({ ctx }) => db.getControls(requireUserId(ctx), ctx.user.name ?? undefined)),
    update: protectedProcedure.input(z.object({ autoSwitchEnabled: z.boolean(), maxMonthlySavingsCents: z.number().int().min(0).max(100000), maxPriceIncreaseCents: z.number().int().min(0).max(100000), notifyPush: z.boolean(), notifyEmail: z.boolean(), notifySms: z.boolean() })).mutation(({ ctx, input }) => db.updateControls(requireUserId(ctx), input)),
  }),
  commute: router({
    guide: protectedProcedure.input(z.object({ city: z.string().min(2).max(80) })).mutation(({ ctx, input }) => db.getCommuteGuide(requireUserId(ctx), input.city)),
  }),
});

export type AppRouter = typeof appRouter;

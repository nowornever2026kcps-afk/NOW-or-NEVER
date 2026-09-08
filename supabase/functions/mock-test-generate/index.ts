import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const GROQ_API_KEY = Deno.env.get("GROQ_RESEARCH_KEY") ?? Deno.env.get("GROQ_API_KEY") ?? "";
const GROQ_MODEL = Deno.env.get("GROQ_MCQ_MODEL") ?? "groq/compound";

const MAX_QUESTIONS = 90;
const BATCH_SIZE = 15;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders,
  });
}

function cleanAnswer(value: unknown): string | null {
  const answer = String(value ?? "").trim().toUpperCase();
  return ["A", "B", "C", "D"].includes(answer) ? answer : null;
}

function normalizeQuestion(raw: any, position: number, defaults: any) {
  const questionText = String(raw?.question_text ?? raw?.question ?? "").trim();
  const optionA = String(raw?.option_a ?? raw?.options?.A ?? "").trim();
  const optionB = String(raw?.option_b ?? raw?.options?.B ?? "").trim();
  const optionC = String(raw?.option_c ?? raw?.options?.C ?? "").trim();
  const optionD = String(raw?.option_d ?? raw?.options?.D ?? "").trim();
  const correctAnswer = cleanAnswer(raw?.correct_answer ?? raw?.answer);

  if (!questionText || !optionA || !optionB || !optionC || !optionD || !correctAnswer) {
    return null;
  }

  const options = [optionA, optionB, optionC, optionD];
  const normalizedOptions = options.map((x) => x.replace(/\s+/g, " ").trim().toLowerCase());
  if (new Set(normalizedOptions).size !== 4) return null;

  return {
    position,
    question_text: questionText,
    option_a: optionA,
    option_b: optionB,
    option_c: optionC,
    option_d: optionD,
    correct_answer: correctAnswer,
    explanation: String(raw?.explanation ?? "").trim() || null,
    difficulty: String(raw?.difficulty ?? defaults.difficulty ?? "medium").trim().toLowerCase(),
    subject: String(raw?.subject ?? defaults.subject ?? "").trim() || null,
    chapter: String(raw?.chapter ?? defaults.chapter ?? "").trim() || null,
    topic: String(raw?.topic ?? "").trim() || null,
    ai_confidence: Number.isFinite(Number(raw?.ai_confidence))
      ? Math.max(0, Math.min(100, Number(raw.ai_confidence)))
      : null,
    generation_model: GROQ_MODEL,
    validation_status: "pending",
  };
}

function questionFingerprint(q: any): string {
  return String(q.question_text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function groqGenerate(batchCount: number, settings: any, existingFingerprints: string[]) {
  const systemPrompt = `You are an expert Indian medical/board examination question setter.
Generate high-quality multiple-choice questions for a mock test.

QUALITY RULES:
- Questions must be factually correct and unambiguous.
- Exactly four distinct options A, B, C, D.
- Exactly one best correct answer.
- The answer must be supported by established academic knowledge.
- Do not invent facts, references, studies, equations, organisms, drugs, reactions, or exam rules.
- Avoid trick wording, double negatives, vague pronouns, and multiple-correct-answer questions.
- Avoid questions where two options could reasonably be accepted.
- Match the requested subject/chapter/syllabus level.
- Avoid duplicate or near-duplicate questions.
- Include a concise explanation that justifies the correct answer.
- Do not include markdown around the JSON.
- Return ONLY valid JSON with this exact top-level shape: {"questions":[...]}
- Each question object must contain: question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty, subject, chapter, topic, ai_confidence.
- correct_answer must be exactly A, B, C, or D.
- ai_confidence is a number from 0 to 100.

This is a generation stage, not final approval. Do not claim that a question is officially approved.`;

  const userPrompt = `Create exactly ${batchCount} NEW MCQs.
Exam type: ${settings.exam_type}
Subject: ${settings.subject || "General"}
Chapter: ${settings.chapter || "All relevant chapters"}
Topic: ${settings.topic || "All relevant topics"}
Difficulty: ${settings.difficulty || "mixed"}
Class/level: ${settings.class_level || "appropriate exam level"}

Questions already generated in this test (do not repeat or paraphrase these):
${existingFingerprints.slice(-30).map((x, i) => `${i + 1}. ${x}`).join("\n") || "None"}`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.2,
      max_completion_tokens: 12000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Groq request failed (${response.status}): ${body.slice(0, 1000)}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq returned no message content");

  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Groq returned invalid JSON");
  }

  if (!Array.isArray(parsed?.questions)) {
    throw new Error("Groq JSON did not contain a questions array");
  }

  return parsed.questions;
}

async function main(req: Request) {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: "Supabase environment variables are not configured" }, 500);
  }
  if (!GROQ_API_KEY) {
    return json({ error: "GROQ_RESEARCH_KEY is not configured" }, 500);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Missing authorization header" }, 401);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON request body" }, 400);
  }

  const requestedCount = Number(body?.question_count ?? 0);
  if (!Number.isInteger(requestedCount) || requestedCount < 1 || requestedCount > MAX_QUESTIONS) {
    return json({ error: `question_count must be an integer from 1 to ${MAX_QUESTIONS}` }, 400);
  }

  const settings = {
    exam_type: String(body?.exam_type ?? "NEET").trim(),
    subject: String(body?.subject ?? "").trim(),
    chapter: String(body?.chapter ?? "").trim(),
    topic: String(body?.topic ?? "").trim(),
    difficulty: String(body?.difficulty ?? "mixed").trim(),
    class_level: String(body?.class_level ?? "").trim(),
  };

  // Authenticate the caller using their own JWT. The service-role client below
  // is used only after the admin check and never receives browser-controlled auth.
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData?.user) {
    return json({ error: "Invalid or expired authentication token" }, 401);
  }

  const { data: adminData, error: adminError } = await userClient.rpc("is_admin");
  if (adminError || adminData !== true) {
    return json({ error: "Admin access required" }, 403);
  }

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let testId = body?.mock_test_id ? String(body.mock_test_id) : null;

  if (testId) {
    const { data: test, error } = await adminClient
      .from("mock_tests")
      .select("id,status,validation_status,question_count,created_by,exam_type,subject,chapter")
      .eq("id", testId)
      .single();

    if (error || !test) return json({ error: "Mock test not found" }, 404);
    if (test.status !== "draft") {
      return json({ error: "Questions can only be generated for a draft mock test" }, 409);
    }
    if (test.created_by && test.created_by !== userData.user.id) {
      return json({ error: "You are not the creator of this draft mock test" }, 403);
    }

    settings.exam_type = settings.exam_type || test.exam_type || "NEET";
    settings.subject = settings.subject || test.subject || "";
    settings.chapter = settings.chapter || test.chapter || "";
  } else {
    const { data: inserted, error } = await adminClient
      .from("mock_tests")
      .insert({
        title: String(body?.title ?? `${settings.exam_type} AI Mock Test`).trim(),
        exam_type: settings.exam_type,
        subject: settings.subject || null,
        chapter: settings.chapter || null,
        question_count: 0,
        duration_minutes: Number(body?.duration_minutes ?? 180),
        marks_per_question: Number(body?.marks_per_question ?? 4),
        negative_marks: Number(body?.negative_marks ?? 1),
        start_at: body?.start_at ?? null,
        end_at: body?.end_at ?? null,
        status: "draft",
        validation_status: "running",
        created_by: userData.user.id,
      })
      .select("id")
      .single();

    if (error || !inserted) {
      return json({ error: `Could not create mock test: ${error?.message ?? "unknown error"}` }, 500);
    }
    testId = inserted.id;
  }

  const { data: oldQuestions, error: oldQuestionError } = await adminClient
    .from("mock_test_questions")
    .select("id,position,question_text")
    .eq("mock_test_id", testId)
    .order("position", { ascending: true });

  if (oldQuestionError) {
    return json({ error: `Could not inspect existing questions: ${oldQuestionError.message}` }, 500);
  }

  const existing = oldQuestions ?? [];
  if (existing.length + requestedCount > MAX_QUESTIONS) {
    return json({
      error: `This test already has ${existing.length} questions. You can add at most ${MAX_QUESTIONS - existing.length} more.`,
    }, 400);
  }

  const fingerprints = existing.map((q) => questionFingerprint(q));
  const generated: any[] = [];
  const target = requestedCount;
  let safetyRounds = 0;

  try {
    while (generated.length < target && safetyRounds < 10) {
      safetyRounds++;
      const remaining = target - generated.length;
      const batchCount = Math.min(BATCH_SIZE, remaining);
      const rawQuestions = await groqGenerate(batchCount, settings, [...fingerprints, ...generated.map(questionFingerprint)]);

      for (const raw of rawQuestions) {
        if (generated.length >= target) break;
        const position = existing.length + generated.length + 1;
        const normalized = normalizeQuestion(raw, position, settings);
        if (!normalized) continue;

        const fp = questionFingerprint(normalized);
        if (!fp || fingerprints.includes(fp) || generated.some((q) => questionFingerprint(q) === fp)) {
          continue;
        }

        generated.push(normalized);
      }
    }

    if (generated.length !== target) {
      throw new Error(`AI generated ${generated.length} usable unique questions out of ${target} requested`);
    }

    const { error: insertError } = await adminClient
      .from("mock_test_questions")
      .insert(generated.map((q) => ({ ...q, mock_test_id: testId })));

    if (insertError) throw new Error(`Could not save generated questions: ${insertError.message}`);

    const totalQuestions = existing.length + generated.length;
    const { error: updateError } = await adminClient
      .from("mock_tests")
      .update({
        question_count: totalQuestions,
        status: "ai_generated",
        validation_status: "pending",
      })
      .eq("id", testId);

    if (updateError) throw new Error(`Questions saved but test status could not be updated: ${updateError.message}`);

    return json({
      success: true,
      mock_test_id: testId,
      generated_count: generated.length,
      total_question_count: totalQuestions,
      status: "ai_generated",
      message: "MCQs generated and stored. They are not published or officially approved yet.",
    });
  } catch (error) {
    // Keep the draft intact if generation fails. If this function created the
    // test itself, it remains a harmless draft that the admin can retry.
    await adminClient
      .from("mock_tests")
      .update({ validation_status: "pending" })
      .eq("id", testId);

    return json({
      error: error instanceof Error ? error.message : "MCQ generation failed",
      mock_test_id: testId,
      generated_count: generated.length,
    }, 500);
  }
}

Deno.serve(main);

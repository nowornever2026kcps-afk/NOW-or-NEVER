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
const GROQ_MODEL = Deno.env.get("GROQ_MCQ_MODEL") ?? "openai/gpt-oss-120b";

const MAX_QUESTIONS = 90;
// GPT-OSS-120B currently has an 8K TPM limit on the user's Groq tier.
// Small batches leave enough room for the syllabus/validator prompts.
const BATCH_SIZE = 5;
const MAX_GENERATION_ROUNDS = 24;
const MAX_GROQ_RETRIES = 4;
const GENERATION_MAX_COMPLETION_TOKENS = 2500;
const VALIDATION_MAX_COMPLETION_TOKENS = 1800;
const MAX_FINGERPRINTS_IN_PROMPT = 15;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
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

  if (!questionText || !optionA || !optionB || !optionC || !optionD || !correctAnswer) return null;

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
  return String(q.question_text).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function tokens(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").split(/\s+/).filter((x) => x.length >= 4);
}

function overlapsAny(text: string, phrases: string[]): boolean {
  const lower = text.toLowerCase();
  return phrases.some((p) => lower.includes(p.toLowerCase()));
}

function normalizedBoundaryText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‐‑‒–—−]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function chapterForbiddenConcepts(syllabus: any): string[] {
  const chapter = normalizedBoundaryText(String(syllabus.chapter ?? ""));

  if (chapter === "principles of inheritance and variation") {
    return [
      "xist", "xist rna", "robertsonian translocation", "fmr1", "fragile x",
      "trinucleotide repeat", "repeat expansion", "anticipation", "advanced cytogenetics",
      "array cgh", "comparative genomic hybridization", "genomic imprinting", "uniparental disomy",
      "mosaicism", "population genetics", "hardy-weinberg", "hardy weinberg", "allele frequency",
      "gene frequency", "genotype frequency", "genetic drift", "founder effect", "bottleneck effect",
      "natural selection coefficient", "selection coefficient", "linkage disequilibrium",
      "molecular mechanism of thalassemia", "molecular mechanism of haemophilia",
      "molecular mechanism of hemophilia", "molecular mechanism of colour blindness",
      "molecular mechanism of color blindness",
    ];
  }

  if (chapter === "molecular basis of inheritance") {
    return [
      "crispr", "crispr-cas", "epigenomics", "advanced epigenetics", "advanced chromatin",
      "transcriptomics", "single-cell sequencing", "rna-seq", "whole exome sequencing",
      "whole genome sequencing", "advanced genomics", "advanced molecular genetics",
      "clinical molecular genetics", "gene therapy", "next-generation sequencing",
    ];
  }

  return ["crispr", "epigenomics", "transcriptomics", "advanced cytogenetics"];
}

async function groqRequest(body: any) {
  let lastError = "Unknown Groq error";
  for (let attempt = 1; attempt <= MAX_GROQ_RETRIES; attempt++) {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (response.ok) return await response.json();

    const text = await response.text();
    lastError = `Groq request failed (${response.status}): ${text.slice(0, 1000)}`;
    if (![408, 409, 425, 429, 500, 502, 503, 504].includes(response.status) || attempt === MAX_GROQ_RETRIES) {
      throw new Error(lastError);
    }
    await new Promise((resolve) => setTimeout(resolve, Math.min(3000 * attempt, 10000)));
  }
  throw new Error(lastError);
}

async function groqGenerate(batchCount: number, settings: any, syllabus: any, existingFingerprints: string[]) {
  const systemPrompt = `You are an expert NEET-UG question setter.

HIGHEST PRIORITY RULE — EXACT SYLLABUS BOUNDARY:
You may ONLY test knowledge explicitly contained in the supplied official syllabus scope.
The supplied chapter scope is a closed set, not a suggestion.
Do not expand it into general biology, university biology, medical-school genetics, research genetics, or related concepts that are not explicitly present.
If a concept is uncertain, indirectly related, or normally taught at a higher level, DO NOT use it.
Every question, option, explanation, calculation, and assumption must be solvable using the supplied syllabus alone.
The exclusions are absolute.

STRICT CONTENT RULES:
- Do not use Hardy-Weinberg equilibrium, population-genetics calculations, allele-frequency calculations, or genetic-drift/founder-effect concepts unless they are explicitly present in the supplied scope.
- Do not use molecular mechanisms of a disorder when the syllabus only names the disorder.
- Do not introduce external clinical statistics, age-risk tables, research findings, or specialized medical facts merely to make a question harder.
- Do not use advanced cytogenetics, molecular genetics, genomics, epigenomics, transcriptomics, or gene-editing concepts unless explicitly present.
- A question is NOT compliant merely because its broad topic is related to the chapter.

QUALITY RULES:
- Factually correct and unambiguous.
- Exactly four distinct options A, B, C, D.
- Exactly one best answer.
- No all-of-the-above/none-of-the-above.
- No trick wording or double negatives.
- Avoid questions whose stem asks for a phenotype ratio while the options actually represent genotype/progeny classes; name the quantity being requested precisely.
- Avoid questions that depend on unstated assumptions.
- Numerical questions must provide every value and rule needed to solve them from the syllabus.
- Use NEET-appropriate terminology and difficulty.
- Avoid duplicate or near-duplicate questions.
- Explanations must justify the answer using only syllabus-level knowledge.
- Return ONLY JSON matching the supplied schema.`;

  const fingerprints = existingFingerprints.slice(-MAX_FINGERPRINTS_IN_PROMPT);
  const userPrompt = `Generate exactly ${batchCount} NEW MCQs.

Exam: ${settings.exam_type}
Exam year: ${syllabus.exam_year}
Subject: ${syllabus.subject}
Unit: ${syllabus.unit_name}
Chapter: ${syllabus.chapter}

OFFICIAL SYLLABUS SCOPE:
${syllabus.scope_text}

HARD EXCLUSIONS:
${syllabus.exclusions_text || "None supplied"}

ADDITIONAL SERVER-SIDE FORBIDDEN CONCEPTS FOR THIS CHAPTER:
${chapterForbiddenConcepts(syllabus).join(", ")}

REQUESTED TOPIC: ${settings.topic || "Any topic within the exact chapter scope"}
REQUESTED DIFFICULTY: ${settings.difficulty || "mixed"}
CLASS/LEVEL: ${settings.class_level || "NEET-UG"}

Previously generated question fingerprints. Do not repeat or paraphrase them:
${fingerprints.map((x, i) => `${i + 1}. ${x}`).join("\n") || "None"}`;

  const schema = {
    type: "object",
    properties: {
      questions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            question_text: { type: "string" },
            option_a: { type: "string" },
            option_b: { type: "string" },
            option_c: { type: "string" },
            option_d: { type: "string" },
            correct_answer: { type: "string", enum: ["A", "B", "C", "D"] },
            explanation: { type: "string" },
            difficulty: { type: "string" },
            subject: { type: "string" },
            chapter: { type: "string" },
            topic: { type: "string" },
            ai_confidence: { type: "number" },
          },
          required: ["question_text", "option_a", "option_b", "option_c", "option_d", "correct_answer", "explanation", "difficulty", "subject", "chapter", "topic", "ai_confidence"],
          additionalProperties: false,
        },
      },
    },
    required: ["questions"],
    additionalProperties: false,
  };

  const payload = await groqRequest({
    model: GROQ_MODEL,
    temperature: 0.15,
    max_completion_tokens: GENERATION_MAX_COMPLETION_TOKENS,
    reasoning_effort: "medium",
    response_format: {
      type: "json_schema",
      json_schema: { name: "neet_mcq_generation", strict: true, schema },
    },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const content = payload?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq returned no message content");
  const parsed = JSON.parse(content);
  if (!Array.isArray(parsed?.questions)) throw new Error("Groq JSON did not contain a questions array");
  return parsed.questions;
}

async function validateSyllabusBatch(questions: any[], syllabus: any) {
  if (!questions.length) return [];

  const schema = {
    type: "object",
    properties: {
      results: {
        type: "array",
        items: {
          type: "object",
          properties: {
            index: { type: "integer" },
            syllabus_compliant: { type: "boolean" },
            factual_quality: { type: "boolean" },
            ambiguity_free: { type: "boolean" },
            reason: { type: "string" },
          },
          required: ["index", "syllabus_compliant", "factual_quality", "ambiguity_free", "reason"],
          additionalProperties: false,
        },
      },
    },
    required: ["results"],
    additionalProperties: false,
  };

  const prompt = `You are performing a STRICT final gate for NEET-UG MCQs.

Approve ONLY if ALL are true:
1. Directly answerable from the official syllabus scope.
2. No hard exclusion or server-forbidden concept.
3. No external clinical statistics, research facts, university-level details, or unstated assumptions.
4. The stem asks for exactly the same kind of quantity represented by the options.
5. Exactly one defensible answer and the explanation supports it.
6. Any calculation uses only principles explicitly in scope.

Scientific correctness alone is NOT sufficient. When uncertain, reject.

SYLLABUS:
${syllabus.scope_text}

HARD EXCLUSIONS:
${syllabus.exclusions_text || "None"}

SERVER-FORBIDDEN CONCEPTS:
${chapterForbiddenConcepts(syllabus).join(", ")}

QUESTIONS:
${questions.map((q, i) => `QUESTION ${i + 1}: ${JSON.stringify(q)}`).join("\n\n")}`;

  const payload = await groqRequest({
    model: GROQ_MODEL,
    temperature: 0,
    max_completion_tokens: VALIDATION_MAX_COMPLETION_TOKENS,
    reasoning_effort: "medium",
    response_format: {
      type: "json_schema",
      json_schema: { name: "neet_mcq_validation", strict: true, schema },
    },
    messages: [
      { role: "system", content: "You are a strict NEET-UG syllabus, factual, and ambiguity validator. Reject borderline questions rather than approving them." },
      { role: "user", content: prompt },
    ],
  });

  return payload?.choices?.[0]?.message?.content
    ? JSON.parse(payload.choices[0].message.content)?.results ?? []
    : [];
}

function deterministicBoundaryCheck(q: any, syllabus: any): boolean {
  const text = normalizedBoundaryText(`${q.question_text} ${q.option_a} ${q.option_b} ${q.option_c} ${q.option_d} ${q.explanation} ${q.topic}`);
  const exclusions = normalizedBoundaryText(String(syllabus.exclusions_text || ""));
  const hardBlocked = chapterForbiddenConcepts(syllabus);

  if (overlapsAny(text, hardBlocked)) return false;

  const globalBlocked = [
    "xist", "robertsonian translocation", "fmr1", "trinucleotide repeat",
    "crispr", "epigenomics", "transcriptomics", "advanced cytogenetics",
  ];
  if (overlapsAny(text, globalBlocked)) return false;

  for (const phrase of globalBlocked) {
    if (exclusions.includes(phrase) && text.includes(phrase)) return false;
  }

  const scopeTokens = new Set(tokens(syllabus.scope_text));
  const textTokens = tokens(text);
  const overlap = textTokens.filter((t) => scopeTokens.has(t)).length;
  return overlap >= Math.min(3, Math.max(1, Math.floor(textTokens.length * 0.08)));
}

async function main(req: Request) {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: "Supabase environment variables are not configured" }, 500);
  }
  if (!GROQ_API_KEY) return json({ error: "GROQ_RESEARCH_KEY is not configured" }, 500);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Missing authorization header" }, 401);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON request body" }, 400); }

  const requestedCount = Number(body?.question_count ?? 0);
  if (!Number.isInteger(requestedCount) || requestedCount < 1 || requestedCount > MAX_QUESTIONS) {
    return json({ error: `question_count must be an integer from 1 to ${MAX_QUESTIONS}` }, 400);
  }

  const examYear = Number(body?.exam_year ?? 2026);
  const settings = {
    exam_type: String(body?.exam_type ?? "NEET").trim(),
    subject: String(body?.subject ?? "").trim(),
    chapter: String(body?.chapter ?? "").trim(),
    topic: String(body?.topic ?? "").trim(),
    difficulty: String(body?.difficulty ?? "mixed").trim(),
    class_level: String(body?.class_level ?? "NEET-UG").trim(),
  };

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData?.user) return json({ error: "Invalid or expired authentication token" }, 401);

  const { data: adminData, error: adminError } = await userClient.rpc("is_admin");
  if (adminError || adminData !== true) return json({ error: "Admin access required" }, 403);

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
    if (test.status !== "draft") return json({ error: "Questions can only be generated for a draft mock test" }, 409);
    if (test.created_by && test.created_by !== userData.user.id) return json({ error: "You are not the creator of this draft mock test" }, 403);

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

    if (error || !inserted) return json({ error: `Could not create mock test: ${error?.message ?? "unknown error"}` }, 500);
    testId = inserted.id;
  }

  if (settings.exam_type.toUpperCase() === "NEET") {
    const { data: syllabusRows, error: syllabusError } = await adminClient
      .from("neet_syllabus")
      .select("id,exam_year,subject,unit_code,unit_name,chapter,scope_text,exclusions_text,source_name,source_url")
      .eq("exam_year", examYear)
      .eq("active", true)
      .ilike("subject", settings.subject || "%")
      .ilike("chapter", settings.chapter || "%")
      .order("unit_code");

    if (syllabusError) return json({ error: `Could not load NEET syllabus boundary: ${syllabusError.message}`, mock_test_id: testId }, 500);
    if (!syllabusRows?.length) {
      return json({
        error: "No official syllabus scope is configured for this NEET subject/chapter. Generation was blocked to prevent out-of-syllabus questions.",
        exam_year: examYear,
        subject: settings.subject,
        chapter: settings.chapter,
        mock_test_id: testId,
      }, 422);
    }
    if (syllabusRows.length > 1 && !settings.chapter) {
      return json({ error: "A specific NEET chapter is required when more than one syllabus scope matches.", mock_test_id: testId }, 422);
    }

    const syllabus = syllabusRows[0];

    await adminClient.from("mock_test_syllabus_scope").upsert({
      mock_test_id: testId,
      syllabus_id: syllabus.id,
      exam_year: syllabus.exam_year,
      subject: syllabus.subject,
      chapter: syllabus.chapter,
      scope_snapshot: syllabus.scope_text,
      exclusions_snapshot: syllabus.exclusions_text,
    }, { onConflict: "mock_test_id,syllabus_id" });

    const { data: oldQuestions, error: oldQuestionError } = await adminClient
      .from("mock_test_questions")
      .select("id,position,question_text,topic")
      .eq("mock_test_id", testId)
      .order("position", { ascending: true });

    if (oldQuestionError) return json({ error: `Could not inspect existing questions: ${oldQuestionError.message}` }, 500);

    const existing = oldQuestions ?? [];
    if (existing.length + requestedCount > MAX_QUESTIONS) {
      return json({ error: `This test already has ${existing.length} questions. You can add at most ${MAX_QUESTIONS - existing.length} more.` }, 400);
    }

    const fingerprints = existing.map((q) => questionFingerprint(q));
    const generated: any[] = [];
    let safetyRounds = 0;
    let rejectedByValidator = 0;
    let rejectedByBoundary = 0;

    try {
      while (generated.length < requestedCount && safetyRounds < MAX_GENERATION_ROUNDS) {
        safetyRounds++;
        const remaining = requestedCount - generated.length;
        const batchCount = Math.min(BATCH_SIZE, remaining);
        const rawQuestions = await groqGenerate(batchCount, settings, syllabus, [...fingerprints, ...generated.map(questionFingerprint)]);
        const candidates: any[] = [];

        for (const raw of rawQuestions) {
          const position = existing.length + generated.length + candidates.length + 1;
          const normalized = normalizeQuestion(raw, position, settings);
          if (!normalized) continue;
          if (!deterministicBoundaryCheck(normalized, syllabus)) {
            rejectedByBoundary++;
            continue;
          }
          const fp = questionFingerprint(normalized);
          if (!fp || fingerprints.includes(fp) || generated.some((q) => questionFingerprint(q) === fp) || candidates.some((q) => questionFingerprint(q) === fp)) continue;
          candidates.push(normalized);
        }

        const validationResults = await validateSyllabusBatch(candidates, syllabus);
        for (let i = 0; i < candidates.length; i++) {
          const result = validationResults.find((x: any) => Number(x.index) === i + 1);
          if (!result || !result.syllabus_compliant || !result.factual_quality || !result.ambiguity_free) {
            rejectedByValidator++;
            continue;
          }
          if (generated.length >= requestedCount) break;
          candidates[i].position = existing.length + generated.length + 1;
          candidates[i].validation_status = "pending";
          generated.push(candidates[i]);
        }
      }

      if (generated.length !== requestedCount) {
        throw new Error(`Could only produce ${generated.length} syllabus-compliant questions out of ${requestedCount} requested. Rejected by boundary check: ${rejectedByBoundary}; rejected by AI validator: ${rejectedByValidator}. Try again or choose a broader configured chapter.`);
      }

      const { error: insertError } = await adminClient
        .from("mock_test_questions")
        .insert(generated.map((q) => ({ ...q, mock_test_id: testId })));
      if (insertError) throw new Error(`Could not save generated questions: ${insertError.message}`);

      const totalQuestions = existing.length + generated.length;
      const { error: updateError } = await adminClient
        .from("mock_tests")
        .update({ question_count: totalQuestions, status: "ai_generated", validation_status: "pending" })
        .eq("id", testId);
      if (updateError) throw new Error(`Questions saved but test status could not be updated: ${updateError.message}`);

      return json({
        success: true,
        mock_test_id: testId,
        generated_count: generated.length,
        total_question_count: totalQuestions,
        syllabus_checked: true,
        syllabus_year: syllabus.exam_year,
        syllabus_chapter: syllabus.chapter,
        rejected_by_boundary: rejectedByBoundary,
        rejected_by_validator: rejectedByValidator,
        generation_rounds: safetyRounds,
        groq_batch_size: BATCH_SIZE,
        groq_generation_token_budget: GENERATION_MAX_COMPLETION_TOKENS,
        groq_validation_token_budget: VALIDATION_MAX_COMPLETION_TOKENS,
        status: "ai_generated",
        message: "MCQs generated in small Groq batches, strict syllabus-boundary checked, AI-validated, and stored. They are not published or officially approved yet.",
      });
    } catch (error) {
      await adminClient.from("mock_tests").update({ validation_status: "pending" }).eq("id", testId);
      return json({ error: error instanceof Error ? error.message : "MCQ generation failed", mock_test_id: testId, generated_count: generated.length }, 500);
    }
  }

  return json({ error: "Only NEET syllabus-aware generation is enabled in this version." }, 422);
}

Deno.serve(main);

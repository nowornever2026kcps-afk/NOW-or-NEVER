/* =========================================================
   NOW-or-NEVER — EXAM PRACTICE ENGINE
   ---------------------------------------------------------
   Generates topic-specific NEET-style MCQs using Groq,
   then independently verifies every answer before returning
   the question to the student.

   Flow:
   Browser → Auth → Generator → Verifier → Student

   No database writes.
   ========================================================= */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-20b";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function cleanJsonText(value: string) {
  return String(value || "")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function validQuestion(question: any) {
  if (!question || typeof question !== "object") return false;
  if (typeof question.question !== "string" || !question.question.trim()) return false;
  if (!Array.isArray(question.options) || question.options.length !== 4) return false;
  if (!question.options.every((o: any) => typeof o === "string" && o.trim())) return false;
  if (!/^[ABCD]$/.test(String(question.answer || "").trim().toUpperCase())) return false;
  if (typeof question.explanation !== "string" || !question.explanation.trim()) return false;
  return true;
}

async function callGroq(
  groqKey: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 3500,
) {
  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${groqKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.15,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  const text = await response.text();

  if (!response.ok) {
    console.error("Groq HTTP error:", response.status, text);
    throw new Error(`Groq HTTP ${response.status}`);
  }

  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Groq returned invalid response JSON.");
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq returned no content.");

  return content;
}

async function generateQuestions(
  groqKey: string,
  examType: string,
  examYear: number,
  subject: string,
  chapter: string,
  topic: string,
  topicId: number | null,
  count: number,
) {
  const systemPrompt = `You are NOW-or-NEVER's NEET Practice Question Generator.

Generate high-quality ${examType} ${examYear} MCQs for Indian medical entrance preparation.
Questions must stay strictly within the supplied subject, chapter and topic.

Rules:
- Generate exactly ${count} questions.
- Four options only: A, B, C, D.
- Exactly one correct answer.
- NEET-appropriate difficulty.
- Test concepts, application, important facts and common traps.
- Avoid ambiguous wording, duplicate questions and meaningless trivia.
- Distractors must be plausible.
- The explanation must justify the correct answer.
- Do not invent facts.
- Do not use markdown fences.
- Return ONLY valid JSON.

JSON shape:
{
  "questions": [
    {
      "question": "...",
      "options": ["...", "...", "...", "..."],
      "answer": "A",
      "explanation": "..."
    }
  ]
}`;

  const userPrompt = `Generate ${count} NEET-level MCQs.

Exam: ${examType} ${examYear}
Subject: ${subject}
Chapter: ${chapter}
Topic: ${topic}
Topic ID: ${topicId ?? "unknown"}

Important: determine the scientifically correct answer before writing the answer field.`;

  const raw = await callGroq(groqKey, systemPrompt, userPrompt, 3500);

  let parsed: any;
  try {
    parsed = JSON.parse(cleanJsonText(raw));
  } catch (error) {
    console.error("Generator JSON parse error:", error, raw);
    throw new Error("Generator returned invalid question JSON.");
  }

  const questions = Array.isArray(parsed?.questions)
    ? parsed.questions.filter(validQuestion)
    : [];

  if (questions.length < count) {
    throw new Error(`Generator returned only ${questions.length} valid questions.`);
  }

  return questions.slice(0, count).map((q: any) => ({
    question: q.question.trim(),
    options: q.options.map((o: string) => o.trim()),
    answer: String(q.answer).trim().toUpperCase(),
    explanation: q.explanation.trim(),
  }));
}

async function verifyQuestions(
  groqKey: string,
  examType: string,
  examYear: number,
  subject: string,
  chapter: string,
  topic: string,
  questions: any[],
) {
  const verifierPrompt = `You are NOW-or-NEVER's independent NEET answer verifier.

You are NOT the question generator. Independently solve every MCQ using established scientific and textbook knowledge.

For each question:
1. Determine the objectively correct option yourself.
2. Compare it with the supplied answer.
3. Reject the question if the supplied answer is wrong.
4. Reject the question if more than one option could reasonably be correct.
5. Reject the question if the wording is ambiguous.
6. Reject the question if it depends on a false or questionable premise.
7. Accept only questions whose answer is clearly correct.

Context:
Exam: ${examType} ${examYear}
Subject: ${subject}
Chapter: ${chapter}
Topic: ${topic}

Return ONLY valid JSON in this exact shape:
{
  "results": [
    {
      "index": 0,
      "verified_answer": "A",
      "valid": true,
      "reason": "Short factual justification"
    }
  ]
}

Do not assume the supplied answer is correct. Solve the question yourself.`;

  const verifierInput = JSON.stringify(
    questions.map((q, index) => ({
      index,
      question: q.question,
      options: q.options,
      supplied_answer: q.answer,
      explanation: q.explanation,
    })),
  );

  const raw = await callGroq(
    groqKey,
    verifierPrompt,
    verifierInput,
    2500,
  );

  let parsed: any;
  try {
    parsed = JSON.parse(cleanJsonText(raw));
  } catch (error) {
    console.error("Verifier JSON parse error:", error, raw);
    throw new Error("Verifier returned invalid JSON.");
  }

  const results = Array.isArray(parsed?.results)
    ? parsed.results
    : [];

  if (results.length !== questions.length) {
    throw new Error("Verifier did not verify every question.");
  }

  return results.map((result: any, index: number) => {
    const verifiedAnswer = String(result?.verified_answer || "")
      .trim()
      .toUpperCase();

    const suppliedAnswer = questions[index].answer;

    const valid =
      result?.valid === true &&
      /^[ABCD]$/.test(verifiedAnswer) &&
      verifiedAnswer === suppliedAnswer;

    return {
      valid,
      verifiedAnswer,
      reason: String(result?.reason || "").trim(),
    };
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ success: false, error: "Method not allowed." }, 405);
  }

  try {
    console.log("=================================================");
    console.log("📝 EXAM PRACTICE REQUEST", new Date().toISOString());

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const groqKey = Deno.env.get("GROQ_API_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing Supabase configuration.");
      return json({ success: false, error: "Supabase configuration is missing." }, 500);
    }

    if (!groqKey) {
      console.error("Missing GROQ_API_KEY.");
      return json({ success: false, error: "GROQ_API_KEY is not configured." }, 500);
    }

    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return json({ success: false, error: "You must be logged in to use Practice." }, 401);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      console.error("Authentication error:", userError);
      return json({ success: false, error: "Your session is invalid or expired." }, 401);
    }

    const body = await req.json().catch(() => null);
    const context = body?.context || {};

    const examType = String(context.exam_type || "NEET").trim().toUpperCase();
    const examYear = Number(context.exam_year || new Date().getFullYear() + 1);
    const subject = String(context.subject || "").trim();
    const chapter = String(context.chapter || "").trim();
    const topic = String(context.topic || "").trim();
    const topicId = Number(context.topic_id) || null;
    const count = Math.min(Math.max(Number(context.count) || 5, 1), 10);

    console.log("Practice context:", {
      examType,
      examYear,
      subject,
      chapter,
      topic,
      topicId,
      count,
      user: userData.user.id,
    });

    if (!subject || !chapter || !topic) {
      return json({
        success: false,
        error: "Subject, chapter and topic are required.",
      }, 400);
    }

    /* =====================================================
       GENERATION + VERIFICATION
       Retry once if verification rejects questions.
       ===================================================== */

    const MAX_ATTEMPTS = 2;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      console.log(`🤖 Generation attempt ${attempt}/${MAX_ATTEMPTS}`);

      const questions = await generateQuestions(
        groqKey,
        examType,
        examYear,
        subject,
        chapter,
        topic,
        topicId,
        count,
      );

      console.log(`Generated ${questions.length} questions.`);

      try {
        console.log("🔎 Independently verifying answers...");

        const verification = await verifyQuestions(
          groqKey,
          examType,
          examYear,
          subject,
          chapter,
          topic,
          questions,
        );

        const verifiedQuestions = questions.filter(
          (_question, index) => verification[index]?.valid === true,
        );

        console.log(
          `Verification result: ${verifiedQuestions.length}/${questions.length} accepted.`,
        );

        if (verifiedQuestions.length >= count) {
          console.log("✅ All questions independently verified.");

          return json({
            success: true,
            questions: verifiedQuestions.slice(0, count),
            context: {
              exam_type: examType,
              exam_year: examYear,
              subject,
              chapter,
              topic,
              topic_id: topicId,
            },
          });
        }

        console.warn(
          `⚠️ Only ${verifiedQuestions.length}/${count} questions passed verification.`,
        );
      } catch (verificationError) {
        console.error(
          "Verification failed:",
          verificationError,
        );

        if (attempt === MAX_ATTEMPTS) {
          throw verificationError;
        }
      }
    }

    return json({
      success: false,
      error: "Practice AI could not produce enough independently verified questions. Please try again.",
    }, 502);
  } catch (error) {
    console.error("🔥 EXAM PRACTICE ERROR:", error);

    return json({
      success: false,
      error: "Practice could not be started. Please try again.",
    }, 500);
  }
});

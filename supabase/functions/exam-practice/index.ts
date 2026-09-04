/* =========================================================
   NOW-or-NEVER — EXAM PRACTICE ENGINE
   ---------------------------------------------------------
   Generates topic-specific NEET-style MCQs using Groq.
   No answer is accepted from the browser; the correct option
   is returned only to the authenticated student session.
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
  let text = String(value || "").trim();
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  return text;
}

function validQuestion(question: any) {
  if (!question || typeof question !== "object") return false;
  if (typeof question.question !== "string" || !question.question.trim()) return false;
  if (!Array.isArray(question.options) || question.options.length !== 4) return false;
  if (!question.options.every((option: any) => typeof option === "string" && option.trim())) return false;
  if (!/^[ABCD]$/.test(String(question.answer || "").toUpperCase())) return false;
  if (typeof question.explanation !== "string" || !question.explanation.trim()) return false;
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "Method not allowed." }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const groqKey = Deno.env.get("GROQ_API_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      return json({ success: false, error: "Supabase configuration is missing." }, 500);
    }
    if (!groqKey) {
      return json({ success: false, error: "GROQ_API_KEY is not configured." }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ success: false, error: "You must be logged in to use Practice." }, 401);

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
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

    if (!subject || !chapter || !topic) {
      return json({ success: false, error: "Subject, chapter and topic are required." }, 400);
    }

    const systemPrompt = `You are NOW-or-NEVER's NEET Practice Question Generator.

Create high-quality ${examType} ${examYear} practice MCQs for Indian medical entrance preparation.
The questions must be strictly relevant to the supplied subject, chapter and topic.

Rules:
- Generate exactly ${count} MCQs.
- Four options only: A, B, C, D.
- Exactly one correct answer per question.
- Questions should test understanding, application, common traps, or important facts rather than meaningless trivia.
- Use NEET-appropriate difficulty. Avoid JEE Advanced mathematics or olympiad-style complexity.
- Do not ask about material outside the supplied topic unless a small prerequisite is genuinely required.
- Avoid ambiguous wording and duplicate questions.
- Make distractors plausible and scientifically meaningful.
- The explanation must briefly explain why the correct option is right and, when useful, identify the common trap.
- Never include markdown fences around the JSON.
- Return ONLY valid JSON.

Required JSON shape:
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

Exam: ${examType}
Exam year: ${examYear}
Subject: ${subject}
Chapter: ${chapter}
Topic: ${topic}
Topic ID: ${topicId ?? "unknown"}`;

    const groqResponse = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.35,
        max_tokens: 2600,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!groqResponse.ok) {
      const detail = await groqResponse.text();
      console.error("Groq practice error:", groqResponse.status, detail);
      return json({ success: false, error: "Practice AI could not generate questions right now." }, 502);
    }

    const groqData = await groqResponse.json();
    const raw = groqData?.choices?.[0]?.message?.content;
    if (!raw) return json({ success: false, error: "Practice AI returned no questions." }, 502);

    let parsed: any;
    try {
      parsed = JSON.parse(cleanJsonText(raw));
    } catch (error) {
      console.error("Practice JSON parse error:", error, raw);
      return json({ success: false, error: "Practice AI returned invalid question data. Please try again." }, 502);
    }

    const questions = Array.isArray(parsed?.questions) ? parsed.questions.filter(validQuestion) : [];
    if (questions.length < count) {
      return json({ success: false, error: "Practice AI did not generate enough valid questions. Please try again." }, 502);
    }

    return json({
      success: true,
      questions: questions.slice(0, count).map((q: any) => ({
        question: q.question.trim(),
        options: q.options.map((option: string) => option.trim()),
        answer: String(q.answer).toUpperCase(),
        explanation: q.explanation.trim(),
      })),
      context: {
        exam_type: examType,
        exam_year: examYear,
        subject,
        chapter,
        topic,
        topic_id: topicId,
      },
    });
  } catch (error) {
    console.error("Exam Practice error:", error);
    return json({ success: false, error: error?.message || "Practice could not be started." }, 500);
  }
});

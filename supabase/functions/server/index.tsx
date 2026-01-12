import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Create Supabase clients
const getSupabaseAdmin = () => createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

const getSupabaseClient = () => createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
);

// Initialize storage bucket on startup
(async () => {
  const bucketName = 'make-812a95c3-notes';
  const supabase = getSupabaseAdmin();
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
  if (!bucketExists) {
    await supabase.storage.createBucket(bucketName, {
      public: false,
      fileSizeLimit: 10485760, // 10MB
    });
  }
})();

// Health check endpoint - returns detailed system status
app.get("/make-server-812a95c3/health", async (c) => {
  const startTime = Date.now();

  try {
    const supabase = getSupabaseAdmin();

    // Check database connectivity
    let databaseStatus = "connected";
    try {
      const { error } = await supabase.from("kv_store_812a95c3").select("key").limit(1);
      if (error) databaseStatus = "degraded";
    } catch {
      databaseStatus = "error";
    }

    // Check storage availability
    let storageStatus = "reachable";
    try {
      const { error } = await supabase.storage.listBuckets();
      if (error) storageStatus = "degraded";
    } catch {
      storageStatus = "error";
    }

    // AI service status (placeholder - would test OpenAI API in production)
    const aiStatus = Deno.env.get("OPENAI_API_KEY") ? "reachable" : "not_configured";

    const responseTime = Date.now() - startTime;

    const overallStatus =
      databaseStatus === "error" || storageStatus === "error" ? "unhealthy" :
        databaseStatus === "degraded" || storageStatus === "degraded" ? "degraded" : "ok";

    return c.json({
      status: overallStatus,
      database: databaseStatus,
      storage: storageStatus,
      ai: aiStatus,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    }, overallStatus === "ok" ? 200 : overallStatus === "degraded" ? 200 : 503);

  } catch (err) {
    console.error("Health check error:", err);
    return c.json({
      status: "unhealthy",
      database: "error",
      storage: "error",
      ai: "unknown",
      error: err instanceof Error ? err.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, 503);
  }
});

// ===== AUTH ROUTES =====

// Sign up
app.post("/make-server-812a95c3/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name: name || '' },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    // Create user profile in KV store
    const userProfile = {
      id: data.user.id,
      email: data.user.email,
      name: name || '',
      class: null,
      exam_type: null,
      created_at: new Date().toISOString(),
    };

    await kv.set(`user:${data.user.id}`, userProfile);

    return c.json({ user: userProfile });
  } catch (err) {
    console.log('Signup error:', err);
    return c.json({ error: 'Failed to sign up user' }, 500);
  }
});

// Sign in
app.post("/make-server-812a95c3/signin", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log('Signin error:', error);
      return c.json({ error: error.message }, 400);
    }

    // Fetch user profile
    const userProfile = await kv.get(`user:${data.user.id}`);

    return c.json({
      session: data.session,
      user: userProfile || { id: data.user.id, email: data.user.email }
    });
  } catch (err) {
    console.log('Signin error:', err);
    return c.json({ error: 'Failed to sign in' }, 500);
  }
});

// Get session
app.get("/make-server-812a95c3/session", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ session: null, user: null });
    }

    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ session: null, user: null });
    }

    const userProfile = await kv.get(`user:${user.id}`);

    return c.json({
      session: { access_token: accessToken },
      user: userProfile || { id: user.id, email: user.email }
    });
  } catch (err) {
    console.log('Session error:', err);
    return c.json({ session: null, user: null });
  }
});

// Update user profile
app.put("/make-server-812a95c3/profile", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { class: userClass, exam_type, name } = body;

    const userProfile = await kv.get(`user:${user.id}`) || { id: user.id, email: user.email };
    const updatedProfile = {
      ...userProfile,
      class: userClass !== undefined ? userClass : userProfile.class,
      exam_type: exam_type !== undefined ? exam_type : userProfile.exam_type,
      name: name !== undefined ? name : userProfile.name,
      updated_at: new Date().toISOString(),
    };

    await kv.set(`user:${user.id}`, updatedProfile);

    return c.json({ user: updatedProfile });
  } catch (err) {
    console.log('Profile update error:', err);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

// ===== NOTES ROUTES =====

// Upload note
app.post("/make-server-812a95c3/notes/upload", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = getSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const subject = formData.get('subject') as string;
    const topic = formData.get('topic') as string;

    if (!file || !subject || !topic) {
      return c.json({ error: 'File, subject, and topic are required' }, 400);
    }

    // Upload file to Supabase Storage
    const fileName = `${user.id}/${Date.now()}_${file.name}`;
    const fileBuffer = await file.arrayBuffer();

    const supabaseAdmin = getSupabaseAdmin();
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('make-812a95c3-notes')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.log('File upload error:', uploadError);
      return c.json({ error: 'Failed to upload file' }, 500);
    }

    // Create signed URL (valid for 1 year)
    const { data: signedUrlData } = await supabaseAdmin.storage
      .from('make-812a95c3-notes')
      .createSignedUrl(fileName, 31536000);

    const noteId = `note:${user.id}:${Date.now()}`;
    const note = {
      id: noteId,
      user_id: user.id,
      subject,
      topic,
      file_url: signedUrlData?.signedUrl || '',
      file_name: file.name,
      created_at: new Date().toISOString(),
    };

    await kv.set(noteId, note);
    await kv.set(`topic:${user.id}:${subject}:${topic}`, { topic, subject, created_at: note.created_at });

    return c.json({ note });
  } catch (err) {
    console.log('Upload note error:', err);
    return c.json({ error: 'Failed to upload note' }, 500);
  }
});

// Get all notes for user
app.get("/make-server-812a95c3/notes", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const notes = await kv.getByPrefix(`note:${user.id}`);
    return c.json({ notes });
  } catch (err) {
    console.log('Get notes error:', err);
    return c.json({ error: 'Failed to fetch notes' }, 500);
  }
});

// ===== TOPICS ROUTES =====

// Get topics for user
app.get("/make-server-812a95c3/topics", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const topics = await kv.getByPrefix(`topic:${user.id}`);
    return c.json({ topics });
  } catch (err) {
    console.log('Get topics error:', err);
    return c.json({ error: 'Failed to fetch topics' }, 500);
  }
});

// ===== DIAGNOSTIC ROUTES =====

// Generate diagnostic test
app.post("/make-server-812a95c3/diagnostic/generate", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { topic, subject } = body;

    // Generate 8 MCQs for diagnostic test
    const questions = Array.from({ length: 8 }, (_, i) => ({
      id: `q${i + 1}`,
      question: `Sample question ${i + 1} for ${topic}`,
      options: [
        `Option A for question ${i + 1}`,
        `Option B for question ${i + 1}`,
        `Option C for question ${i + 1}`,
        `Option D for question ${i + 1}`,
      ],
      correctAnswer: Math.floor(Math.random() * 4),
    }));

    const diagnosticId = `diagnostic:${user.id}:${Date.now()}`;
    const diagnostic = {
      id: diagnosticId,
      user_id: user.id,
      topic,
      subject,
      questions,
      created_at: new Date().toISOString(),
      completed: false,
    };

    await kv.set(diagnosticId, diagnostic);

    return c.json({ diagnostic });
  } catch (err) {
    console.log('Generate diagnostic error:', err);
    return c.json({ error: 'Failed to generate diagnostic test' }, 500);
  }
});

// Submit diagnostic test
app.post("/make-server-812a95c3/diagnostic/submit", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { diagnosticId, answers, timeTaken, confidence } = body;

    const diagnostic = await kv.get(diagnosticId);
    if (!diagnostic || diagnostic.user_id !== user.id) {
      return c.json({ error: 'Diagnostic not found' }, 404);
    }

    // Calculate score
    let correct = 0;
    diagnostic.questions.forEach((q: any, index: number) => {
      if (answers[index] === q.correctAnswer) {
        correct++;
      }
    });

    const score = (correct / diagnostic.questions.length) * 100;
    const avgTime = timeTaken / diagnostic.questions.length;

    const result = {
      diagnosticId,
      score,
      correct,
      total: diagnostic.questions.length,
      avgTime,
      confidence,
      topic: diagnostic.topic,
      subject: diagnostic.subject,
      completed_at: new Date().toISOString(),
    };

    // Update diagnostic as completed
    await kv.set(diagnosticId, { ...diagnostic, completed: true, result });

    // Save result
    const resultId = `result:${user.id}:${Date.now()}`;
    await kv.set(resultId, result);

    // Determine weak concepts (score < 70% or low confidence)
    if (score < 70 || confidence < 3) {
      const weakConceptId = `weak:${user.id}:${diagnostic.topic}`;
      await kv.set(weakConceptId, {
        user_id: user.id,
        topic: diagnostic.topic,
        subject: diagnostic.subject,
        score,
        confidence,
        created_at: new Date().toISOString(),
      });
    }

    // Schedule revisions (Day 1, Day 3, Day 7)
    const now = new Date();
    const revisionDays = [1, 3, 7];

    for (const day of revisionDays) {
      const scheduledDate = new Date(now);
      scheduledDate.setDate(scheduledDate.getDate() + day);

      const revisionId = `revision:${user.id}:${diagnostic.topic}:day${day}`;
      await kv.set(revisionId, {
        user_id: user.id,
        topic: diagnostic.topic,
        subject: diagnostic.subject,
        revision_day: day,
        scheduled_date: scheduledDate.toISOString(),
        completed: false,
      });
    }

    return c.json({ result });
  } catch (err) {
    console.log('Submit diagnostic error:', err);
    return c.json({ error: 'Failed to submit diagnostic' }, 500);
  }
});

// ===== REVISION ROUTES =====

// Get revisions for user
app.get("/make-server-812a95c3/revisions", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const allRevisions = await kv.getByPrefix(`revision:${user.id}`);

    // Filter for today's revisions
    const today = new Date().toISOString().split('T')[0];
    const todaysRevisions = allRevisions.filter((r: any) => {
      return r.scheduled_date.split('T')[0] <= today && !r.completed;
    });

    return c.json({ revisions: todaysRevisions });
  } catch (err) {
    console.log('Get revisions error:', err);
    return c.json({ error: 'Failed to fetch revisions' }, 500);
  }
});

// Complete revision
app.post("/make-server-812a95c3/revisions/complete", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { revisionId, recallScore } = body;

    const revision = await kv.get(revisionId);
    if (!revision || revision.user_id !== user.id) {
      return c.json({ error: 'Revision not found' }, 404);
    }

    const updated = {
      ...revision,
      completed: true,
      recall_score: recallScore,
      completed_at: new Date().toISOString(),
    };

    await kv.set(revisionId, updated);

    // Update progress
    const progressId = `progress:${user.id}:${revision.topic}`;
    const existingProgress = await kv.get(progressId) || {};

    const progress = {
      ...existingProgress,
      user_id: user.id,
      topic: revision.topic,
      subject: revision.subject,
      [`day${revision.revision_day}_score`]: recallScore,
      mastery_level: calculateMasteryLevel(existingProgress, revision.revision_day, recallScore),
      updated_at: new Date().toISOString(),
    };

    await kv.set(progressId, progress);

    return c.json({ revision: updated, progress });
  } catch (err) {
    console.log('Complete revision error:', err);
    return c.json({ error: 'Failed to complete revision' }, 500);
  }
});

// ===== PROGRESS ROUTES =====

// Get progress for user
app.get("/make-server-812a95c3/progress", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const progress = await kv.getByPrefix(`progress:${user.id}`);
    return c.json({ progress });
  } catch (err) {
    console.log('Get progress error:', err);
    return c.json({ error: 'Failed to fetch progress' }, 500);
  }
});

// Get weak concepts
app.get("/make-server-812a95c3/weak-concepts", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const weakConcepts = await kv.getByPrefix(`weak:${user.id}`);
    return c.json({ weakConcepts });
  } catch (err) {
    console.log('Get weak concepts error:', err);
    return c.json({ error: 'Failed to fetch weak concepts' }, 500);
  }
});

// Get dashboard stats
app.get("/make-server-812a95c3/dashboard", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const [weakConcepts, revisions, progress] = await Promise.all([
      kv.getByPrefix(`weak:${user.id}`),
      kv.getByPrefix(`revision:${user.id}`),
      kv.getByPrefix(`progress:${user.id}`),
    ]);

    // Calculate streak (simplified - check last 7 days of revisions)
    const completedRevisions = revisions.filter((r: any) => r.completed);
    const streak = Math.min(completedRevisions.length, 7);

    const today = new Date().toISOString().split('T')[0];
    const todaysRevisions = revisions.filter((r: any) =>
      r.scheduled_date.split('T')[0] <= today && !r.completed
    );

    return c.json({
      weakConceptsCount: weakConcepts.length,
      upcomingRevisionsCount: todaysRevisions.length,
      masteryProgress: progress.length,
      streak,
    });
  } catch (err) {
    console.log('Get dashboard error:', err);
    return c.json({ error: 'Failed to fetch dashboard' }, 500);
  }
});

// Helper function to calculate mastery level
function calculateMasteryLevel(progress: any, day: number, score: number) {
  const day1 = progress.day1_score || 0;
  const day3 = progress.day3_score || 0;
  const day7 = progress.day7_score || 0;

  if (day === 7 && day7 >= 80) return 'mastered';
  if (day >= 3 && day3 >= 70 && day1 >= 60) return 'improving';
  if (day === 1 && day1 >= 60) return 'learning';
  return 'weak';
}

Deno.serve(app.fetch);

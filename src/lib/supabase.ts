import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { USE_MOCK } from './config';
import {
  DEMO_PROGRESS,
  getDemoQuestions,
  getDemoWeakConcepts,
  getDemoCorrection
} from './demo-data';
import { generateQuestionsFromText, analyzeQuizResults } from './gemini';
import { extractTextFromPDF } from './pdf-utils';

// Create Supabase client for direct database access
export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

// Edge Function server URL (for advanced operations)
const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-812a95c3`;

// Check if Edge Function is available
let edgeFunctionAvailable = false;
(async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${serverUrl}/health`, { signal: controller.signal });
    clearTimeout(timeoutId);
    edgeFunctionAvailable = res.ok;
    console.log(`🔌 Edge Function: ${edgeFunctionAvailable ? 'Available' : 'Not deployed'}`);
  } catch {
    console.log('🔌 Edge Function: Not available (using direct Supabase)');
  }
})();

// Mock data helpers (only used when USE_MOCK = true)
const getMockData = (key: string) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};

const setMockData = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Kiro Bridge Helper
const updateTaskStatus = (taskId: string, status: 'todo' | 'in-progress' | 'review' | 'done') => {
  try {
    const projects = getMockData('kiro_planning_projects') || [];
    if (projects.length > 0) {
      const project = projects[0];
      const taskIndex = project.tasks.findIndex((t: any) => t.id === taskId);
      if (taskIndex !== -1) {
        project.tasks[taskIndex].status = status;
        if (status === 'done') project.tasks[taskIndex].progress = 100;
        setMockData('kiro_planning_projects', projects);
      }
    }
  } catch (e) {
    console.error('Failed to update Kiro Task status', e);
  }
};

export const api = {
  // ===== AUTH =====
  signup: async (email: string, password: string, name: string) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      // Check if user already exists
      const existingUser = getMockData('mock_user_' + email);
      if (existingUser) {
        return { error: 'User already exists. Please sign in instead.' };
      }

      const userId = 'mock-user-' + Date.now();
      const user = { id: userId, email, name, class: null };
      setMockData('mock_user_' + email, { ...user, password });
      return { user };
    }

    // Use direct Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: name || '' }
      }
    });

    if (error) {
      console.error('Signup error:', error);
      return { error: error.message };
    }

    // Store user profile in localStorage for now (would be in database in production)
    if (data.user) {
      const userProfile = {
        id: data.user.id,
        email: data.user.email,
        name: name || '',
        class: null,
        exam_type: null,
        created_at: new Date().toISOString(),
      };
      localStorage.setItem(`user_profile_${data.user.id}`, JSON.stringify(userProfile));
      return { user: userProfile };
    }

    return { error: 'Signup failed' };
  },

  signin: async (email: string, password: string) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const storedUser = getMockData('mock_user_' + email);
      if (storedUser && storedUser.password !== password) {
        return { error: 'Invalid password' };
      }
      const user = storedUser || {
        id: 'mock-user-id',
        email,
        name: 'Mock User',
        class: '12th Grade'
      };
      const session = {
        access_token: 'mock-access-token-' + Date.now(),
        user
      };
      setMockData('mock_active_user_profile', user);
      return { session, user };
    }

    // Use direct Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Signin error:', error);
      return { error: error.message };
    }

    // Get or create user profile
    let userProfile = null;
    if (data.user) {
      const storedProfile = localStorage.getItem(`user_profile_${data.user.id}`);
      userProfile = storedProfile ? JSON.parse(storedProfile) : {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || '',
        class: null,
        exam_type: null
      };

      // Sync name from metadata if it exists and differs from detailed profile
      if (data.user.user_metadata?.name && userProfile.name !== data.user.user_metadata.name) {
        userProfile.name = data.user.user_metadata.name;
        localStorage.setItem(`user_profile_${data.user.id}`, JSON.stringify(userProfile));
      }
    }

    return { session: data.session, user: userProfile };
  },

  getSession: async (_token?: string) => {
    if (USE_MOCK) {
      const storedProfile = getMockData('mock_active_user_profile');
      return {
        session: storedProfile ? { access_token: 'mock-token' } : null,
        user: storedProfile || null
      };
    }

    // Use direct Supabase Auth
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      return { session: null, user: null };
    }

    // Get user profile
    const storedProfile = localStorage.getItem(`user_profile_${session.user.id}`);
    let userProfile = storedProfile ? JSON.parse(storedProfile) : {
      id: session.user.id,
      email: session.user.email,
      name: session.user.user_metadata?.name || '',
      class: null,
      exam_type: null
    };

    // Sync name from metadata if it exists and differs from detailed profile
    if (session.user.user_metadata?.name && userProfile.name !== session.user.user_metadata.name) {
      userProfile.name = session.user.user_metadata.name;
      localStorage.setItem(`user_profile_${session.user.id}`, JSON.stringify(userProfile));
    }

    return { session, user: userProfile };
  },

  signout: async () => {
    if (USE_MOCK) {
      localStorage.removeItem('mock_active_user_profile');
      return { success: true };
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      return { error: error.message };
    }
    return { success: true };
  },

  updateProfile: async (_token: string, data: any) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const current = getMockData('mock_active_user_profile') || { id: 'mock-user-id' };
      const updated = { ...current, ...data };
      setMockData('mock_active_user_profile', updated);
      return { user: updated };
    }

    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { error: 'Not authenticated' };
    }

    // Update local profile
    const storedProfile = localStorage.getItem(`user_profile_${session.user.id}`);
    const currentProfile = storedProfile ? JSON.parse(storedProfile) : {};
    const updatedProfile = {
      ...currentProfile,
      ...data,
      updated_at: new Date().toISOString()
    };
    localStorage.setItem(`user_profile_${session.user.id}`, JSON.stringify(updatedProfile));

    return { user: updatedProfile };
  },

  // ===== NOTES =====
  uploadNote: async (_token: string, file: File, subject: string, topic: string) => {
    // Extract text for Gemini Analysis keying by topic
    try {
      if (file.type === 'application/pdf') {
        const text = await extractTextFromPDF(file);
        localStorage.setItem(`doc_text_${subject}_${topic}`, text);
        console.log('📄 PDF Text extracted specifically for:', topic);
      }
    } catch (e) {
      console.error("⚠️ PDF Extraction failed", e);
    }

    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 800));
      const note = {
        id: 'mock-note-' + Date.now(),
        subject,
        topic,
        file_name: file.name,
        created_at: new Date().toISOString(),
        file_url: URL.createObjectURL(file)
      };

      const user = getMockData('mock_active_user_profile');
      const userId = user ? user.id : 'unknown';
      const notes = getMockData(`mock_notes_${userId}`) || [];

      // GEMINI ANALYSIS: Extract topic from filename
      let detectedTopic = topic;
      if (USE_MOCK) {
        try {
          const { GEMINI_API_KEY } = await import('./config');
          const prompt = `Given a file named '${file.name}' uploaded for subject '${subject}' and user-entered topic '${topic}', identify the precise academic concept or sub-topic (max 5 words). Return ONLY the topic name, nothing else.`;

          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=\${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
          });

          if (response.ok) {
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) detectedTopic = text.trim();
          }
        } catch (e) {
          console.error("Gemini Analysis Failed", e);
          // Fallback to simple keyword simulated analysis
          const name = file.name.toLowerCase();
          if (name.includes('thermo')) detectedTopic = 'Thermodynamics';
          else if (name.includes('organic')) detectedTopic = 'Organic Chemistry';
        }
      }

      notes.push({ ...note, topic: detectedTopic });
      setMockData(`mock_notes_${userId}`, notes);

      updateTaskStatus('t1', 'done');
      updateTaskStatus('t2', 'in-progress');

      return { note, detectedTopic };
    }

    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { error: 'Not authenticated' };
    }

    // Upload file to Supabase Storage
    const fileName = `${session.user.id}/${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('make-812a95c3-notes')
      .upload(fileName, file, { upsert: false });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { error: uploadError.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('make-812a95c3-notes')
      .getPublicUrl(fileName);

    const note = {
      id: `note-${Date.now()}`,
      user_id: session.user.id,
      subject,
      topic,
      file_url: publicUrl,
      file_name: file.name,
      created_at: new Date().toISOString(),
    };

    // Store note in localStorage (would be database in production)
    const notes = JSON.parse(localStorage.getItem(`notes_${session.user.id}`) || '[]');
    notes.push(note);
    localStorage.setItem(`notes_${session.user.id}`, JSON.stringify(notes));

    return { note };
  },

  getNotes: async (_token: string) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const user = getMockData('mock_active_user_profile');
      const userId = user ? user.id : 'unknown';
      return { notes: getMockData(`mock_notes_${userId}`) || [] };
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { error: 'Unauthorized' };
    }

    const notes = JSON.parse(localStorage.getItem(`notes_${session.user.id}`) || '[]');
    return { notes };
  },

  // ===== TOPICS =====
  getTopics: async (_token: string) => {
    if (USE_MOCK) {
      const user = getMockData('mock_active_user_profile');
      const userId = user ? user.id : 'unknown';
      const notes = getMockData(`mock_notes_${userId}`) || [];
      const topics = notes.map((n: any) => ({ topic: n.topic, subject: n.subject }));
      const uniqueTags = new Set(topics.map((t: any) => `${t.subject}|${t.topic}`));
      const uniqueTopics = Array.from(uniqueTags).map((tag: any) => {
        const [s, t] = tag.split('|');
        return { subject: s, topic: t, created_at: new Date().toISOString() };
      });
      return { topics: uniqueTopics };
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { error: 'Unauthorized' };
    }

    const notes = JSON.parse(localStorage.getItem(`notes_${session.user.id}`) || '[]');
    const topics = notes.map((n: any) => ({ topic: n.topic, subject: n.subject }));
    const uniqueTags = [...new Set(topics.map((t: any) => `${t.subject}|${t.topic}`))];
    const uniqueTopics = uniqueTags.map((tag: any) => {
      const [s, t] = tag.split('|');
      return { subject: s, topic: t };
    });
    return { topics: uniqueTopics };
  },

  // ===== DIAGNOSTICS =====
  generateDiagnostic: async (_token: string, topic: string, subject: string) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      // GEMINI QUESTION GENERATION VIA PDF ANALYSIS
      let questions: any[] = [];
      const storedText = localStorage.getItem(`doc_text_${subject}_${topic}`);

      if (storedText) {
        try {
          console.log('🤖 Generating questions from PDF content...');
          questions = await generateQuestionsFromText(storedText);
        } catch (e) {
          console.error("Gemini Generation Error", e);
        }
      }

      // Fallback if no specific questions generated
      if (!questions || questions.length === 0) {
        console.log('⚠️ No PDF text found or generation failed, using topic-based fallback');
        const t = topic.toLowerCase();
        if (t.includes('thermo')) {
          questions = [
            {
              id: 1,
              question: "First Law of Thermodynamics is essentially a statement of conservation of:",
              options: ["Mass", "Energy", "Momentum", "Charge"],
              correctAnswer: 1,
              explanation: "The First Law states that energy cannot be created or destroyed, only transferred.",
              difficulty: "medium"
            },
            {
              id: 2,
              question: "In an adiabatic process, which of the following is true?",
              options: ["dQ = 0", "dU = 0", "dW = 0", "dT = 0"],
              correctAnswer: 0,
              explanation: "Adiabatic means no heat exchange with surroundings.",
              difficulty: "hard"
            },
            {
              id: 3,
              question: "Entropy of a system approaches a constant value as temperature approaches:",
              options: ["Absolute Zero", "Boiling Point", "Triple Point", "Critical Point"],
              correctAnswer: 0,
              explanation: "This is the Third Law of Thermodynamics.",
              difficulty: "hard"
            },
            {
              id: 4,
              question: "Which process occurs at constant pressure?",
              options: ["Isobaric", "Isochoric", "Isothermal", "Adiabatic"],
              correctAnswer: 0,
              explanation: "Isobaric means constant pressure.",
              difficulty: "easy"
            },
            {
              id: 5,
              question: "Efficiency of a Carnot engine depends on:",
              options: ["Working substance", "Design of engine", "Temperatures of source and sink", "Fuel used"],
              correctAnswer: 2,
              explanation: "Efficiency = 1 - T2/T1",
              difficulty: "medium"
            }
          ];
        } else if (t.includes('organic')) {
          questions = [
            {
              id: 1,
              question: "Which of the following is the most acidic?",
              options: ["Ethyne", "Ethene", "Ethane", "Benzene"],
              correctAnswer: 0,
              explanation: "sp hybridized carbons are more electronegative.",
              difficulty: "medium"
            },
            {
              id: 2,
              question: "What is the hybridization of carbon in methane?",
              options: ["sp", "sp2", "sp3", "dsp2"],
              correctAnswer: 2,
              explanation: "Methane (CH4) has 4 sigma bonds.",
              difficulty: "easy"
            },
            {
              id: 3,
              question: "Benzene reacts with Chlorine in presence of FeCl3 to give:",
              options: ["Chlorobenzene", "Hexachlorocyclohexane", "Benzyl Chloride", "No reaction"],
              correctAnswer: 0,
              explanation: "Electrophilic substitution reaction.",
              difficulty: "medium"
            },
            {
              id: 4,
              question: "The shape of checking carbocation is:",
              options: ["Planar", "Pyramidal", "Tetrahedral", "Linear"],
              correctAnswer: 0,
              explanation: "Carbocations are sp2 hybridized and planar.",
              difficulty: "medium"
            },
            {
              id: 5,
              question: "Ethanol on heating with conc. H2SO4 at 170°C gives:",
              options: ["Ethene", "Ethoxyethane", "Ethyl Hydrogen Sulphate", "Methane"],
              correctAnswer: 0,
              explanation: "Dehydration of alcohol to alkene.",
              difficulty: "medium"
            }
          ];
        } else if (t.includes('newton')) {
          questions = [
            { id: 1, question: "Newton's First Law is also known as:", options: ["Law of Momentum", "Law of Inertia", "Law of Force", "Law of Energy"], correctAnswer: 1, explanation: "Inertia is the resistance to change in motion." },
            { id: 2, question: "Force equals:", options: ["m/a", "m*a", "m+a", "m-a"], correctAnswer: 1, explanation: "F=ma" },
            { id: 3, question: "Action and reaction forces act on:", options: ["Same body", "Different bodies", "Depends on velocity", "None"], correctAnswer: 1, explanation: "Action-Reaction pair acts on two interacting objects." },
            { id: 4, question: "Unit of Force is:", options: ["Joule", "Watt", "Newton", "Pascal"], correctAnswer: 2, explanation: "Standard unit." },
            { id: 5, question: "Inertia depends on:", options: ["Velocity", "Mass", "Volume", "Area"], correctAnswer: 1, explanation: "Mass is a measure of inertia." }
          ];
        } else {
          try {
            // Try generating from topic name alone if no PDF text
            console.log('🤖 Attempting generic generation for topic:', topic);
            questions = await generateQuestionsFromText(`Please generate 5 quiz questions about the topic: ${topic}. The context is high school physics/chemistry/math.`);
          } catch (e) {
            const demoQuestions = getDemoQuestions(topic, 5);
            questions = demoQuestions.length > 0 ? demoQuestions : Array.from({ length: 5 }, (_, i) => ({
              id: `q${i + 1}`,
              question: `Analysis Question ${i + 1}: Based on your upload about ${topic}`,
              options: [
                `Concept A related to ${topic}`,
                `Concept B related to ${topic}`,
                `Concept C related to ${topic}`,
                `Concept D related to ${topic}`,
              ],
              correctAnswer: 0,
              explanation: `This tests your understanding of ${topic}.`,
              concept: topic,
              difficulty: 'medium'
            }));
          }
        }
      }

      const diagnostic = {
        id: `demo-diag-${Date.now()}`,
        topic,
        subject,
        questions,
        created_at: new Date().toISOString(),
        completed: false
      };

      setMockData('current_diagnostic', diagnostic);
      return { diagnostic };
    }

    // Generate questions (in production, this would use AI)
    const questions = Array.from({ length: 8 }, (_, i) => ({
      id: `q${i + 1}`,
      question: `Question ${i + 1} about ${topic} in ${subject}`,
      options: [`Option A`, `Option B`, `Option C`, `Option D`],
      correctAnswer: Math.floor(Math.random() * 4),
    }));

    const diagnostic = {
      id: `diag-${Date.now()}`,
      topic,
      subject,
      questions,
      created_at: new Date().toISOString(),
      completed: false
    };

    localStorage.setItem('current_diagnostic', JSON.stringify(diagnostic));
    return { diagnostic };
  },

  submitDiagnostic: async (_token: string, data: any) => {
    if (USE_MOCK) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const { diagnosticId, answers, timeTaken, confidence } = data;
      const storedDiag = getMockData('current_diagnostic');
      let score = 0;
      let correct = 0;
      let total = 8;
      let weakAreas: string[] = [];
      let message = "Keep practicing!";

      if (storedDiag) {
        correct = 0;
        storedDiag.questions.forEach((q: any, i: number) => {
          if (answers[i] === q.correctAnswer) correct++;
        });
        total = storedDiag.questions.length;
        score = Math.round((correct / total) * 100);

        // GEMINI ANALYSIS
        try {
          const storedText = localStorage.getItem(`doc_text_${storedDiag.subject}_${storedDiag.topic}`);
          console.log('🤖 Analyzing results with Gemini...');
          // Pass the questions, user's answers, and original text context
          const analysis = await analyzeQuizResults(storedDiag.questions, answers, storedText || '');

          if (analysis) {
            console.log('✅ Gemini Analysis Complete:', analysis);
            weakAreas = analysis.weakTopics || [];
            message = analysis.suggestions?.[0] || "Review the material focusing on missed concepts.";

            // If we have weak areas, create specific "weak concept" entries
            const user = getMockData('mock_active_user_profile');
            const userId = user ? user.id : 'unknown';
            const weak = getMockData(`mock_weak_${userId}`) || [];

            weakAreas.forEach(area => {
              weak.push({
                topic: area,
                subject: storedDiag.subject,
                score: 50, // Arbitrary low score for weak area
                created_at: new Date().toISOString()
              });
            });
            setMockData(`mock_weak_${userId}`, weak);
          }
        } catch (e) {
          console.error("Gemini Analysis Failed", e);
          // Fallback logic
          if (score < 70) weakAreas = [storedDiag.topic];
        }
      }

      const result = {
        diagnosticId,
        score,
        correct,
        total,
        avgTime: timeTaken / total,
        confidence,
        topic: storedDiag?.topic || 'Unknown',
        subject: storedDiag?.subject || 'Unknown',
        weakAreas: weakAreas.length > 0 ? weakAreas : [storedDiag?.topic || 'General'],
        message: message,
        completed_at: new Date().toISOString()
      };

      const user = getMockData('mock_active_user_profile');
      const userId = user ? user.id : 'unknown';
      const results = getMockData(`mock_results_${userId}`) || [];
      results.push(result);
      setMockData(`mock_results_${userId}`, results);

      // Trigger Tasks
      updateTaskStatus('t2', 'done');
      updateTaskStatus('t3', 'done');
      updateTaskStatus('t4', 'in-progress');

      // Schedule Revisions
      const revisions = getMockData(`mock_revisions_${userId}`) || [];
      [1, 3, 7].forEach(day => {
        const d = new Date();
        d.setDate(d.getDate() + day);
        revisions.push({
          id: `rev-${Date.now()}-${day}`,
          topic: result.topic,
          subject: result.subject,
          revision_day: day,
          scheduled_date: d.toISOString(),
          completed: false
        });
      });
      setMockData(`mock_revisions_${userId}`, revisions);

      return { result };
    }

    // Production mode
    const { answers, timeTaken, confidence } = data;
    const storedDiag = JSON.parse(localStorage.getItem('current_diagnostic') || '{}');

    let correct = 0;
    if (storedDiag.questions) {
      storedDiag.questions.forEach((q: any, i: number) => {
        if (answers[i] === q.correctAnswer) correct++;
      });
    }
    const total = storedDiag.questions?.length || 8;
    const score = (correct / total) * 100;

    const result = {
      diagnosticId: storedDiag.id,
      score,
      correct,
      total,
      avgTime: timeTaken / total,
      confidence,
      topic: storedDiag.topic,
      subject: storedDiag.subject,
      completed_at: new Date().toISOString()
    };

    // Store results
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const results = JSON.parse(localStorage.getItem(`results_${session.user.id}`) || '[]');
      results.push(result);
      localStorage.setItem(`results_${session.user.id}`, JSON.stringify(results));

      // Schedule revisions
      const revisions = JSON.parse(localStorage.getItem(`revisions_${session.user.id}`) || '[]');
      [1, 3, 7].forEach(day => {
        const d = new Date();
        d.setDate(d.getDate() + day);
        revisions.push({
          id: `rev-${Date.now()}-${day}`,
          topic: storedDiag.topic,
          subject: storedDiag.subject,
          revision_day: day,
          scheduled_date: d.toISOString(),
          completed: false
        });
      });
      localStorage.setItem(`revisions_${session.user.id}`, JSON.stringify(revisions));
    }

    return { result };
  },

  // ===== REVISIONS =====
  getRevisions: async (_token: string) => {
    if (USE_MOCK) {
      const user = getMockData('mock_active_user_profile');
      const userId = user ? user.id : 'unknown';
      const revisions = getMockData(`mock_revisions_${userId}`) || [];
      return { revisions: revisions.filter((r: any) => !r.completed) };
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { error: 'Unauthorized' };
    }

    const revisions = JSON.parse(localStorage.getItem(`revisions_${session.user.id}`) || '[]');
    const today = new Date().toISOString().split('T')[0];
    const dueRevisions = revisions.filter((r: any) =>
      r.scheduled_date.split('T')[0] <= today && !r.completed
    );
    return { revisions: dueRevisions };
  },

  completeRevision: async (_token: string, revisionId: string, recallScore: number) => {
    if (USE_MOCK) {
      const user = getMockData('mock_active_user_profile');
      const userId = user ? user.id : 'unknown';
      const revisions = getMockData(`mock_revisions_${userId}`) || [];
      const index = revisions.findIndex((r: any) => r.id === revisionId);
      if (index !== -1) {
        revisions[index].completed = true;
        revisions[index].recall_score = recallScore;
        setMockData(`mock_revisions_${userId}`, revisions);
      }
      return { revision: revisions[index], progress: {} };
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { error: 'Unauthorized' };
    }

    const revisions = JSON.parse(localStorage.getItem(`revisions_${session.user.id}`) || '[]');
    const index = revisions.findIndex((r: any) => r.id === revisionId);
    if (index !== -1) {
      revisions[index].completed = true;
      revisions[index].recall_score = recallScore;
      revisions[index].completed_at = new Date().toISOString();
      localStorage.setItem(`revisions_${session.user.id}`, JSON.stringify(revisions));
    }

    return { revision: revisions[index], progress: {} };
  },

  // ===== PROGRESS =====
  getProgress: async (_token: string) => {
    if (USE_MOCK) {
      const user = getMockData('mock_active_user_profile');
      const userId = user ? user.id : 'unknown';
      const results = getMockData(`mock_results_${userId}`) || [];
      return { progress: results };
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { error: 'Unauthorized' };
    }

    const results = JSON.parse(localStorage.getItem(`results_${session.user.id}`) || '[]');
    return { progress: results };
  },

  getWeakConcepts: async (_token: string) => {
    if (USE_MOCK) {
      const user = getMockData('mock_active_user_profile');
      const userId = user ? user.id : 'unknown';
      const weakConcepts = getMockData(`mock_weak_${userId}`) || [];
      return { weakConcepts };
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { error: 'Unauthorized' };
    }

    const results = JSON.parse(localStorage.getItem(`results_${session.user.id}`) || '[]');
    const weakConcepts = results.filter((r: any) => r.score < 70);
    return { weakConcepts };
  },

  getCorrection: async (_token: string, topic: string) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 600));

      // GEMINI EXPLANATION GENERATION
      try {
        const { GEMINI_API_KEY } = await import('./config');
        const prompt = `Explain '${topic}' to a high school student who just failed a quiz on it. 
        Return a JSON object with this exact structure:
        {
          "intro": { "title": "string", "description": "string", "why": "string" },
          "explanation": { "title": "string", "text": "string", "definition": "string" },
          "analogy": { "title": "string", "text": "string", "visual": "short string description" },
          "example": { "step1": "string", "step2": "string", "answer": "string" }
        }
        Return RAW JSON only, no markdown.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (response.ok) {
          const data = await response.json();
          let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const correctionData = JSON.parse(text);
            updateTaskStatus('t4', 'done');
            updateTaskStatus('t5', 'in-progress');
            return {
              correction: {
                id: 'gemini-corr-' + Date.now(),
                topic,
                ...correctionData
              }
            };
          }
        }
      } catch (e) {
        console.error("Gemini Correction Failed", e);
        // Fallthrough to demo data
      }

      // Use demo correction data if available
      const demoCorrection = getDemoCorrection(topic);

      if (demoCorrection) {
        updateTaskStatus('t4', 'done');
        updateTaskStatus('t5', 'in-progress');
        return {
          correction: {
            id: 'demo-corr-' + Date.now(),
            topic,
            ...demoCorrection
          }
        };
      }

      return {
        correction: {
          id: 'corr-' + Date.now(),
          topic,
          intro: {
            title: `Mastering ${topic}`,
            description: "You struggled slightly with this concept. Let's break it down.",
            why: "Understanding this is crucial for solving advanced problems."
          },
          explanation: {
            title: "The Core Idea",
            text: `Imagine ${topic} as a fundamental relationship. It describes how elements interact under standard conditions.`,
            definition: "The principle states that for every action, there is an equal and opposite reaction."
          },
          analogy: {
            title: "Think of it like a...",
            text: "Just like a rubber band stores energy, this concept works on restoring forces.",
            visual: "Rubber Band"
          },
          example: {
            step1: "Identify known variables",
            step2: "Apply the Formula",
            answer: "Result = 10 Units"
          }
        }
      };
    }

    // In production, this would call an AI service
    return {
      correction: {
        id: 'corr-' + Date.now(),
        topic,
        intro: {
          title: `Understanding ${topic}`,
          description: "Let's review this concept together.",
          why: "This is a key foundation for your learning."
        },
        explanation: {
          title: "Key Points",
          text: `${topic} is an important concept that builds on fundamental principles.`,
          definition: "The core definition and application."
        },
        analogy: {
          title: "Visual Example",
          text: "Think of this concept in everyday terms...",
          visual: "Diagram"
        },
        example: {
          step1: "Step 1: Analyze",
          step2: "Step 2: Apply",
          answer: "Final Answer"
        }
      }
    };
  },

  getDashboard: async (_token: string) => {
    if (USE_MOCK) {
      const user = getMockData('mock_active_user_profile');
      const userId = user ? user.id : 'unknown';

      const weak = getMockData(`mock_weak_${userId}`) || [];
      const revisions = getMockData(`mock_revisions_${userId}`) || [];
      const pendingRevisions = revisions.filter((r: any) => !r.completed);
      const completedRevisions = revisions.filter((r: any) => r.completed);

      // Calculate overall mastery from stored results
      const results = getMockData(`mock_results_${userId}`) || [];
      let avgScore = 0;
      if (results.length > 0) {
        const totalScore = results.reduce((sum: number, r: any) => sum + (r.score || 0), 0);
        avgScore = totalScore / results.length;
      }

      return {
        weakConceptsCount: weak.length,
        upcomingRevisionsCount: pendingRevisions.length,
        masteryProgress: Math.round(avgScore),
        streak: Math.min(completedRevisions.length, 7),
      };
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return {
        weakConceptsCount: 0,
        upcomingRevisionsCount: 0,
        masteryProgress: 0,
        streak: 0,
      };
    }

    const results = JSON.parse(localStorage.getItem(`results_${session.user.id}`) || '[]');
    const revisions = JSON.parse(localStorage.getItem(`revisions_${session.user.id}`) || '[]');

    const weakConcepts = results.filter((r: any) => r.score < 70);
    const today = new Date().toISOString().split('T')[0];
    const pendingRevisions = revisions.filter((r: any) =>
      r.scheduled_date.split('T')[0] <= today && !r.completed
    );
    const completedRevisions = revisions.filter((r: any) => r.completed);

    return {
      weakConceptsCount: weakConcepts.length,
      upcomingRevisionsCount: pendingRevisions.length,
      masteryProgress: results.length,
      streak: Math.min(completedRevisions.length, 7),
    };
  },

  // ===== AI CHAT =====
  chat: async (_token: string, query: string, _context?: any) => {
    if (USE_MOCK) {
      const { GEMINI_API_KEY } = await import('./config');

      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: query }]
            }]
          })
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (text) {
          return { response: text };
        }
      } catch (error) {
        console.error('Gemini API Error:', error);
        // Fallthrough to mock responses if API fails
      }

      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate thinking

      const q = query.toLowerCase();
      let response = "That's an interesting question. Could you provide more specific details so I can help you better?";

      if (q.includes('newton') || q.includes('force') || q.includes('motion')) {
        response = "Newton's laws of motion are three physical laws that, together, laid the foundation for classical mechanics. They describe the relationship between a body and the forces acting upon it, and its motion in response to those forces.";
      } else if (q.includes('integral') || q.includes('calculus') || q.includes('derivative')) {
        response = "Calculus is the mathematical study of continuous change. Derivatives represent the rate of change, while integrals represent accumulation (like the area under a curve). Do you need help with a specific problem?";
      } else if (q.includes('plant') || q.includes('photosynthesis') || q.includes('biology')) {
        response = "Photosynthesis is the process used by plants and other organisms to convert light energy into chemical energy that can later be released to fuel the organisms' activities.";
      } else if (q.includes('chemistry') || q.includes('bond') || q.includes('reaction')) {
        response = "Chemical bonds are forces that hold atoms together to form molecules. The main types are ionic bonds (transfer of electrons) and covalent bonds (sharing of electrons).";
      } else if (q.includes('hello') || q.includes('hi')) {
        response = "Hello! I'm your AI study assistant. I'm now powered by Gemini AI! Ask me anything about your subjects.";
      }

      return { response };
    }

    // Production placeholder
    return { response: "I am a simulated AI in production mode. Please connect a real LLM backend." };
  },
};

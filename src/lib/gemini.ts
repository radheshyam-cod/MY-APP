import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.error("Missing VITE_GEMINI_API_KEY in .env file");
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export interface QuizQuestion {
    id: number;
    question: string;
    options: string[];
    correctAnswer: number; // Index of correct option (0-3)
    explanation: string;
}

export interface AnalysisResult {
    weakTopics: string[];
    suggestions: string[];
    score: number;
}

export const generateQuestionsFromText = async (text: string): Promise<QuizQuestion[]> => {
    try {
        const prompt = `
      You are an expert tutor. Analyze the following text and generate 5 multiple-choice questions to test understanding of the key concepts.
      
      Text content:
      "${text.substring(0, 10000)}..." (truncated for length)

      Return ONLY a JSON array of objects. Do not include markdown formatting (like \`\`\`json).
      Each object must have:
      - id: number (1-5)
      - question: string
      - options: array of 4 strings
      - correctAnswer: number (0-3, index of the correct option)
      - explanation: string (brief explanation of the answer)
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text();

        // Clean up if markdown is included despite instructions
        const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(cleanJson);
    } catch (error) {
        console.error("Error generating questions:", error);
        // Fallback questions if API fails
        return [
            {
                id: 1,
                question: "What is the primary focus of the uploaded content?",
                options: ["Concept A", "Concept B", "Concept C", "Concept D"],
                correctAnswer: 0,
                explanation: "Unable to generate specific questions due to API error."
            }
        ];
    }
};

export const analyzeQuizResults = async (questions: QuizQuestion[], userAnswers: number[], originalText: string): Promise<AnalysisResult> => {
    try {
        const score = questions.reduce((acc, q, i) => acc + (q.correctAnswer === userAnswers[i] ? 1 : 0), 0);

        // Identify incorrect questions
        const incorrectIndices = userAnswers.map((ans, i) => ans !== questions[i].correctAnswer ? i : -1).filter(i => i !== -1);

        if (incorrectIndices.length === 0) {
            return {
                weakTopics: [],
                suggestions: ["Great job! You mastered this topic."],
                score
            };
        }

        const incorrectQuestions = incorrectIndices.map(i => questions[i]);

        const prompt = `
      The student answered the following questions incorrectly based on the text provided earlier.
      
      Incorrect Questions:
      ${JSON.stringify(incorrectQuestions.map(q => q.question))}
      
      Analyze these mistakes and identify:
      1. Which specific topics or concepts are weak?
      2. Provide 3 specific actionable study suggestions.
      
      Return ONLY a JSON object with:
      - weakTopics: string[]
      - suggestions: string[]
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text();
        const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();

        const analysis = JSON.parse(cleanJson);
        return { ...analysis, score };

    } catch (error) {
        console.error("Error analyzing results:", error);
        return {
            weakTopics: ["General Understanding"],
            suggestions: ["Review the material again.", "Focus on key terms."],
            score: questions.reduce((acc, q, i) => acc + (q.correctAnswer === userAnswers[i] ? 1 : 0), 0)
        };
    }
};

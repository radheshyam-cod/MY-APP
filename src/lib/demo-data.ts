
// Demo Data for ConceptPulse

export const DEMO_USER = {
    id: 'mock-user-id',
    email: 'admin@conceptpule.ed',
    name: 'Demo Student',
    class: '12th Grade',
    exam_type: 'JEE Advanced',
    created_at: new Date().toISOString()
};

export interface ConceptProgress {
    concepts: Record<string, number>;
}

export const DEMO_PROGRESS: Record<string, ConceptProgress> = {
    Physics: {
        concepts: {
            "Newton's Laws": 75,
            "Kinematics": 60,
            "Thermodynamics": 45,
            "Electromagnetism": 80
        }
    },
    Mathematics: {
        concepts: {
            "Calculus": 70,
            "Linear Algebra": 55,
            "Trigonometry": 85,
            "Probability": 40
        }
    },
    Chemistry: {
        concepts: {
            "Organic Reactions": 65,
            "Periodic Table": 90,
            "Chemical Bonding": 50
        }
    }
};

export const getDemoWeakConcepts = (): string[] => {
    const weak: string[] = [];
    Object.entries(DEMO_PROGRESS).forEach(([_, subject]) => {
        Object.entries(subject.concepts).forEach(([concept, score]) => {
            if (score < 60) weak.push(concept);
        });
    });
    return weak;
};

export const getDemoQuestions = (topic: string, count: number = 8) => {
    const questionsMap: Record<string, Array<{
        id: string;
        question: string;
        options: string[];
        correctAnswer: number;
        explanation: string;
        concept: string;
        difficulty: 'easy' | 'medium' | 'hard';
    }>> = {
        "Newton's Laws": [
            {
                id: 'nl1',
                question: "A 5 kg object accelerates at 2 m/s². What force is applied?",
                options: ["5 N", "10 N", "7 N", "2.5 N"],
                correctAnswer: 1,
                explanation: "Using F = ma: F = 5 kg × 2 m/s² = 10 N",
                concept: "Newton's Laws",
                difficulty: 'easy'
            },
            {
                id: 'nl2',
                question: "Which law explains why you feel pushed back when a car accelerates?",
                options: ["First Law", "Second Law", "Third Law", "Law of Gravitation"],
                correctAnswer: 0,
                explanation: "Newton's First Law (Inertia) explains this effect",
                concept: "Newton's Laws",
                difficulty: 'medium'
            }
        ],
        "Calculus": [
            {
                id: 'calc1',
                question: "What is the derivative of x³?",
                options: ["x²", "3x²", "3x", "x³"],
                correctAnswer: 1,
                explanation: "Using power rule: d/dx(xⁿ) = nxⁿ⁻¹, so d/dx(x³) = 3x²",
                concept: "Calculus",
                difficulty: 'easy'
            },
            {
                id: 'calc2',
                question: "What is ∫2x dx?",
                options: ["x²", "x² + C", "2x²", "2x² + C"],
                correctAnswer: 1,
                explanation: "The integral of 2x is x² plus constant C",
                concept: "Calculus",
                difficulty: 'medium'
            }
        ]
    };

    const questions = questionsMap[topic] || [];
    return questions.slice(0, count);
};

export const getDemoCorrection = (topic: string) => {
    const corrections: Record<string, any> = {
        "Newton's Laws": {
            intro: {
                title: "Mastering Newton's Laws of Motion",
                description: "Let's strengthen your understanding of the fundamental laws governing motion.",
                why: "These laws form the foundation of classical mechanics and are essential for physics problems."
            },
            explanation: {
                title: "The Three Laws",
                text: "Newton's Laws describe how objects move and interact. The First Law (Inertia) states objects stay at rest or in motion unless acted upon. The Second Law (F=ma) relates force, mass, and acceleration. The Third Law states every action has an equal and opposite reaction.",
                definition: "Force equals mass times acceleration (F = ma)"
            },
            analogy: {
                title: "Real-World Example",
                text: "Think of a hockey puck on ice - it keeps sliding (First Law) until friction or a stick (force) changes its motion (Second Law). When you push a wall, it pushes back (Third Law).",
                visual: "Hockey Puck"
            },
            example: {
                step1: "Identify: A 10 kg cart is pushed with 20 N force",
                step2: "Apply F = ma: a = F/m = 20 N / 10 kg",
                answer: "Acceleration = 2 m/s²"
            }
        },
        "Calculus": {
            intro: {
                title: "Understanding Calculus Fundamentals",
                description: "Building a solid foundation in derivatives and integrals.",
                why: "Calculus is essential for advanced mathematics, physics, and engineering."
            },
            explanation: {
                title: "Derivatives and Integrals",
                text: "A derivative measures the rate of change of a function. An integral calculates the area under a curve. They are inverse operations of each other.",
                definition: "The derivative of f(x) at point a is the limit of [f(a+h) - f(a)]/h as h→0"
            },
            analogy: {
                title: "Distance and Speed",
                text: "If you know your position over time, the derivative gives you velocity (how fast you're moving). If you know velocity, the integral gives you total distance traveled.",
                visual: "Car Speedometer"
            },
            example: {
                step1: "Find d/dx(x⁴): Using power rule, bring down the exponent",
                step2: "Multiply by original exponent, reduce power by 1",
                answer: "d/dx(x⁴) = 4x³"
            }
        }
    };

    return corrections[topic] || null;
};

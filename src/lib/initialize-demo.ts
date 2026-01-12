
/**
 * Demo Initialization Script for ConceptPulse
 * Sets up demo environment with controlled data
 */

import { DEMO_USER, DEMO_PROGRESS, getDemoWeakConcepts } from './demo-data';

interface DemoState {
    user: typeof DEMO_USER;
    progress: typeof DEMO_PROGRESS;
    weakConcepts: string[];
    revisions: any[];
}

function initializeDemoState(): DemoState {
    const weakConcepts = getDemoWeakConcepts();

    // Create demo revisions for weak concepts
    const revisions = weakConcepts.flatMap(concept => {
        return [1, 3, 7].map(day => {
            const date = new Date();
            date.setDate(date.getDate() + day);
            return {
                id: `demo-rev-${concept.replace(/\s+/g, '-').toLowerCase()}-${day}`,
                topic: concept,
                subject: concept.includes('Newton') || concept.includes('Kinematics') ? 'Physics' : 'Mathematics',
                revision_day: day,
                scheduled_date: date.toISOString(),
                completed: false
            };
        });
    });

    return {
        user: DEMO_USER,
        progress: DEMO_PROGRESS,
        weakConcepts,
        revisions
    };
}

function setupLocalStorage(demoState: DemoState): void {
    // Clear existing demo data
    const keysToRemove = Object.keys(localStorage).filter(key =>
        key.startsWith('mock_') || key.startsWith('demo_') || key.startsWith('kiro_')
    );
    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Set up demo user
    localStorage.setItem('mock_active_user_profile', JSON.stringify(demoState.user));
    localStorage.setItem('mock_user_admin@conceptpule.ed', JSON.stringify({
        ...demoState.user,
        password: 'admin@123'
    }));

    // Set up demo revisions
    localStorage.setItem(`mock_revisions_${demoState.user.id}`, JSON.stringify(demoState.revisions));

    // Set up demo notes
    const demoNotes = [
        {
            id: 'demo-note-physics',
            subject: 'Physics',
            topic: 'Newton\'s Laws of Motion',
            file_name: 'physics_mechanics.pdf',
            created_at: new Date().toISOString(),
            file_url: 'demo://physics-notes'
        },
        {
            id: 'demo-note-math',
            subject: 'Mathematics',
            topic: 'Limits and Continuity',
            file_name: 'calculus_chapter1.pdf',
            created_at: new Date().toISOString(),
            file_url: 'demo://math-notes'
        }
    ];

    localStorage.setItem(`mock_notes_${demoState.user.id}`, JSON.stringify(demoNotes));

    console.log('✅ Demo environment initialized successfully');
    console.log(`📊 Weak concepts: ${demoState.weakConcepts.length}`);
    console.log(`📅 Scheduled revisions: ${demoState.revisions.length}`);
}

export { initializeDemoState, setupLocalStorage };

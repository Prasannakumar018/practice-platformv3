-- Rulesets table
CREATE TABLE IF NOT EXISTS rulesets (
    id UUID PRIMARY KEY,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    config JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated Questions table
CREATE TABLE IF NOT EXISTS generated_questions (
    id UUID PRIMARY KEY,
    ruleset_id UUID REFERENCES rulesets(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,
    answer TEXT NOT NULL,
    difficulty VARCHAR(50),
    bloom_level VARCHAR(50),
    topic VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
    quiz_id UUID PRIMARY KEY,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    question_ids UUID[] NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    timed BOOLEAN DEFAULT FALSE,
    time_limit INTEGER, -- in minutes
    grading_style VARCHAR(50) DEFAULT 'end_only',
    status VARCHAR(50) DEFAULT 'created', -- created, in_progress, completed
    score FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quiz Answers table
CREATE TABLE IF NOT EXISTS quiz_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID REFERENCES quizzes(quiz_id) ON DELETE CASCADE,
    question_id UUID REFERENCES generated_questions(id),
    selected_answer TEXT NOT NULL,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_rulesets_owner_id ON rulesets(owner_id);
CREATE INDEX idx_generated_questions_ruleset_id ON generated_questions(ruleset_id);
CREATE INDEX idx_quizzes_owner_id ON quizzes(owner_id);
CREATE INDEX idx_quiz_answers_quiz_id ON quiz_answers(quiz_id);

-- Triggers
CREATE TRIGGER update_rulesets_updated_at BEFORE UPDATE ON rulesets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

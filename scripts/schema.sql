-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create updated_at trigger function (shared across services)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ==========================================
-- User Service Schema
-- ==========================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Settings table
CREATE TABLE IF NOT EXISTS user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- File Service Schema
-- ==========================================

-- Files table
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    storage_path VARCHAR(512),
    status VARCHAR(50) DEFAULT 'pending',
    size BIGINT,
    error_message TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table (extracted content)
CREATE TABLE IF NOT EXISTS documents (
    doc_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    page_number INTEGER,
    text TEXT,
    embeddings vector(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Topics table
CREATE TABLE IF NOT EXISTS topics (
    topic_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    parent_topic_id UUID REFERENCES topics(topic_id),
    doc_id UUID REFERENCES documents(doc_id) ON DELETE CASCADE,
    page_range VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_files_owner_id ON files(owner_id);
CREATE INDEX IF NOT EXISTS idx_documents_file_id ON documents(file_id);
CREATE INDEX IF NOT EXISTS idx_topics_doc_id ON topics(doc_id);

DROP TRIGGER IF EXISTS update_files_updated_at ON files;
CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- Question Service Schema
-- ==========================================

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
    time_limit INTEGER,
    grading_style VARCHAR(50) DEFAULT 'end_only',
    status VARCHAR(50) DEFAULT 'created',
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

CREATE INDEX IF NOT EXISTS idx_rulesets_owner_id ON rulesets(owner_id);
CREATE INDEX IF NOT EXISTS idx_generated_questions_ruleset_id ON generated_questions(ruleset_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_owner_id ON quizzes(owner_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_quiz_id ON quiz_answers(quiz_id);

DROP TRIGGER IF EXISTS update_rulesets_updated_at ON rulesets;
CREATE TRIGGER update_rulesets_updated_at BEFORE UPDATE ON rulesets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

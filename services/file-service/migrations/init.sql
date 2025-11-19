-- Files table
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    storage_path VARCHAR(512),
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
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
    embeddings vector(1536), -- For future semantic search
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

-- Indexes
CREATE INDEX idx_files_owner_id ON files(owner_id);
CREATE INDEX idx_documents_file_id ON documents(file_id);
CREATE INDEX idx_topics_doc_id ON topics(doc_id);

-- Triggers
CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

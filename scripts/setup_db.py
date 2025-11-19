import os
import psycopg2
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
DB_URL = os.getenv("POSTGRES_URL") or os.getenv("DATABASE_URL")

if not all([SUPABASE_URL, SUPABASE_SERVICE_KEY, DB_URL]):
    print("Error: Missing required environment variables.")
    print("Please ensure SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and POSTGRES_URL are set.")
    exit(1)

def run_migrations():
    print("Running database migrations...")
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        
        # Read schema file
        with open("scripts/schema.sql", "r") as f:
            schema_sql = f.read()
            
        # Execute schema
        cur.execute(schema_sql)
        conn.commit()
        
        print("✅ Database schema created successfully.")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ Error running migrations: {e}")
        exit(1)

def setup_storage():
    print("Setting up Supabase Storage...")
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        
        # List buckets to check if 'documents' exists
        buckets = supabase.storage.list_buckets()
        bucket_names = [b.name for b in buckets]
        
        if "documents" not in bucket_names:
            supabase.storage.create_bucket("documents", options={"public": False})
            print("✅ 'documents' storage bucket created.")
        else:
            print("ℹ️ 'documents' storage bucket already exists.")
            
    except Exception as e:
        print(f"❌ Error setting up storage: {e}")
        # Don't exit here, as storage might be restricted or handled differently
        print("You may need to create the 'documents' bucket manually in the Supabase dashboard.")

if __name__ == "__main__":
    print("🚀 Starting Supabase setup...")
    run_migrations()
    setup_storage()
    print("✨ Setup complete!")

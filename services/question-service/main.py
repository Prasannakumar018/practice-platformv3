from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi import status as fastapi_status, Request

# Initialize FastAPI app
app = FastAPI(
    title="Question Generation Service",
    description="AI-powered quiz generation using Google Gemini",
    version="1.0.0"
)

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    import traceback
    print("Exception:", exc)
    print(traceback.format_exc())
    return JSONResponse(
        status_code=fastapi_status.HTTP_400_BAD_REQUEST,
        content={
            "error": type(exc).__name__,
            "detail": str(exc),
            "trace": traceback.format_exc()
        },
    )
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import uuid
from datetime import datetime, timedelta, timezone
from supabase import create_client, Client
import google.generativeai as genai
import json
import time

# Initialize FastAPI app
app = FastAPI(
    title="Question Generation Service",
    description="AI-powered quiz generation using Google Gemini",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))
model = genai.GenerativeModel("gemini-2.0-flash")

# Supabase client
supabase: Client = create_client(
    os.getenv("SUPABASE_URL", ""),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
)

# Security
security = HTTPBearer()

# Models
class RulesetCreate(BaseModel):
    name: str
    config: Dict[str, Any]  # Contains hardness, question_types, topics, num_questions, time_limit, grading_style, bloom_levels

class RulesetResponse(BaseModel):
    id: str
    name: str
    owner_id: str
    config: Dict[str, Any]
    created_at: datetime

class GenerateQuestionsRequest(BaseModel):
    file_id: str
    ruleset_id: str
    topic: Optional[str] = None

class QuestionOption(BaseModel):
    text: str
    is_correct: bool

class GeneratedQuestion(BaseModel):
    id: str
    question_text: str
    options: List[Dict[str, Any]]
    answer: str
    difficulty: str
    bloom_level: str
    topic: Optional[str] = None

class QuizCreate(BaseModel):
    ruleset_id: str
    question_ids: List[str]
    time_limit: Optional[int] = None  # in minutes

class QuizResponse(BaseModel):
    quiz_id: str
    owner_id: str
    question_ids: List[str]
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    timed: bool
    grading_style: str
    status: str

class AnswerSubmission(BaseModel):
    question_id: str
    selected_answer: str

class QuizResult(BaseModel):
    quiz_id: str
    score: float
    total_questions: int
    correct_answers: int
    time_taken: Optional[int] = None
    answers: List[Dict[str, Any]]

# Dependency to get current user
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        user = supabase.auth.get_user(token)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return user.user
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

# Helper functions
def generate_questions_with_gemini(text: str, config: Dict[str, Any], previous_questions: List[str] = []) -> List[Dict]:
    """Generate questions using Gemini API based on ruleset configuration."""
    
    num_questions = config.get("num_questions", 5)
    difficulty = config.get("hardness", "medium")
    bloom_levels = config.get("bloom_levels", ["remember", "understand"])
    topic = config.get("topic", "general")
    
    system_message = """You are an expert quiz generator. Generate multiple choice questions based on the provided content.
    Provide the JSON response directly without wrapping it in backticks or marking it as a code block.
    Each question should have exactly 4 options with one correct answer."""
    
    prompt = f"""
    Generate {num_questions} multiple choice questions from the following content.
    
    Requirements:
    - Difficulty level: {difficulty}
    - Bloom's taxonomy levels: {', '.join(bloom_levels)}
    - Topic focus: {topic}
    - Each question must have 4 options
    - Avoid these previous questions: {', '.join(previous_questions[:5])}
    
    Content:
    {text[:100]}
    
    Return ONLY a JSON array in this exact format:
    [
        {{
            "question": "What is the capital of France?",
            "options": ["Paris", "London", "Berlin", "Madrid"],
            "answer": "Paris",
            "difficulty": "easy",
            "bloom_level": "remember"
        }}
    ]
    """
    
    try:
        response = model.generate_content(system_message + "\n" + prompt)
        response_text = response.text.strip()
        
        # Clean up response
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]

        print("Gemini Response:", response_text)
        
        questions = json.loads(response_text.strip())
        return questions
    except Exception as e:
        print(f"Error generating questions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate questions: {str(e)}")

# Routes
@app.post("/rulesets", response_model=RulesetResponse, status_code=status.HTTP_201_CREATED)
@app.post("/rulesets/", response_model=RulesetResponse, status_code=status.HTTP_201_CREATED)
async def create_ruleset(ruleset: RulesetCreate, current_user = Depends(get_current_user)):
    """
    Create a new quiz generation ruleset.
    """
    try:
        ruleset_id = str(uuid.uuid4())
        data = {
            "id": ruleset_id,
            "owner_id": current_user.id,
            "name": ruleset.name,
            "config": ruleset.config
        }
        
        result = supabase.table("rulesets").insert(data).execute()
        
        return RulesetResponse(**result.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/rulesets/{ruleset_id}", response_model=RulesetResponse)
async def get_ruleset(ruleset_id: str, current_user = Depends(get_current_user)):
    """
    Get a specific ruleset by ID.
    """
    try:
        result = supabase.table("rulesets").select("*").eq("id", ruleset_id).eq("owner_id", current_user.id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Ruleset not found")
            
        return RulesetResponse(**result.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/rulesets", response_model=List[RulesetResponse])
async def list_rulesets(current_user = Depends(get_current_user)):
    """
    List all rulesets for the current user.
    """
    try:
        result = supabase.table("rulesets").select("*").eq("owner_id", current_user.id).execute()
        return [RulesetResponse(**item) for item in result.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate", status_code=status.HTTP_201_CREATED)
async def generate_questions(request: GenerateQuestionsRequest, current_user = Depends(get_current_user)):
    """
    Generate questions using AI based on file content and ruleset.
    """
    try:
        # Get file content
        file_result = supabase.table("files").select("*").eq("id", request.file_id).eq("owner_id", current_user.id).execute()
        if not file_result.data:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Get document text
        doc_result = supabase.table("documents").select("text").eq("file_id", request.file_id).execute()
        if not doc_result.data:
            raise HTTPException(status_code=404, detail="Document content not found")
        
        text = doc_result.data[0]["text"]
        
        # Get ruleset
        ruleset_result = supabase.table("rulesets").select("*").eq("id", request.ruleset_id).execute()
        if not ruleset_result.data:
            raise HTTPException(status_code=404, detail="Ruleset not found")
        
        config = ruleset_result.data[0]["config"]
        
        # Get previous questions to avoid duplicates
        prev_questions_result = supabase.table("generated_questions").select("question_text").eq("ruleset_id", request.ruleset_id).limit(10).execute()
        previous_questions = [q["question_text"] for q in prev_questions_result.data]
        
        # Generate questions
        questions_data = generate_questions_with_gemini(text, config, previous_questions)
        
        # Store generated questions
        generated_questions = []
        for q_data in questions_data:
            question_id = str(uuid.uuid4())
            
            question_record = {
                "id": question_id,
                "ruleset_id": request.ruleset_id,
                "question_text": q_data["question"],
                "options": q_data["options"],
                "answer": q_data["answer"],
                "difficulty": q_data.get("difficulty", config.get("hardness", "medium")),
                "bloom_level": q_data.get("bloom_level", "understand"),
                "topic": request.topic
            }
            
            supabase.table("generated_questions").insert(question_record).execute()
            
            generated_questions.append(question_record)
        
        return generated_questions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/quizzes", response_model=QuizResponse, status_code=status.HTTP_201_CREATED)
async def create_quiz(quiz: QuizCreate, current_user = Depends(get_current_user)):
    """
    Create a new quiz session.
    """
    try:
        quiz_id = str(uuid.uuid4())
        
        # Get ruleset for grading style
        ruleset_result = supabase.table("rulesets").select("config").eq("id", quiz.ruleset_id).execute()
        grading_style = ruleset_result.data[0]["config"].get("grading_style", "end_only")
        
        data = {
            "quiz_id": quiz_id,
            "owner_id": current_user.id,
            "question_ids": quiz.question_ids,
            "timed": quiz.time_limit is not None,
            "time_limit": quiz.time_limit,
            "grading_style": grading_style,
            "status": "created"
        }
        
        result = supabase.table("quizzes").insert(data).execute()
        
        return QuizResponse(**result.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/quizzes/{quiz_id}/start", response_model=QuizResponse)
async def start_quiz(quiz_id: str, current_user = Depends(get_current_user)):
    """
    Start a quiz session.
    """
    try:
        start_time = datetime.now()
        
        result = supabase.table("quizzes").update({
            "start_time": start_time.isoformat(),
            "status": "in_progress"
        }).eq("quiz_id", quiz_id).eq("owner_id", current_user.id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Quiz not found")
            
        return QuizResponse(**result.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/quizzes/{quiz_id}/answer")
async def submit_answer(quiz_id: str, answer: AnswerSubmission, current_user = Depends(get_current_user)):
    """
    Submit an answer for a quiz question.
    """
    try:
        # Store answer
        supabase.table("quiz_answers").insert({
            "quiz_id": quiz_id,
            "question_id": answer.question_id,
            "selected_answer": answer.selected_answer,
            "answered_at": datetime.now().isoformat()
        }).execute()
        
        return {"message": "Answer submitted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/quizzes/{quiz_id}/finish", response_model=QuizResult)
async def finish_quiz(quiz_id: str, current_user = Depends(get_current_user)):
    """
    Finish a quiz and calculate results.
    """
    try:
        # Get quiz details
        quiz_result = supabase.table("quizzes").select("*").eq("quiz_id", quiz_id).eq("owner_id", current_user.id).execute()
        if not quiz_result.data:
            raise HTTPException(status_code=404, detail="Quiz not found")
        
        quiz_data = quiz_result.data[0]
        
        # Get all answers
        answers_result = supabase.table("quiz_answers").select("*").eq("quiz_id", quiz_id).execute()
        
        # Get correct answers
        questions_result = supabase.table("generated_questions").select("*").in_("id", quiz_data["question_ids"]).execute()
        correct_answers_map = {q["id"]: q["answer"] for q in questions_result.data}
        
        # Calculate score
        correct_count = 0
        answer_details = []
        
        for answer in answers_result.data:
            is_correct = answer["selected_answer"] == correct_answers_map.get(answer["question_id"])
            if is_correct:
                correct_count += 1
            
            answer_details.append({
                "question_id": answer["question_id"],
                "selected_answer": answer["selected_answer"],
                "correct_answer": correct_answers_map.get(answer["question_id"]),
                "is_correct": is_correct
            })
        
        total_questions = len(quiz_data["question_ids"])
        score = (correct_count / total_questions * 100) if total_questions > 0 else 0
        
        # Calculate time taken
        time_taken = None
        if quiz_data.get("start_time"):
            start_time = datetime.fromisoformat(quiz_data["start_time"])
            if start_time.tzinfo is None:
                start_time = start_time.replace(tzinfo=timezone.utc)
            now = datetime.now(timezone.utc)
            time_taken = int((now - start_time).total_seconds() / 60)
        # Update quiz status
        supabase.table("quizzes").update({
            "end_time": datetime.now(timezone.utc).isoformat(),
            "status": "completed",
            "score": score
        }).eq("quiz_id", quiz_id).execute()
        
        return QuizResult(
            quiz_id=quiz_id,
            score=score,
            total_questions=total_questions,
            correct_answers=correct_count,
            time_taken=time_taken,
            answers=answer_details
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "question-service"}

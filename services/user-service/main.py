from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional
import os
from supabase import create_client, Client
from datetime import datetime

# Initialize FastAPI app
app = FastAPI(
    title="User Management Service",
    description="Handles user authentication, profiles, and settings",
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

# Supabase client
supabase: Client = create_client(
    os.getenv("SUPABASE_URL", ""),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
)

# Security
security = HTTPBearer()

# Pydantic Models
class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    role: str
    created_at: datetime

class UserSettingsUpdate(BaseModel):
    preferences: dict

class UserSettings(BaseModel):
    user_id: str
    preferences: dict

# Dependency to get current user
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        # Verify token with Supabase
        user = supabase.auth.get_user(token)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        return user.user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )

# Routes
@app.get("/")
async def root():
    return {"message": "User Management Service", "version": "1.0.0"}

@app.post("/auth/signup", response_model=dict, status_code=status.HTTP_201_CREATED)
async def signup(request: SignupRequest):
    """
    Register a new user with email and password.
    """
    try:
        # Create user in Supabase Auth
        response = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password,
            "options": {
                "data": {
                    "full_name": request.full_name
                }
            }
        })
        
        if response.user:
            # Create user profile in database
            supabase.table("users").insert({
                "id": response.user.id,
                "email": request.email,
                "full_name": request.full_name,
                "role": "user"
            }).execute()
            
            return {
                "message": "User created successfully",
                "user_id": response.user.id,
                "email": request.email
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create user"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@app.post("/auth/login", response_model=dict)
async def login(request: LoginRequest):
    """
    Authenticate user and return access token.
    """
    try:
        response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        
        if response.session:
            return {
                "access_token": response.session.access_token,
                "refresh_token": response.session.refresh_token,
                "token_type": "bearer",
                "expires_in": response.session.expires_in
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

@app.get("/users/me", response_model=UserResponse)
async def get_current_user_profile(current_user = Depends(get_current_user)):
    """
    Get current user profile.
    """
    try:
        result = supabase.table("users").select("*").eq("id", current_user.id).execute()
        if result.data and len(result.data) > 0:
            user_data = result.data[0]
            return UserResponse(
                id=user_data["id"],
                email=user_data["email"],
                full_name=user_data.get("full_name"),
                role=user_data.get("role", "user"),
                created_at=user_data["created_at"]
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.put("/users/me/settings", response_model=UserSettings)
async def update_user_settings(
    settings: UserSettingsUpdate,
    current_user = Depends(get_current_user)
):
    """
    Update user settings and preferences.
    """
    try:
        # Upsert user settings
        result = supabase.table("user_settings").upsert({
            "user_id": current_user.id,
            "preferences": settings.preferences
        }).execute()
        
        if result.data:
            return UserSettings(
                user_id=current_user.id,
                preferences=settings.preferences
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update settings"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.get("/users/me/settings", response_model=UserSettings)
async def get_user_settings(current_user = Depends(get_current_user)):
    """
    Get user settings and preferences.
    """
    try:
        result = supabase.table("user_settings").select("*").eq("user_id", current_user.id).execute()
        
        if result.data and len(result.data) > 0:
            settings = result.data[0]
            return UserSettings(
                user_id=settings["user_id"],
                preferences=settings.get("preferences", {})
            )
        else:
            # Return default settings
            return UserSettings(
                user_id=current_user.id,
                preferences={}
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "user-service"}

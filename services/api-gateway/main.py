from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi import status as fastapi_status

# Initialize FastAPI app
app = FastAPI(
    title="Practice Platform API Gateway",
    description="Central gateway for routing requests to microservices",
    version="1.0.0"
)

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=fastapi_status.HTTP_400_BAD_REQUEST,
        content={"detail": str(exc)},
    )
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
import httpx
import os
from typing import Optional

# Initialize FastAPI app
app = FastAPI(
    title="Practice Platform API Gateway",
    description="Central gateway for routing requests to microservices",
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

# Service URLs
USER_SERVICE_URL = os.getenv("USER_SERVICE_URL", "http://user-service:8001")
FILE_SERVICE_URL = os.getenv("FILE_SERVICE_URL", "http://file-service:8002")
QUESTION_SERVICE_URL = os.getenv("QUESTION_SERVICE_URL", "http://question-service:8003")

# HTTP Client
client = httpx.AsyncClient()

async def proxy_request(url: str, method: str, headers: dict, content: Optional[bytes] = None, params: Optional[dict] = None):
    try:
        # Filter headers to forward
        forward_headers = {
            k: v for k, v in headers.items() 
            if k.lower() not in ['host', 'content-length']
        }
        
        response = await client.request(
            method=method,
            url=url,
            headers=forward_headers,
            content=content,
            params=params,
            timeout=60.0,
            follow_redirects=False
        )
        
        return Response(
            content=response.content,
            status_code=response.status_code,
            headers=dict(response.headers)
        )
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Service unavailable: {str(exc)}"
        )

# Auth & User Routes
@app.api_route("/api/auth/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def auth_proxy(path: str, request: Request):
    url = f"{USER_SERVICE_URL}/auth/{path}"
    return await proxy_request(
        url, 
        request.method, 
        dict(request.headers), 
        await request.body(),
        dict(request.query_params)
    )

@app.api_route("/api/users/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def users_proxy(path: str, request: Request):
    url = f"{USER_SERVICE_URL}/users/{path}"
    return await proxy_request(
        url, 
        request.method, 
        dict(request.headers), 
        await request.body(),
        dict(request.query_params)
    )

# File Routes

# Always forward to /files (no trailing slash) to avoid redirect issues
@app.api_route("/api/files", methods=["GET", "POST", "PUT", "DELETE"])
async def files_root_proxy(request: Request):
    url = f"{FILE_SERVICE_URL}/files"
    return await proxy_request(
        url,
        request.method,
        dict(request.headers),
        await request.body(),
        dict(request.query_params)
    )

@app.api_route("/api/files/", methods=["GET", "POST", "PUT", "DELETE"])
async def files_root_slash_proxy(request: Request):
    url = f"{FILE_SERVICE_URL}/files"
    return await proxy_request(
        url,
        request.method,
        dict(request.headers),
        await request.body(),
        dict(request.query_params)
    )

@app.api_route("/api/files/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def files_proxy(path: str, request: Request):
    url = f"{FILE_SERVICE_URL}/files/{path}"
    return await proxy_request(
        url, 
        request.method, 
        dict(request.headers), 
        await request.body(),
        dict(request.query_params)
    )

# Question & Quiz Routes

@app.api_route("/api/rulesets", methods=["GET", "POST", "PUT", "DELETE"])
async def rulesets_root_proxy(request: Request):
    url = f"{QUESTION_SERVICE_URL}/rulesets"
    return await proxy_request(
        url,
        request.method,
        dict(request.headers),
        await request.body(),
        dict(request.query_params)
    )

@app.api_route("/api/rulesets/", methods=["GET", "POST", "PUT", "DELETE"])
async def rulesets_root_slash_proxy(request: Request):
    url = f"{QUESTION_SERVICE_URL}/rulesets"
    return await proxy_request(
        url,
        request.method,
        dict(request.headers),
        await request.body(),
        dict(request.query_params)
    )

@app.api_route("/api/rulesets/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def rulesets_proxy(path: str, request: Request):
    url = f"{QUESTION_SERVICE_URL}/rulesets/{path}"
    return await proxy_request(
        url,
        request.method,
        dict(request.headers),
        await request.body(),
        dict(request.query_params)
    )

@app.api_route("/api/generate", methods=["POST"])
async def generate_proxy(request: Request):
    url = f"{QUESTION_SERVICE_URL}/generate"
    return await proxy_request(
        url,
        request.method,
        dict(request.headers),
        await request.body(),
        dict(request.query_params)
    )


@app.api_route("/api/quizzes", methods=["GET", "POST", "PUT", "DELETE"])
async def quizzes_root_proxy(request: Request):
    url = f"{QUESTION_SERVICE_URL}/quizzes"
    return await proxy_request(
        url,
        request.method,
        dict(request.headers),
        await request.body(),
        dict(request.query_params)
    )

@app.api_route("/api/quizzes/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def quizzes_proxy(path: str, request: Request):
    url = f"{QUESTION_SERVICE_URL}/quizzes/{path}"
    return await proxy_request(
        url,
        request.method,
        dict(request.headers),
        await request.body(),
        dict(request.query_params)
    )

# Health Check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "api-gateway"}

# Cleanup on shutdown
@app.on_event("shutdown")
async def shutdown_event():
    await client.aclose()

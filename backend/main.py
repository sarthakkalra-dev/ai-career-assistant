import os
import shutil
import re
import json
import urllib.error
import urllib.request

import pymupdf
from docx import Document
from pydantic import BaseModel, field_validator

from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    UploadFile,
    File
)
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from fastapi.security import (
    OAuth2PasswordBearer,
    OAuth2PasswordRequestForm
)

from sqlalchemy.orm import Session
from pydantic import BaseModel
from jose import JWTError, jwt

from app.database import engine, Base, get_db
from app.models import (
    User,
    Resume,
    Job,
    JobMatch,
    JobApplication,
    RoadmapProgress,
    InterviewSession,
    InterviewResult
)

from app.auth import (
    hash_password,
    verify_password,
    create_access_token,
    SECRET_KEY,
    ALGORITHM
)


# ==========================================
# DATABASE
# ==========================================

Base.metadata.create_all(bind=engine)


# ==========================================
# FASTAPI APP
# ==========================================

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="AI Career & Placement Assistant",
    description="AI-powered career assistance platform",
    version="1.0.0"
)


def generate_gemini_response(prompt: str):
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        return None

    model = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{model}:generateContent?key={api_key}"
    )
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 700,
        },
    }
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=25) as response:
            result = json.loads(response.read().decode("utf-8"))
        parts = result.get("candidates", [{}])[0].get("content", {}).get("parts", [])
        text = "".join(part.get("text", "") for part in parts).strip()
        return text or None
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, json.JSONDecodeError):
        return None

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):

    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected server error occurred"
        }
    )

configured_frontend_url = os.getenv("FRONTEND_URL", "")
allowed_origins = [
    origin.strip()
    for origin in configured_frontend_url.split(",")
    if origin.strip()
]
allowed_origins.extend([
    "http://localhost:5173",
    "http://127.0.0.1:5173",
])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# JWT AUTHENTICATION
# ==========================================

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="login"
)


# ==========================================
# UPLOAD DIRECTORY
# ==========================================

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")

os.makedirs(
    UPLOAD_DIR,
    exist_ok=True
)


# ==========================================
# REQUEST MODELS
# ==========================================

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

    @field_validator("name")
    @classmethod
    def validate_name(cls, value):
        value = value.strip()

        if len(value) < 2:
            raise ValueError(
                "Name must contain at least 2 characters"
            )

        return value

    @field_validator("email")
    @classmethod
    def validate_email(cls, value):
        value = value.strip().lower()

        if "@" not in value or "." not in value:
            raise ValueError(
                "Please enter a valid email address"
            )

        return value

    @field_validator("password")
    @classmethod
    def validate_password(cls, value):
        if len(value) < 8:
            raise ValueError(
                "Password must be at least 8 characters"
            )

        return value


class ProfileUpdateRequest(BaseModel):

    name: str | None = None
    phone: str | None = None
    college: str | None = None
    degree: str | None = None
    skills: str | None = None
    graduation_year: int | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value):
        if value is None:
            return value

        value = value.strip()

        if len(value) < 2:
            raise ValueError(
                "Name must contain at least 2 characters"
            )

        return value

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value):
        if value is None:
            return value

        value = value.strip()

        if not value.isdigit():
            raise ValueError(
                "Phone number must contain only digits"
            )

        if len(value) != 10:
            raise ValueError(
                "Phone number must contain exactly 10 digits"
            )

        return value

    @field_validator("graduation_year")
    @classmethod
    def validate_graduation_year(cls, value):
        if value is None:
            return value

        if value < 2000 or value > 2100:
            raise ValueError(
                "Please enter a valid graduation year"
            )

        return value


class JobCreateRequest(BaseModel):
    title: str
    company: str
    location: str | None = None
    job_type: str | None = None
    description: str | None = None
    skills: str


class JobUpdateRequest(BaseModel):
    title: str | None = None
    company: str | None = None
    location: str | None = None
    job_type: str | None = None
    description: str | None = None
    skills: str | None = None


class JobApplicationRequest(BaseModel):
    cover_note: str | None = None


# ==========================================
# GET CURRENT USER
# ==========================================

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get(
            "user_id"
        )

        if user_id is None:

            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

    except JWTError:

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if user is None:

        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user


# ==========================================
# GET ADMIN USER
# ==========================================

def get_admin_user(
    current_user: User = Depends(get_current_user)
):

    if current_user.role != "admin":

        raise HTTPException(
            status_code=403,
            detail="Admin access required."
        )

    return current_user


# ==========================================
# HOME
# ==========================================

@app.get("/")
def home():

    return {
        "message": "AI Career & Placement Assistant API is running!"
    }


# ==========================================
# HEALTH CHECK
# ==========================================

@app.get("/health")
def health_check():

    return {
        "status": "healthy"
    }


# ==========================================
# REGISTER
# ==========================================

@app.post("/register")
def register(
    user_data: RegisterRequest,
    db: Session = Depends(get_db)
):

    existing_user = db.query(User).filter(
        User.email == user_data.email
    ).first()

    if existing_user:

        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    hashed_password = hash_password(
        user_data.password
    )

    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password=hashed_password,
        role="student"
    )

    db.add(new_user)

    db.commit()

    db.refresh(new_user)

    return {
        "message": "Registration successful",
        "user_id": new_user.id
    }


# ==========================================
# LOGIN
# ==========================================

@app.post("/login")
def login(
    login_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    email = login_data.username.strip().lower()
    password = login_data.password

    # Validate email
    if not email or "@" not in email or "." not in email:
        raise HTTPException(
            status_code=400,
            detail="Please enter a valid email address"
        )

    # Validate password
    if not password:
        raise HTTPException(
            status_code=400,
            detail="Password is required"
        )

    user = db.query(User).filter(
        User.email == email
    ).first()

    if not user:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        password,
        user.password
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token = create_access_token({
        "user_id": user.id,
        "email": user.email
    })

    return {
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer"
    }

@app.get("/profile")
def profile(
    current_user: User = Depends(get_current_user)
):

    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "phone": current_user.phone,
        "college": current_user.college,
        "degree": current_user.degree,
        "skills": current_user.skills,
        "graduation_year": current_user.graduation_year
    }


# ==========================================
# UPDATE PROFILE
# ==========================================

@app.put("/profile")
def update_profile(

    profile_data: ProfileUpdateRequest,

    current_user: User = Depends(
        get_current_user
    ),

    db: Session = Depends(get_db)
):

    if profile_data.name is not None:
        current_user.name = profile_data.name

    if profile_data.phone is not None:
        current_user.phone = profile_data.phone

    if profile_data.college is not None:
        current_user.college = profile_data.college

    if profile_data.degree is not None:
        current_user.degree = profile_data.degree

    if profile_data.skills is not None:
        current_user.skills = profile_data.skills

    if profile_data.graduation_year is not None:
        current_user.graduation_year = (
            profile_data.graduation_year
        )

    db.commit()

    db.refresh(current_user)

    return {
        "message": "Profile updated successfully",
        "profile": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role,
            "phone": current_user.phone,
            "college": current_user.college,
            "degree": current_user.degree,
            "skills": current_user.skills,
            "graduation_year": current_user.graduation_year
        }
    }


# ==========================================
# RESUME UPLOAD
# ==========================================

@app.post("/resume/upload")
def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    allowed_extensions = [
        ".pdf",
        ".docx"
    ]

    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

    # Check filename
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Filename is required"
        )

    file_extension = os.path.splitext(
        file.filename
    )[1].lower()

    # Check file extension
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are allowed"
        )

    # Check file size
    file.file.seek(0, os.SEEK_END)
    file_size = file.file.tell()
    file.file.seek(0)

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Resume file size must be 5 MB or less"
        )

    # Check actual file content
    file_header = file.file.read(8)
    file.file.seek(0)

    # PDF validation
    if file_extension == ".pdf":

        if not file_header.startswith(b"%PDF-"):
            raise HTTPException(
                status_code=400,
                detail="Invalid PDF file"
            )

    # DOCX validation
    elif file_extension == ".docx":

        if not file_header.startswith(b"PK"):
            raise HTTPException(
                status_code=400,
                detail="Invalid DOCX file"
            )

    # Generate safe server-side filename
    filename = (
        f"user_{current_user.id}_resume"
        f"{file_extension}"
    )

    file_path = os.path.join(
        UPLOAD_DIR,
        filename
    )

    # Save file
    with open(
        file_path,
        "wb"
    ) as buffer:

        shutil.copyfileobj(
            file.file,
            buffer
        )

    # Remove previous resume record
    db.query(Resume).filter(
        Resume.user_id == current_user.id
    ).delete()

    # Create new resume record
    new_resume = Resume(
        user_id=current_user.id,
        filename=filename,
        file_path=file_path
    )

    db.add(new_resume)

    db.commit()

    db.refresh(new_resume)

    return {
        "message": "Resume uploaded successfully",
        "resume_id": new_resume.id,
        "filename": new_resume.filename,
        "user_id": current_user.id
    }

@app.get("/resume/text")
def extract_resume_text(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    resume = db.query(Resume).filter(
        Resume.user_id == current_user.id
    ).first()

    if resume is None:

        raise HTTPException(
            status_code=404,
            detail="Resume not found. Please upload a resume first."
        )

    file_path = resume.file_path

    if not os.path.exists(file_path):

        raise HTTPException(
            status_code=404,
            detail="Resume file not found on server."
        )

    text = ""

    if file_path.lower().endswith(".pdf"):

        document = pymupdf.open(file_path)

        for page in document:
            text += page.get_text()

        document.close()

    elif file_path.lower().endswith(".docx"):

        document = Document(file_path)

        text = "\n".join(
            paragraph.text
            for paragraph in document.paragraphs
        )

    else:

        raise HTTPException(
            status_code=400,
            detail="Unsupported resume format."
        )

    resume.extracted_text = text

    db.commit()

    db.refresh(resume)

    return {
        "resume_id": resume.id,
        "filename": resume.filename,
        "text": text,
        "text_length": len(text),
        "message": "Resume text extracted and saved successfully"
    }


# ==========================================
# RESUME ANALYSIS
# ==========================================

@app.get("/resume/analyze")
def analyze_resume(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    resume = db.query(Resume).filter(
        Resume.user_id == current_user.id
    ).first()

    if resume is None:

        raise HTTPException(
            status_code=404,
            detail="Resume not found. Please upload a resume first."
        )

    if not resume.extracted_text:

        raise HTTPException(
            status_code=400,
            detail="Resume text not available. Please extract resume text first."
        )

    text = resume.extracted_text.lower()

    skill_database = [
        "python",
        "java",
        "javascript",
        "typescript",
        "c++",
        "c",
        "html",
        "css",
        "react",
        "react.js",
        "react native",
        "node.js",
        "node",
        "express",
        "fastapi",
        "flask",
        "django",
        "sql",
        "mysql",
        "postgresql",
        "mongodb",
        "git",
        "github",
        "docker",
        "aws",
        "azure",
        "machine learning",
        "deep learning",
        "artificial intelligence",
        "tensorflow",
        "pytorch",
        "scikit-learn",
        "pandas",
        "numpy"
    ]

    detected_skills = []

    for skill in skill_database:

        skill_found = False

        if skill in ["c", "c++"]:

            if skill == "c":

                skill_found = any(
                    word in text.split()
                    for word in [
                        "c",
                        "c/c++",
                        "c-language"
                    ]
                )

            else:

                skill_found = "c++" in text

        elif skill == "java":

            skill_found = any(
                phrase in text
                for phrase in [
                    "java programming",
                    "java development",
                    "java developer",
                    "java language",
                    "java project",
                    "java projects"
                ]
            )

        else:

            skill_found = skill in text

        if skill_found:
            detected_skills.append(skill)

    if (
        "react.js" in detected_skills
        and "react" in detected_skills
    ):

        detected_skills.remove("react.js")

    education_keywords = []

    education_terms = [
        "b.tech",
        "btech",
        "bachelor",
        "computer science",
        "engineering",
        "m.tech",
        "mtech",
        "bca",
        "mca",
        "mba",
        "degree"
    ]

    for term in education_terms:

        pattern = (
            r"\b"
            + re.escape(term)
            + r"\b"
        )

        if re.search(pattern, text):

            education_keywords.append(term)

    project_indicators = []

    project_terms = [
        "project",
        "projects",
        "developed",
        "built",
        "application",
        "website"
    ]

    for term in project_terms:

        if term in text:
            project_indicators.append(term)

    target_roles = []

    role_terms = [
        "frontend developer",
        "backend developer",
        "full-stack developer",
        "software engineer",
        "software developer",
        "data analyst",
        "data scientist",
        "machine learning engineer",
        "ai engineer"
    ]

    for role in role_terms:

        if role in text:
            target_roles.append(role)

    score = 0

    if len(detected_skills) >= 5:
        score += 30

    elif len(detected_skills) >= 3:
        score += 20

    elif len(detected_skills) >= 1:
        score += 10

    if len(education_keywords) >= 2:
        score += 20

    elif len(education_keywords) >= 1:
        score += 15

    if len(project_indicators) >= 3:
        score += 20

    elif len(project_indicators) >= 1:
        score += 10

    if len(target_roles) >= 1:
        score += 15

    if len(text) > 1000:
        score += 15

    score = min(
        score,
        100
    )

    resume.analysis_score = score

    db.commit()

    db.refresh(resume)

    return {
        "resume_id": resume.id,
        "resume_score": score,
        "detected_skills": detected_skills,
        "education_keywords": education_keywords,
        "project_indicators": project_indicators,
        "target_roles": target_roles,
        "text_length": len(text),
        "message": "Resume analysis completed and saved successfully"
    }


# ==========================================
# CAREER SKILL GAP
# ==========================================

@app.get("/career/skill-gap")
def career_skill_gap(
    target_role: str = "frontend developer",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    resume = db.query(Resume).filter(
        Resume.user_id == current_user.id
    ).first()

    # Jobs remain browseable before onboarding; matching improves after analysis.
    resume_text = resume.extracted_text.lower() if resume and resume.extracted_text else ""

    role_requirements = {

        "frontend developer": [
            "html",
            "css",
            "javascript",
            "typescript",
            "react",
            "git",
            "rest api",
            "responsive design"
        ],

        "full-stack developer": [
            "html",
            "css",
            "javascript",
            "typescript",
            "react",
            "node.js",
            "sql",
            "rest api",
            "git"
        ],

        "software engineer": [
            "python",
            "java",
            "javascript",
            "sql",
            "git",
            "data structures",
            "algorithms",
            "rest api"
        ],

        "data scientist": [
            "python",
            "sql",
            "pandas",
            "numpy",
            "scikit-learn",
            "machine learning",
            "statistics"
        ],

        "machine learning engineer": [
            "python",
            "numpy",
            "pandas",
            "scikit-learn",
            "machine learning",
            "deep learning",
            "tensorflow",
            "pytorch"
        ]
    }

    target_role = target_role.lower().strip()

    if target_role not in role_requirements:

        raise HTTPException(
            status_code=400,
            detail={
                "message": "Unsupported target role",
                "available_roles": list(
                    role_requirements.keys()
                )
            }
        )

    required_skills = role_requirements[
        target_role
    ]

    current_skills = []

    for skill in required_skills:

        if skill in resume_text:
            current_skills.append(skill)

    missing_skills = [
        skill
        for skill in required_skills
        if skill not in current_skills
    ]

    if len(required_skills) > 0:

        match_percentage = round(
            (
                len(current_skills)
                / len(required_skills)
            ) * 100,
            2
        )

    else:

        match_percentage = 0

    return {

        "target_role": target_role,

        "current_skills": current_skills,

        "required_skills": required_skills,

        "missing_skills": missing_skills,

        "match_percentage": match_percentage,

        "total_required_skills": len(
            required_skills
        ),

        "skills_matched": len(
            current_skills
        ),

        "skills_missing": len(
            missing_skills
        ),

        "message": "Skill gap analysis completed successfully"
    }


# ==========================================
# CAREER ROADMAP
# ==========================================

@app.get("/career/roadmap")
def career_roadmap(
    target_role: str = "frontend developer",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    resume = db.query(Resume).filter(
        Resume.user_id == current_user.id
    ).first()

    if resume is None:

        raise HTTPException(
            status_code=404,
            detail="Resume not found. Please upload a resume first."
        )

    if not resume.extracted_text:

        raise HTTPException(
            status_code=400,
            detail="Resume text not available. Please analyze your resume first."
        )

    target_role = target_role.lower().strip()

    role_requirements = {

        "frontend developer": [
            "html",
            "css",
            "javascript",
            "typescript",
            "react",
            "git",
            "rest api",
            "responsive design"
        ],

        "full-stack developer": [
            "html",
            "css",
            "javascript",
            "typescript",
            "react",
            "node.js",
            "sql",
            "rest api",
            "git"
        ],

        "software engineer": [
            "python",
            "java",
            "javascript",
            "sql",
            "git",
            "data structures",
            "algorithms",
            "rest api"
        ],

        "data scientist": [
            "python",
            "sql",
            "pandas",
            "numpy",
            "scikit-learn",
            "machine learning",
            "statistics"
        ],

        "machine learning engineer": [
            "python",
            "numpy",
            "pandas",
            "scikit-learn",
            "machine learning",
            "deep learning",
            "tensorflow",
            "pytorch"
        ]
    }

    learning_resources = {

        "html":
            "HTML fundamentals and semantic web development",

        "css":
            "CSS, Flexbox, Grid and modern styling",

        "javascript":
            "JavaScript fundamentals and ES6+",

        "typescript":
            "TypeScript types, interfaces and advanced features",

        "react":
            "React components, hooks, state and API integration",

        "git":
            "Git and GitHub version control",

        "rest api":
            "REST API concepts and API integration",

        "responsive design":
            "Responsive web design, Flexbox, Grid and mobile-first development",

        "node.js":
            "Node.js and backend development",

        "sql":
            "SQL queries, joins, indexes and database design",

        "python":
            "Python programming and backend development",

        "java":
            "Java programming and object-oriented programming",

        "data structures":
            "Arrays, linked lists, stacks, queues, trees and graphs",

        "algorithms":
            "Searching, sorting, recursion and algorithmic problem solving",

        "pandas":
            "Data analysis using Pandas",

        "numpy":
            "Numerical computing using NumPy",

        "scikit-learn":
            "Machine learning with Scikit-learn",

        "machine learning":
            "Machine learning fundamentals and model building",

        "statistics":
            "Statistics and probability for data science",

        "deep learning":
            "Neural networks and deep learning",

        "tensorflow":
            "Deep learning using TensorFlow",

        "pytorch":
            "Deep learning using PyTorch"
    }

    if target_role not in role_requirements:

        raise HTTPException(
            status_code=400,
            detail={
                "message": "Unsupported target role",
                "available_roles": list(
                    role_requirements.keys()
                )
            }
        )

    required_skills = role_requirements[
        target_role
    ]

    resume_text = resume.extracted_text.lower()

    current_skills = []

    for skill in required_skills:

        if skill in resume_text:
            current_skills.append(skill)

    missing_skills = [
        skill
        for skill in required_skills
        if skill not in current_skills
    ]

    roadmap = []

    for index, skill in enumerate(
        missing_skills,
        start=1
    ):

        roadmap.append({

            "step": index,

            "skill": skill,

            "topic": learning_resources.get(
                skill,
                f"Learn {skill}"
            ),

            "status": "pending"
        })

    if not roadmap:

        roadmap.append({

            "step": 1,

            "skill": "advanced preparation",

            "topic":
                f"Advanced {target_role} projects, "
                "interview preparation and system design",

            "status": "recommended"
        })

    ai_prompt = f"""You are a Google-style career coach. Create practical guidance for a candidate targeting {target_role}.
Current skills: {', '.join(current_skills) or 'none detected'}
Missing skills: {', '.join(missing_skills) or 'none'}
Roadmap steps: {', '.join(item['skill'] for item in roadmap)}

Return a concise response with exactly these headings:
Why this order
How to practice
Google-style preparation
Use original advice and do not claim to speak for Google."""
    ai_response = generate_gemini_response(ai_prompt)

    return {

        "target_role": target_role,

        "current_skills": current_skills,

        "missing_skills": missing_skills,

        "roadmap": roadmap,

        "total_steps": len(roadmap),

        "ai_response": ai_response,

        "ai_provider": "Google Gemini" if ai_response else "Local roadmap engine",

        "message": "Career roadmap generated successfully"
    }


@app.get("/career/roadmap/progress")
def get_roadmap_progress(
    target_role: str = "frontend developer",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_role = target_role.lower().strip()
    progress = db.query(RoadmapProgress).filter(
        RoadmapProgress.user_id == current_user.id,
        RoadmapProgress.target_role == target_role,
        RoadmapProgress.completed == 1,
    ).all()
    return {"target_role": target_role, "completed_skills": [item.skill for item in progress]}


@app.put("/career/roadmap/progress")
def update_roadmap_progress(
    target_role: str,
    skill: str,
    completed: bool,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_role = target_role.lower().strip()
    skill = skill.lower().strip()
    progress = db.query(RoadmapProgress).filter(
        RoadmapProgress.user_id == current_user.id,
        RoadmapProgress.target_role == target_role,
        RoadmapProgress.skill == skill,
    ).first()

    if progress is None:
        progress = RoadmapProgress(
            user_id=current_user.id,
            target_role=target_role,
            skill=skill,
            completed=int(completed),
        )
        db.add(progress)
    else:
        progress.completed = int(completed)

    db.commit()
    return {"target_role": target_role, "skill": skill, "completed": completed}


# ==========================================
# JOB RECOMMENDATIONS
# ==========================================

@app.get("/jobs/recommendations")
def job_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    resume = db.query(Resume).filter(
        Resume.user_id == current_user.id
    ).first()

    if resume is None:

        raise HTTPException(
            status_code=404,
            detail="Resume not found. Please upload a resume first."
        )

    if not resume.extracted_text:

        raise HTTPException(
            status_code=400,
            detail="Resume text not available. Please analyze your resume first."
        )

    resume_text = resume.extracted_text.lower()

    jobs = db.query(Job).all()

    if not jobs:

        raise HTTPException(
            status_code=404,
            detail="No jobs found in database."
        )

    recommendations = []

    for job in jobs:

        required_skills = [
            skill.strip().lower()
            for skill in job.skills.split(",")
            if skill.strip()
        ]

        matched_skills = []

        missing_skills = []

        for skill in required_skills:

            if skill in resume_text:
                matched_skills.append(skill)

            else:
                missing_skills.append(skill)

        if required_skills:

            match_percentage = round(
                (
                    len(matched_skills)
                    / len(required_skills)
                ) * 100,
                2
            )

        else:

            match_percentage = 0

        existing_match = db.query(
            JobMatch
        ).filter(
            JobMatch.user_id == current_user.id,
            JobMatch.job_id == job.id
        ).first()

        if existing_match:

            existing_match.match_percentage = (
                match_percentage
            )

            existing_match.matched_skills = (
                ",".join(matched_skills)
            )

            existing_match.missing_skills = (
                ",".join(missing_skills)
            )

        else:

            new_match = JobMatch(

                user_id=current_user.id,

                job_id=job.id,

                match_percentage=match_percentage,

                matched_skills=",".join(
                    matched_skills
                ),

                missing_skills=",".join(
                    missing_skills
                )
            )

            db.add(new_match)

        recommendations.append({

            "job_id": job.id,

            "title": job.title,

            "company": job.company,

            "location": job.location,

            "job_type": job.job_type,

            "description": job.description,

            "required_skills": required_skills,

            "matched_skills": matched_skills,

            "missing_skills": missing_skills,

            "match_percentage": match_percentage
        })

    db.commit()

    recommendations.sort(
        key=lambda job: job["match_percentage"],
        reverse=True
    )

    return {

        "total_jobs": len(
            recommendations
        ),

        "recommendations": recommendations,

        "message":
            "Job recommendations generated successfully",

        "resume_analyzed": bool(resume_text)
    }


# ==========================================
# JOB APPLICATIONS
# ==========================================

@app.get("/jobs/applications")
def get_job_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    applications = db.query(JobApplication).filter(
        JobApplication.user_id == current_user.id
    ).order_by(
        JobApplication.applied_at.desc()
    ).all()

    return {
        "applications": [
            {
                "id": application.id,
                "job_id": application.job_id,
                "status": application.status,
                "cover_note": application.cover_note,
                "applied_at": application.applied_at,
            }
            for application in applications
        ],
        "total_applications": len(applications),
    }


@app.post("/jobs/{job_id}/apply")
def apply_to_job(
    job_id: int,
    application_data: JobApplicationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    job = db.query(Job).filter(Job.id == job_id).first()

    if job is None:
        raise HTTPException(status_code=404, detail="Job not found.")

    existing_application = db.query(JobApplication).filter(
        JobApplication.user_id == current_user.id,
        JobApplication.job_id == job_id,
    ).first()

    if existing_application:
        raise HTTPException(
            status_code=409,
            detail="You have already applied to this job."
        )

    cover_note = application_data.cover_note.strip() if application_data.cover_note else None

    application = JobApplication(
        user_id=current_user.id,
        job_id=job_id,
        cover_note=cover_note,
    )

    db.add(application)
    db.commit()
    db.refresh(application)

    return {
        "message": "Application submitted successfully.",
        "application": {
            "id": application.id,
            "job_id": application.job_id,
            "status": application.status,
            "applied_at": application.applied_at,
        },
    }


# ==========================================
# START INTERVIEW
# ==========================================

@app.post("/interview/start")
def start_interview(
    target_role: str = "frontend developer",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    target_role = target_role.lower().strip()

    question_bank = {

        # Original, public interview-style prompts covering the core areas
        # commonly assessed in large-scale software interviews.
        "frontend developer": [
            "How would you build an accessible, responsive navigation system?",
            "Explain the CSS box model and how box-sizing changes layout behavior.",
            "When would you choose CSS Grid over Flexbox?",
            "How do closures and lexical scope work in JavaScript?",
            "What is the event loop and how do promises use it?",
            "How would you reduce the initial load time of a web application?",
            "How do React reconciliation and keys affect rendering?",
            "When should state live locally, in context, or in a server cache?",
            "How would you design resilient loading, error, and empty states?",
            "How do you prevent unnecessary React renders?",
            "How would you test a component that fetches and displays API data?",
            "How would you make a frontend application secure against XSS?"
        ],

        "full-stack developer": [
            "Design a URL shortener and explain the main API and database choices.",
            "How would you design authentication and refresh-token rotation?",
            "What makes an HTTP API idempotent, and why does that matter?",
            "How would you version a public API without breaking clients?",
            "Explain database indexes and when an index can hurt performance.",
            "How would you model users, roles, and permissions?",
            "How would you prevent SQL injection and validate request data?",
            "What belongs in a background job instead of a web request?",
            "How would you diagnose a slow endpoint across frontend and backend?",
            "How would you design pagination for a large result set?",
            "How would you deploy a web application with zero-downtime releases?",
            "How would you monitor reliability and troubleshoot production errors?"
        ],

        "software engineer": [
            "How would you find the first non-repeating character in a string?",
            "Compare hash tables, balanced trees, and arrays for lookup workloads.",
            "How would you detect a cycle in a linked list?",
            "Explain breadth-first search and depth-first search with use cases.",
            "How do you reason about time and space complexity?",
            "When is dynamic programming a better choice than greedy search?",
            "How would you design an LRU cache?",
            "What trade-offs exist between threads, processes, and asynchronous I/O?",
            "Explain immutability, encapsulation, and polymorphism with examples.",
            "How would you make a concurrent counter safe?",
            "How would you test an algorithm beyond its happy path?",
            "Design a rate limiter and explain its correctness trade-offs."
        ],

        "data scientist": [
            "How would you frame a business problem as a measurable data problem?",
            "How do you choose between classification, regression, and ranking?",
            "Explain bias, variance, and how cross-validation helps estimate risk.",
            "How would you handle missing values and outliers?",
            "When can accuracy be a misleading evaluation metric?",
            "How would you detect data leakage before model training?",
            "How do precision, recall, and threshold selection affect decisions?",
            "How would you design an experiment and determine sample size?",
            "How would you explain a model prediction to a non-technical stakeholder?",
            "What causes a distribution shift after deployment?",
            "How would you optimize a slow Pandas transformation?",
            "How would you monitor a data product after launch?"
        ],

        "machine learning engineer": [
            "Design an end-to-end pipeline for training and serving a model.",
            "How would you choose a baseline before trying a complex model?",
            "Explain gradient descent and what affects its convergence.",
            "How do regularization and dropout reduce overfitting?",
            "How would you handle class imbalance in training and evaluation?",
            "How would you build reproducible training experiments?",
            "What are the trade-offs between batch, online, and streaming inference?",
            "How would you detect training-serving skew?",
            "How would you reduce model latency while preserving quality?",
            "How would you monitor drift, quality, and fairness in production?",
            "When would you choose TensorFlow, PyTorch, or a simpler approach?",
            "How would you safely roll back a model after a bad deployment?"
        ]
    }

    if target_role not in question_bank:

        raise HTTPException(
            status_code=400,
            detail={
                "message": "Unsupported target role",
                "available_roles": list(
                    question_bank.keys()
                )
            }
        )

    interview_session = InterviewSession(

        user_id=current_user.id,

        target_role=target_role,

        score=None
    )

    db.add(interview_session)

    db.commit()

    db.refresh(interview_session)

    questions = question_bank[
        target_role
    ]

    for question in questions:

        result = InterviewResult(

            session_id=interview_session.id,

            question=question,

            answer=None,

            evaluation=None,

            score=None
        )

        db.add(result)

    db.commit()

    return {

        "session_id":
            interview_session.id,

        "target_role":
            target_role,

        "total_questions":
            len(questions),

        "questions": [

            {
                "question_number": index,
                "question": question
            }

            for index, question
            in enumerate(
                questions,
                start=1
            )
        ],

        "message":
            "Interview session started successfully"
    }


# ==========================================
# SUBMIT INTERVIEW ANSWER
# ==========================================

@app.post("/interview/answer")
def submit_interview_answer(
    session_id: int,
    question_number: int,
    answer: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    session = db.query(
        InterviewSession
    ).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id
    ).first()

    if session is None:

        raise HTTPException(
            status_code=404,
            detail="Interview session not found."
        )

    results = db.query(
        InterviewResult
    ).filter(
        InterviewResult.session_id == session_id
    ).order_by(
        InterviewResult.id
    ).all()

    if (
        question_number < 1
        or question_number > len(results)
    ):

        raise HTTPException(
            status_code=400,
            detail="Invalid question number."
        )

    if not answer or not answer.strip():

        raise HTTPException(
            status_code=400,
            detail="Answer cannot be empty."
        )

    result = results[
        question_number - 1
    ]

    answer_text = answer.strip()

    answer_lower = answer_text.lower()

    keyword_map = {

        "html": [
            "html",
            "html5",
            "semantic",
            "doctype",
            "canvas",
            "audio",
            "video"
        ],

        "flexbox": [
            "flexbox",
            "flex",
            "one dimensional",
            "one-dimensional",
            "layout",
            "align-items",
            "justify-content"
        ],

        "javascript": [
            "javascript",
            "let",
            "const",
            "var",
            "scope",
            "hoisting",
            "block scope"
        ],

        "react components": [
            "component",
            "react",
            "props",
            "state",
            "jsx"
        ],

        "react hooks": [
            "hook",
            "useeffect",
            "usestate",
            "usecontext",
            "state",
            "lifecycle"
        ],

        "virtual dom": [
            "virtual dom",
            "dom",
            "virtual",
            "diffing",
            "reconciliation",
            "render"
        ],

        "rest api": [
            "rest",
            "api",
            "http",
            "get",
            "post",
            "put",
            "delete",
            "fetch",
            "axios",
            "json"
        ],

        "responsive design": [
            "responsive",
            "mobile",
            "desktop",
            "tablet",
            "media query",
            "flexbox",
            "grid",
            "breakpoint"
        ],

        "system design": [
            "api", "database", "cache", "scalability", "latency", "availability", "service"
        ],

        "authentication": [
            "authentication", "token", "refresh", "session", "password", "oauth", "permission"
        ],

        "database design": [
            "database", "index", "sql", "schema", "query", "pagination", "normalization"
        ],

        "algorithms": [
            "algorithm", "array", "linked list", "hash", "tree", "graph", "complexity", "search", "sort"
        ],

        "concurrency": [
            "thread", "process", "concurrent", "async", "race", "lock", "parallel"
        ],

        "machine learning": [
            "model", "training", "prediction", "feature", "gradient", "regularization", "overfitting", "inference"
        ],

        "data science": [
            "data", "classification", "regression", "precision", "recall", "experiment", "cross-validation", "pandas"
        ]
    }

    question_lower = result.question.lower()

    detected_keywords = []

    for topic, keywords in keyword_map.items():

        topic_found = False

        for keyword in keywords:

            if keyword in question_lower:

                topic_found = True

                break

        if topic_found:

            detected_keywords = keywords

            break

    matched_keywords = []

    for keyword in detected_keywords:

        if keyword in answer_lower:

            matched_keywords.append(
                keyword
            )

    matched_keywords = list(
        dict.fromkeys(
            matched_keywords
        )
    )

    keyword_count = len(
        matched_keywords
    )

    word_count = len(
        answer_text.split()
    )

    if word_count < 5:

        score = 2

        evaluation = (
            "Answer is too short. "
            "Provide a detailed technical explanation."
        )

    elif (
        keyword_count >= 4
        and word_count >= 40
    ):

        score = 10

        evaluation = (
            "Excellent answer. "
            "It contains relevant technical concepts "
            "and sufficient explanation."
        )

    elif (
        keyword_count >= 3
        and word_count >= 25
    ):

        score = 8

        evaluation = (
            "Good answer. "
            "The answer contains several relevant technical concepts. "
            "Add more examples for a stronger response."
        )

    elif (
        keyword_count >= 2
        and word_count >= 15
    ):

        score = 6

        evaluation = (
            "Average answer. "
            "Some relevant concepts are present, "
            "but the explanation could be more detailed."
        )

    elif keyword_count >= 1:

        score = 4

        evaluation = (
            "Partially relevant answer. "
            "More technical details and examples are needed."
        )

    else:

        score = 2

        evaluation = (
            "The answer does not contain enough relevant "
            "technical concepts."
        )

    ai_prompt = f"""You are a rigorous Google-style technical interviewer evaluating a {session.target_role} candidate.
Question: {result.question}
Candidate answer: {answer_text}
Local score: {score}/10

Give concise, constructive feedback with exactly these headings:
Assessment
What was good
What to improve
Ideal answer direction
Do not claim to be an official Google interviewer or reveal private interview material."""
    ai_response = generate_gemini_response(ai_prompt)

    result.answer = answer_text

    result.evaluation = evaluation

    result.score = score

    db.commit()

    db.refresh(result)

    return {

        "session_id":
            session_id,

        "question_number":
            question_number,

        "question":
            result.question,

        "answer":
            result.answer,

        "matched_keywords":
            matched_keywords,

        "keyword_count":
            keyword_count,

        "word_count":
            word_count,

        "evaluation":
            result.evaluation,

        "score":
            result.score,

        "ai_response": ai_response,

        "ai_provider": "Google Gemini" if ai_response else "Local evaluator",

        "message":
            "Answer evaluated and saved successfully"
    }


# ==========================================
# INTERVIEW RESULT
# ==========================================

@app.get("/interview/result/{session_id}")
def get_interview_result(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    session = db.query(
        InterviewSession
    ).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id
    ).first()

    if session is None:

        raise HTTPException(
            status_code=404,
            detail="Interview session not found."
        )

    results = db.query(
        InterviewResult
    ).filter(
        InterviewResult.session_id == session_id
    ).order_by(
        InterviewResult.id
    ).all()

    if not results:

        raise HTTPException(
            status_code=404,
            detail="No interview questions found."
        )

    answered_results = [
        result
        for result in results
        if result.answer is not None
    ]

    if not answered_results:

        raise HTTPException(
            status_code=400,
            detail="No answers submitted yet."
        )

    total_score = sum(
        result.score or 0
        for result in answered_results
    )

    maximum_score = (
        len(answered_results) * 10
    )

    overall_percentage = round(
        (
            total_score
            / maximum_score
        ) * 100,
        2
    )

    session.score = (
        overall_percentage
    )

    db.commit()

    db.refresh(session)

    question_results = []

    for index, result in enumerate(
        answered_results,
        start=1
    ):

        question_results.append({

            "question_number":
                index,

            "question":
                result.question,

            "answer":
                result.answer,

            "evaluation":
                result.evaluation,

            "score":
                result.score
        })

    return {

        "session_id":
            session.id,

        "target_role":
            session.target_role,

        "answered_questions":
            len(answered_results),

        "total_questions":
            len(results),

        "total_score":
            total_score,

        "maximum_score":
            maximum_score,

        "overall_percentage":
            overall_percentage,

        "question_results":
            question_results,

        "message":
            "Interview result calculated successfully"
    }


# ============================================================
# ADMIN SECTION
# ============================================================


# ==========================================
# ADMIN - DASHBOARD SUMMARY
# ==========================================

@app.get("/admin/dashboard")
def admin_dashboard(
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):

    total_users = db.query(User).count()

    total_resumes = db.query(
        Resume
    ).count()

    total_jobs = db.query(
        Job
    ).count()

    total_interviews = db.query(
        InterviewSession
    ).count()

    return {

        "admin": admin_user.email,

        "total_users":
            total_users,

        "total_resumes":
            total_resumes,

        "total_jobs":
            total_jobs,

        "total_interviews":
            total_interviews,

        "message":
            "Admin dashboard data retrieved successfully"
    }


# ==========================================
# ADMIN - VIEW USERS
# ==========================================

@app.get("/admin/users")
def admin_users(
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):

    users = db.query(
        User
    ).order_by(
        User.id
    ).all()

    return {

        "total_users":
            len(users),

        "users": [

            {
                "id":
                    user.id,

                "name":
                    user.name,

                "email":
                    user.email,

                "role":
                    user.role,

                "phone":
                    user.phone,

                "college":
                    user.college,

                "degree":
                    user.degree,

                "skills":
                    user.skills,

                "graduation_year":
                    user.graduation_year
            }

            for user in users
        ],

        "message":
            "Users retrieved successfully"
    }


# ==========================================
# ADMIN - VIEW RESUMES
# ==========================================

@app.get("/admin/resumes")
def admin_resumes(
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):

    resumes = db.query(
        Resume
    ).order_by(
        Resume.id
    ).all()

    return {

        "total_resumes":
            len(resumes),

        "resumes": [

            {
                "id":
                    resume.id,

                "user_id":
                    resume.user_id,

                "filename":
                    resume.filename,

                "analysis_score":
                    resume.analysis_score,

                "uploaded_at":
                    resume.uploaded_at
            }

            for resume in resumes
        ],

        "message":
            "Resumes retrieved successfully"
    }


# ==========================================
# ADMIN - VIEW JOBS
# ==========================================

@app.get("/admin/jobs")
def admin_jobs(
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):

    jobs = db.query(
        Job
    ).order_by(
        Job.id
    ).all()

    return {

        "total_jobs":
            len(jobs),

        "jobs": [

            {
                "id":
                    job.id,

                "title":
                    job.title,

                "company":
                    job.company,

                "location":
                    job.location,

                "job_type":
                    job.job_type,

                "description":
                    job.description,

                "skills":
                    job.skills
            }

            for job in jobs
        ],

        "message":
            "Jobs retrieved successfully"
    }


# ==========================================
# ADMIN - ADD JOB
# ==========================================

@app.post("/admin/jobs")
def admin_add_job(
    job_data: JobCreateRequest,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):

    new_job = Job(

        title=job_data.title,

        company=job_data.company,

        location=job_data.location,

        job_type=job_data.job_type,

        description=job_data.description,

        skills=job_data.skills
    )

    db.add(new_job)

    db.commit()

    db.refresh(new_job)

    return {

        "message":
            "Job added successfully",

        "job": {

            "id":
                new_job.id,

            "title":
                new_job.title,

            "company":
                new_job.company,

            "location":
                new_job.location,

            "job_type":
                new_job.job_type,

            "description":
                new_job.description,

            "skills":
                new_job.skills
        }
    }


# ==========================================
# ADMIN - UPDATE JOB
# ==========================================

@app.put("/admin/jobs/{job_id}")
def admin_update_job(
    job_id: int,
    job_data: JobUpdateRequest,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):

    job = db.query(
        Job
    ).filter(
        Job.id == job_id
    ).first()

    if job is None:

        raise HTTPException(
            status_code=404,
            detail="Job not found."
        )

    if job_data.title is not None:
        job.title = job_data.title

    if job_data.company is not None:
        job.company = job_data.company

    if job_data.location is not None:
        job.location = job_data.location

    if job_data.job_type is not None:
        job.job_type = job_data.job_type

    if job_data.description is not None:
        job.description = job_data.description

    if job_data.skills is not None:
        job.skills = job_data.skills

    db.commit()

    db.refresh(job)

    return {

        "message":
            "Job updated successfully",

        "job": {

            "id":
                job.id,

            "title":
                job.title,

            "company":
                job.company,

            "location":
                job.location,

            "job_type":
                job.job_type,

            "description":
                job.description,

            "skills":
                job.skills
        }
    }


# ==========================================
# ADMIN - DELETE JOB
# ==========================================

@app.delete("/admin/jobs/{job_id}")
def admin_delete_job(
    job_id: int,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):

    job = db.query(
        Job
    ).filter(
        Job.id == job_id
    ).first()

    if job is None:

        raise HTTPException(
            status_code=404,
            detail="Job not found."
        )

    db.query(
        JobMatch
    ).filter(
        JobMatch.job_id == job_id
    ).delete()

    db.delete(job)

    db.commit()

    return {

        "message":
            "Job deleted successfully",

        "job_id":
            job_id
    }


# ==========================================
# ADMIN - VIEW INTERVIEW SESSIONS
# ==========================================

@app.get("/admin/interviews")
def admin_interviews(
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):

    sessions = db.query(
        InterviewSession
    ).order_by(
        InterviewSession.id
    ).all()

    return {

        "total_interviews":
            len(sessions),

        "interviews": [

            {
                "id":
                    session.id,

                "user_id":
                    session.user_id,

                "target_role":
                    session.target_role,

                "score":
                    session.score,

                "created_at":
                    session.created_at
            }

            for session in sessions
        ],

        "message":
            "Interview sessions retrieved successfully"
    }
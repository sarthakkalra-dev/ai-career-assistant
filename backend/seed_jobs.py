from app.database import SessionLocal
from app.models import Job


jobs = [
    {
        "title": "Frontend Developer Intern",
        "company": "Tech Solutions",
        "location": "Remote",
        "job_type": "Internship",
        "description": "Frontend development internship working with modern web technologies.",
        "skills": "html,css,javascript,react,git"
    },
    {
        "title": "React Developer Intern",
        "company": "Web Innovations",
        "location": "Delhi NCR",
        "job_type": "Internship",
        "description": "Work on React applications and integrate REST APIs.",
        "skills": "javascript,typescript,react,git,rest api"
    },
    {
        "title": "Full Stack Developer Intern",
        "company": "Startup Labs",
        "location": "Gurugram",
        "job_type": "Internship",
        "description": "Build full-stack applications using React and backend technologies.",
        "skills": "javascript,react,node.js,sql,rest api,git"
    },
    {
        "title": "Python Backend Developer Intern",
        "company": "AI Technologies",
        "location": "Remote",
        "job_type": "Internship",
        "description": "Develop backend APIs and database-driven applications using Python.",
        "skills": "python,fastapi,flask,sql,rest api,git"
    },
    {
        "title": "Software Engineer Intern",
        "company": "Digital Systems",
        "location": "Noida",
        "job_type": "Internship",
        "description": "Software engineering internship involving programming and problem solving.",
        "skills": "python,java,sql,git,data structures,algorithms"
    },
    {
        "title": "Junior React Developer",
        "company": "Frontend Labs",
        "location": "Delhi",
        "job_type": "Full-time",
        "description": "Build responsive React applications and reusable frontend components.",
        "skills": "html,css,javascript,react,typescript,git"
    }
]


db = SessionLocal()

try:
    existing_jobs = db.query(Job).count()

    if existing_jobs > 0:
        print(f"Jobs already exist in database: {existing_jobs}")
        print("No new jobs were added.")
    else:
        for job_data in jobs:
            job = Job(**job_data)
            db.add(job)

        db.commit()

        print(f"Successfully added {len(jobs)} jobs to database.")

finally:
    db.close()
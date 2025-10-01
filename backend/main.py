from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

with open("form-submissions.json", "r", encoding='utf-8') as f:
    raw_candidates = json.load(f)

class Education(BaseModel):
    highest_level: str
    isTop50: Optional[bool] = None

class Candidate(BaseModel):
    id: int
    name: str
    skills: list
    experience: int  # This will now be calculated
    location: str
    education: Education
    diversity: str

class RankRequest(BaseModel):
    selectedIds: List[int]
    limit: int

candidates = []
for idx, c in enumerate(raw_candidates):
    # FIX: Calculate experience by counting the number of jobs
    experience_years = len(c.get("work_experiences", []))
    
    candidates.append(Candidate(
        id=idx,
        name=c.get("name", f"Candidate {idx}"),
        skills=c.get("skills", []),
        experience=experience_years, # Use the calculated value
        location=c.get("location", ""),
        # Provide a default for education in case it's missing
        education=c.get("education", {"highest_level": "N/A", "isTop50": False}),
        # The diversity field is missing in the JSON, so we default it
        diversity=c.get("diversity", "Not Specified")
    ))

print(f"Successfully loaded and parsed {len(candidates)} candidates.")

@app.get("/candidates")
def get_candidates():
    return [c.dict() for c in candidates]

@app.post("/rank")
def get_ranked_candidates(request_data: RankRequest):
    print(f"\n--- RANK REQUEST RECEIVED ---")
    print(f"Limit: {request_data.limit}, Selected IDs: {request_data.selectedIds}")

    selected = [c for c in candidates if c.id in request_data.selectedIds]
    print(f"Found {len(selected)} matching candidates from the master list.")
    
    if not selected:
        print("No candidates were selected. Returning empty list.")
        return []

    ranked_list = []
    for c in selected:
        score = len(c.skills)*2 + min(c.experience, 10) + (1 if c.diversity != "Not Specified" else 0)
        ranked_list.append({**c.dict(), "score": score})
        
    ranked_list.sort(key=lambda x: x["score"], reverse=True)
    
    final_results = ranked_list[:request_data.limit]
    
    print(f"Returning top {len(final_results)} candidates.")
    print("---------------------------\n")
    
    return final_results
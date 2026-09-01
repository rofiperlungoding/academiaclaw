import uuid
from datetime import datetime, timezone
import aiosqlite
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any

from backend.app.core.database import get_db
from backend.app.core.security import hash_password, verify_password, create_access_token, get_current_user_token
from backend.app.models.schemas import UserRegisterRequest, UserLoginRequest, UserResponse, AuthResponse

router = APIRouter(prefix="/api/auth", tags=["Authentication & User Session"])

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(req: UserRegisterRequest, db: aiosqlite.Connection = Depends(get_db)):
    # Check if NIM exists
    cur = await db.execute("SELECT id FROM users WHERE nim = ?", (req.nim.strip(),))
    existing = await cur.fetchone()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"NIM {req.nim} sudah terdaftar. Silakan gunakan NIM lain atau login."
        )

    user_id = str(uuid.uuid4())
    pw_hash = hash_password(req.password)
    now = datetime.now(timezone.utc).isoformat()

    await db.execute("""
        INSERT INTO users (id, nim, name, email, faculty, program, university, password_hash, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user_id,
        req.nim.strip(),
        req.name.strip(),
        req.email.strip() if req.email else "",
        req.faculty.strip() if req.faculty else "Fakultas Ilmu Komputer",
        req.program.strip() if req.program else "Teknik Komputer",
        req.university.strip() if req.university else "Universitas Brawijaya",
        pw_hash,
        now
    ))
    await db.commit()

    token_data = {
        "sub": user_id,
        "nim": req.nim.strip(),
        "name": req.name.strip(),
    }
    access_token = create_access_token(token_data)

    return AuthResponse(
        user=UserResponse(
            id=user_id,
            nim=req.nim.strip(),
            name=req.name.strip(),
            email=req.email.strip() if req.email else "",
            faculty=req.faculty.strip() if req.faculty else "Fakultas Ilmu Komputer",
            program=req.program.strip() if req.program else "Teknik Komputer",
            university=req.university.strip() if req.university else "Universitas Brawijaya",
            created_at=datetime.fromisoformat(now)
        ),
        access_token=access_token,
        token_type="bearer"
    )

@router.post("/login", response_model=AuthResponse)
async def login(req: UserLoginRequest, db: aiosqlite.Connection = Depends(get_db)):
    cur = await db.execute("""
        SELECT id, nim, name, email, faculty, program, university, password_hash, created_at
        FROM users WHERE nim = ?
    """, (req.nim.strip(),))
    row = await cur.fetchone()

    if not row or not verify_password(req.password, row["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="NIM atau password salah. Silakan periksa kembali."
        )

    token_data = {
        "sub": row["id"],
        "nim": row["nim"],
        "name": row["name"],
    }
    access_token = create_access_token(token_data)

    return AuthResponse(
        user=UserResponse(
            id=row["id"],
            nim=row["nim"],
            name=row["name"],
            email=row["email"] or "",
            faculty=row["faculty"] or "Fakultas Ilmu Komputer",
            program=row["program"] or "Teknik Komputer",
            university=row["university"] or "Universitas Brawijaya",
            created_at=datetime.fromisoformat(row["created_at"]) if isinstance(row["created_at"], str) else row["created_at"]
        ),
        access_token=access_token,
        token_type="bearer"
    )

@router.get("/me", response_model=UserResponse)
async def get_me(
    token_payload: Dict[str, Any] = Depends(get_current_user_token),
    db: aiosqlite.Connection = Depends(get_db)
):
    user_id = token_payload.get("sub")
    cur = await db.execute("""
        SELECT id, nim, name, email, faculty, program, university, created_at
        FROM users WHERE id = ?
    """, (user_id,))
    row = await cur.fetchone()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data pengguna tidak ditemukan."
        )

    return UserResponse(
        id=row["id"],
        nim=row["nim"],
        name=row["name"],
        email=row["email"] or "",
        faculty=row["faculty"] or "Fakultas Ilmu Komputer",
        program=row["program"] or "Teknik Komputer",
        university=row["university"] or "Universitas Brawijaya",
        created_at=datetime.fromisoformat(row["created_at"]) if isinstance(row["created_at"], str) else row["created_at"]
    )

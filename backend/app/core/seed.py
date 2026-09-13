import asyncio
import uuid
from datetime import datetime, timezone, timedelta
import aiosqlite
from backend.app.core.config import settings
from backend.app.core.security import hash_password

# Placeholder demo account. Not a real person or a real student ID.
DEMO_NIM = "2200000001"
DEMO_PASSWORD = "demo1234"

async def seed_data():
    async with aiosqlite.connect(settings.database_url) as db:
        db.row_factory = aiosqlite.Row
        
        # Check if user exists
        cur = await db.execute("SELECT COUNT(*) FROM users")
        user_count = (await cur.fetchone())[0]

        # Check if tasks exist
        cur = await db.execute("SELECT COUNT(*) FROM academic_tasks")
        task_count = (await cur.fetchone())[0]
        
        # Check if flashcards exist
        cur = await db.execute("SELECT COUNT(*) FROM flashcards")
        card_count = (await cur.fetchone())[0]
        
        now = datetime.now(timezone.utc)

        cur = await db.execute("SELECT id FROM users WHERE nim = ?", (DEMO_NIM,))
        row = await cur.fetchone()
        user_id = row["id"] if row else str(uuid.uuid4())

        if user_count == 0:
            pw_hash = hash_password(DEMO_PASSWORD)
            await db.execute("""
                INSERT INTO users (id, nim, name, email, faculty, program, university, password_hash, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                user_id,
                DEMO_NIM,
                "John Doe",
                "john.doe@example.edu",
                "Faculty of Computer Science",
                "Computer Science",
                "Example University",
                pw_hash,
                now.isoformat()
            ))
            print(f"Seeded demo user (NIM: {DEMO_NIM}, password: demo1234).")
        
        if task_count == 0:
            tasks = [
                (
                    str(uuid.uuid4()),
                    "Lab 4: AVL Tree and balancer implementation in C++",
                    "Data Structures and Algorithms",
                    "Lab",
                    (now + timedelta(days=2, hours=4)).isoformat(),
                    "high",
                    "pending",
                    "Include LL, RR, LR and RL rotations plus a benchmark test",
                    None,
                    now.isoformat()
                ),
                (
                    str(uuid.uuid4()),
                    "Assignment: Booth multiplication simulation in Logisim",
                    "Computer Organization and Architecture",
                    "Assignment",
                    (now + timedelta(days=3, hours=8)).isoformat(),
                    "high",
                    "pending",
                    "Submit the .circ file plus a PDF register analysis report",
                    None,
                    now.isoformat()
                ),
                (
                    str(uuid.uuid4()),
                    "Final Report: 3NF database schema design",
                    "Database Systems",
                    "Report",
                    (now + timedelta(days=5)).isoformat(),
                    "medium",
                    "pending",
                    "Include both conceptual and relational ERD diagrams",
                    None,
                    now.isoformat()
                ),
                (
                    str(uuid.uuid4()),
                    "Midterm Prep Quiz: deadlock and semaphore IPC",
                    "Operating Systems",
                    "Quiz",
                    (now + timedelta(days=7)).isoformat(),
                    "medium",
                    "pending",
                    "Covers Process Synchronization through Deadlock Avoidance",
                    None,
                    now.isoformat()
                )
            ]
            await db.executemany("""
                INSERT INTO academic_tasks (id, user_id, title, course, task_type, deadline, priority, status, notes, source_doc_id, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, [(t[0], user_id, *t[1:]) for t in tasks])
            print(f"Seeded {len(tasks)} academic tasks.")

        if card_count == 0:
            cards = [
                (
                    str(uuid.uuid4()),
                    None,
                    None,
                    "What is the fundamental difference between an AVL tree and a red-black tree in how they balance?",
                    "An AVL tree balances height strictly (|balance factor| <= 1), so lookups are O(log n) with a small constant. A red-black tree balances loosely via node colouring, so insertion and deletion need fewer rotations.",
                    "concept",
                    3.5,
                    2.0,
                    0.88,
                    1,
                    0,
                    2,
                    now.isoformat(),
                    (now - timedelta(days=2)).isoformat(),
                    now.isoformat()
                ),
                (
                    str(uuid.uuid4()),
                    None,
                    None,
                    "How does Booth's algorithm work for signed binary multiplication in two's complement?",
                    "Booth's algorithm inspects consecutive bit pairs (Q0 and Q-1):\n- 10: A = A - M\n- 01: A = A + M\n- 00 or 11: no arithmetic operation\nEach step ends with an Arithmetic Shift Right (ASR [A, Q, Q-1]). This speeds up multiplication over runs of identical bits.",
                    "concept",
                    4.2,
                    1.5,
                    0.82,
                    1,
                    0,
                    2,
                    now.isoformat(),
                    (now - timedelta(days=1)).isoformat(),
                    now.isoformat()
                ),
                (
                    str(uuid.uuid4()),
                    None,
                    None,
                    "Name and explain the four Coffman conditions required for deadlock.",
                    "1. Mutual Exclusion: a resource can be held by only one process at a time.\n2. Hold and Wait: a process holds a resource while requesting another.\n3. No Preemption: a resource cannot be forcibly taken away.\n4. Circular Wait: a cycle of processes each waiting on the next.",
                    "concept",
                    2.8,
                    3.5,
                    0.92,
                    2,
                    0,
                    2,
                    now.isoformat(),
                    (now - timedelta(days=3)).isoformat(),
                    now.isoformat()
                ),
                (
                    str(uuid.uuid4()),
                    None,
                    None,
                    "What must a relation satisfy to be in Third Normal Form (3NF)?",
                    "1. It is already in 2NF, with no partial dependency on a candidate key.\n2. It has no transitive dependency: every non-prime attribute depends directly on a super key, never through another non-prime attribute.",
                    "concept",
                    3.0,
                    2.5,
                    0.85,
                    1,
                    0,
                    2,
                    now.isoformat(),
                    (now - timedelta(days=2)).isoformat(),
                    now.isoformat()
                ),
                (
                    str(uuid.uuid4()),
                    None,
                    None,
                    "Why does FSRS-6 model the human forgetting curve more accurately than SM-2?",
                    "SM-2 tracks a single static easiness factor. FSRS-6 models memory in three dimensions (stability, difficulty, retrievability), fitted on millions of real reviews, and accounts for overdue intervals and the spacing effect non-linearly.",
                    "concept",
                    2.2,
                    4.0,
                    0.95,
                    3,
                    0,
                    2,
                    now.isoformat(),
                    (now - timedelta(days=4)).isoformat(),
                    now.isoformat()
                )
            ]
            await db.executemany("""
                INSERT INTO flashcards (id, user_id, doc_id, topic_id, question, answer, card_type, difficulty, stability, retrievability, reps, lapses, state, due, last_review, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, [(c[0], user_id, *c[1:]) for c in cards])
            print(f"Seeded {len(cards)} flashcards.")

        await db.commit()

if __name__ == '__main__':
    asyncio.run(seed_data())

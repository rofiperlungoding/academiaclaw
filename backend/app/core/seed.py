import asyncio
import uuid
from datetime import datetime, timezone, timedelta
import aiosqlite
from backend.app.core.config import settings
from backend.app.core.security import hash_password

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

        if user_count == 0:
            user_id = str(uuid.uuid4())
            pw_hash = hash_password("demo1234")
            await db.execute("""
                INSERT INTO users (id, nim, name, email, faculty, program, university, password_hash, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                user_id,
                "255150307111073",
                "Muhammad Rofi Darmawan",
                "rofi@student.ub.ac.id",
                "Fakultas Ilmu Komputer",
                "Teknik Komputer",
                "Universitas Brawijaya",
                pw_hash,
                now.isoformat()
            ))
            print("Seeded default demo user (NIM: 255150307111073).")
        
        if task_count == 0:
            tasks = [
                (
                    str(uuid.uuid4()),
                    "Praktikum 4: Implementasi AVL Tree & Balancer C++",
                    "Algoritma dan Struktur Data",
                    "Praktikum",
                    (now + timedelta(days=2, hours=4)).isoformat(),
                    "high",
                    "pending",
                    "Lengkap dengan rotasi LL, RR, LR, RL dan test benchmark",
                    None,
                    now.isoformat()
                ),
                (
                    str(uuid.uuid4()),
                    "Tugas Mandiri: Simulasi Perkalian Booth di Logisim",
                    "Organisasi & Arsitektur Komputer",
                    "Tugas",
                    (now + timedelta(days=3, hours=8)).isoformat(),
                    "high",
                    "pending",
                    "Format file .circ + PDF laporan analisa register",
                    None,
                    now.isoformat()
                ),
                (
                    str(uuid.uuid4()),
                    "Laporan Akhir: Desain Skema Database Normalisasi 3NF",
                    "Basis Data",
                    "Laporan",
                    (now + timedelta(days=5)).isoformat(),
                    "medium",
                    "pending",
                    "Sertakan diagram ERD konseptual dan relasional",
                    None,
                    now.isoformat()
                ),
                (
                    str(uuid.uuid4()),
                    "Kuis Persiapan UTS: Deadlock & Semaphore IPC",
                    "Sistem Operasi",
                    "Kuis",
                    (now + timedelta(days=7)).isoformat(),
                    "medium",
                    "pending",
                    "Materi bab Process Synchronization sampai Deadlock Avoidance",
                    None,
                    now.isoformat()
                )
            ]
            await db.executemany("""
                INSERT INTO academic_tasks (id, title, course, task_type, deadline, priority, status, notes, source_doc_id, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, tasks)
            print(f"Seeded {len(tasks)} academic tasks.")

        if card_count == 0:
            cards = [
                (
                    str(uuid.uuid4()),
                    None,
                    None,
                    "Apa perbedaan mendasar antara AVL Tree dan Red-Black Tree dalam hal faktor penyeimbangan?",
                    "AVL Tree menyeimbangkan ketinggian secara ketat (|balance factor| <= 1) sehingga pencarian lebih cepat O(log n) dengan konstanta kecil. Red-Black Tree balancing lebih longgar berbasis pewarnaan node (merah/hitam), sehingga proses insertion/deletion memerlukan rotasi lebih sedikit.",
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
                    "Bagaimana prinsip kerja Algoritma Booth pada perkalian biner bertanda (2's complement)?",
                    "Algoritma Booth memeriksa pasangan bit berurutan (Q0 dan Q-1):\n- Jika 10: A = A - M\n- Jika 01: A = A + M\n- Jika 00 atau 11: tidak ada operasi aritmatika\nDilanjutkan dengan Arithmetic Shift Right (ASR [A, Q, Q-1]). Ini mempercepat perkalian string bit berurutan.",
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
                    "Sebutkan dan jelaskan 4 kondisi Coffman yang menyebabkan terjadinya deadlock!",
                    "1. Mutual Exclusion: resource hanya dapat dipakai 1 proses pada satu waktu.\n2. Hold and Wait: proses menahan resource sambil meminta resource lain.\n3. No Preemption: resource tidak dapat direbut paksa.\n4. Circular Wait: terdapat siklus ketergantungan tunggu antar proses.",
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
                    "Apa syarat relasi memenuhi Bentuk Normal Ketiga (3NF) dalam basis data?",
                    "1. Memenuhi 2NF (tidak ada dependensi parsial terhadap candidate key).\n2. Tidak ada dependensi transitif (setiap atribut non-prime harus bergantung langsung hanya pada super key, bukan melalui atribut non-prime lain).",
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
                    "Mengapa algoritma FSRS-6 lebih akurat dibanding SM-2 dalam memodelkan kurva lupa manusia?",
                    "SM-2 hanya memodelkan satu nilai Easiness Factor statis. FSRS-6 memodelkan daya ingat secara multidimensi (Stability, Difficulty, Retrievability) berdasarkan data jutaan review riil, serta memperhitungkan interval over-due dan interaksi spacing effect secara non-linear.",
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
                INSERT INTO flashcards (id, doc_id, topic_id, question, answer, card_type, difficulty, stability, retrievability, reps, lapses, state, due, last_review, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, cards)
            print(f"Seeded {len(cards)} flashcards.")

        await db.commit()

if __name__ == '__main__':
    asyncio.run(seed_data())

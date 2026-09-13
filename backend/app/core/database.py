import aiosqlite
from backend.app.core.config import settings

async def get_db():
    async with aiosqlite.connect(settings.database_url) as db:
        db.row_factory = aiosqlite.Row
        yield db

async def init_db():
    async with aiosqlite.connect(settings.database_url) as db:
        await db.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            nim TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            email TEXT DEFAULT '',
            faculty TEXT DEFAULT '',
            program TEXT DEFAULT '',
            university TEXT DEFAULT '',
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)

        await db.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL DEFAULT '',
            title TEXT NOT NULL,
            filename TEXT NOT NULL,
            file_path TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            extracted_text TEXT NOT NULL,
            summary TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)

        await db.execute("""
        CREATE TABLE IF NOT EXISTS graph_entities (
            id TEXT PRIMARY KEY,
            doc_id TEXT NOT NULL,
            name TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            description TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (doc_id) REFERENCES documents (id) ON DELETE CASCADE
        )
        """)

        await db.execute("""
        CREATE TABLE IF NOT EXISTS graph_relations (
            id TEXT PRIMARY KEY,
            doc_id TEXT NOT NULL,
            source_name TEXT NOT NULL,
            target_name TEXT NOT NULL,
            relation_type TEXT NOT NULL,
            description TEXT NOT NULL,
            weight REAL DEFAULT 1.0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (doc_id) REFERENCES documents (id) ON DELETE CASCADE
        )
        """)

        await db.execute("""
        CREATE TABLE IF NOT EXISTS graph_topics (
            id TEXT PRIMARY KEY,
            doc_id TEXT NOT NULL,
            title TEXT NOT NULL,
            summary TEXT NOT NULL,
            key_entities TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (doc_id) REFERENCES documents (id) ON DELETE CASCADE
        )
        """)

        await db.execute("""
        CREATE TABLE IF NOT EXISTS flashcards (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL DEFAULT '',
            doc_id TEXT,
            topic_id TEXT,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            card_type TEXT DEFAULT 'concept',
            difficulty REAL DEFAULT 0.0,
            stability REAL DEFAULT 0.0,
            retrievability REAL DEFAULT 1.0,
            reps INTEGER DEFAULT 0,
            lapses INTEGER DEFAULT 0,
            state INTEGER DEFAULT 0,
            due TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_review TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (doc_id) REFERENCES documents (id) ON DELETE SET NULL
        )
        """)

        await db.execute("""
        CREATE TABLE IF NOT EXISTS review_logs (
            id TEXT PRIMARY KEY,
            card_id TEXT NOT NULL,
            rating INTEGER NOT NULL,
            state INTEGER NOT NULL,
            due TIMESTAMP NOT NULL,
            stability REAL NOT NULL,
            difficulty REAL NOT NULL,
            scheduled_days INTEGER NOT NULL,
            review_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (card_id) REFERENCES flashcards (id) ON DELETE CASCADE
        )
        """)

        await db.execute("""
        CREATE TABLE IF NOT EXISTS academic_tasks (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL DEFAULT '',
            title TEXT NOT NULL,
            course TEXT NOT NULL,
            task_type TEXT NOT NULL,
            deadline TIMESTAMP NOT NULL,
            priority TEXT DEFAULT 'medium',
            status TEXT DEFAULT 'pending',
            notes TEXT DEFAULT '',
            source_doc_id TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)

        # Proactive notifications the agent has already pushed. The digest hash lets
        # the agent skip a run when nothing changed, so a 30-minute cron does not spam.
        await db.execute("""
        CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL DEFAULT '',
            digest_hash TEXT NOT NULL,
            channel TEXT NOT NULL DEFAULT 'whatsapp',
            body TEXT NOT NULL,
            urgent_tasks_count INTEGER NOT NULL DEFAULT 0,
            due_flashcards_count INTEGER NOT NULL DEFAULT 0,
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)

        await db.execute(
            "CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON notifications (sent_at DESC)"
        )

        await _migrate_user_scoping(db)

        await db.commit()

    from backend.app.core.seed import seed_data
    await seed_data()


OWNED_TABLES = ("documents", "flashcards", "academic_tasks", "notifications")


async def _migrate_user_scoping(db) -> None:
    """Add user_id to databases created before per-user scoping existed.

    CREATE TABLE IF NOT EXISTS never alters an existing table, so a database from
    an earlier version keeps the old shape and every scoped query silently returns
    nothing. Add the column, then adopt orphan rows into the oldest account so
    existing demo data does not vanish.
    """
    for table in OWNED_TABLES:
        cur = await db.execute(f"PRAGMA table_info({table})")
        columns = {row[1] for row in await cur.fetchall()}
        if "user_id" not in columns:
            await db.execute(f"ALTER TABLE {table} ADD COLUMN user_id TEXT NOT NULL DEFAULT ''")
            print(f"[db] migrated {table}: added user_id")
        await db.execute(f"CREATE INDEX IF NOT EXISTS idx_{table}_user ON {table} (user_id)")

    cur = await db.execute("SELECT id FROM users ORDER BY created_at ASC LIMIT 1")
    row = await cur.fetchone()
    if row is None:
        return

    owner = row[0]
    for table in OWNED_TABLES:
        cur = await db.execute(f"SELECT COUNT(*) FROM {table} WHERE user_id = ''")
        orphans = (await cur.fetchone())[0]
        if orphans:
            await db.execute(f"UPDATE {table} SET user_id = ? WHERE user_id = ''", (owner,))
            print(f"[db] adopted {orphans} orphan row(s) in {table}")

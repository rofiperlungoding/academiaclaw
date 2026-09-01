# **Evaluasi Strategis dan Arsitektur Agentic AI untuk Inovasi Hackathon Kompetitif**

Pengembangan aplikasi berbasis agen kecerdasan buatan (*agentic AI*) untuk kompetisi hackathon memerlukan pendekatan terstruktur yang memadukan kelayakan teknis, efisiensi infrastruktur, dampak sosial, dan tingkat keterbaruan (*novelty*). Analisis ini mengevaluasi empat gagasan sistem otonom secara mendalam, mengidentifikasi kelemahan mendasar pada arsitektur awal, serta menyajikan penguatan teknis menggunakan teknologi mutakhir guna memaksimalkan keunggulan kompetitif.

## **Evaluasi Komparatif Portofolio Gagasan Hackathon**

Penilaian terhadap empat proposisi proyek dilakukan dengan mempertimbangkan batasan infrastruktur server privat maya (VPS) berkapasitas memori 4GB RAM, dinamika regulasi platform pesan instan, dan skenario eksekusi Minimum Viable Product (MVP) berdurasi 30 hari.

| Parameter Evaluasi | 1\. Asisten Kuliah Proaktif | 2\. Agent Anti-Penipuan WA | 3\. Customer Service UMKM | 4\. Pipeline Catatan Otomatis |
| :---- | :---- | :---- | :---- | :---- |
| **Relevansi Pasar & Pengguna** | Sangat Tinggi (Persona Mahasiswa Valid) | Tinggi (Dampak Publik & Keamanan Digital) | Sedang (Pasar Komersial Jenuh) | Tinggi (Kebutuhan Akademik Spesifik) |
| **Kelayakan VPS 4GB** | Tinggi (Dengan Offloading API Teks)1 | Sangat Tinggi (Gateway Ringan)1 | Tinggi (Cloud API Engine)2 | Sedang (Tergantung Model Indeks RAG)3 |
| **Tingkat Keterbaruan Teknologis** | Sedang-Tinggi (Tergantung Layer Memori)5 | Sedang (Membutuhkan RAG Terverifikasi)6 | Rendah (Komoditisasi Tinggi) | Sangat Tinggi (Jika Pakai LightRAG \+ FSRS-6)3 |
| **Risiko Operasional Utama** | Sinkronisasi Memori & Latensi Voice5 | Pemblokiran Akun & Biaya Meta API8 | Perubahan Pricing Meta & ToS Scraping10 | Latensi Pipeline & Scope Creep12 |
| **Skor Efektivitas MVP** | 88 / 100 | 92 / 100 | 74 / 100 | 85 / 100 |

## **Analisis Kritis Idea 1: Asisten Kuliah Proaktif (Turunan F.R.I.D.A.Y.)**

### **Kelemahan Mendasar dan Bottleneck Teknis**

> 1. **Miskonsepsi Arsitektur Memori**: Penggunaan istilah *holographic memory* sering kali tidak selaras dengan arsitektur memori agen modern. Pada rilis Nous Research Hermes Agent (seperti pada rilis v0.20.0 Herald Release), memori jangka panjang dikelola melalui representasi konteks persisten berbasis grafik, kerangka kerja memU, atau *Memory Wiki* terkompilasi, bukan penyimpanan holografik fisik atau kuantum5. Menggabungkan SQLite-fact dengan repositori vektor tanpa lapisan sintesis yang terstruktur akan menyebabkan penumpukan konteks berulang (*context bloat*) yang memperlambat respons model bahasa5.  
> 2. **Keterbatasan Infrastruktur VPS 4GB RAM**: Menjalankan *pipeline* pemrosesan suara lokal secara penuh—terdiri dari faster-whisper untuk pemrosesan *Speech-to-Text* (STT), Edge-TTS untuk *Text-to-Speech* (TTS), dan *Retrieval-based Voice Conversion* (RVC)—pada VPS berkapasitas memori 4GB RAM dipastikan akan memicu kondisi *Out-Of-Memory* (OOM) atau latensi pemrosesan di atas 15–30 detik per interaksi.  
> 3. **Risiko Eksekusi Proaktif**: Mekanisme pengingat proaktif berbasis *cron/heartbeat* berisiko mengirimkan notifikasi berulang (*spamming*) jika status penyelesaian tugas tidak disinkronkan secara atomik dalam basis data transaksi lokal.

### **Penguatan Arsitektur dan Teknologi Mutakhir**

> 1. **Implementasi OpenClaw Gateway dan ClawRouter**: Daripada membangun sistem orkestrasi dari awal, kerangka kerja OpenClaw menyediakan *Gateway engine* berbasis Node.js yang mampu mengelola sesi pesan, pemanggilan fungsi (*tools*), dan koneksi saluran komunikasi secara efisien1. Untuk menekan biaya API dan latensi pada VPS 4GB, modul ClawRouter diimplementasikan guna mengarahkan kueri sederhana (seperti penambahan jadwal) ke model lokal/ringkas, dan mengekskalasi analisis jadwal yang kompleks ke LLM tingkat tinggi seperti Claude 3.5 Sonnet1.  
> 2. **Memori Persisten Terstruktur via memU dan Memory Wiki**: Mengintegrasikan arsitektur memori memU atau *Karpathy-style pre-compiled agent memory* (Memory Wiki) memungkinkan agen menyimpan fakta-fakta perkuliahan, tenggat waktu, dan preferensi pengguna dalam struktur Markdown terkompilasi (SOUL.md / MEMORY.md)5. Pendekatan ini menghilangkan kebutuhan akan basis data vektor yang berat di lingkungan server berspesifikasi terbatas1.  
> 3. **Penerapan Heartbeat Daemon Bawaan OpenClaw**: Pengingat otomatis dieksekusi menggunakan daemon latar belakang bawaan OpenClaw melalui perintah openclaw onboard \--install-daemon2. Daemon ini memeriksa kondisi pemicu secara deterministik tanpa mengonsumsi memori runtime berlebih.

## **Analisis Kritis Idea 2: Agent Anti-Penipuan WhatsApp (Public Good)**

### **Kelemahan Mendasar dan Bottleneck Teknis**

> 1. **Kerentanan Klasifikasi Zero-Shot LLM**: Mengandalkan *prompt engineering* standar pada LLM untuk mendeteksi pesan penipuan di Indonesia (seperti modus kurir paket .APK, undangan pernikahan digital, atau tawaran kerja paruh waktu) berisiko tinggi menghasilkan *false positive* atau *false negative*. Penipu secara kontinu mengubah variasi sintaksis dan penggalan kata untuk menghindari filter heuristik generik.  
> 2. **Risiko Pemblokiran Akun WhatsApp (Anti-Ban)**: Menggunakan pustaka otomasi WhatsApp non-resmi (seperti Baileys atau whatsapp-web.js) tanpa manajemen pola perilaku manusia berisiko menyebabkan pemblokiran nomor agen secara permanen oleh sistem anti-spam Meta10. Ekosistem pustaka open-source pihak ketiga juga memiliki risiko keamanan rantai pasokan (*supply chain attack*), sebagaimana teridentifikasi pada kasus penyelewengan kredensial oleh pustaka otomasi pihak ketiga seperti lotusbail8.  
> 3. **Model Biaya Per-Message Pricing Meta (Revisi 2025–2026)**: Sejak 1 Juli 2025, Meta secara resmi menggantikan model *Conversation-Based Pricing* (CBP) menjadi *Per-Message Pricing* (PMP), di mana setiap templat pesan yang dikirimkan oleh bisnis dikenakan biaya individual berdasarkan kategori pesan dan negara penerima9. Di Indonesia, tarif templat pemasaran berkisar pada Rp586,33 ($0,036) per pesan18. Jika agen secara proaktif mengirimkan pengingat bahaya tanpa inisiasi dari pengguna, biaya operasional akan membengkak secara drastis.

### **Penguatan Arsitektur dan Teknologi Mutakhir**

> 1. **Retrieval-Augmented Generation (RAG) Terintegrasi Data Publik MAFINDO**: Efektivitas klasifikasi ditingkatkan dengan menambahkan lapisan RAG yang terhubung langsung ke basis data penipuan publik terverifikasi di Indonesia, seperti API TurnBackHoax.id, Yudistira, dan Kalimasada yang dikelola oleh MAFINDO6. Agen tidak hanya mengandalkan analisis teks LLM, melainkan melakukan kalkulasi kemiripan vektor terhadap laporan kejahatan siber nyata.  
> 2. **Mesin Penilai Risiko Multi-Tingkat (Hybrid Risk Scoring)**: Skor risiko disusun menggunakan kombinasi tiga variabel deterministik:

![][image1]  
Di mana ![][image2] mengukur entropi URL, keberadaan file eksekusi Android (.APK), dan pola nomor rekening; ![][image3] mengukur tingkat pencocokan data MAFINDO; dan ![][image4] menganalisis nada persuasi pesan6. 3\. **Kepatuhan Jendela Layanan 24 Jam Bebas Biaya**: Seluruh alur komunikasi diarsitekturkan agar selalu dimulai oleh pengguna (*customer-initiated*)21. Berdasarkan aturan Meta, seluruh balasan pesan non-templat yang dikirimkan di dalam jendela layanan 24 jam bersifat bebas biaya (*free of charge*)18.

## **Analisis Kritis Idea 3: Customer Service Agent UMKM (Business Automation)**

### **Kelemahan Mendasar dan Bottleneck Teknis**

> 1. **Tingkat Komoditisasi Tinggi dan Pergeseran Biaya API**: Gagasan agen layanan pelanggan (CS) untuk UMKM telah sangat umum di industri SaaS. Solusi ini kurang memiliki keunikan teknis (*technical novelty*) yang menonjol untuk skala hackathon. Selain pemberlakuan *Per-Message Pricing* pada Juli 20259, pembaruan kebijakan Meta menetapkan bahwa per 1 Oktober 2026, pesan balik kategori *service* dan *utility* di dalam jendela 24 jam yang menggunakan Cloud API berbayar akan dikenakan tarif tertentu, sementara balasan manual via aplikasi WhatsApp Business gratis tetap tidak dikenakan biaya11.  
> 2. **Pengelolaan State Transaksi yang Rentan**: Sistem otomatisasi warung/toko rentan mengalami gagal interaksi saat terjadi perubahan ketersediaan stok produk secara tiba-tiba di basis data Postgres/Supabase tanpa adanya sinkronisasi status (*race condition*).

### **Penguatan Arsitektur dan Teknologi Mutakhir**

> 1. **Arsitektur WhatsApp Coexistence**: Mengimplementasikan strategi *coexistence* yang menggabungkan penggunaan aplikasi WhatsApp Business gratis untuk obrolan manual manusia dengan pemanggilan API berbasis event hanya untuk notifikasi pesanan utama11. Pendekatan ini memangkas pengeluaran API secara signifikan11.  
> 2. **Pembagian Peran Mikro-Agen (OpenClaw SOUL-based Multi-Agent)**: Memecah agen CS menjadi sub-agen berspesialisasi menggunakan *template* SOUL.md OpenClaw14:  
   * *Catalog Search Agent*: Khusus memetakan kueri teks pengguna ke SQL via *pgvector*.  
   * *Order State Agent*: Memvalidasi format pembayaran dan alamat pengiriman.  
   * *Escalation Sentinel Agent*: Mengukur tingkat frustrasi pelanggan melalui analisis sentimen dan secara otomatis menyambungkan pesan ke pemilik UMKM jika skor ketidakpastian tinggi.

## **Analisis Kritis Idea 4: Pipeline Catatan Kuliah Otomatis (Knowledge Automation)**

### **Kelemahan Mendasar dan Bottleneck Teknis**

> 1. **Kegagalan Naive Vector RAG pada Dokumen Akademik**: RAG berbasis vektor tradisional (*Naive Vector RAG*) memecah dokumen menjadi potongan-potongan (*chunks*) terisolasi berdasarkan kemiripan kosinus (*cosine similarity*)3. Metode ini gagal dalam menjawab pertanyaan perkuliahan yang bersifat komprehensif atau menghubungkan konsep antarbab (seperti *"Hubungkan bab arsitektur komputer dengan bab optimasi memori"*), karena tidak memiliki representasi hubungan antar-entitas3.  
> 2. **Penggunaan Algoritma Spaced Repetition Usang (SM-2)**: Mayoritas aplikasi pencatat otomatis masih menggunakan algoritma SuperMemo-2 (SM-2) buatan tahun 198724. SM-2 mengandalkan aturan tetap yang kaku (*fixed rules*) tanpa memodelkan daya ingat individu, sehingga membutuhkan 20% hingga 30% lebih banyak pengulangan review dibanding algoritma berbasis data modern untuk tingkat retensi yang sama24.

### **Penguatan Arsitektur dan Teknologi Mutakhir**

#### **Implementasi Arsitektur LightRAG (HKU Dual-Level Graph Retrieval)**

Untuk mengatasi keterbatasan *Naive RAG* tanpa menanggung beban biaya dan komputasi ekstrim dari Microsoft GraphRAG (yang membutuhkan pencarian komunitas via algoritma Leiden dan ringkasan hierarkis berbiaya tinggi)3, sistem menerapkan **LightRAG**3.  
LightRAG mengekstraksi entitas dan hubungan dari materi kuliah ke dalam Knowledge Graph (misalnya Neo4j atau NetworkX), lalu menjalankan strategi *Dual-Level Retrieval*3:

> * **Low-Level Retrieval**: Mengambil entitas spesifik dan hubungan langsungnya untuk menjawab pertanyaan fakta yang rinci3.  
> * **High-Level Retrieval**: Mengambil topik abstrak dan tema menyeluruh untuk menjawab pertanyaan sintetis3.

Pengujian empiris menunjukkan bahwa LightRAG mampu mengungguli Vector RAG konvensional dengan *win rate* hingga 83,6% pada aspek komprehensivitas dan 86,4% pada aspek keanekaragaman jawaban, sekaligus menghemat biaya indeks LLM hingga lebih dari 70% dibanding Microsoft GraphRAG4.

#### **Implementasi Algoritma FSRS-6 (Free Spaced Repetition Scheduler)**

Untuk modul latihan soal otomatis, algoritma kaku SM-2 digantikan oleh **FSRS-6** (Free Spaced Repetition Scheduler versi 6), yang telah diadopsi secara resmi oleh Anki sejak versi 23.107.  
FSRS memodelkan ingatan manusia menggunakan tiga variabel memori tunggal (Model DSR)7:

> * **Difficulty (![][image5])**: Tingkat kesulitan intrinsik kartu soal (skala 1–10)7.  
> * **Stability (![][image6])**: Jumlah hari yang dibutuhkan agar probabilitas mengingat kembali turun ke target retensi (default 90%)7.  
> * **Retrievability (![][image7])**: Probabilitas mengingat kembali informasi pada waktu ![][image8] sejak review terakhir7.

Persamaan fungsi pelupuan daya (*power-law forgetting curve*) pada FSRS didefinisikan secara matematis sebagai berikut7:  
![][image9]  
Penjadwalan interval berikutnya (![][image10]) dihitung dengan membalikkan kurva pelupa untuk mencapai target retensi diinginkan (![][image11], misal 0,90)7:  
![][image12]  
Implementasi FSRS-6 diintegrasikan menggunakan pustaka open-source Python py-fsrs atau TypeScript ts-fsrs26. Pendekatan ini menjamin efisiensi belajar mahasiswa dengan mengurangi beban review soal hingga 20–30% tanpa mengurangi daya ingat24.

## **Matriks Komparatif Arsitektur Inovasi**

Komparasi arsitektural berikut memperlihatkan perbandingan antara pendekatan konvensional dengan teknologi baru yang direkomendasikan:

### **Perbandingan Arsitektur RAG untuk Ingest Catatan Kuliah**

| Variabel Pembanding | Naive Vector RAG | Microsoft GraphRAG | LightRAG (Rekomendasi) |
| :---- | :---- | :---- | :---- |
| **Metode Indeks Data** | Vektor Potongan Teks (*Chunk Embedding*)23 | Ekstraksi Entitas \+ Komunitas Leiden \+ Ringkasan Hierarkis12 | Indeks Grafik Entitas/Topik Dua-Tingkat (*Dual-Level Index*)3 |
| **Biaya Pemrosesan (LLM Calls)** | Sangat Rendah (1 Panggilan Embedding per *Chunk*)23 | Sangat Tinggi (4–6 Panggilan LLM per *Chunk* \+ Ringkasan Komunitas)12 | Rendah-Sedang (Ekstraksi Entitas Paralel Tanpa Ringkasan Komunitas)4 |
| **Kemampuan Multi-Hop QA** | Buruk (Terisolasi pada Potongan Teks)3 | Sangat Baik (Melalui Penelusuran Grafik)12 | Sangat Baik (Melalui *Low-Level & High-Level Traversal*)3 |
| **Kinerja Pertanyaan Global** | Sangat Buruk3 | Sangat Baik (Via Ringkasan Komunitas)12 | Baik-Sangat Baik (Via *High-Level Topic Retrieval*)3 |
| **Skalabilitas VPS 4GB** | Sangat Tinggi | Sangat Buruk (Membutuhkan Compute GPU/CPU Besar)12 | Tinggi (Dapat Berjalan dengan Database Graph Ringan)3 |

### **Perbandingan Algoritma Spaced Repetition**

| Parameter | SM-2 (SuperMemo 2 \- 1987\) | FSRS-6 (Free Spaced Repetition Scheduler \- 2026\) |
| :---- | :---- | :---- |
| **Model Memori** | Aturan Heuristik Kaku (*Easiness Factor*)7 | Model Statistik 3-Komponen (Difficulty, Stability, Retrievability)7 |
| **Parameter Bobot** | Tidak Ada (Aturan Tetap)7 | 21 Bobot Teroptimasi (*Research-Optimized Weights*)7 |
| **Prediksi Kurva Pelupa** | Tidak Eksplisit7 | Eksplisit Berdasarkan Fungsi Daya (![][image13])7 |
| **Beban Review** | Baseline (100%)24 | 20% – 30% Lebih Sedikit Review untuk Retensi Sama24 |
| **Pustaka Integrasi** | Logika Kustom Manual | Open-Source (py-fsrs, ts-fsrs, rs-fsrs)26 |

## **Strategi Konvergensi Hibrida: AcademiaClaw**

Berdasarkan analisis teknis dan kriteria penilaian kompetisi, strategi terbaik untuk meningkatkan daya saing ide adalah melakukan konvergensi arsitektural antara **Gagasan 1 (Asisten Kuliah Proaktif)** dan **Gagasan 4 (Pipeline Catatan Otomatis)** menjadi satu ekosistem agen tunggal yang diberi nama **AcademiaClaw: Proactive Knowledge & Task Agent**.

### **Alur Eksekusi Terintegrasi**

> * **Tahap 1: Ingestion & Dual-Level Knowledge Indexing**: Pengguna mengirimkan dokumen perkuliahan (PDF) atau pesan suara via saluran WhatsApp OpenClaw2. Dokumen diurai dan diindeks oleh mesin LightRAG untuk memetakan entitas fakta dan topik abstrak secara simultan3.  
> * **Tahap 2: Task Parsing & Memory Commit**: Secara bersamaan, OpenClaw memprediksi instruksi pengumpulan tugas atau jadwal praktikum dari input teks, lalu mendaftarkannya ke dalam memori persisten memU (MEMORY.md)5.  
> * **Tahap 3: FSRS-6 Flashcard Generation**: Mesin pembuat kuis mengekstrak konsep kunci dari graf LightRAG dan menyusun kartu latihan4. Algoritma py-fsrs mengkalkulasi tanggal review optimal berdasarkan nilai stabilitas ingatan awal (![][image6])7.  
> * **Tahap 4: Proactive Push via WhatsApp Window**: Daemon latar belakang OpenClaw (openclaw onboard \--install-daemon) memicu pengiriman notifikasi pengingat tenggat waktu dan kuis *spaced-repetition* harian langsung ke WhatsApp pengguna2. Karena notifikasi dikirimkan dalam alur obrolan aktif pengguna, seluruh balasan berada dalam jendela layanan 24 jam bebas biaya18.

Solusi hibrida ini menggabungkan relevansi personal persona mahasiswa, keterbaruan arsitektural berbasis LightRAG dan FSRS-6, serta efisiensi eksekusi pada VPS 4GB melalui orkestrasi OpenClaw1.

## **Kesimpulan dan Rekomendasi Eksekusi MVP**

Hasil analisis menunjukkan bahwa penggabungan antara Asisten Kuliah Proaktif dan Pipeline Catatan Otomatis melalui arsitektur **AcademiaClaw** menawarkan nilai inovasi tertinggi untuk hackathon. Solusi ini mengatasi masalah nyata akademisi sekaligus menerapkan standar arsitektur AI modern:

> 1. **Gunakan OpenClaw sebagai Engine Utama**: Manfaatkan OpenClaw Gateway untuk mengelola koneksi WhatsApp dan orkestrasi agen berbasis file konfigurasi SOUL.md2.  
> 2. **Terapkan Text-First Offloading**: Hindari menjalankan pemrosesan suara berlama-lama di VPS 4GB. Fokus pada pemrosesan teks, dan gunakan API eksternal jika fitur suara diperlukan1.  
> 3. **Gantikan Naive Vector RAG dengan LightRAG**: Gunakan LightRAG untuk mengindeks materi perkuliahan agar agen mampu menjawab pertanyaan sintesis multi-bab secara presisi dengan biaya pemrosesan yang efisien3.  
> 4. **Adopsi FSRS-6 untuk Fitur Belajar**: Gunakan pustaka py-fsrs untuk menjadwalkan review kuis otomatis secara presisi7.  
> 5. **Patuhi Aturan WhatsApp API**: Pastikan interaksi berjalan dalam alur *customer-initiated* untuk memanfaatkan jendela layanan 24 jam bebas biaya dari Meta18.

#### **Works cited**

> 1. OpenClaw GitHub: Repo, Install Commands & Self-Hosting Guide, [https://www.oneclaw.net/blog/openclaw-ai-agent-self-hosted-github](https://www.oneclaw.net/blog/openclaw-ai-agent-self-hosted-github)  
> 2. OpenClaw — Your assistant, on your devices, in your chats \- GitHub, [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)  
> 3. GraphRAG Explained | When Vector Search Isn't Enough \- Scaler, [https://www.scaler.com/topics/what-is-graphrag/](https://www.scaler.com/topics/what-is-graphrag/)  
> 4. Under the covers with LightRAG: Extraction \- Neo4j, [https://neo4j.com/blog/developer/under-the-covers-with-lightrag-extraction/](https://neo4j.com/blog/developer/under-the-covers-with-lightrag-extraction/)  
> 5. 10 GitHub Repositories to Master OpenClaw \- KDnuggets, [https://www.kdnuggets.com/10-github-repositories-to-master-openclaw](https://www.kdnuggets.com/10-github-repositories-to-master-openclaw)  
> 6. Anti Hoax Search Engine \- TurnBackHoax.ID, [https://search.turnbackhoax.id/](https://search.turnbackhoax.id/)  
> 7. The FSRS Algorithm Explained — Spaced Repetition | Gnoseed, [https://gnoseed.com/algorithms/fsrs](https://gnoseed.com/algorithms/fsrs)  
> 8. baileys-antiban — Anti-Ban Middleware for Baileys & WhatsApp Bots, [https://github.com/kobie3717/baileys-antiban](https://github.com/kobie3717/baileys-antiban)  
> 9. WhatsApp Business API Pricing: How It Works & What's Better \- Zernio, [https://zernio.com/blog/whatsapp-business-api-pricing](https://zernio.com/blog/whatsapp-business-api-pricing)  
> 10. How to Use Evolution API Without Getting Banned on WhatsApp, [https://wasenderapi.com/blog/how-to-use-evolution-api-without-getting-banned-on-whatsapp-2026-guide](https://wasenderapi.com/blog/how-to-use-evolution-api-without-getting-banned-on-whatsapp-2026-guide)  
> 11. WhatsApp Business API Pricing in Globally (2026) \- Eazybe, [https://eazybe.com/blog/whatsapp-business-api-pricing](https://eazybe.com/blog/whatsapp-business-api-pricing)  
> 12. Deploy GraphRAG on GPU Cloud: Knowledge Graph Construction, [https://www.spheron.network/blog/graphrag-gpu-cloud-deployment-guide/](https://www.spheron.network/blog/graphrag-gpu-cloud-deployment-guide/)  
> 13. How Hermes Agent Memory Actually Works in 2026: Native ... \- Reddit, [https://www.reddit.com/r/hermesagent/comments/1w301d0/megathread\_how\_hermes\_agent\_memory\_actually\_works/](https://www.reddit.com/r/hermesagent/comments/1w301d0/megathread_how_hermes_agent_memory_actually_works/)  
> 14. OpenClaw GitHub Repo: Structure, Install & First Agent (2026), [https://crewclaw.com/blog/openclaw-github-repository-guide](https://crewclaw.com/blog/openclaw-github-repository-guide)  
> 15. mergisi/awesome-openclaw-agents \- GitHub, [https://github.com/mergisi/awesome-openclaw-agents](https://github.com/mergisi/awesome-openclaw-agents)  
> 16. WhatsApp Automation Using Baileys.js: A Complete Guide, [https://blog.pallysystems.com/2025/12/04/whatsapp-automation-using-baileys-js-a-complete-guide/](https://blog.pallysystems.com/2025/12/04/whatsapp-automation-using-baileys-js-a-complete-guide/)  
> 17. WhatsApp business pricing: the complete guide to per-message costs, [https://routemobile.com/blog/whatsapp-business-pricing/](https://routemobile.com/blog/whatsapp-business-pricing/)  
> 18. WhatsApp Business API Pricing: 2026 Complete Cost Guide, [https://www.engagelab.com/blog/whatsapp-business-api-pricing](https://www.engagelab.com/blog/whatsapp-business-api-pricing)  
> 19. WhatsApp Business API Pricing: Comprehensive Guide & Cost, [https://qontak.com/en/blog/whatsapp-business-api-pricing/](https://qontak.com/en/blog/whatsapp-business-api-pricing/)  
> 20. Produk – Mafindo, [https://mafindo.or.id/produk/](https://mafindo.or.id/produk/)  
> 21. WhatsApp Business API Pricing 2026: Per-Message Rates \- SetSmart, [https://setsmart.io/blog/whatsapp-business-api-pricing](https://setsmart.io/blog/whatsapp-business-api-pricing)  
> 22. WhatsApp API Pricing 2026 | WABA Cost Calculator \- Resayil, [https://resayil.io/whatsapp-api-pricing](https://resayil.io/whatsapp-api-pricing)  
> 23. GraphRAG Is an Inference Problem, Not a Database Problem, [https://www.digitalocean.com/community/conceptual-articles/graph-rag-inference](https://www.digitalocean.com/community/conceptual-articles/graph-rag-inference)  
> 24. Best Spaced Repetition Apps 2026: FSRS vs SM-2 Ranked, [https://studyglen.com/guides/best-spaced-repetition-apps](https://studyglen.com/guides/best-spaced-repetition-apps)  
> 25. Graph Theory for Dummies (and Lawyers) | WashULaw AI Lab, [https://sites.wustl.edu/westcoastclub/graph-theory/](https://sites.wustl.edu/westcoastclub/graph-theory/)  
> 26. devel/py-fsrs: Free Spaced Repetition Scheduler \- FreshPorts, [https://www.freshports.org/devel/py-fsrs/?branch=2026Q3](https://www.freshports.org/devel/py-fsrs/?branch=2026Q3)  
> 27. GitHub \- open-spaced-repetition/awesome-fsrs, [https://github.com/open-spaced-repetition/awesome-fsrs](https://github.com/open-spaced-repetition/awesome-fsrs)  
> 28. The Complete Guide to RAG: Naive, Advanced, and Graph RAG in, [https://www.mrlatte.net/en/research/2026/04/27/rag-complete-guide/](https://www.mrlatte.net/en/research/2026/04/27/rag-complete-guide/)  
> 29. WhatsApp Channel \- OpenClaw, [https://openclaw-openclaw.mintlify.app/channels/whatsapp](https://openclaw-openclaw.mintlify.app/channels/whatsapp)

[image1]: <data:image/png;base64,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>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEMAAAAaCAYAAADsS+FMAAAB4ElEQVR4Xu2WDU3EQBBGVwMW0IAFLGABC1jAARKQgAMc4AADCIC+9F7yZWiv5ehBct2XTNpu2935322t0+l0tuMxRB7ifhdcDfIyyHMbHfF0uL8f5CO+u3hwxNtBkvdBPtvopN0wZ/BtG9/d1BeXDAZTFhWcsasSAZxBSVAuyXUbe8auIPo4JGWqbHYBPcFmmUJm7BaMJyPMFLZWeW3TfWVL7tr3Ul3DJg2eSfJwldArcIBwn8/ngEAsZeOUDpscCj1cTUGUamZMKfKXkDVn292OpT6OYGsVnUEUcGKNoEd4d5+adfmOK8/MzxUjEceAZ9ZyPSBzKF++cf26DuT8q/BAhWSd2kzraRRHMC78JzmeiqaSNbPSudY8c2pE6mXAHK84xr/+x5zMX4M2CT9isAcrs8TGWRtZNUYFVNDMyIgsOaNG1HnA3Q2d1GXJGfyTa6yGVHIR+oOGzHmyGlOdMcVvnIFuBodg8Ty3lmNcT3LGT6nGpFIZPdCh2eWrosecgdFZenzLmM5g/ux16kJQuTczCTiyOSyCUIuUF/epEMpjSI4ZXUtShyBG3H7BlTHmwRi+p2FSsrmrOe5/Zo+OxnjmcN1/wTSuvQaliSTX+m4OdxfvK2sOWXPl3ul0OifzBZENp04jbr59AAAAAElFTkSuQmCC>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAaCAYAAADIUm6MAAABiUlEQVR4Xu2WAW3DMBBFjWEUiqEURmEUSmEUymAQBmEMxqAMSqAA1jzFf7r9ndtOiSZL8ZOspI5j//u+c1rKYLBd9lM71vZc+16n9vQ9ojMQ9jG1S5lFv9X7Q712y6m2XegjmK8yB9QlpEdLHMJ53iVKjYyu0wTh55IXIDneLeQ1KREbqdNtikRw3MUvTRMMyXZxdViIMxvBEi9IGZ3vai/heQanFPO14DvxXub12GHmeyhQfWwyEBqFA78/w28dlxkI1i5mMH8WVOt0+8Gt04TofVEXrr7MJdzOggfGt9LwobpCREs4W+iLuvBbjsu5TGBmyp9QHiMywhbjmDvJWJ6xUwTAffzSRvQuIt0c3l8kHHEUCFe5z5VAXDS44xLvEAzzqvkYctuFs7aK3o38RRSnl7KCES685RxzxNOHMTF39d2IKEj69a90NVx4dI5CRByNHYyQ5+46pvmfuiygxbCVTIoIidfi5LGKUXUjCER9HhBzMh+pobrBgH8D4a0ivQfBK00Gg81zBc+BfjZ7iSEeAAAAAElFTkSuQmCC>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC0AAAAaCAYAAAAjZdWPAAABRElEQVR4Xu2WYQ0CMQxGpwELaMACFrCABSzgAAlIwAEOcIABBMC9bCWldLfx45Im7EsajnbbPbquI6Whof/RerJjsX3xbYuFFKDP8ondU4Z9TLZR48LonDKczSg/An9I1cCAPlhnBJHdm3UWAR2yNICuwVHbYQW0NjK/+xgRUNf0DY6F1yrl3kyrs9D4pRV6JdOK296vpe8G271cXayjiIVspvnOjtTUisvZsd3olPK8ublvzXUNsr4ENEliJ7U4O93QbEcNmm1cAtpbF3VDS91acCZ7V3cLqhWXeqUc2EkkpdINLdc2W8YErnJ5tsDIg9L16cW1BJq1yTjinagbWoPNnXyRB6XHe3HdDfSzJObnTP8qCwWEBvHi+j+NvqwYqzvXItDUIS8CgsWll+s69eJy6PDJ+SHDAMuPkBgmZTM0NBRRLxQfgCrezmquAAAAAElFTkSuQmCC>

[image5]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAaCAYAAAC6nQw6AAAAo0lEQVR4Xu2TQQ2AMAxFqwELaMACFtCCBRwgAQkowQEGEAB7wMKysHYHEi57yb+s3V8/GyKF36iddkOzU+M3WGzybAoZ73WUhW+u4sINB0zx4huYLPFiwCDX1CYYESMFRma8TvRYQDTTiEm0WEAsq+ds0GJx9Vb0rFirZMbSmnq56pipEEszosb3Sb5sCv5KURuIKfwBWmTz/8KEV5ycolD4igOYrDvKw14ycQAAAABJRU5ErkJggg==>

[image6]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAZCAYAAAABmx/yAAAAqklEQVR4XmNgGNnAFIi7oNgNKlYJxEJwFWgAJLETiD8zQDTNhLIzoDROAJJURhcEgv8MEBuxApDzQLZhAyCNIHmsAOY0bACvM0FOAZn8jAFiCNEA5DeQRmQMcjpOJ6IDkAEg20HOgxlAEgBFzXUGPBphkY0NgOIPp8YTDLhDcyUDHo2wkEQHIJeA/IkrbsH+AKVHEA2zHUSDbMOZNkEAWRKWsHEmr1Ew6AAATWYq5p6RrC8AAAAASUVORK5CYII=>

[image7]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAaCAYAAAC+aNwHAAAAv0lEQVR4Xu2SWw3CUAyGqwEL0zALWMDCLGBhDpCABBzgAAczMAGjX066NeVcIOFlyb6kLz097d+LyMHf6dSWij3Uzmt0hVm2DwYfzT84fxariCIPSeytCgGv6FSu8kOCW3QqT0lvtFLkIino5HxIJyEJYlsfEBinj00+qAa9e/koYRvNviEnH+w+mjdg8iPs/asEyM8luEvyFwfYq42yDYxKvo04A2JXSvfvz5UC7B4ltJk7siYoojLXGId8sG/eektATHd9kW0AAAAASUVORK5CYII=>

[image8]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAdCAYAAABmH3YuAAAAa0lEQVR4XmNgGLbgGRD/RxcEAWUGiARIAQbIYIBIrkQWBOlwA+KdUMkuKB8MQDpOQCVAGMRG0Q0CGEYiA5AkyBSsACQJsh8DgASxegEEQMYh2zcTiY3ifAx7TRkgxl5ngPgXA4B0YnXQiAYAwNAYvmtS71MAAAAASUVORK5CYII=>

[image9]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmwAAABQCAYAAACksinaAAAGO0lEQVR4Xu3d4a3jRBQG0FcDLVDDtkALtEALtEAHlEAJdEAHdEADK37D+8ReZIax4/HzJN7kHMl6u95s7DhP8qc7d8ZvbwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAz+Sb9+3bdicAAI+XkPbT+/bXl58AAFyUwAYAcHECGwAwJMN0v7Y7mXpNBDYAYLc0v//c7uRfn9+3T+3OEwhsAMAuCWu/tzu/ct+1Oz7ol7d/QtvZBDYAYJcM+c0II4+UIHR2aJsRagU2AOCmZ+xb+/59+6PdeZIZQRAAYNNvb8+3cGt68TKEOUMqkbPCIADA/yR4pGL0LBKm8nmW29nS75fj5CcAwHQJNLMqUY+S4dAZQW0pFTx9ZwDAdOnDesahvUwMmB3YIsf4od0JAHCmVNZ+bHc+gVlDoa0cI/1/AABTpDJ0j1DzCPca5r1XJQ8AeFEJNM8aNpZDlTOX30gf27NeQwC4jDSnz3jU0Jo0qV9lZuG9hg0foT5XQunMSlu+yxxrZigEgJeXIa0ZASo38OVNvEJh+sVmrJR/xLMHtlznezwXNZM2zBYFgB1yw0zzd27U+XNttSZXG8oSoLbCSvv6vXLzXgayevbkssqT977CDX60z0sw6cs1ecaZtgAwRR6t1FavEo5yM20fu5Rwt3aTTRXsSDCpY7VhL8dql35IWHr0kwUq3N6S86/gu+f1Pe01eSb5fdkK/wDAF1UxS09aqypvyyHKXtUtqifpSJhaW/m+F3ISIB95k8+1aK/JLUcDWx3rWR25lgDwkqrK0QtMCVLZltbWzjq6Qn4Fxt4Ehl7IeXRV5kjIENj6KuQfuTYA8FIyFNkLBTWUt5QbaztEWRWvdhtR55Atze69at/S6PufKddg9PhHQ8mzB7Y4em0A4KVUUEo4SFDKzTMhLE317fBm9q1Vlo4EtVLVueW2Fdraql9PPsferVfdWyOwnSufb2QCBwC8pNwwlxMOagJA77FLa8Ohkfc5YymIBJuquK2FnJxHGybvRWA7Vz7f1u8VAPDWD1r5eztrNLZurLeqYiOqt2nteNm/VumbbVZgq3C2Z0ug3fLnBba9tr5nAOBtfcJBAkHvJroWlBLUboWInk/tjoWcV9svV3rn1mqHPbe2rfNozQpsPSpsAEB3/bWEl7Wb6FoPWypy1YeU8LfsMdsauuwNu5a1pT5CD9vzyOfTwwYAHQkoVV1LkFiGsDaw5WcNdeZ1veCR4FfvkQC4DFo1jNdTy4Ysj39r2Y5Hh5g6v60gWnKudb5VnRwJh4/+rPdwNMwCwFOr/rB2W6rHQuVG2j4aqld5SwjJkGgb1iLv3auI5f9kf6pzFWiyZd9W5e1WoJutQlSv0thqr3F9zr2+hsCW77sNontDqXXYAGCS3GDXesvWjISUW3L8Rw6hVcjYCpVnqVB7VIJQ/n+CdH6e+T1USK/gmuvSe/7rlpHwCwAMyE0/N+q9MnQ48vpbEgj2DEfOdM+qUFuxHLEM1xX+PvJ+S/lOe9/rSKA/0g8IAOyUG/LeG//easse6ZW7goSMdrLG1SRMtdcrlayPVOyWcg16vwO9ELemhsEBgEl6/WozZQjyKiGp+tGuaq03rIYg9/aYramJKb33GQno1ScJAHC6BI0rB7YMGW8Ftnb/ERVaE6IzcWQ0vNfjyAAApkgV6epho9f8PyOw1ZbjjTzpomYHAwBMkWpSAkpvSPAqali0zjF/TzVsK7AlcI1O6kgIrMkDIwFs9PUAAMNSvUqV6MpqOY+cZ/5cvWdrgS0TALb+fcvoMHFea8IBADBdQsfXtIbYGbNE10JZhb09UsH76HkAAOySgNIunXEVCUU5t+VkgFTa2r62UWuhLAFsbwjLeRyp4gEADLvyTMeslZeqVwW2syZK5D3aYJYlV/YGQYvlAgB3l1A00qR/T1nENtWsbKOzOHvSA5eteuLqqRdtgNuS115lPT0A4IWkYvTRMPQKakYpAMDdpVdspMr0ijI0O/LYKgCA0yWQ7O3jekVXX7cOAHgRCSVp9ue/ck2ENQDgElJlu+oyH49kgVwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAruBvSIfppsLIligAAAAASUVORK5CYII=>

[image10]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAAbCAYAAACqenW9AAAAaklEQVR4XmNgGGEgA4hPAPF1IP4PxM+gfLzAjQGi2BRdAhvoYoCYShQAmQpyEkEAc4IyugQ2AHICSDFRAOR7ohTDnECUYpgTiAoJmBNWokugA2QnEAwJkGkwxThjLpwBoQgZ49QwCgYRAACpvR+r0PQuiwAAAABJRU5ErkJggg==>

[image11]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAbCAYAAABFuB6DAAAAZElEQVR4XmNgGAWDGwgB8X8gPgHEykD8DMoH0ShgJRC7MSAkTYE4HIg/IyvKYIAo7GKAKASxQWAmA8QGDAASBCkEacQLQNaAFILcixcgW4sXEGUtCIAUgoIGLwApwOrDUUBdAACQvRcOS8ENDwAAAABJRU5ErkJggg==>

[image12]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmwAAAA2CAYAAAB6H8WdAAAEuUlEQVR4Xu3dgbHjNBQF0NRAC9SwLdACLdACLWwHlEAJdEAHdEADFAD/Am/Go5VsJ5Hj5OecGU9YJ1iynRndfZKzlwsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAT+LLx/bXx/ZD+8Yn8svH9mu7EwDgVSSs/dzuvNNPH9vv7c6T/dHuAIB3ksE5VZojpfqzrAB99/9rwsbRbZ+tPfeZ5/v1Y/u+3TnJswW2+Pty3PkCwCkSDDLoLrdMLS3VdNpREihy/LSd1wqHNeimMnRk+3u0gWqWhNJM4/15+e/885pzz+sMuYZHXrszA1sF+lZ9lwDg00lVYrT+58iKxW+Xb6tJCXBpcylhKUHu0TL4L6fZ0q9Z/UjgSDBrg0fCxqw20v9Z4a/nkcGo/nKRe5BtFKB/vHz7/QGAl5eBbxREqgJ0hGq3Ndp/ZPAYST8SAEoC0KyKVYLp8thl5hTmWhAfSdvpw2hbemRgq37ldS2wxax7BABPo6oWPamAHSWDaq/dDMS9cHZL+LhHpobb/q1dq2ukWpTjtNXFaEPRPdLGrPDX88jAtrQV2HIN26l9AHhpGfxGIWS0P4NlVYeq8tFO7W2pwNYbeHshI5/tBbmj9MJZb98tKrBlurU912uv40hVonpm3L941sCWczurbwBwiFFgyxRpb39CRk1bZstAX+uG1gbRVi2Ir+OM+lFS7Vt7P9J+O4W3tq3Jww5pbxmoZgW2qGu23HpTpLdK/3uhZdb9O9NWX3NOs+4TADyFDGy9369KoOkNelXlWgasTD8lfF1bpUkYyvH2hJZRf5ZSuWpD2dq2prdWannOMySELkNr/rutuN0q59cLbDPv31na+9KTz8y6lgBwqqq09ELSVkDKe1uh51prFayt/hyh2sxr1s9t9aFC0FaY6KmqUC9klbo+e677KLCVvceZpa7N1rbHnmu85zMA8BIqgPQqK3vCya0D4uhhhrTZq/bFVn+OUmu8al3UWh96DypcI//v2mL5mrrcUznaE9huvX9n29P3PZ8BgJeQQW305OVoDVvkvbUwsKYW3PckyI0G2UevYYuEx5xrSftbfdiStWUjM6clR2vY4p779wy2wtjaAxcA8FJqOnQZSJbq/Z6aHhxJlWhUKavF/K219mKrunWEtLcMNvnz2nnvkeA5moJeC3PXyvUc3YOt+/fstgJb3vNbbAC8tAzUVSlabj2jAX/0+ZI2MmD2QkH2JyTWr/AnEKWdhLy16lLaXJsuPELaTMCq6t5a//aof+arpk5z7tmyb2ZYK2mj91tvW/fvGVWgb7fedyz7Hv1dAYDTJET0qkG9ENAaTTvW8RJ+Etz2VpZG4eNImVpL39LHGW3nGHWcWhuX7d4gOJJr1qugzjiXZ5YQ3PveAsCnlUF/zyL3Vqpns6S6YgC+XlUx30k9mAEAbyUD/ujBhDW9ys6tXnmB/Jlq+vud5Lv6bucMAP9K+DprGi1VorPa/gxmTee+ipk/PgwAL+esKUmD7/3epUJZaw4BAF5OPZ269lMYry5Phd4ydQ8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcIB/AGirWRGJc4l3AAAAAElFTkSuQmCC>

[image13]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADcAAAAXCAYAAACvd9dwAAACBElEQVR4Xu2XbVHtMBCGowELaMACFrCABSzgAAlIwAEOcIABBECfU94z2+1ukmbCD2b6zGTuuWm7n2+2pZSTk5P/ys2yPpb15C9M5HFZz2X1gT/tia9l3Zr/7/iuLIKXUc/rst795kQeyuqf5PBDIvdlW8yX33uyGC/wAMncmT0MvZX8Ye7Pqsa+tXUUuoN9SxQjcX2WNckUEvDGhLpowTmVzcAexRmBgvokRKQUEvTxXdHF7Ab2qY6FADLoWmarB8USqSVKDrL9Swey5Kg+++jeEt0rZG8UxRINKjtMLMQXKkWStLql+uxziD3SvgcZ4YRnVBBflB6IQwlqtezgmwG3wxuyBiNpsB8lBy2J9xIlWB0aJZGmHraJ0GI6EB1qKpQFL0mGjgbQqFeM2XSG0GdWlSxI9rLkFEio/w6iOICB1rK7i1UyisZ6llxNlqrwKNmzKtqhzklG/mxpnEeHtJWcnGBz57CCJnNEVmix8YUhFu1mk9/2fPEbgxoq9htO1yL0DPgvG3U1q77k7qWHVLNXgOD6VX1yZJd/UWuPIL1xf69gXwXzatAg8sELruGHf/HJh4LstcC291eFILKXI9XMOuBV4InsYUuV5zfvUnxHsyCipwCHGDHoFTADukanp8I5jD6RMnR2Z4IKkHFNKUMgmeYfiwa6NrtzqGe2zQ29yf05Pxi6ughDeojeAAAAAElFTkSuQmCC>
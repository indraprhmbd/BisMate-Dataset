# BisMate Dataset — Panduan Kontribusi Tim

Dokumen ini adalah panduan lengkap untuk seluruh anggota tim yang membantu pengumpulan dataset fine-tuning model AI BisMate. Baca sampai selesai sebelum mulai generate data.

---

## Gambaran Umum

Dataset ini digunakan untuk melatih model AI BisMate agar bisa membantu pelaku UMKM Indonesia menyusun model bisnis melalui percakapan natural. Ada tiga jenis dataset yang dikumpulkan secara paralel oleh anggota tim yang berbeda.

---

## Pembagian Tugas

| Nama | Task | Target | Folder Submit |
|---|---|---|---|
| [Nama A] | Regulasi UMKM | 600 sampel | `regulasi/submit/` |
| [Nama B] | Regulasi UMKM (bantu A) | — | `regulasi/submit/` |
| [Nama C] | Strategi Pemasaran | 500 sampel | `marketing/submit/` |
| [Nama D] | BMC Conversation + JSON | 300 pasang | `bmc/conv/submit/` dan `bmc/json/submit/` |

---

## Deadline

| Milestone | Tanggal |
|---|---|
| 10 sampel percobaan pertama dikirim ke AI Engineer untuk dicek | 22 Maret 2026 |
| Seluruh data selesai dan disubmit ke folder Drive | 29 Maret 2026 |

Jangan tunggu sampai deadline untuk mulai. Target per hari sekitar 30-50 sampel sudah cukup jika dikerjakan konsisten.

---

## Struktur Folder Google Drive

```
BisMate-Dataset/
├── README.md                        (file ini)
├── regulasi/
│   ├── PROMPT_regulasi.txt          (prompt siap pakai)
│   ├── CONTOH_regulasi.jsonl        (3 contoh sampel valid)
│   └── submit/                      (taruh file hasil generate di sini)
├── marketing/
│   ├── PROMPT_marketing.txt
│   ├── CONTOH_marketing.jsonl
│   └── submit/
└── bmc/
    ├── PROMPT_conv.txt              (prompt percakapan)
    ├── PROMPT_json.txt              (prompt konversi JSON)
    ├── CONTOH_conv.json             (contoh output CONV)
    ├── CONTOH_json.json             (contoh output JSON)
    ├── conv/submit/                 (file CONV di sini)
    └── json/submit/                 (file JSON di sini)
```

Jangan buat folder baru di luar struktur ini. Jangan sentuh folder milik anggota lain.

---

## Task Regulasi dan Marketing

### Cara Generate

1. Buka file `PROMPT_[task].txt` di folder tugasmu
2. Copy seluruh isi prompt tersebut
3. Paste ke ChatGPT (GPT-4 direkomendasikan) atau Claude
4. Kirim dan tunggu output keluar lengkap
5. Kalau output terpotong, ketik: `Lanjutkan JSON yang terpotong`
6. Copy seluruh output JSON array yang dihasilkan

### Cara Simpan File

- Buat file baru dengan nama: `[task]_[namamu]_[nomor].jsonl`
- Contoh: `regulasi_budi_001.jsonl`, `marketing_sari_003.jsonl`
- Satu file = hasil dari satu kali run prompt
- Taruh di folder `submit/` sesuai task masing-masing

### Target per Run

| Task | Sampel per Run | Run yang Dibutuhkan |
|---|---|---|
| Regulasi (per orang) | 10 sampel | 30 run |
| Marketing | 10 sampel | 50 run |

### Checklist Kualitas Sebelum Submit

Cek setiap file sebelum disimpan ke Drive:

**Untuk semua task:**
- [ ] Semua field terisi: `system`, `instruction`, `input`, `output`
- [ ] Tidak ada field yang kosong
- [ ] Bahasa Indonesia yang natural
- [ ] Tidak ada sampel yang sama persis dengan file lain
- [ ] Tidak menggunakan emoji

**Khusus regulasi:**
- [ ] Field `input` mengandung `Konteks:` dan `Pertanyaan:`
- [ ] Konteks berisi informasi regulasi yang realistis
- [ ] Jawaban actionable dengan langkah konkret
- [ ] Topik beragam, tidak semua tentang satu jenis regulasi

**Khusus marketing:**
- [ ] Field `input` berisi deskripsi bisnis langsung (bukan format Konteks/Pertanyaan)
- [ ] Field `output` mengandung strategi pemasaran dan content calendar
- [ ] Content calendar menyebut hari Senin sampai Minggu
- [ ] Sektor bisnis bervariasi antar sampel

### Yang Tidak Boleh

- Jangan ubah isi field `system` dari template
- Jangan submit data berbahasa Inggris
- Jangan generate topik yang sama berulang kali
- Jangan edit output dari AI — submit apa adanya, biar AI Engineer yang filter

---

## Task BMC (Conversation + JSON)

Task ini berbeda dari regulasi dan marketing karena setiap sesi menghasilkan dua file sekaligus.

### Cara Generate — Satu Sesi

**Langkah 1 — Generate percakapan:**
1. Buka `PROMPT_conv.txt`
2. Copy seluruh isinya
3. Paste ke ChatGPT atau Claude, kirim
4. Tunggu output lengkap (5 percakapan + report)
5. Kalau terpotong: ketik `Lanjutkan JSON yang terpotong`
6. Simpan output ke file: `bmc_conv_[namamu]_[nomor].json`
7. Taruh di folder `bmc/conv/submit/`

**Langkah 2 — Generate JSON BMC (di sesi yang sama, jangan buka tab baru):**
1. Buka `PROMPT_json.txt`
2. Copy seluruh isinya
3. Kirim di sesi yang SAMA dengan Langkah 1
4. Tunggu output lengkap (5 JSON BMC)
5. Kalau terpotong: ketik `Lanjutkan JSON yang terpotong`
6. Simpan output ke file: `bmc_json_[namamu]_[nomor].json`
7. Taruh di folder `bmc/json/submit/`

Penting: Langkah 2 harus dilakukan di sesi yang sama dengan Langkah 1 karena prompt JSON merujuk ke output percakapan yang baru saja dihasilkan.

### Cara Simpan File

```
1 sesi = 2 file:

bmc/conv/submit/bmc_conv_[namamu]_[nomor].json
bmc/json/submit/bmc_json_[namamu]_[nomor].json

Contoh:
bmc/conv/submit/bmc_conv_dian_001.json
bmc/json/submit/bmc_json_dian_001.json
```

Nomor file harus sama antara CONV dan JSON yang berasal dari sesi yang sama.

### Rotasi Batch Sektor

Setiap sesi baru harus menggunakan batch sektor yang berbeda. Ikuti urutan ini dan catat sudah sampai batch mana:

```
Sesi 1  → Batch 1: Kuliner, Fashion, Kerajinan, Jasa, Pertanian
Sesi 2  → Batch 2: Digital/Kreatif, Ritel, Kuliner, Fashion, Jasa
Sesi 3  → Batch 3: Pertanian, Kerajinan, Digital/Kreatif, Ritel, Kuliner
Sesi 4  → Batch 4: Jasa, Fashion, Pertanian, Kerajinan, Digital/Kreatif
Sesi 5  → Batch 5: Ritel, Kuliner, Jasa, Fashion, Pertanian
Sesi 6  → Batch 1: (ulangi dari awal)
...
```

### Target BMC

```
60 sesi = 60 file CONV + 60 file JSON = 300 pasang bisnis
```

### Checklist Kualitas BMC

**Untuk file CONV:**
- [ ] Percakapan 3-5 turn sebelum konfirmasi
- [ ] AI tidak pernah menyebut kata "BMC" sebelum turn terakhir
- [ ] AI tidak menggunakan istilah teknis bisnis saat bertanya
- [ ] Hanya satu pertanyaan per turn dari AI
- [ ] Ada kalimat konfirmasi sebelum report
- [ ] Report mencakup semua 9 blok dengan heading yang benar
- [ ] Setiap blok minimal 2 poin dengan penjelasan minimal 3 kalimat
- [ ] Tidak ada emoji
- [ ] Panjang report minimal 800 kata

**Untuk file JSON:**
- [ ] Ada 9 blok BMC lengkap
- [ ] Setiap blok berupa array of strings
- [ ] Setiap array berisi 2-4 item
- [ ] Tidak ada penjelasan di dalam item, hanya poin singkat
- [ ] JSON valid (bisa dicek di jsonlint.com)
- [ ] Tidak ada emoji

---

## Cara Cek JSON Valid

Sebelum submit, paste isi file ke [jsonlint.com](https://jsonlint.com) dan pastikan muncul tulisan "Valid JSON". Kalau ada error, cari baris yang bermasalah dan perbaiki (biasanya ada tanda kutip yang kurang atau koma yang salah).

---

## Kontak

Kalau ada yang bingung soal format, output AI tidak sesuai, atau ada pertanyaan lain, langsung hubungi AI Engineer tim:

**[Nama Bintang] — [kontak]**

Jangan tebak-tebak sendiri kalau tidak yakin. Lebih baik tanya dulu daripada generate ratusan sampel dengan format yang salah.
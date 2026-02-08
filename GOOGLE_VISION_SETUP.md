# Cara Mendapatkan Google Vision API Key

Ikuti langkah-langkah ini untuk mendapatkan kredensial yang dibutuhkan untuk `.env.local`.

## 1. Buat Project di Google Cloud Console
1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Klik dropdown project di bagian atas kiri dan pilih **"New Project"**.
3. Beri nama project (contoh: `splitbill-ocr`) dan klik **Create**.

## 2. Aktifkan Cloud Vision API
1. Pastikan project Anda terpilih.
2. Di kolom pencarian bagian atas, ketik **"Cloud Vision API"**.
3. Pilih hasil dari Marketplace.
4. Klik tombol **Enable**.
   * *Catatan: Anda mungkin perlu mengaktifkan Billing Account jika belum pernah.*

## 3. Buat Service Account
**PENTING: Jangan pilih "OAuth Client ID". Kita butuh "Service Account".**

1. Buka menu navigasi (garis tiga di kiri atas) -> **IAM & Admin** -> **Service Accounts**.
2. Klik **+ CREATE SERVICE ACCOUNT**.

3. Isi **Service account name** (contoh: `ocr-service`).
4. Klik **Create and Continue**.
5. (Opsional) Di bagian "Grant this service account access to project", pilih role **Owner** atau **Cloud Vision API User** (untuk keamanan lebih baik).
6. Klik **Continue** lalu **Done**.

## 4. Generate JSON Key
1. Di daftar Service Accounts, klik pada email service account yang baru dibuat (misal: `ocr-service@...`).
2. Masuk ke tab **KEYS**.
3. Klik **ADD KEY** -> **Create new key**.
4. Pilih tipe **JSON** dan klik **Create**.
5. File JSON akan otomatis terunduh ke komputer Anda.

## 5. Masukkan ke .env.local
Buka file JSON yang terunduh dengan text editor. Anda akan melihat isi seperti ini:

```json
{
  "type": "service_account",
  "project_id": "splitbill-ocr-123",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggvkAgEAAoIBAQDh...\n-----END PRIVATE KEY-----\n",
  "client_email": "ocr-service@splitbill-ocr-123.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "...",
  "token_uri": "...",
  "auth_provider_x509_cert_url": "...",
  "client_x509_cert_url": "..."
}
```

Salin nilai berikut ke file `.env.local` Anda:

- `GOOGLE_PROJECT_ID` -> ambil dari `project_id`
- `GOOGLE_CLIENT_EMAIL` -> ambil dari `client_email`
- `GOOGLE_PRIVATE_KEY` -> ambil dari `private_key` (Salin **semua** teks di dalam kutip, termasuk `\n` atau baris baru).

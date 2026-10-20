# Design Spec: Pencegahan Duplikasi Pengiriman PO & Subcont (SC)

- **Date**: 2026-10-20
- **Topic**: Prevent Duplicate PO & Subcont Dispatches (Pencegahan Double PO & SC untuk Part/Komponen)
- **Target Aesthetic**: MATRIX clean industrial design system (zero emojis/emoticons, native micro-SVGs, high contrast, clean alert styling matching `control-table.tsx` and `app-shell.tsx`)

---

## 1. Overview & Business Rules

Pada sistem MATRIX saat ini, pengguna (khususnya user dengan role `controller`) dapat mengirim PO (`bulkSendPo` atau single row send) dan mengirim Subcont (`bulkSendSubcont` atau trigger `In Progress SC`). Namun, belum ada proteksi yang membatasi pengiriman ulang jika suatu part/komponen telah memiliki nomor/data PO atau sudah aktif dikirim ke vendor Subcont. Hal ini dapat menimbulkan duplikasi (double entry) data pengadaan maupun instruksi subkontraktor.

Aturan yang diterapkan:
1. **Aturan PO (Purchase Order)**:
   - Suatu part atau komponen yang proses pengadaannya sudah dikirim PO (kontrol `Material` untuk Part, atau kontrol `PO` untuk Component sudah berstatus `Done` atau sudah memiliki relasi `poTracking`) **tidak dapat dikirim PO lagi**.
2. **Aturan Subcont (SC)**:
   - Suatu part atau komponen yang sudah aktif dikirim ke Subcont (`is_subcont == true` atau proses yang dipilih sudah berstatus `In Progress SC`) **tidak dapat dikirim Subcont lagi**.
3. **Cakupan Independen**:
   - Aturan berlaku spesifik untuk jalurnya masing-masing: pencegahan double PO mencegah pengiriman PO ulang, dan pencegahan double SC mencegah pengiriman Subcont ulang.

---

## 2. Technical Architecture & Verification Points

### A. Backend (Laravel 13 / PHP 8.3 / PostgreSQL)

1. **`BulkActionController::bulkSendPo(Request $request, JO $jo)`**:
   - Sebelum mengeksekusi `DB::transaction`, lakukan verifikasi terhadap seluruh `itemIds`.
   - Query items terkait beserta relasi `controls.poTracking`.
   - Periksa apakah ada item yang:
     - Memiliki kontrol `Material` (jika Part) atau `PO` (jika Component) dengan `status === 'Done'` ATAU `poTracking !== null`.
   - Jika ditemukan item yang sudah dikirim PO:
     - Kembalikan response JSON `422 Unprocessable Entity`:
       ```json
       {
         "message": "Beberapa part/komponen sudah pernah dikirim PO dan tidak dapat dikirim ulang.",
         "already_sent_items": [
           { "id": "uuid", "no": "1", "description": "Plate Top" }
         ]
       }
       ```
     - Transaksi dibatalkan (hard rejection).

2. **`BulkActionController::bulkSendSubcont(Request $request, JO $jo)`**:
   - Sebelum mengeksekusi transaksi, periksa apakah ada item dalam `itemIds` yang memiliki `is_subcont === true` atau kontrol pada proses tersebut sudah berstatus `In Progress SC`.
   - Jika ditemukan:
     - Kembalikan response JSON `422 Unprocessable Entity`:
       ```json
       {
         "message": "Beberapa part/komponen sudah aktif di Subcont dan tidak dapat dikirim ulang.",
         "already_sent_items": [
           { "id": "uuid", "no": "2", "description": "Pin Guide" }
         ]
       }
       ```
     - Transaksi dibatalkan (hard rejection).

3. **`ItemController::updateSubcont(Request $request, Item $item)`**:
   - Jika request meminta `isSubcont: true` sedangkan item saat ini sudah `is_subcont == true` dan `subcont_status === 'In Progress'`, pastikan tidak menduplikasi dispatch atau return 422 bila mencoba re-dispatch proses yang sama tanpa perubahan valid.

---

### B. Frontend (Next.js 16 / React 19 / TypeScript)

1. **Helper Identifikasi Status (`frontend/lib/po-tracking.ts` & `frontend/lib/subcont-tracking.ts`)**:
   - Tambahkan fungsi murni:
     - `isItemPoSent(item: Item, categoryKind: 'Part' | 'Component'): boolean`
       - Mengembalikan `true` jika kontrol `Material` (Part) / `PO` (Component) berstatus `"Done"` atau memiliki `poTracking` terisi.
     - `isItemSubcontSent(item: Item, process?: string): boolean`
       - Mengembalikan `true` jika `item.isSubcont === true` atau kontrol proses terkait berstatus `"In Progress SC"`.

2. **JO Detail Page (`frontend/app/projects/[projectId]/jos/[joId]/page.tsx`)**:
   - **Modal Kirim PO**:
     - Analisis item yang terpilih dalam `selectedItemIds`:
       - Hitung `eligibleItems` (belum pernah PO) dan `ineligibleItems` (sudah pernah PO).
     - Jika ada `ineligibleItems`:
       - Tampilkan kotak informasi (alert banner) bersih bernuansa netral/warning:
         `X part diabaikan karena sudah pernah dikirim PO ([Daftar part/No]).`
     - Tombol konfirmasi `"Kirim PO"`:
       - Menampilkan jumlah part yang benar-benar akan dikirim: misal `"Kirim PO (3 Part)"`.
       - Jika semua part terpilih ternyata sudah pernah dikirim PO, tombol submit berstatus `disabled` dengan keterangan *"Semua part terpilih sudah dikirim PO"*.
     - Ketika dispatch ke store/API, hanya kirim `eligibleItems.map(i => i.id)`.
   - **Modal Kirim Subcont**:
     - Analisis item terpilih: pisahkan `eligibleItems` (belum Subcont) vs `ineligibleItems` (sudah Subcont).
     - Tampilkan alert info jika ada item yang diabaikan karena sudah di Subcont.
     - Tombol konfirmasi hanya mengirim `eligibleItems.map(i => i.id)`.
     - Jika tidak ada item yang eligible, tombol submit berstatus `disabled`.

3. **Tabel Kontrol (`frontend/components/control-table.tsx` & `frontend/components/process-control-cell.tsx`)**:
   - Pada baris item yang PO-nya sudah terkirim:
     - Sel `Material` / `PO` berstatus `Done` tidak lagi memicu modal Kirim PO jika diklik, atau diberi indikasi bahwa PO sudah terbit.
   - Pada baris item yang Subcont-nya sudah aktif:
     - Opsi status `In Progress SC` dinonaktifkan atau dicegah pemicuan dialog Subcont ganda.

4. **State Store (`frontend/lib/store.tsx`)**:
   - Di dalam reducer `BULK_SEND_PO`:
     - Filter `action.itemIds` untuk hanya memproses item yang kontrol PO-nya belum berstatus `Done`.
   - Di dalam reducer `BULK_SEND_SUBCONT`:
     - Filter `action.itemIds` untuk hanya memproses item yang `isSubcont !== true`.

---

## 3. UI/UX Design System Compliance
- **Zero Emojis**: Menggunakan strictly SVG stroke icons atau teks bersih.
- **Micro-Copy**: Pesan jelas dan profesional dalam Bahasa Indonesia (sesuai konteks pengguna), misal:
  - *"2 dari 5 part yang dipilih sudah pernah dikirim PO dan akan dilewati."*
  - *"Part sudah aktif dalam proses Subcont."*
- **Aesthetic**: Sesuai palet CSS variables:
  - Alert box: `var(--color-bg-wash)` dengan border `var(--color-border)` dan aksen `var(--color-status-in-progress)` / `var(--color-text-secondary)`.
  - Disable state: `opacity: 0.5`, `cursor: not-allowed`.

---

## 4. Testing & Verification Plan

1. **Backend Tests (PHPUnit / Pest)**:
   - Test: `BulkActionControllerTest::test_cannot_send_po_for_items_already_sent_po` -> assert response 422.
   - Test: `BulkActionControllerTest::test_cannot_send_subcont_for_items_already_in_subcont` -> assert response 422.
   - Test: `BulkActionControllerTest::test_can_send_po_for_new_items` -> assert response 200.
2. **Frontend Tests (Vitest)**:
   - Unit test helper `isItemPoSent` dan `isItemSubcontSent`.
   - Test reducer `BULK_SEND_PO` dan `BULK_SEND_SUBCONT` mengabaikan item yang sudah terkirim.
   - Test visual filter dan disabled state pada dialog modal Kirim PO dan Kirim Subcont.

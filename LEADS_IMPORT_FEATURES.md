# Leads Import System - Complete Feature Documentation

## 🎯 Overview
Advanced CSV/Excel import system with duplicate detection, inline editing, and bulk database operations.

---

## ✨ Key Features Implemented

### 1. **Duplicate Detection** 🔍
- **Real-time detection** when file is uploaded
- Duplicates highlighted in **RED** in preview modal
- Duplicate rows show a **"DUP"** badge
- Phone numbers are compared (case-insensitive, trimmed)
- Duplicate count displayed in warning banner

### 2. **Inline Editing** ✏️
- Click **pencil icon** to edit any row
- Edit fields: Business Name, Phone, Address, Category
- Changes update duplicate detection instantly
- Edit mode toggles with same icon (click again to finish)

### 3. **Row Removal** 🗑️
- Click **trash icon** to remove unwanted rows
- Duplicate detection updates automatically after removal
- Removed rows are excluded from import

### 4. **Import Validation** ⚠️
- **BLOCKS saving** if duplicates exist
- Shows alert with duplicate phone numbers
- Save button is **disabled** when duplicates detected
- Clear visual feedback (red warning banner)

### 5. **Complete Data Preview** 📊
- Shows **ALL rows** (no pagination in preview)
- Shows **ALL columns** in horizontal scroll
- Empty values highlighted in **orange** as "Empty"
- Sticky header for easy navigation
- Full-screen modal with scroll support

### 6. **Bulk Database Transaction** 💾
- **Single API call** for all leads
- **Single database transaction** (all-or-nothing)
- Uses Prisma's `createMany()` for optimal performance
- **60-second timeout** for large imports
- **30-second max wait** for transaction start
- Duplicate check against existing database records
- Automatic rollback on any error

---

## 🚀 How to Use

### Step 1: Download Sample Template
1. Click **"Download Sample"** button
2. Opens `sample_leads.csv` with correct column format
3. Use this as template for your data

### Step 2: Import CSV/Excel
1. Click **"Import CSV/Excel"** button
2. Select your file (.csv, .xlsx, .xls)
3. System parses and validates data

### Step 3: Review & Edit Preview
- **Green banner** = No duplicates, ready to save ✅
- **Red banner** = Duplicates found, must fix ⚠️

**If duplicates found:**
1. Duplicate rows highlighted in RED
2. Edit phone numbers using pencil icon
3. OR remove duplicate rows using trash icon
4. System re-checks after each edit/removal

### Step 4: Save to Database
- Button **disabled** if duplicates exist
- Click **"Save All X Leads to Database"** when ready
- Single transaction saves all leads at once
- Shows success/error message
- Refreshes lead list automatically

---

## 📋 CSV Format

### Required Columns
```csv
place_id,business_name,phone,address,category,rating,review_count,social_only,website,business_status
```

### Column Details
| Column | Type | Required | Notes |
|--------|------|----------|-------|
| place_id | String | No | Google Maps Place ID |
| business_name | String | Yes | Will use "N/A" if empty |
| phone | String | No | Used for duplicate detection |
| address | String | No | Full address |
| category | String | No | Business category |
| rating | Float | No | 1.0 - 5.0 |
| review_count | Integer | No | Number of reviews |
| social_only | Boolean | No | "True" or "False" |
| website | String | No | URL |
| business_status | String | No | "OPERATIONAL", etc. |

### Empty Values
- Any column can be empty
- Empty values saved as `NULL` in database
- Business name defaults to "N/A" if empty
- Business status defaults to "N/A" if empty

---

## 🛠️ Technical Implementation

### Frontend (`app/leads/page.tsx`)
```typescript
// Duplicate detection
const detectDuplicates = (data: Lead[]) => {
  const phoneMap = new Map<string, number>();
  const duplicates = new Set<string>();
  // Counts phone occurrences
  // Returns Set of duplicate phones
}

// Features
- useState for importedData, duplicatePhones, editingIndex
- Real-time duplicate re-detection on edit/remove
- Validation before API call
- Single POST request with all leads
```

### Backend (`app/api/leads/route.ts`)
```typescript
// Single transaction with all operations
await prisma.$transaction(async (tx) => {
  // 1. Process all leads
  // 2. Check database for existing phones
  // 3. Filter out duplicates
  // 4. Bulk insert with createMany()
}, {
  maxWait: 30000,  // 30 seconds
  timeout: 60000,  // 60 seconds
});
```

### Database Transaction Benefits
- ✅ **Atomic**: All succeed or all fail
- ✅ **Fast**: Single bulk insert instead of N individual inserts
- ✅ **Safe**: Automatic rollback on error
- ✅ **Efficient**: Reduced database round-trips
- ✅ **Timeout protection**: Won't hang on large imports

---

## 🐛 Troubleshooting

### Issue: "Cannot read properties of undefined (reading 'count')"
**Solution:** Prisma client needs regeneration
1. Stop dev server (Ctrl+C)
2. Run: `npx prisma generate`
3. Restart: `npm run dev`

OR use the provided batch file:
```bash
regenerate-prisma.bat
```

### Issue: "Duplicates not detected"
**Solution:** Check phone number format
- Must be exact match (case-insensitive)
- Whitespace is trimmed
- Empty phones are not checked

### Issue: "Transaction timeout"
**Solution:** Increase timeout in `route.ts`
```typescript
{
  maxWait: 60000,  // Increase if needed
  timeout: 120000, // Increase if needed
}
```

### Issue: "Save button disabled"
**Reason:** Duplicates detected
- Red rows must be edited or removed
- Cannot proceed with duplicates
- This is intentional protection

---

## 📊 UI Features

### Color Coding
- 🔴 **Red rows** = Duplicates (must fix)
- 🟠 **Orange text** = Empty values (saved as NULL)
- 🟢 **Green banner** = No issues, ready to save
- 🔴 **Red banner** = Duplicates found, cannot save

### Icons & Badges
- ✏️ **Pencil** = Edit mode toggle
- 🗑️ **Trash** = Remove row
- 🏷️ **DUP badge** = Duplicate marker
- ✅/❌ **Save button** = Status indicator

---

## 🎯 Best Practices

1. **Always download sample first** to see correct format
2. **Review preview carefully** before saving
3. **Fix all duplicates** before attempting save
4. **Use edit feature** instead of re-uploading
5. **Remove unwanted rows** during preview
6. **Check duplicate warning** at bottom of modal
7. **Wait for success message** before closing modal

---

## 🔐 Data Safety

- ✅ **No partial imports** (transaction ensures all-or-nothing)
- ✅ **Duplicate prevention** (enforced at UI and API level)
- ✅ **Validation before save** (cannot bypass)
- ✅ **Database constraints** (skipDuplicates as backup)
- ✅ **Error rollback** (automatic transaction rollback)
- ✅ **User confirmation** (preview before commit)

---

## 📈 Performance

### Large File Handling
- Frontend: Can handle 1000+ rows in preview
- Backend: Single transaction, not N queries
- Database: Bulk insert optimization
- Timeout: 60 seconds for transaction

### Optimization Tips
- Limit imports to ~1000 rows per file
- For larger imports, split into multiple files
- Use consistent phone formats
- Remove duplicates before upload when possible

---

## 🆘 Support

### Files Modified
1. `app/leads/page.tsx` - Frontend UI and logic
2. `app/api/leads/route.ts` - Backend API with transactions
3. `prisma/schema.prisma` - Lead model (already existed)

### Key Dependencies
- `xlsx` - Excel/CSV parsing
- `@prisma/client` - Database ORM
- `next` - Framework

### Database
- PostgreSQL required
- Prisma migrations applied
- Lead table must exist

---

## ✅ Checklist Before First Import

- [ ] PostgreSQL database running
- [ ] `DATABASE_URL` set in `.env`
- [ ] Run `npx prisma generate`
- [ ] Run `npx prisma migrate dev`
- [ ] Dev server running (`npm run dev`)
- [ ] Download sample CSV to see format
- [ ] Prepare your data in correct format
- [ ] Upload and review preview
- [ ] Fix any duplicates
- [ ] Click save!

---

🎉 **You're all set! Happy importing!**

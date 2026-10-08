# Implementation Plan: Resume Authenticity & Non-Resume Content Guard (Document Classification Gate)

> **User Request**:
> *"if the resemue analyzer me or kuch file like pdf hi he lakin us me resemue ki jaga kuch or file uplode ki to kya honga wo uplode ho jaya ge to is ko rokne ke liya kya karna pade ga"*
> 
> *(If someone uploads another PDF file like an invoice, bill, college assignment, exam paper, or ticket instead of an actual resume/CV, what will happen? Will it get uploaded? How do we prevent/stop this?)*

---

## 1. Problem Analysis & Current Behavior (Kya Hota Hai Abhi?)

### Will it get uploaded right now?
**YES, currently it WILL get uploaded!**

### Why does this happen?
1. **Shallow Binary Validation**:
   In `server/controllers/userController.js`, `validateResumeBuffer` only inspects the first 4 bytes of the file for the PDF magic bytes signature (`%PDF` / `0x25504446`).
2. **Blind Cloudinary Upload**:
   Because an electricity bill, tax invoice, college question paper, or restaurant menu is a syntactically valid PDF, the server believes it is a valid file and **immediately uploads it to Cloudinary**.
3. **Nonsensical ATS AI Evaluation**:
   The text from the electricity bill or assignment is extracted and passed to Gemini / Groq with the prompt:
   *"You are an ATS Specialist. Analyze the following student resume..."*
   The LLM tries to evaluate the bill, returns a random ATS score (e.g. 42%), hallucinates missing tech skills, and attaches this evaluation to the student's profile.
4. **Data Pollution & Recruiter Confusion**:
   The non-resume file is permanently recorded in the database as the student's official `resumeUrl`. When recruiters inspect candidates in the Recruiter Dashboard or review job applications, they see an electricity bill or assignment instead of a resume!

---

## 2. The Solution: 4-Layer Pre-Upload Authenticity & Content Verification Gate

To stop this cleanly, we introduce a **Pre-Upload Document Classification Gate** that inspects the actual document contents **BEFORE** any file is sent to Cloudinary and **BEFORE** any database record is created.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                   RESUME AUTHENTICITY & CONTENT VERIFICATION GATE                                │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                  │
│   Incoming File: POST /api/users/resume { fileData, fileName }                                   │
│                                                                                                  │
│   ▼ LAYER 1: Binary Magic Byte & Size Check                                                      │
│   ├── Is it valid PDF (%PDF) or DOCX? (Yes)                                                      │
│   └── Size <= 5MB? (Yes)                                                                         │
│                                                                                                  │
│   ▼ LAYER 2: In-Memory Text Extraction (Pre-Upload!)                                             │
│   ├── Run pdf-parse directly on the memory buffer BEFORE calling Cloudinary                      │
│   └── Check: Extracted text length < 100 characters?                                             │
│       ──► REJECT: "Document contains no readable text (scanned image or empty page)."            │
│                                                                                                  │
│   ▼ LAYER 3: Deterministic Signature & Blacklist Detection (Instant Regex, 0ms, $0)              │
│   ├── Check for Blacklist Document Patterns:                                                     │
│   │   • Bills / Invoices: "Invoice #", "Electricity Bill", "Amount Due", "Meter Reading", "GSTIN"│
│   │   • ID Cards / Govt: "Aadhaar", "Govt of India", "Passport No", "Income Tax Dept"           │
│   │   • Exam Papers / Homework: "Question Paper", "Max Marks", "Semester Exam", "Hall Ticket"   │
│   │   • Menus / Receipts: "Appetizers", "Table #", "Main Course", "Payment Receipt"             │
│   │   ──► IF MATCHED: REJECT HTTP 422: "Detected [Invoice/Bill], not a Resume/CV."               │
│   │                                                                                              │
│   ├── Check for Whitelist Resume Structural Anchors:                                             │
│   │   • Required: Email address pattern                                                          │
│   │   • Required: At least 2 standard resume sections:                                           │
│   │     ["Education", "Experience", "Skills", "Projects", "Certifications", "Summary"]           │
│                                                                                                  │
│   ▼ LAYER 4: AI Pre-Flight Classifier (Gemini 2.5 Flash / Groq)                                  │
│   ├── If document is ambiguous / borderline (e.g. non-traditional layout):                       │
│   │   Fast prompt: "Is this document an authentic Resume/CV? Output JSON: { isResume, type }"    │
│   │   ──► If isResume === false: REJECT HTTP 422 with explanation.                               │
│                                                                                                  │
│   ▼ ALL GATES PASSED: Verified Resume ✓                                                          │
│   ├── Upload to Cloudinary                                                                       │
│   ├── Save to Resume collection & User record                                                    │
│   └── Run ATS keyword analysis                                                                   │
│                                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Proposed Changes

### Component 1: Document Classification Service

#### [NEW] `server/services/resumeAuthenticityService.js`
This service handles all content-level validation logic:
1. `extractTextFromBuffer(buffer, mimeType)`:
   Extracts text using `pdf-parse` in memory.
2. `detectNonResumeBlacklist(text)`:
   Runs regex against 4 categories of blacklisted non-resume documents:
   - **Financial / Bills / Invoices**: `/\b(invoice\s*#?|tax\s+invoice|electricity\s+bill|meter\s+reading|amount\s+due|payment\s+receipt|consumer\s+no|subtotal|hsn\s+code)\b/i`
   - **Official Government IDs**: `/\b(unique\s+identification\s+authority|aadhaar|income\s+tax\s+department|permanent\s+account\s+number|passport\s+no)\b/i`
   - **Exam / Academic Question Papers**: `/\b(question\s+paper|maximum\s+marks|semester\s+examination|answer\s+any\s+\d+|roll\s+no\b.*hall\s+ticket)\b/i`
   - **Commercial Menus / Catalogs**: `/\b(appetizers|main\s+course|desserts|beverages|table\s*#|order\s*#)\b/i`
3. `detectResumeStructuralMarkers(text)`:
   Checks for standard resume anatomy:
   - Contains valid email address regex.
   - Matches at least 2 common resume section keywords:
     `Education`, `Experience`, `Work History`, `Skills`, `Technical Skills`, `Projects`, `Certifications`, `Summary`, `Achievements`.
   - Action verbs and career markers: `developed`, `built`, `engineered`, `bachelor`, `b.tech`, `university`, `college`.
4. `classifyWithAi(text)` (Fallback for edge cases):
   Calls Groq / Gemini with a tight classification prompt:
   ```json
   {
     "isResume": false,
     "confidence": 98,
     "detectedType": "electricity_bill",
     "reason": "This document is an electricity utility bill containing consumer numbers and meter charges, not a professional resume or curriculum vitae."
   }
   ```
5. `verifyResumeContent(buffer, mimeType, fileName)`:
   Coordinates all layers and returns:
   `{ isValid: boolean, code: string, message: string, extractedText: string }`.

---

### Component 2: Backend Upload & Analysis Endpoints

#### [MODIFY] `server/controllers/userController.js`
In `uploadResume`:
1. Call `validateResumeBuffer` (binary check).
2. **NEW STEP**: Call `verifyResumeContent(validated.buffer, validated.mimeType, validated.sanitizedName)` **BEFORE Cloudinary upload**.
3. If `!validationResult.isValid`:
   Return `HTTP 422 Unprocessable Entity`:
   ```json
   {
     "success": false,
     "code": "INVALID_RESUME_CONTENT",
     "detectedType": validationResult.detectedType,
     "message": validationResult.message
   }
   ```
4. Only if `isValid === true`:
   - Proceed to `uploadResumeToCloudinary`.
   - Reuse the already extracted text for ATS analysis (saving redundant parsing).

#### [MODIFY] `server/controllers/resumeController.js`
In `analyzeResume`:
- If `resumeText` is submitted directly via request body, validate it through `detectNonResumeBlacklist` and structural checks to prevent grading arbitrary text.

---

### Component 3: Frontend User Experience

#### [MODIFY] `client/js/dashboard.js`
When `resumeFileInput` change event fires:
- If server responds with `422 INVALID_RESUME_CONTENT`:
  Display a clear, helpful warning in the UI:
  ```html
  <div class="alert alert-warning border border-warning d-flex align-items-start gap-2">
    <i class="bi bi-file-earmark-x-fill text-warning fs-5"></i>
    <div>
      <strong>Not a Resume:</strong> We detected that the uploaded file is a 
      <em>[Electricity Bill / Exam Paper / Invoice]</em>.
      Please upload a genuine resume or CV containing your education, skills, and projects.
    </div>
  </div>
  ```

#### [MODIFY] `client/js/resume-builder.js`
- Display similar pre-upload validation feedback if importing external PDF files.

---

## 4. Verification Plan

### Automated Unit / Integration Tests
Create test script `server/test_resume_authenticity.js`:
1. **Valid Resume Test**:
   - Provide a sample software engineer resume PDF with Education, Skills, and Projects -> Assert `isValid: true`.
2. **Electricity Bill / Invoice Test**:
   - Provide a PDF containing "Tax Invoice #INV-1092, Amount Due: ₹2450, GSTIN..." -> Assert `isValid: false`, `code: 'INVALID_RESUME_CONTENT'`, Cloudinary upload NOT called.
3. **College Question Paper Test**:
   - Provide a PDF containing "Semester Examination, Question Paper, Max Marks: 100" -> Assert `isValid: false`.
4. **Scanned / Empty PDF Test**:
   - Provide a 1-page blank PDF -> Assert `isValid: false`, reason: "Insufficient readable text".

### Manual UI Verification
1. Log in to Student Dashboard (`http://localhost:5500/dashboard.html`).
2. Click "Upload Resume".
3. Select an invoice or electricity bill PDF.
4. **Observe**: Upload is rejected immediately with a friendly explanation:
   *"Document rejection: This file appears to be an invoice or bill, not a resume. Please upload your curriculum vitae (CV)."*
5. Select a genuine student resume PDF.
6. **Observe**: Successfully uploaded, Cloudinary asset created, and ATS analysis generated cleanly.

---

## 5. Summary Answer to Your Question

| Question | Answer |
| :--- | :--- |
| **Kya wo upload ho jayega?** | **Haan, abhi upload ho jata hai** kyunki system sirf file extension aur `%PDF` binary header dekhta hai, document ka content nahi. |
| **Kya nuksan hoga?** | Fake file Cloudinary pe store hogi, AI us bill ko resume samajh kar faltu ka ATS score dega, aur recruiters ko student ke profile par bill/assignment dikhega. |
| **Is ko rokne ke liye kya karna padega?** | Cloudinary par bhejne se **pehle** hum server ke memory me text extract karenge, blacklist patterns (invoice, bill, marksheet, menu) check karenge, aur Gemini AI classifier se verify karenge ki document sach me Resume/CV hai ya nahi. Agar resume nahi hai, to upload wahin reject ho jayega! |

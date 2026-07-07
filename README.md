# GrowEasy AI-Powered CSV Importer

An intelligent, full-stack application that allows users to upload lead spreadsheets of any format, size, or structure (e.g., Facebook Lead Exports, Google Ads Exports, CRM tables, manual Excel files) and utilizes Google Gemini AI to dynamically parse, normalize, and map them into the target GrowEasy CRM format.

---

## 🚀 Getting Started

### 📋 Prerequisites
- **Node.js**: v18.x or v20.x installed.
- **Google Gemini API Key**: Obtain one from [Google AI Studio](https://aistudio.google.com/).

---

## 🛠️ Local Development Setup

1. **Clone the project & navigate to the workspace**:
   ```bash
   cd CSV-Importer
   ```

2. **Configure Backend Environment Variables**:
   Create a `.env` file inside the `backend/` folder:
   ```env
   PORT=5000
   GEMINI_API_KEY=your_google_gemini_api_key_here
   NODE_ENV=development
   ```

3. **Install Dependencies & Start Services**:

   #### Running Backend:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   *Runs on [http://localhost:5000](http://localhost:5000)*
     
   #### Running Frontend:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```
   *Runs on [http://localhost:3000](http://localhost:3000)*

   #### Running Unit Tests:
   ```bash
   cd backend
   npm test
   ```

---

## 🏗️ Folder Structure

```
workspace/
├── backend/
│   └── src/
│       ├── config/          # Configurations & environment auto-sanitization
│       ├── controllers/     # Controller handlers (upload/import)
│       ├── routes/          # Express route definitions
│       ├── services/        # Business logic services (CSV streaming parser, Gemini client)
│       ├── middlewares/     # Multer file handlers & global error boundary
│       ├── prompts/         # Independent Gemini system mapping prompt template
│       ├── types/           # TS Interfaces & CRM Typings
│       └── tests/           # Jest unit tests
├── frontend/
│   ├── app/                 # Next.js App Router (Layout & main Dashboard page)
│   ├── components/          # Reusable presentation views (DropZone, PreviewTable)
│   └── services/            # API call connectors for backend routes
└── README.md                # System instructions & documentation
```

---

## 🧠 AI Prompt Strategy & Structured Mappings

To achieve deterministic performance from a large language model on chaotic tabular data:
1. **Separation of Instructions**: The AI prompt is stored separately from executable logic inside [prompts/mappingPrompt.ts](file:///d:/Projects/CSV/backend/src/prompts/mappingPrompt.ts).
2. **Structured Outputs**: We feed Gemini a strict JSON Schema using the Generative AI SDK's `responseSchema` configuration. This forces the model to respond *exclusively* in a JSON array format matching our parameters, eliminating JSON parsing failures.
3. **Data Normalization Rules**:
   - **First Match Wins**: The first valid phone and email are isolated. Secondary ones are combined into the `crm_note` field.
   - **Phone Splitting**: Dial codes are extracted into `country_code`, and digits are formatted into `mobile_without_country_code`.
   - **Duplicate Filtering**: The backend screens processed contacts across import tasks, rejecting duplicate phone numbers/emails and logging them as skipped.
   - **Skip Tagging**: If neither email nor phone numbers are detected, the row is skipped and logged with an explanation.

---

## 🌐 Deployment Instructions

### 1. Backend → Render (Web Service)
1. Log into [Render](https://render.com/) and create a new **Web Service**.
2. Connect your GitHub repository.
3. Configure the following parameters:
   - **Runtime**: `Node`
   - **Build Command**: `cd backend && npm install && npm run build`
   - **Start Command**: `cd backend && npm start`
4. Under **Environment Variables**, add:
   - `GEMINI_API_KEY`: *(Your Google AI Studio key)*
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `CORS_ORIGIN`: `https://your-frontend-domain.vercel.app` (Add your frontend Vercel URL here once created)

### 2. Frontend → Vercel
1. Log into [Vercel](https://vercel.com/) and import your project repository.
2. Select the **`frontend`** directory as the **Root Directory** of the project.
3. Vercel will automatically detect the **Next.js** framework and configure the correct build settings.
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_API_URL`: `https://your-backend-domain.onrender.com` (Add your Render web service URL here)
5. Click **Deploy**.

# VitalSense - Healthcare Feedback & Patient Assessment Platform

A modern healthcare feedback collection and patient assessment platform built with React, featuring AI-powered voice interactions and real-time emotion detection.

![VitalSense](https://img.shields.io/badge/VitalSense-Healthcare-blue)
![React](https://img.shields.io/badge/React-18.3-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8)

## 🏥 Overview

VitalSense is a comprehensive healthcare feedback and patient assessment solution designed to:

- **Collect Patient Feedback** - Gather feedback on room cleanliness, staff interactions, and food quality through an intuitive chat interface
- **Nursing Staff Assessments** - Enable nursing staff to conduct patient check-ins with AI-powered voice conversations
- **Emotion Detection** - Real-time facial emotion analysis during patient interactions
- **AI-Powered Analysis** - Automatic patient condition assessment and priority recommendations

## ✨ Features

### For Patients
- 💬 **Chat-based Feedback** - Natural conversation flow for collecting feedback
- 📞 **Phone Call Option** - Request a callback for verbal feedback
- 🏷️ **Category Selection** - Organized feedback categories (Room, Staff, Food)

### For Nursing Staff
- 🎙️ **Voice Interface** - AI-powered voice conversations using Vapi
- 📹 **Video Emotion Capture** - Real-time emotion detection during assessments
- 📊 **AI Analysis** - Automated patient condition summaries and recommendations
- 🔴 **Priority Levels** - Automatic priority assignment (Low, Medium, High, Critical)

### Admin Features
- 📈 **Dashboard** - Overview of feedback and assessments
- 🔐 **Role-based Access** - Secure admin authentication

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (Database, Auth, Edge Functions)
- **Voice AI**: Vapi AI for voice conversations
- **AI Analysis**: Lovable AI Gateway (Gemini/GPT models)
- **State Management**: TanStack React Query

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or bun package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd <YOUR_PROJECT_NAME>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

## 📁 Project Structure

```
src/
├── components/
│   ├── feedback/        # Feedback collection components
│   │   ├── CategorySelector.tsx
│   │   ├── ChatInput.tsx
│   │   ├── ChatMessages.tsx
│   │   └── PhoneCallOption.tsx
│   ├── nursing/         # Nursing assessment components
│   │   ├── PatientInfoForm.tsx
│   │   ├── VoiceInterface.tsx
│   │   ├── VideoEmotionCapture.tsx
│   │   └── NursingComplete.tsx
│   ├── layout/          # Layout components
│   └── ui/              # shadcn/ui components
├── pages/
│   ├── Index.tsx        # Landing page
│   ├── Feedback.tsx     # Patient feedback page
│   ├── Nursing.tsx      # Nursing assessment page
│   └── AdminDashboard.tsx
├── hooks/               # Custom React hooks
└── integrations/        # Supabase integration
```

## 🔧 Environment Variables

The following environment variables are automatically configured:

- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anon key

### Edge Function Secrets

Configure these in your Lovable Cloud settings:

- `VAPI_API_KEY` - Vapi AI API key
- `VAPI_ASSISTANT_ID` - Vapi Assistant ID
- `LOVABLE_API_KEY` - Auto-provisioned for AI features

## 📱 Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/feedback` | Patient feedback collection |
| `/nursing` | Nursing staff patient assessment |
| `/admin` | Admin dashboard |
| `/auth` | Authentication page |

## 🔒 Security

- Row Level Security (RLS) enabled on all database tables
- Role-based access control for admin features
- Secure API key management via Supabase secrets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support, please contact the development team or open an issue in the repository.

---

Built with ❤️ using [Lovable](https://lovable.dev)

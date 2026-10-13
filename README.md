
# SmartStudy AI

A learning prototype that generates multiple-choice quizzes
for a selected topic using Google's Gemini API.

## Features
- React quiz dashboard
- Express REST API
- AI-generated multiple-choice questions
- Interactive answer selection and score calculation

## Tech Stack
- React and Vite
- Node.js and Express
- Google Gemini API
- dotenv for environment configuration

## Setup

### Backend
1. Open a terminal in the server directory.
2. Run `npm install`.
3. Create a `.env` file containing `GEMINI_API_KEY=your_key`.
4. Run `node server.js`.

### Frontend
1. Open another terminal in the client directory.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open the local URL shown by Vite.

The Gemini API key must remain private and must not be committed.

## Current limitations
- Quiz data is not persisted to a database.
- Authentication is not implemented.
- Scores are calculated in the browser.

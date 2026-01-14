
import React, { useState, useEffect } from 'react';
import { AppState, InterviewSession, InterviewQuestion, InterviewAnalysis } from './types';
import { generateQuestions, analyzeInterviewResponse } from './services/geminiService';
import { Button } from './components/Button';
import { VideoRecorder } from './components/VideoRecorder';
import { ScoreCard } from './components/ScoreCard';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.SETUP);
  const [session, setSession] = useState<InterviewSession>({
    resume: '',
    jobDescription: '',
    questions: [],
    currentQuestionIndex: 0,
    analyses: {}
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartSetup = async () => {
    if (!session.resume || !session.jobDescription) {
      alert("Please enter both resume and job description.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const questions = await generateQuestions(session.resume, session.jobDescription);
      if (questions.length === 0) throw new Error("Could not generate questions.");
      setSession(prev => ({ ...prev, questions }));
      setAppState(AppState.PREPARING);
    } catch (err) {
      setError("Failed to generate questions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const startInterview = () => {
    setAppState(AppState.INTERVIEWING);
  };

  const handleRecordingComplete = async (frames: string[]) => {
    if (frames.length === 0) {
      alert("No video data captured. Please try again.");
      return;
    }

    setAppState(AppState.ANALYZING);
    setIsLoading(true);

    try {
      const currentQ = session.questions[session.currentQuestionIndex];
      const analysis = await analyzeInterviewResponse(currentQ.text, frames);
      
      setSession(prev => ({
        ...prev,
        analyses: { ...prev.analyses, [currentQ.id]: analysis }
      }));
      setAppState(AppState.RESULTS);
    } catch (err) {
      setError("Failed to analyze response. Let's try the next question.");
      setAppState(AppState.INTERVIEWING);
    } finally {
      setIsLoading(false);
    }
  };

  const nextQuestion = () => {
    if (session.currentQuestionIndex < session.questions.length - 1) {
      setSession(prev => ({ ...prev, currentQuestionIndex: prev.currentQuestionIndex + 1 }));
      setAppState(AppState.INTERVIEWING);
    } else {
      // Completed all questions
      alert("Interview Completed! Great job.");
    }
  };

  const currentAnalysis = session.questions[session.currentQuestionIndex] 
    ? session.analyses[session.questions[session.currentQuestionIndex].id] 
    : null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4 px-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 text-white p-2 rounded-lg">
            <i className="fa-solid fa-bolt text-lg"></i>
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">HireSight<span className="text-indigo-600">AI</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-500 hidden md:block">Personal Interview Coach</span>
          <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 border border-indigo-100">
            <i className="fa-solid fa-user"></i>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-6">
        
        {/* SETUP STATE */}
        {appState === AppState.SETUP && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Master Your Next Interview</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">Upload your credentials and let our AI generate tailored questions and analyze your non-verbal cues in real-time.</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <i className="fa-solid fa-file-invoice text-indigo-500"></i> Your Resume / Profile
                </label>
                <textarea 
                  className="w-full h-64 p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-gray-700 text-sm shadow-sm"
                  placeholder="Paste your resume details here..."
                  value={session.resume}
                  onChange={(e) => setSession({...session, resume: e.target.value})}
                />
              </div>
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <i className="fa-solid fa-briefcase text-indigo-500"></i> Job Description
                </label>
                <textarea 
                  className="w-full h-64 p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-gray-700 text-sm shadow-sm"
                  placeholder="Paste the job description here..."
                  value={session.jobDescription}
                  onChange={(e) => setSession({...session, jobDescription: e.target.value})}
                />
              </div>
            </div>
            
            <div className="mt-12 flex justify-center">
              <Button 
                onClick={handleStartSetup} 
                isLoading={isLoading}
                className="w-full md:w-80 py-4 text-xl"
              >
                Prepare Interview Questions
              </Button>
            </div>
          </div>
        )}

        {/* PREPARING STATE */}
        {appState === AppState.PREPARING && (
          <div className="max-w-3xl mx-auto animate-in zoom-in-95 duration-300">
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-green-100 text-green-600 p-2 rounded-lg">
                  <i className="fa-solid fa-check-circle text-xl"></i>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Questions Generated</h2>
              </div>
              <div className="space-y-4 mb-8">
                {session.questions.map((q, idx) => (
                  <div key={q.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="text-xs font-bold uppercase text-indigo-500 tracking-wider mb-1 block">
                        {q.category}
                      </span>
                      <p className="text-gray-800 font-medium">{q.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button onClick={startInterview} className="w-full py-4 text-xl">
                Enter Interview Room
              </Button>
            </div>
          </div>
        )}

        {/* INTERVIEWING STATE */}
        {appState === AppState.INTERVIEWING && (
          <div className="flex flex-col items-center gap-8 py-4 animate-in fade-in duration-500">
            <div className="text-center w-full max-w-2xl bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase mb-3">
                Question {session.currentQuestionIndex + 1} of {session.questions.length}
              </span>
              <h3 className="text-2xl font-bold text-gray-900 leading-tight">
                {session.questions[session.currentQuestionIndex].text}
              </h3>
            </div>

            <VideoRecorder 
              isRecording={isRecording}
              setIsRecording={setIsRecording}
              onRecordingComplete={handleRecordingComplete} 
            />

            <div className="text-sm text-gray-500 text-center max-w-md">
              <p>Take a deep breath. Speak clearly. We'll analyze your response once you click "Finish Answer".</p>
            </div>
          </div>
        )}

        {/* ANALYZING STATE */}
        {appState === AppState.ANALYZING && (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-300">
            <div className="relative mb-8">
              <div className="w-24 h-24 border-8 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
                <i className="fa-solid fa-brain text-2xl"></i>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Analyzing Your Response...</h2>
            <p className="text-gray-500 text-center">Gemini is evaluating your structured thinking, sentiment, and body language.</p>
          </div>
        )}

        {/* RESULTS STATE */}
        {appState === AppState.RESULTS && currentAnalysis && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-right-8 duration-500 pb-20">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-3xl font-extrabold text-gray-900">Analysis Result</h2>
              <Button variant="outline" onClick={() => setAppState(AppState.INTERVIEWING)}>
                Redo Question
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <ScoreCard 
                label="Clarity" 
                score={currentAnalysis.clarityScore} 
                color="text-emerald-500" 
                icon="fa-solid fa-comment"
              />
              <ScoreCard 
                label="Sentiment" 
                score={currentAnalysis.sentimentScore} 
                color="text-pink-500" 
                icon="fa-solid fa-heart"
              />
              <ScoreCard 
                label="Structure" 
                score={currentAnalysis.structuredThinkingScore} 
                color="text-indigo-500" 
                icon="fa-solid fa-layer-group"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-camera text-indigo-500"></i> Body Language
                </h4>
                <p className="text-gray-600 leading-relaxed italic">
                  "{currentAnalysis.bodyLanguageNotes}"
                </p>
              </div>
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-lightbulb text-amber-500"></i> Overall Feedback
                </h4>
                <p className="text-gray-600 leading-relaxed">
                  {currentAnalysis.overallFeedback}
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                  <i className="fa-solid fa-star text-green-500"></i> Key Strengths
                </h4>
                <ul className="space-y-2">
                  {currentAnalysis.keyStrengths.map((s, i) => (
                    <li key={i} className="flex gap-2 items-start text-gray-700 bg-green-50 p-3 rounded-lg border border-green-100">
                      <i className="fa-solid fa-check text-green-500 mt-1"></i> {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                  <i className="fa-solid fa-arrow-trend-up text-indigo-500"></i> Areas to Improve
                </h4>
                <ul className="space-y-2">
                  {currentAnalysis.areasOfImprovement.map((a, i) => (
                    <li key={i} className="flex gap-2 items-start text-gray-700 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                      <i className="fa-solid fa-up-long text-indigo-500 mt-1"></i> {a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-8 border-t border-gray-200 flex justify-center">
              <Button onClick={nextQuestion} className="w-full md:w-80 h-16 text-xl">
                {session.currentQuestionIndex < session.questions.length - 1 
                  ? 'Next Question' 
                  : 'View Final Summary'
                }
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-900 font-bold hover:underline">Dismiss</button>
          </div>
        )}

      </main>

      <footer className="py-8 bg-gray-50 border-t border-gray-200 mt-20">
        <div className="max-w-5xl mx-auto px-6 text-center text-gray-500 text-sm">
          <p>© 2024 HireSight AI. Built with Google Gemini 3. Improve your interviewing skills 10x faster.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;

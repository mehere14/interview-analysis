
import React, { useState } from 'react';
import { AppState, InterviewSession } from './types';
import { generateQuestions, analyzeInterviewResponse } from './services/geminiService';
import { Button } from './components/Button';
import { VideoRecorder } from './components/VideoRecorder';

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
      const analysis = await analyzeInterviewResponse(currentQ, frames);
      
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
      setAppState(AppState.SETUP);
      setSession({
        resume: '',
        jobDescription: '',
        questions: [],
        currentQuestionIndex: 0,
        analyses: {}
      });
      alert("Interview Completed! Session reset.");
    }
  };

  const currentAnalysis = session.questions[session.currentQuestionIndex] 
    ? session.analyses[session.questions[session.currentQuestionIndex].id] 
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="py-4 px-10 flex items-center justify-between border-b border-gray-50">
        <div className="text-2xl font-bold text-[#2563eb] tracking-tight">Cruit</div>
        <div className="flex items-center gap-6">
          <button className="flex items-center gap-2 text-xs font-bold text-[#2563eb] uppercase tracking-wider">
            <i className="fa-solid fa-circle-user text-lg"></i> Account
          </button>
          <button className="flex items-center gap-2 text-xs font-bold text-[#2563eb] uppercase tracking-wider">
            <i className="fa-solid fa-circle-stop text-lg text-gray-400"></i> Logout
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 md:px-10 pt-10">
        
        {appState === AppState.SETUP && (
          <div className="animate-in fade-in duration-700">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">HireSight AI Interview Coach</h2>
              <p className="text-sm text-gray-500 uppercase tracking-widest font-bold">Paste your details to begin the evaluation</p>
            </div>

            <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-10">
              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                    <i className="fa-solid fa-file-lines text-[#2563eb]"></i> Your Resume
                  </label>
                  <textarea 
                    className="w-full h-[400px] p-8 rounded-[2rem] border border-gray-200 focus:ring-4 focus:ring-blue-50 focus:border-[#2563eb] transition-all outline-none text-gray-900 text-base leading-relaxed placeholder:text-gray-300 bg-white shadow-inner"
                    placeholder="Paste your resume content here..."
                    value={session.resume}
                    onChange={(e) => setSession({...session, resume: e.target.value})}
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                    <i className="fa-solid fa-bullseye text-[#2563eb]"></i> Job Description
                  </label>
                  <textarea 
                    className="w-full h-[400px] p-8 rounded-[2rem] border border-gray-200 focus:ring-4 focus:ring-blue-50 focus:border-[#2563eb] transition-all outline-none text-gray-900 text-base leading-relaxed placeholder:text-gray-300 bg-white shadow-inner"
                    placeholder="Paste the target job description here..."
                    value={session.jobDescription}
                    onChange={(e) => setSession({...session, jobDescription: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-center">
                <Button 
                  onClick={handleStartSetup} 
                  isLoading={isLoading}
                  className="w-full max-w-lg py-5 text-base font-bold uppercase tracking-[0.15em] bg-[#2563eb] hover:bg-blue-700 shadow-xl"
                >
                  Prepare Session
                </Button>
              </div>
            </div>
          </div>
        )}

        {appState === AppState.PREPARING && (
          <div className="max-w-3xl mx-auto animate-in zoom-in-95 duration-300 pt-10">
            <div className="bg-[#eff6ff] rounded-[3rem] p-12 border border-blue-100 shadow-lg">
              <div className="flex items-center gap-4 mb-10">
                <div className="bg-white text-[#2563eb] w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm">
                  <i className="fa-solid fa-wand-magic-sparkles text-xl"></i>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Custom Questions Ready</h2>
              </div>
              <div className="space-y-4 mb-12">
                {session.questions.map((q, idx) => (
                  <div key={q.id} className="p-6 bg-white/60 rounded-[1.5rem] border border-white/50 flex gap-5 items-center backdrop-blur-sm">
                    <span className="flex-shrink-0 w-10 h-10 rounded-full bg-[#2563eb] text-white flex items-center justify-center font-bold text-sm shadow-md">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="text-[10px] font-bold text-[#2563eb] uppercase tracking-widest">{q.category}</span>
                      <p className="text-gray-800 font-semibold text-lg">{q.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button onClick={startInterview} className="w-full py-5 text-xl font-bold rounded-[1.5rem]">
                Start practicing
              </Button>
            </div>
          </div>
        )}

        {appState === AppState.INTERVIEWING && (
          <div className="flex flex-col items-center gap-10 py-4 animate-in fade-in duration-500">
            <div className="text-center w-full max-w-3xl bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
              <span className="inline-block px-4 py-1 bg-blue-50 text-[#2563eb] rounded-full text-xs font-bold uppercase tracking-[0.1em] mb-6">
                Question {session.currentQuestionIndex + 1} of {session.questions.length} • {session.questions[session.currentQuestionIndex].category}
              </span>
              <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
                {session.questions[session.currentQuestionIndex].text}
              </h3>
            </div>

            <VideoRecorder 
              isRecording={isRecording}
              setIsRecording={setIsRecording}
              onRecordingComplete={handleRecordingComplete} 
            />

            <div className="flex items-center gap-2 text-gray-400">
              <i className="fa-solid fa-circle-info text-blue-500"></i>
              <p className="text-sm font-medium">Record your answer. Use the {session.questions[session.currentQuestionIndex].category === 'technical' ? 'Thinking Out Loud approach' : 'STAR+R method'}.</p>
            </div>
          </div>
        )}

        {appState === AppState.ANALYZING && (
          <div className="flex flex-col items-center justify-center py-32 animate-in fade-in duration-300">
            <div className="relative mb-8">
               <div className="w-24 h-24 border-[6px] border-blue-50 border-t-[#2563eb] rounded-full animate-spin"></div>
               <div className="absolute inset-0 flex items-center justify-center">
                  <i className="fa-solid fa-brain text-2xl text-[#2563eb] animate-pulse"></i>
               </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">AI Interview Evaluation...</h2>
            <p className="text-sm text-gray-500 uppercase tracking-widest font-bold">Grading on STAR+R & Technical metrics</p>
          </div>
        )}

        {appState === AppState.RESULTS && currentAnalysis && (
          <div className="max-w-5xl mx-auto space-y-12 animate-in slide-in-from-right-8 duration-500 pb-24">
            <div className="flex items-center justify-between border-b border-gray-100 pb-8">
              <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Practice Evaluation Report</h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-gray-500 text-xs uppercase tracking-widest font-bold">Overall Score</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <i key={i} className={`fa-solid fa-star ${i <= currentAnalysis.overallScore ? 'text-[#2563eb]' : 'text-gray-200'}`}></i>
                    ))}
                  </div>
                </div>
              </div>
              <Button variant="outline" onClick={() => setAppState(AppState.INTERVIEWING)} className="px-8 border-2 border-gray-100 text-gray-600 font-bold">
                Redo practice
              </Button>
            </div>

            {/* Dimensional Scoring Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentAnalysis.dimensions.map((dim, i) => (
                <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-tight w-2/3">{dim.label}</h4>
                    <span className="bg-blue-50 text-[#2563eb] font-black text-xl px-3 py-1 rounded-xl">{dim.score}<span className="text-[10px] text-blue-300 font-medium">/5</span></span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-4">{dim.feedback}</p>
                </div>
              ))}
            </div>

            {/* Red Flags Section */}
            {currentAnalysis.redFlags && currentAnalysis.redFlags.length > 0 && (
              <div className="bg-red-50 rounded-[2.5rem] p-10 border border-red-100 shadow-sm">
                <h4 className="font-bold text-red-900 mb-6 flex items-center gap-3 text-lg">
                  <span className="w-8 h-8 rounded-lg bg-red-200 text-red-700 flex items-center justify-center"><i className="fa-solid fa-triangle-exclamation"></i></span>
                  Red Flags Detected
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {currentAnalysis.redFlags.map((flag, i) => (
                    <div key={i} className="flex gap-3 items-start bg-white/60 p-4 rounded-2xl border border-red-200/50">
                      <i className="fa-solid fa-circle-xmark text-red-500 mt-1"></i>
                      <span className="text-sm text-red-800 font-medium leading-relaxed">{flag}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-10">
              <div className="bg-[#fdf2f8] rounded-[2.5rem] p-10 border border-pink-100 shadow-sm">
                <h4 className="font-bold text-gray-900 mb-6 flex items-center gap-3 text-lg">
                  <span className="w-8 h-8 rounded-lg bg-pink-200 text-pink-700 flex items-center justify-center"><i className="fa-solid fa-video"></i></span>
                  Non-Verbal & Professionalism
                </h4>
                <p className="text-gray-700 leading-relaxed italic bg-white/40 p-5 rounded-2xl border border-white/60 text-sm">
                  "{currentAnalysis.bodyLanguageNotes}"
                </p>
              </div>
              <div className="bg-[#eff6ff] rounded-[2.5rem] p-10 border border-blue-100 shadow-sm">
                <h4 className="font-bold text-gray-900 mb-6 flex items-center gap-3 text-lg">
                  <span className="w-8 h-8 rounded-lg bg-blue-200 text-blue-700 flex items-center justify-center"><i className="fa-solid fa-star"></i></span>
                  Coach's Summary
                </h4>
                <p className="text-gray-700 leading-relaxed text-sm">
                  {currentAnalysis.overallFeedback}
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] px-2 border-l-4 border-green-500">Key Strengths</h4>
                <div className="space-y-3">
                  {currentAnalysis.keyStrengths.map((s, i) => (
                    <div key={i} className="flex gap-4 items-center bg-green-50/40 p-5 rounded-[1.5rem] border border-green-100/50">
                      <i className="fa-solid fa-check-circle text-green-500 text-lg"></i> 
                      <span className="font-medium text-gray-800 text-sm">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] px-2 border-l-4 border-indigo-500">Areas to Focus</h4>
                <div className="space-y-3">
                  {currentAnalysis.areasOfImprovement.map((a, i) => (
                    <div key={i} className="flex gap-4 items-center bg-indigo-50/40 p-5 rounded-[1.5rem] border border-indigo-100/50">
                      <i className="fa-solid fa-arrow-trend-up text-indigo-500 text-lg"></i>
                      <span className="font-medium text-gray-800 text-sm">{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-16 flex justify-center">
              <Button onClick={nextQuestion} className="w-full md:w-96 py-6 text-lg uppercase tracking-[0.2em] font-black bg-[#2563eb] rounded-[2rem] shadow-2xl">
                {session.currentQuestionIndex < session.questions.length - 1 
                  ? 'Next Challenge' 
                  : 'Complete Session'
                }
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-lg p-5 bg-red-600 text-white rounded-[2rem] shadow-[0_20px_50px_rgba(220,38,38,0.3)] flex items-center justify-between z-50 animate-bounce">
            <div className="flex items-center gap-3">
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span className="text-sm font-bold">{error}</span>
            </div>
            <button onClick={() => setError(null)} className="ml-4 hover:scale-125 transition-transform p-2">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        )}

      </main>

      <footer className="py-12 border-t border-gray-50 mt-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
           <p className="text-[11px] text-gray-400 uppercase tracking-[0.3em] font-bold">
             Cruit x HireSight AI • Professional Interview Coaching
           </p>
           <p className="text-[9px] text-gray-300 mt-4 uppercase tracking-widest leading-relaxed">
             Evaluations based on STAR+R (Behavioral) and Meta-Reasoning (Technical) frameworks.
           </p>
        </div>
      </footer>
      
      <div className="fixed bottom-8 right-8 z-40">
        <Button className="bg-white text-[#2563eb] border border-blue-100 px-5 py-3 text-xs font-black shadow-lg hover:shadow-xl transition-all">
          <i className="fa-solid fa-message-heart"></i> GIVE FEEDBACK
        </Button>
      </div>
    </div>
  );
};

export default App;

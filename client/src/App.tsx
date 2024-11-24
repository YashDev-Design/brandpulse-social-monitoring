import React, { useState } from 'react';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-900 via-teal-900 to-emerald-900 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-2">
          <svg className="w-10 h-10 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <h1 className="text-4xl font-bold text-white">Brand<span className="text-cyan-400">Pulse</span></h1>
        </div>
        <p className="text-cyan-200">Real-Time Social Media Intelligence</p>
      </div>

      {/* Login Card */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-white/20 shadow-2xl">
        <h2 className="text-2xl font-semibold text-white mb-6">Sign in to your account</h2>

        <form className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-cyan-200 mb-2">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="analyst@company.com"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-cyan-200 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-semibold rounded-lg transition-all shadow-lg shadow-cyan-500/30"
          >
            Sign In
          </button>

          <button
            type="button"
            className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors border border-white/20"
          >
            Try Demo Account
          </button>
        </form>

        <div className="mt-6 p-4 bg-cyan-900/50 rounded-lg border border-cyan-500/30">
          <p className="text-cyan-300 text-sm mb-1">Demo credentials:</p>
          <p className="text-white text-sm">Email: demo@brandpulse.io</p>
          <p className="text-white text-sm">Password: demo123</p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-12 mt-10 text-center">
        <div>
          <div className="text-3xl font-bold text-white">500K+</div>
          <div className="text-cyan-300 text-sm">Mentions/Day</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-white">94%</div>
          <div className="text-cyan-300 text-sm">Sentiment Accuracy</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-white">Real-time</div>
          <div className="text-cyan-300 text-sm">Monitoring</div>
        </div>
      </div>

      <p className="mt-8 text-cyan-300 text-sm">AI-Powered Social Listening & Analytics</p>
    </div>
  );
}

export default App;

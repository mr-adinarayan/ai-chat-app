import { SignedIn, SignedOut, SignIn } from '@clerk/clerk-react';
import { Sparkles, MessageSquare, Image as ImageIcon, Cloud } from 'lucide-react';
import ChatLayout from './components/ChatLayout';
import InstallPWA from './components/InstallPWA';

export default function App() {
  return (
    <>
      <SignedIn>
        {/* Only logged-in users see the chat and PWA installer */}
        <ChatLayout />
        <InstallPWA />
      </SignedIn>
      
      <SignedOut>
        {/* Logged-out users see the beautiful landing page */}
        <LandingSignIn />
      </SignedOut>
    </>
  );
}

function LandingSignIn() {
  const features = [
    { icon: MessageSquare, text: 'Multi-model chat with streaming' },
    { icon: ImageIcon, text: 'Vision — analyze images in conversation' },
    { icon: Cloud, text: 'Cloud-synced chat history' },
  ];

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-bg px-4 py-8">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        {/* Hero Section */}
        <div className="text-center lg:text-left">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-900/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-white">Nova Chat</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-5">
            Your AI assistant,
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              always in sync.
            </span>
          </h1>

          <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto lg:mx-0">
            Sign in to start chatting with Claude. Your conversations are
            securely synced across all your devices.
          </p>

          <ul className="space-y-2.5 max-w-md mx-auto lg:mx-0">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-3 text-gray-300">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                  <f.icon className="w-4 h-4 text-violet-400" />
                </div>
                <span>{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Clerk Sign In Component */}
        <div className="flex justify-center lg:justify-end">
          <SignIn routing="hash" />
        </div>
      </div>
    </div>
  );
}
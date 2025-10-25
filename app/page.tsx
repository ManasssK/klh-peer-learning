// app/page.js
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-6">
          KLH Peer Learning Network 🎓
        </h1>
        <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
          A campus-only educational video platform where KLH students share knowledge, 
          collaborate, and learn together.
        </p>
        
        <div className="flex gap-4 justify-center">
          <Link 
            href="/signup"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition shadow-lg"
          >
            Get Started
          </Link>
          <Link 
            href="/login"
            className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-50 transition shadow-lg border-2 border-blue-600"
          >
            Login
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Platform Features
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg p-8 shadow-md">
            <div className="text-5xl mb-4">🔒</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Campus-Only Access
            </h3>
            <p className="text-gray-600">
              Only verified @klh.edu.in email addresses can join
            </p>
          </div>

          <div className="bg-white rounded-lg p-8 shadow-md">
            <div className="text-5xl mb-4">📹</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Video Sharing
            </h3>
            <p className="text-gray-600">
              Upload and stream educational videos seamlessly
            </p>
          </div>

          <div className="bg-white rounded-lg p-8 shadow-md">
            <div className="text-5xl mb-4">💬</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Discussion & Q&A
            </h3>
            <p className="text-gray-600">
              Comment and discuss videos with your peers
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

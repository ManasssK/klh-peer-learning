import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-6">
          KLH Peer Learning Network 🎓
        </h1>
        {/* Paragraph that stays black even in dark mode */}
        <p className="text-xl text-white mb-8 max-w-2xl mx-auto">
          A campus-only educational video platform where KLH students share knowledge, 
          collaborate, and learn together.
        </p>
        
        <div className="flex gap-4 justify-center flex-wrap">
          <Link 
            href="/signup"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition shadow-lg"
          >
            Get Started
          </Link>
          <Link 
            href="/login"
            className="bg-white dark:bg-gray-700 text-blue-600 dark:text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition shadow-lg border-2 border-blue-600 dark:border-blue-500"
          >
            Login
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Platform Features
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition">
            <div className="text-5xl mb-4">🔒</div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
              Campus-Only Access
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Only verified @klh.edu.in email addresses can join
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition">
            <div className="text-5xl mb-4">📹</div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
              Video Sharing
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Upload and stream educational videos seamlessly
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition">
            <div className="text-5xl mb-4">💬</div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
              Discussion & Q&A
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Comment and discuss videos with your peers
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

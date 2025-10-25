'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [showContent, setShowContent] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      // When video finishes, show content
      const handleEnd = () => {
        setTimeout(() => setShowContent(true), 500); // small delay for smooth fade
      };
      video.addEventListener('ended', handleEnd);
      return () => video.removeEventListener('ended', handleEnd);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300 flex items-center justify-center relative overflow-hidden">
      {/* 🔹 Intro Video Animation */}
      {!showContent && (
        <div className="absolute inset-0 flex items-center justify-center bg-black transition-opacity duration-1000">
          <video
            ref={videoRef}
            src="https://res.cloudinary.com/dpin9vdqe/video/upload/v1761403065/KLH_Logo_ufi1zd.mp4"
            autoPlay
            muted
            playsInline
            className="w-full h-full object-contain"
          />
        </div>
      )}

      {/* 🔹 Main Page Content */}
      <div
        className={`transition-all duration-1000 ease-out ${
          showContent
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-6">
            KLH Peer Learning Network 🎓
          </h1>

          {/* ✅ Always White Text */}
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

        {/* 🔹 Features Section */}
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
    </div>
  );
}

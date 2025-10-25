'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import Comments from '@/components/Comments';
import QuestionsAndAnswers from '@/components/QuestionsAndAnswers';
import VideoAnalytics from '@/components/VideoAnalytics';
import ReportButton from '@/components/ReportButton';
import ThemeToggle from '@/components/ThemeToggle';
import { askPerplexity } from '@/lib/ai-service'; // ✅ Added import

export default function VideoPage() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('comments');

  // ✅ Added AI Summary states
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (!id || !user) return;

    const fetchVideo = async () => {
      try {
        const videoDoc = await getDoc(doc(db, 'videos', id));

        if (!videoDoc.exists()) {
          setError('Video not found');
          setLoading(false);
          return;
        }

        const videoData = videoDoc.data();
        setVideo({ id: videoDoc.id, ...videoData });

        // Increment view count
        await updateDoc(doc(db, 'videos', id), {
          views: increment(1),
        });

        setLoading(false);
      } catch (err) {
        console.error('Error fetching video:', err);
        setError('Failed to load video');
        setLoading(false);
      }
    };

    fetchVideo();
  }, [id, user, authLoading, router]);

  // ✅ AI Summary Function
  const handleGenerateSummary = async () => {
    setLoadingSummary(true);
    setShowSummary(true);

    try {
      const prompt = `Create a concise educational summary of this video:

Title: ${video.title}
Subject: ${video.subject}
Topics: ${video.topics?.join(', ') || 'Not specified'}
Description: ${video.description || 'No description available'}

Provide:
1. Main Topic (1 line)
2. Key Points (3-5 bullet points)
3. Who Should Watch (1 line)
4. Prerequisites (if any)

Keep it under 150 words, educational, and actionable.`;

      const result = await askPerplexity(prompt, '', false);

      if (result.success) {
        setSummary(result.answer);
      } else {
        setSummary('Failed to generate summary. Please try again.');
      }
    } catch (error) {
      console.error('Summary error:', error);
      setSummary('Error generating summary. Please try again.');
    } finally {
      setLoadingSummary(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading video...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{error}</h2>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            Go back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!video) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold text-gray-800">
            KLH Peer Learning
          </Link>
          <div className="flex gap-3 items-center">
            <ThemeToggle />
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-800">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2">
            <div className="bg-black rounded-lg overflow-hidden mb-4">
              <video
                src={video.videoUrl}
                controls
                className="w-full"
                style={{ maxHeight: '600px' }}
              >
                Your browser does not support video playback.
              </video>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{video.title}</h1>

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <span>👁️ {video.views || 0} views</span>
                <span>
                  ⏱️ {Math.floor(video.duration / 60)}:
                  {(video.duration % 60).toString().padStart(2, '0')}
                </span>
                <span>
                  📅{' '}
                  {video.createdAt
                    ? new Date(video.createdAt.seconds * 1000).toLocaleDateString()
                    : 'Recently'}
                </span>
              </div>

              <div className="mb-4">
                <ReportButton
                  contentType="video"
                  contentId={video.id}
                  contentOwnerId={video.ownerUid}
                />
              </div>

              <div className="flex items-center gap-4 pb-4 border-b">
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{video.ownerName}</p>
                  <p className="text-sm text-gray-600">{video.ownerEmail}</p>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {video.description || 'No description provided.'}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Analytics */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <VideoAnalytics
                videoId={id}
                ownerUid={video.ownerUid}
                currentUserUid={user.uid}
              />

              <h3 className="font-semibold text-gray-800 mb-4">Course Details</h3>

              {/* Playlist */}
              {video.playlistId && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Part of Playlist</h3>
                  <Link
                    href={`/playlists/${video.playlistId}`}
                    className="block p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">📋</div>
                      <div>
                        <p className="font-medium text-blue-600 hover:underline">
                          View Full Playlist →
                        </p>
                        <p className="text-xs text-gray-600">
                          See all videos in this series
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Subject</p>
                  <p className="font-medium text-gray-800">{video.subject}</p>
                </div>

                {video.syllabusTag && (
                  <div>
                    <p className="text-sm text-gray-600">Course Code</p>
                    <p className="font-medium text-gray-800">{video.syllabusTag}</p>
                  </div>
                )}

                {video.topics && video.topics.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Topics Covered</p>
                    <div className="flex flex-wrap gap-2">
                      {video.topics.map((topic, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ✅ AI Summary Card */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-lg shadow-md p-6 border-2 border-purple-200 dark:border-purple-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🤖</span>
                  <h3 className="font-bold text-gray-800 dark:text-white">
                    AI Summary
                  </h3>
                </div>
                {!showSummary && (
                  <button
                    onClick={handleGenerateSummary}
                    disabled={loadingSummary}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-300 font-medium disabled:opacity-50"
                  >
                    {loadingSummary ? '⏳ Loading...' : '✨ Get Summary'}
                  </button>
                )}
              </div>

              {showSummary && (
                <div className="space-y-3">
                  {loadingSummary ? (
                    <div className="space-y-2">
                      <div className="animate-pulse h-4 bg-gray-300 rounded"></div>
                      <div className="animate-pulse h-4 bg-gray-300 rounded w-5/6"></div>
                      <div className="animate-pulse h-4 bg-gray-300 rounded w-4/6"></div>
                    </div>
                  ) : (
                    <>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {summary}
                      </div>
                      <button
                        onClick={handleGenerateSummary}
                        className="text-purple-600 dark:text-purple-400 text-sm hover:underline"
                      >
                        🔄 Regenerate
                      </button>
                    </>
                  )}
                </div>
              )}

              {!showSummary && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  Get an AI-powered summary of this video&apos;s key points instantly
                </p>
              )}
            </div>

            {/* Comments / Q&A Tabs */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="flex border-b">
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`flex-1 px-6 py-3 font-medium transition ${
                    activeTab === 'comments'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  💬 Comments
                </button>
                <button
                  onClick={() => setActiveTab('qa')}
                  className={`flex-1 px-6 py-3 font-medium transition ${
                    activeTab === 'qa'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  ❓ Q&A
                </button>
              </div>
              <div className="p-0">
                {activeTab === 'comments' ? (
                  <Comments videoId={id} />
                ) : (
                  <QuestionsAndAnswers videoId={id} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// app/profile/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { deleteUser } from 'firebase/auth';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

export default function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();

  const [userVideos, setUserVideos] = useState([]);
  const [userComments, setUserComments] = useState([]);
  const [userQuestions, setUserQuestions] = useState([]);
  const [stats, setStats] = useState({
    totalVideos: 0,
    totalViews: 0,
    totalComments: 0,
    totalQuestions: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchUserData();
    }
  }, [user, authLoading, router]);

  const fetchUserData = async () => {
    try {
      // Fetch user's videos
      const videosQuery = query(
        collection(db, 'videos'),
        where('ownerUid', '==', user.uid)
      );
      const videosSnapshot = await getDocs(videosQuery);
      const videosData = videosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUserVideos(videosData);

      // Fetch user's comments
      const commentsQuery = query(
        collection(db, 'comments'),
        where('authorUid', '==', user.uid)
      );
      const commentsSnapshot = await getDocs(commentsQuery);
      const commentsData = commentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUserComments(commentsData);

      // Fetch user's questions
      const questionsQuery = query(
        collection(db, 'qa_threads'),
        where('askerUid', '==', user.uid)
      );
      const questionsSnapshot = await getDocs(questionsQuery);
      const questionsData = questionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUserQuestions(questionsData);

      // Calculate stats
      const totalViews = videosData.reduce((sum, video) => sum + (video.views || 0), 0);
      setStats({
        totalVideos: videosData.length,
        totalViews,
        totalComments: commentsData.length,
        totalQuestions: questionsData.length
      });

      setLoading(false);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setLoading(false);
    }
  };

  // Delete own video
  const handleDeleteVideo = async (videoId) => {
    if (!confirm('Delete this video permanently?')) return;

    try {
      await deleteDoc(doc(db, 'videos', videoId));
      
      // Delete associated comments
      const commentsQuery = query(
        collection(db, 'comments'),
        where('videoId', '==', videoId)
      );
      const commentsSnapshot = await getDocs(commentsQuery);
      await Promise.all(
        commentsSnapshot.docs.map(doc => deleteDoc(doc.ref))
      );

      alert('Video deleted successfully');
      fetchUserData();
    } catch (err) {
      console.error('Error deleting video:', err);
      alert('Failed to delete video');
    }
  };

  // Delete own comment
  const handleDeleteComment = async (commentId) => {
    if (!confirm('Delete this comment?')) return;

    try {
      await deleteDoc(doc(db, 'comments', commentId));
      alert('Comment deleted');
      fetchUserData();
    } catch (err) {
      console.error('Error deleting comment:', err);
      alert('Failed to delete comment');
    }
  };

  // Delete own question
  const handleDeleteQuestion = async (questionId) => {
    if (!confirm('Delete this question?')) return;

    try {
      await deleteDoc(doc(db, 'qa_threads', questionId));
      alert('Question deleted');
      fetchUserData();
    } catch (err) {
      console.error('Error deleting question:', err);
      alert('Failed to delete question');
    }
  };

  // Delete own account
  const handleDeleteAccount = async () => {
    const confirmation = prompt(
      'Type "DELETE MY ACCOUNT" to confirm account deletion. This cannot be undone!'
    );

    if (confirmation !== 'DELETE MY ACCOUNT') {
      alert('Account deletion cancelled');
      return;
    }

    try {
      // Delete user's videos
      const videosQuery = query(
        collection(db, 'videos'),
        where('ownerUid', '==', user.uid)
      );
      const videosSnapshot = await getDocs(videosQuery);
      await Promise.all(
        videosSnapshot.docs.map(doc => deleteDoc(doc.ref))
      );

      // Delete user's comments
      const commentsQuery = query(
        collection(db, 'comments'),
        where('authorUid', '==', user.uid)
      );
      const commentsSnapshot = await getDocs(commentsQuery);
      await Promise.all(
        commentsSnapshot.docs.map(doc => deleteDoc(doc.ref))
      );

      // Delete user's questions
      const questionsQuery = query(
        collection(db, 'qa_threads'),
        where('askerUid', '==', user.uid)
      );
      const questionsSnapshot = await getDocs(questionsQuery);
      await Promise.all(
        questionsSnapshot.docs.map(doc => deleteDoc(doc.ref))
      );

      // Delete user document
      await deleteDoc(doc(db, 'users', user.uid));

      // Delete Firebase Auth account
      await deleteUser(auth.currentUser);

      alert('Account deleted successfully');
      router.push('/');
    } catch (err) {
      console.error('Error deleting account:', err);
      alert('Failed to delete account: ' + err.message);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading profile...</div>
      </div>
    );
  }

  if (!user) return null;

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
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-800"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
              {user.displayName?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-1">
                {user.displayName}
              </h1>
              <p className="text-gray-600 mb-2">{user.email}</p>
              <span
                className={`text-xs px-3 py-1 rounded-full ${
                  user.role === 'admin'
                    ? 'bg-red-100 text-red-800'
                    : user.role === 'faculty'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {user.role}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-2">📹</div>
            <div className="text-2xl font-bold text-gray-800">{stats.totalVideos}</div>
            <div className="text-sm text-gray-600">My Videos</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-2">👁️</div>
            <div className="text-2xl font-bold text-gray-800">{stats.totalViews}</div>
            <div className="text-sm text-gray-600">Total Views</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-2">💬</div>
            <div className="text-2xl font-bold text-gray-800">{stats.totalComments}</div>
            <div className="text-sm text-gray-600">Comments</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-2">❓</div>
            <div className="text-2xl font-bold text-gray-800">{stats.totalQuestions}</div>
            <div className="text-sm text-gray-600">Questions Asked</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 font-medium transition ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              📊 Overview
            </button>
            <button
              onClick={() => setActiveTab('videos')}
              className={`px-6 py-3 font-medium transition ${
                activeTab === 'videos'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              📹 My Videos ({userVideos.length})
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-6 py-3 font-medium transition ${
                activeTab === 'activity'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              💬 My Activity
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-3 font-medium transition ${
                activeTab === 'settings'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              ⚙️ Settings
            </button>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Account Overview
                </h2>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Member Since</p>
                    <p className="font-semibold text-gray-800">
                      {new Date(user.joinedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Email Verification</p>
                    <p className="font-semibold text-gray-800">
                      {user.emailVerified ? '✅ Verified' : '⚠️ Not Verified'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Videos Tab */}
            {activeTab === 'videos' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  My Uploaded Videos
                </h2>
                {userVideos.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    You haven't uploaded any videos yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {userVideos.map((video) => (
                      <div
                        key={video.id}
                        className="border border-gray-200 rounded-lg p-4 flex justify-between items-center"
                      >
                        <div className="flex-1">
                          <Link
                            href={`/videos/${video.id}`}
                            className="text-blue-600 hover:underline font-semibold"
                          >
                            {video.title}
                          </Link>
                          <p className="text-sm text-gray-600">
                            {video.subject} • {video.views || 0} views
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteVideo(video.id)}
                          className="text-red-600 hover:underline text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  My Activity
                </h2>
                
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  My Comments ({userComments.length})
                </h3>
                <div className="space-y-3 mb-6">
                  {userComments.slice(0, 5).map((comment) => (
                    <div
                      key={comment.id}
                      className="border border-gray-200 rounded-lg p-3"
                    >
                      <p className="text-gray-800 mb-2">{comment.body}</p>
                      <div className="flex justify-between items-center">
                        <Link
                          href={`/videos/${comment.videoId}`}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View Video →
                        </Link>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-red-600 hover:underline text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  My Questions ({userQuestions.length})
                </h3>
                <div className="space-y-3">
                  {userQuestions.slice(0, 5).map((question) => (
                    <div
                      key={question.id}
                      className="border border-gray-200 rounded-lg p-3"
                    >
                      <p className="text-gray-800 font-medium mb-2">
                        ❓ {question.question}
                      </p>
                      <div className="flex justify-between items-center">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            question.status === 'resolved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {question.status}
                        </span>
                        <button
                          onClick={() => handleDeleteQuestion(question.id)}
                          className="text-red-600 hover:underline text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Account Settings
                </h2>
                
                <div className="border-2 border-red-200 rounded-lg p-6 bg-red-50">
                  <h3 className="text-xl font-bold text-red-800 mb-2">
                    Danger Zone
                  </h3>
                  <p className="text-gray-700 mb-4">
                    Once you delete your account, there is no going back. All your videos,
                    comments, and questions will be permanently deleted.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition font-medium"
                  >
                    Delete My Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

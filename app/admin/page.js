// app/admin/page.js
'use client';
import ThemeToggle from '@/components/ThemeToggle';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  collection,
  query,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  orderBy,
  where
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('overview');
  const [videos, setVideos] = useState([]);
  const [users, setUsers] = useState([]);
  const [comments, setComments] = useState([]);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({
    totalVideos: 0,
    totalUsers: 0,
    totalComments: 0,
    totalViews: 0
  });
  const [loading, setLoading] = useState(true);

  // Check if user is admin
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (!authLoading && user && user.role !== 'admin') {
      alert('Access denied. Admin only.');
      router.push('/dashboard');
      return;
    }

    if (user && user.role === 'admin') {
      fetchData();
    }
  }, [user, authLoading, router]);

  const fetchData = async () => {
    try {
      // Fetch all videos
      const videosSnapshot = await getDocs(
        query(collection(db, 'videos'), orderBy('createdAt', 'desc'))
      );
      const videosData = videosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setVideos(videosData);

      // Fetch all users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);

      // Fetch all comments
      const commentsSnapshot = await getDocs(
        query(collection(db, 'comments'), orderBy('createdAt', 'desc'))
      );
      const commentsData = commentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComments(commentsData);

      // Calculate stats
      const totalViews = videosData.reduce((sum, video) => sum + (video.views || 0), 0);
      setStats({
        totalVideos: videosData.length,
        totalUsers: usersData.length,
        totalComments: commentsData.length,
        totalViews
      });
      // Fetch all reports
const reportsSnapshot = await getDocs(
  query(collection(db, 'reports'), orderBy('createdAt', 'desc'))
);
const reportsData = reportsSnapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));
setReports(reportsData);


      setLoading(false);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setLoading(false);
    }
  };

  // Delete video
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
      fetchData();
    } catch (err) {
      console.error('Error deleting video:', err);
      alert('Failed to delete video');
    }
  };

  // Change user role
  const handleChangeRole = async (userId, newRole) => {
    if (!confirm(`Change user role to ${newRole}?`)) return;

    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole
      });
      alert('Role updated successfully');
      fetchData();
    } catch (err) {
      console.error('Error changing role:', err);
      alert('Failed to change role');
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    if (!confirm('Delete this comment?')) return;

    try {
      await deleteDoc(doc(db, 'comments', commentId));
      alert('Comment deleted');
      fetchData();
    } catch (err) {
      console.error('Error deleting comment:', err);
      alert('Failed to delete comment');
    }
  };
  // Handle report action (delete content & mark report as resolved)
const handleReportAction = async (report, action) => {
  if (action === 'delete') {
    if (!confirm('Delete this reported content?')) return;

    try {
      // Delete the content based on type
      if (report.contentType === 'video') {
        await deleteDoc(doc(db, 'videos', report.contentId));
        
        // Delete associated comments
        const commentsQuery = query(
          collection(db, 'comments'),
          where('videoId', '==', report.contentId)
        );
        const commentsSnapshot = await getDocs(commentsQuery);
        await Promise.all(
          commentsSnapshot.docs.map(doc => deleteDoc(doc.ref))
        );
      } else if (report.contentType === 'comment') {
        await deleteDoc(doc(db, 'comments', report.contentId));
      } else if (report.contentType === 'qa') {
        await deleteDoc(doc(db, 'qa_threads', report.contentId));
      }

      // Mark report as resolved
      await updateDoc(doc(db, 'reports', report.id), {
        status: 'resolved',
        resolvedAt: new Date().toISOString(),
        action: 'deleted'
      });

      alert('Content deleted and report resolved');
      fetchData();
    } catch (err) {
      console.error('Error handling report:', err);
      alert('Failed to process report');
    }
  } else if (action === 'dismiss') {
    try {
      await updateDoc(doc(db, 'reports', report.id), {
        status: 'dismissed',
        resolvedAt: new Date().toISOString(),
        action: 'dismissed'
      });
      alert('Report dismissed');
      fetchData();
    } catch (err) {
      console.error('Error dismissing report:', err);
      alert('Failed to dismiss report');
    }
  }
};

// Delete user account
const handleDeleteUser = async (userId) => {
  if (!confirm('Delete this user and all their content? This cannot be undone!')) return;

  try {
    // Delete user's videos
    const userVideosQuery = query(
      collection(db, 'videos'),
      where('ownerUid', '==', userId)
    );
    const videosSnapshot = await getDocs(userVideosQuery);
    await Promise.all(
      videosSnapshot.docs.map(doc => deleteDoc(doc.ref))
    );

    // Delete user's comments
    const userCommentsQuery = query(
      collection(db, 'comments'),
      where('authorUid', '==', userId)
    );
    const commentsSnapshot = await getDocs(userCommentsQuery);
    await Promise.all(
      commentsSnapshot.docs.map(doc => deleteDoc(doc.ref))
    );

    // Delete user document
    await deleteDoc(doc(db, 'users', userId));

    alert('User and all their content deleted');
    fetchData();
  } catch (err) {
    console.error('Error deleting user:', err);
    alert('Failed to delete user');
  }
};


  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading admin panel...</div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
   <div className="min-h-screen bg-gray-50">
  {/* Navigation Bar */}
  <nav className="flex items-center gap-4 px-6 py-4 bg-white shadow-sm border-b border-gray-200">
    {/* Left Section */}
    <div className="flex items-center gap-3">
      <Link href="/dashboard" className="text-2xl font-bold text-gray-800">
        KLH Peer Learning
      </Link>

      <span className="bg-red-600 text-white text-xs px-3 py-1 rounded-full font-bold">
        ADMIN
      </span>
    </div>

    {/* Right Section (still aligned left but after small spacing) */}
    <div className="flex items-center gap-3 ml-6">
      <ThemeToggle />
      <Link href="/dashboard" className="text-gray-600 hover:text-gray-800 font-medium">
        ← Back to Dashboard
      </Link>
    </div>
  </nav>





      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600 mb-8">Manage platform content and users</p>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-2">📹</div>
            <div className="text-3xl font-bold text-gray-800">{stats.totalVideos}</div>
            <div className="text-sm text-gray-600">Total Videos</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-2">👥</div>
            <div className="text-3xl font-bold text-gray-800">{stats.totalUsers}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-2">💬</div>
            <div className="text-3xl font-bold text-gray-800">{stats.totalComments}</div>
            <div className="text-sm text-gray-600">Total Comments</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-2">👁️</div>
            <div className="text-3xl font-bold text-gray-800">{stats.totalViews}</div>
            <div className="text-sm text-gray-600">Total Views</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
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
              📹 Videos ({videos.length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 font-medium transition ${
                activeTab === 'users'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              👥 Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`px-6 py-3 font-medium transition ${
                activeTab === 'comments'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              💬 Comments ({comments.length})
            </button>
            <button
  onClick={() => setActiveTab('reports')}
  className={`px-6 py-3 font-medium transition ${
    activeTab === 'reports'
      ? 'bg-blue-600 text-white'
      : 'bg-white text-gray-600 hover:bg-gray-50'
  }`}
>
  🚩 Reports ({reports.filter(r => r.status === 'pending').length})
</button>

          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Platform Overview
                </h2>
                
                {/* Recent Activity */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Recent Videos
                  </h3>
                  <div className="space-y-2">
                    {videos.slice(0, 5).map((video) => (
                      <div
                        key={video.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-800">{video.title}</p>
                          <p className="text-sm text-gray-600">
                            by {video.ownerName} • {video.views || 0} views
                          </p>
                        </div>
                        <Link
                          href={`/videos/${video.id}`}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View →
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Contributors */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Top Contributors
                  </h3>
                  <div className="space-y-2">
                    {(() => {
                      const contributors = {};
                      videos.forEach(video => {
                        contributors[video.ownerUid] = contributors[video.ownerUid] || {
                          name: video.ownerName,
                          count: 0
                        };
                        contributors[video.ownerUid].count++;
                      });
                      return Object.values(contributors)
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 5)
                        .map((contributor, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <p className="font-medium text-gray-800">
                              {contributor.name}
                            </p>
                            <span className="text-sm text-gray-600">
                              {contributor.count} videos
                            </span>
                          </div>
                        ));
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* Videos Tab */}
            {activeTab === 'videos' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Manage Videos
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Title
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Owner
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Subject
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Views
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {videos.map((video) => (
                        <tr key={video.id} className="border-b">
                          <td className="px-4 py-3">
                            <Link
                              href={`/videos/${video.id}`}
                              className="text-blue-600 hover:underline font-medium"
                            >
                              {video.title}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {video.ownerName}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {video.subject}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {video.views || 0}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleDeleteVideo(video.id)}
                              className="text-red-600 hover:underline text-sm"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Manage Users
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Role
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Joined
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b">
                          <td className="px-4 py-3 font-medium text-gray-800">
                            {u.displayName}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {u.email}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                u.role === 'admin'
                                  ? 'bg-red-100 text-red-800'
                                  : u.role === 'faculty'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(u.joinedAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
  <div className="flex gap-2">
    <select
      value={u.role}
      onChange={(e) => handleChangeRole(u.id, e.target.value)}
      className="text-sm border border-gray-300 rounded px-2 py-1"
    >
      <option value="student">Student</option>
      <option value="faculty">Faculty</option>
      <option value="admin">Admin</option>
    </select>
    {u.id !== user.uid && (
      <button
        onClick={() => handleDeleteUser(u.id)}
        className="text-red-600 hover:underline text-sm"
      >
        Delete
      </button>
    )}
  </div>
</td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Comments Tab */}
            {activeTab === 'comments' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Manage Comments
                </h2>
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-gray-800">
                            {comment.authorName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {comment.createdAt
                              ? new Date(comment.createdAt.seconds * 1000).toLocaleString()
                              : 'Just now'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-red-600 hover:underline text-sm"
                        >
                          Delete
                        </button>
                      </div>
                      <p className="text-gray-700 mb-2">{comment.body}</p>
                      <Link
                        href={`/videos/${comment.videoId}`}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View Video →
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Reports Tab */}
{activeTab === 'reports' && (
  <div>
    <h2 className="text-2xl font-bold text-gray-800 mb-4">
      Content Reports
    </h2>
    
    {/* Filter buttons */}
    <div className="flex gap-2 mb-4">
      <button
        onClick={() => setActiveTab('reports')}
        className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg font-medium"
      >
        Pending ({reports.filter(r => r.status === 'pending').length})
      </button>
    </div>

    <div className="space-y-4">
      {reports.filter(r => r.status === 'pending').length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No pending reports. Great job! 🎉
        </p>
      ) : (
        reports
          .filter(r => r.status === 'pending')
          .map((report) => (
            <div
              key={report.id}
              className="border-2 border-red-200 rounded-lg p-4 bg-red-50"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="bg-red-600 text-white text-xs px-2 py-1 rounded font-bold">
                    {report.contentType.toUpperCase()}
                  </span>
                  <p className="text-sm text-gray-600 mt-1">
                    Reported by: <strong>{report.reporterName}</strong>
                  </p>
                  <p className="text-xs text-gray-500">
                    {report.createdAt
                      ? new Date(report.createdAt.seconds * 1000).toLocaleString()
                      : 'Recently'}
                  </p>
                </div>
                <span className="bg-yellow-500 text-white text-xs px-3 py-1 rounded-full">
                  PENDING
                </span>
              </div>

              <div className="mb-3">
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  Reason:
                </p>
                <p className="text-gray-800 bg-white p-3 rounded border">
                  {report.reason}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleReportAction(report, 'delete')}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm font-medium"
                >
                  Delete Content
                </button>
                <button
                  onClick={() => handleReportAction(report, 'dismiss')}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition text-sm font-medium"
                >
                  Dismiss Report
                </button>
                {report.contentType === 'video' && (
                  <Link
                    href={`/videos/${report.contentId}`}
                    target="_blank"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                  >
                    View Content →
                  </Link>
                )}
              </div>
            </div>
          ))
      )}
    </div>
  </div>
)}

          </div>
        </div>
      </div>
    </div>
  );
}

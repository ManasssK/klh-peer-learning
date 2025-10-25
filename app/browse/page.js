'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

export default function BrowsePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSubject, setFilterSubject] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [playlists, setPlaylists] = useState([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (!user) return;

    const fetchVideos = async () => {
      try {
        let q;
        if (filterSubject === 'All') {
          q = query(collection(db, 'videos'), orderBy('createdAt', 'desc'));
        } else {
          q = query(
            collection(db, 'videos'),
            where('subject', '==', filterSubject),
            orderBy('createdAt', 'desc')
          );
        }

        const querySnapshot = await getDocs(q);
        const videosData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setVideos(videosData);

        // Fetch all public playlists
        const playlistsSnapshot = await getDocs(
          query(collection(db, 'playlists'), orderBy('createdAt', 'desc'))
        );
        const playlistsData = playlistsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPlaylists(playlistsData);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching videos:', err);
        setLoading(false);
      }
    };

    fetchVideos();
  }, [user, authLoading, router, filterSubject]);

  const filteredVideos = videos.filter(video => {
    const matchesSearch =
      searchQuery === '' ||
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.topics?.some(topic => topic.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-300 text-xl">Loading videos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold text-gray-800 dark:text-white">
            KLH Peer Learning
          </Link>
          <div className="flex gap-3 items-center">
            <ThemeToggle />
            <Link href="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-1">Browse Videos</h1>
            <p className="text-gray-600 dark:text-gray-300">
              {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''} found
            </p>
          </div>

          {/* Subject Filter */}
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-300 mr-2">Filter by Subject:</label>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:focus:ring-blue-400"
            >
              <option value="All">All Subjects</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Electronics and Communication">Electronics and Communication</option>
              <option value="Artificial Intelligence and Data Science">Artificial Intelligence and Data Science</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search videos by title, description, or topics..."
            className="w-full px-4 py-3 pl-12 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200"
          />
          <div className="absolute left-4 top-3.5 text-gray-400 dark:text-gray-300 text-xl">🔍</div>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setShowPlaylists(false)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              !showPlaylists
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            📹 Videos
          </button>

          <button
            onClick={() => setShowPlaylists(true)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              showPlaylists
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            📋 Playlists
          </button>
        </div>

        {/* Content Grid */}
        {showPlaylists ? (
          playlists.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📋</div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                No playlists yet
              </h2>
              <p className="text-gray-600 dark:text-gray-300">Create a playlist to organize videos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {playlists.map((playlist) => (
                <Link
                  key={playlist.id}
                  href={`/playlists/${playlist.id}`}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition flex flex-col justify-between"
                >
                  <div>
                    <div className="text-4xl mb-4">📋</div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2 line-clamp-2">
                      {playlist.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                      {playlist.description || 'No description'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mt-2">
                    <span>📹 {playlist.videoIds?.length || 0} videos</span>
                    <span>👤 {playlist.ownerName}</span>
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : filteredVideos.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📹</div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              No videos found
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Try adjusting your search or filters
            </p>
            <Link
              href="/upload"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Upload Video
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredVideos.map((video) => (
              <Link
                key={video.id}
                href={`/videos/${video.id}`}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition flex flex-col"
              >
                {/* Thumbnail */}
                <div className="relative bg-gray-900 aspect-video">
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-4xl">
                      ▶️
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                    {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                  </div>
                  {video.playlistId && (
                    <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                      📋 Playlist
                    </div>
                  )}
                </div>

                {/* Video Info */}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1 line-clamp-2 group-hover:text-blue-600 transition">
                    {video.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {video.ownerName}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>👁️ {video.views || 0} views</span>
                    <span>📚 {video.subject}</span>
                  </div>

                  {/* Topics */}
                  {video.topics && video.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {video.topics.slice(0, 2).map((topic, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                        >
                          {topic}
                        </span>
                      ))}
                      {video.topics.length > 2 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          +{video.topics.length - 2} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

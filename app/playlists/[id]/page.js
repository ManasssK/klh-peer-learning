// app/playlists/[id]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  arrayRemove,
  arrayUnion,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

export default function PlaylistDetailPage() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [playlist, setPlaylist] = useState(null);
  const [playlistVideos, setPlaylistVideos] = useState([]);
  const [allVideos, setAllVideos] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && id) {
      fetchPlaylistData();
    }
  }, [user, authLoading, id, router]);

  const fetchPlaylistData = async () => {
    try {
      // Fetch playlist
      const playlistDoc = await getDoc(doc(db, 'playlists', id));
      
      if (!playlistDoc.exists()) {
        alert('Playlist not found');
        router.push('/playlists');
        return;
      }

      const playlistData = { id: playlistDoc.id, ...playlistDoc.data() };
      
      // Check ownership
      if (playlistData.ownerUid !== user.uid) {
        alert('You do not have access to this playlist');
        router.push('/playlists');
        return;
      }

      setPlaylist(playlistData);

      // Fetch videos in playlist
      if (playlistData.videoIds && playlistData.videoIds.length > 0) {
        const videosPromises = playlistData.videoIds.map(videoId =>
          getDoc(doc(db, 'videos', videoId))
        );
        const videosSnapshots = await Promise.all(videosPromises);
        const videosData = videosSnapshots
          .filter(snap => snap.exists())
          .map(snap => ({ id: snap.id, ...snap.data() }));
        setPlaylistVideos(videosData);
      }

      // Fetch user's other videos (not in this playlist)
      const userVideosQuery = query(
        collection(db, 'videos'),
        where('ownerUid', '==', user.uid)
      );
      const videosSnapshot = await getDocs(userVideosQuery);
      const allVideosData = videosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter out videos already in playlist
      const availableVideos = allVideosData.filter(
        video => !playlistData.videoIds?.includes(video.id)
      );
      setAllVideos(availableVideos);

      setLoading(false);
    } catch (err) {
      console.error('Error fetching playlist:', err);
      setLoading(false);
    }
  };

  const handleRemoveVideo = async (videoId) => {
    if (!confirm('Remove this video from playlist?')) return;

    try {
      await updateDoc(doc(db, 'playlists', id), {
        videoIds: arrayRemove(videoId)
      });

      // Update video document
      await updateDoc(doc(db, 'videos', videoId), {
        playlistId: null
      });

      alert('Video removed from playlist');
      fetchPlaylistData();
    } catch (err) {
      console.error('Error removing video:', err);
      alert('Failed to remove video');
    }
  };

  const handleAddVideo = async (videoId) => {
    try {
      await updateDoc(doc(db, 'playlists', id), {
        videoIds: arrayUnion(videoId)
      });

      // Update video document
      await updateDoc(doc(db, 'videos', videoId), {
        playlistId: id
      });

      setShowAddModal(false);
      alert('Video added to playlist');
      fetchPlaylistData();
    } catch (err) {
      console.error('Error adding video:', err);
      alert('Failed to add video');
    }
  };

  const handleDeletePlaylist = async () => {
    if (!confirm('Delete this playlist? Videos will not be deleted.')) return;

    try {
      // Remove playlist reference from all videos
      if (playlist.videoIds && playlist.videoIds.length > 0) {
        const updates = playlist.videoIds.map(videoId =>
          updateDoc(doc(db, 'videos', videoId), { playlistId: null })
        );
        await Promise.all(updates);
      }

      // Delete playlist
      await deleteDoc(doc(db, 'playlists', id));

      alert('Playlist deleted');
      router.push('/playlists');
    } catch (err) {
      console.error('Error deleting playlist:', err);
      alert('Failed to delete playlist');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading playlist...</div>
      </div>
    );
  }

  if (!user || !playlist) return null;

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
              href="/playlists"
              className="text-gray-600 hover:text-gray-800"
            >
              ← Back to Playlists
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Playlist Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-5xl mb-4">📋</div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {playlist.title}
              </h1>
              <p className="text-gray-600 mb-4">
                {playlist.description || 'No description'}
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>📹 {playlistVideos.length} videos</span>
                <span>👤 {playlist.ownerName}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                + Add Videos
              </button>
              <button
                onClick={handleDeletePlaylist}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-medium"
              >
                Delete Playlist
              </button>
            </div>
          </div>
        </div>

        {/* Videos List */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Videos in Playlist
          </h2>

          {playlistVideos.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="text-6xl mb-4">📹</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                No videos yet
              </h3>
              <p className="text-gray-600 mb-6">
                Add videos to this playlist to get started
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Add Videos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {playlistVideos.map((video, index) => (
                <div
                  key={video.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
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
                    <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                      #{index + 1}
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                      {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                    </div>
                  </div>

                  {/* Video Info */}
                  <div className="p-4">
                    <Link
                      href={`/videos/${video.id}`}
                      className="font-semibold text-gray-800 hover:text-blue-600 transition line-clamp-2 mb-2"
                    >
                      {video.title}
                    </Link>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span>👁️ {video.views || 0} views</span>
                      <span>📚 {video.subject}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveVideo(video.id)}
                      className="w-full text-red-600 hover:bg-red-50 py-2 rounded transition text-sm font-medium"
                    >
                      Remove from Playlist
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Videos Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Add Videos to Playlist
            </h3>

            {allVideos.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">
                  No available videos to add. All your videos are already in this playlist.
                </p>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-4">
                  {allVideos.map((video) => (
                    <div
                      key={video.id}
                      className="border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 mb-1">
                          {video.title}
                        </p>
                        <p className="text-sm text-gray-600">
                          {video.subject} • {video.views || 0} views
                        </p>
                      </div>
                      <button
                        onClick={() => handleAddVideo(video.id)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

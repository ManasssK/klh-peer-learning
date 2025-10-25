// app/playlists/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

export default function PlaylistsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [playlists, setPlaylists] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchPlaylists();
    }
  }, [user, authLoading, router]);

  const fetchPlaylists = async () => {
    try {
      const q = query(
        collection(db, 'playlists'),
        where('ownerUid', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const playlistsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPlaylists(playlistsData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching playlists:', err);
      setLoading(false);
    }
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistTitle.trim()) return;

    try {
      await addDoc(collection(db, 'playlists'), {
        ownerUid: user.uid,
        ownerName: user.displayName,
        title: newPlaylistTitle.trim(),
        description: newPlaylistDescription.trim(),
        videoIds: [],
        publicToCampus: true,
        createdAt: serverTimestamp()
      });

      setNewPlaylistTitle('');
      setNewPlaylistDescription('');
      setShowCreateModal(false);
      fetchPlaylists();
      alert('Playlist created!');
    } catch (err) {
      console.error('Error creating playlist:', err);
      alert('Failed to create playlist');
    }
  };

  const handleDeletePlaylist = async (playlistId) => {
    if (!confirm('Delete this playlist?')) return;

    try {
      await deleteDoc(doc(db, 'playlists', playlistId));
      fetchPlaylists();
      alert('Playlist deleted');
    } catch (err) {
      console.error('Error deleting playlist:', err);
      alert('Failed to delete playlist');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading playlists...</div>
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              My Playlists
            </h1>
            <p className="text-gray-600">
              Organize your videos into collections
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            + Create Playlist
          </button>
        </div>

        {/* Playlists Grid */}
        {playlists.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              No playlists yet
            </h2>
            <p className="text-gray-600 mb-6">
              Create your first playlist to organize videos
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Create Playlist
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-4xl">📋</div>
                    <button
                      onClick={() => handleDeletePlaylist(playlist.id)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Delete
                    </button>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {playlist.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {playlist.description || 'No description'}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {playlist.videoIds?.length || 0} videos
                    </span>
                    <Link
                      href={`/playlists/${playlist.id}`}
                      className="text-blue-600 hover:underline text-sm font-medium"
                    >
                      View Playlist →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Create New Playlist
            </h3>
            <form onSubmit={handleCreatePlaylist} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Playlist Title *
                </label>
                <input
                  type="text"
                  value={newPlaylistTitle}
                  onChange={(e) => setNewPlaylistTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Data Structures Tutorials"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="What is this playlist about?"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewPlaylistTitle('');
                    setNewPlaylistDescription('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

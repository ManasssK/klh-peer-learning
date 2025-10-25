// app/upload/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
// import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import { 
  doc, 
  setDoc, 
  collection, 
  serverTimestamp, 
  query, 
  where, 
  getDocs,
  updateDoc,
  arrayUnion 
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { cloudinaryConfig } from '@/lib/cloudinary';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

export default function UploadPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [topics, setTopics] = useState('');
  const [syllabusTag, setSyllabusTag] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState('');
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [duration, setDuration] = useState(0);
  
  // UI state
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
  // Redirect if not authenticated
  if (!loading && !user) {
    router.push('/login');
    return;
  }

  // Fetch user's playlists
  if (user) {
    fetchUserPlaylists();
  }
}, [user, loading, router]);

const fetchUserPlaylists = async () => {
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
    setUserPlaylists(playlistsData);
  } catch (err) {
    console.error('Error fetching playlists:', err);
  }
};


  // Open Cloudinary upload widget
  const openUploadWidget = () => {
    if (typeof window !== 'undefined' && window.cloudinary) {
      setUploading(true);
      setError('');

      const widget = window.cloudinary.createUploadWidget(
        {
          cloudName: cloudinaryConfig.cloudName,
          uploadPreset: cloudinaryConfig.uploadPreset,
          sources: ['local', 'url', 'camera'],
          resourceType: 'video',
          maxFileSize: 100000000, // 100MB
          clientAllowedFormats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
          maxVideoFileSize: 100000000,
          folder: 'klh-platform',
          cropping: false,
        },
        (error, result) => {
          if (error) {
            setError('Upload failed: ' + error.message);
            setUploading(false);
            return;
          }

          if (result.event === 'success') {
            console.log('Upload successful:', result.info);
            
            // Set video details
            setVideoUrl(result.info.secure_url);
            setThumbnailUrl(result.info.thumbnail_url || result.info.secure_url + '.jpg');
            setDuration(Math.round(result.info.duration || 0));
            setUploading(false);
            
            alert('Video uploaded successfully! Now fill in the details.');
          }

          if (result.event === 'queues-end') {
            widget.close();
          }
        }
      );

      widget.open();
    } else {
      setError('Upload widget not loaded. Please refresh the page.');
    }
  };

  // Save video metadata to Firestore
  // Save video metadata to Firestore
const handleSaveVideo = async (e) => {
  e.preventDefault();
  setError('');
  setSaving(true);

  // Validation
  if (!videoUrl) {
    setError('Please upload a video first');
    setSaving(false);
    return;
  }

  if (!title.trim()) {
    setError('Please enter a title');
    setSaving(false);
    return;
  }

  if (!subject.trim()) {
    setError('Please select a subject');
    setSaving(false);
    return;
  }

  try {
  // Create video document in Firestore
  const videoRef = doc(collection(db, 'videos'));
  
  await setDoc(videoRef, {
    videoId: videoRef.id,
    ownerUid: user.uid,
    ownerName: user.displayName,
    ownerEmail: user.email,
    title: title.trim(),
    description: description.trim(),
    subject,
    topics: topics.split(',').map(t => t.trim()).filter(t => t),
    syllabusTag: syllabusTag.trim(),
    videoUrl,
    thumbnailUrl,
    duration,
    visibility: 'campus',
    views: 0,
    likes: 0,
    playlistId: selectedPlaylist || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  // If playlist selected, add video to playlist
  if (selectedPlaylist) {
    const playlistRef = doc(db, 'playlists', selectedPlaylist);
    await updateDoc(playlistRef, {
      videoIds: arrayUnion(videoRef.id)
    });
  }

  setUploadSuccess(true);



    // Redirect to video page after 2 seconds
    setTimeout(() => {
      router.push(`/videos/${videoRef.id}`);
    }, 2000);
  } catch (err) {
    console.error('Error saving video:', err);
    setError('Failed to save video: ' + err.message);
  } finally {
    setSaving(false);
  }
};


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (uploadSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Video Published!
          </h2>
          <p className="text-gray-600 mb-6">
            Your video is now live and accessible to all KLH students.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/dashboard"
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/upload"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Upload Another
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Upload Educational Video
          </h1>
          <p className="text-gray-600 mb-8">
            Share your knowledge with fellow KLH students
          </p>

          {/* Upload Button */}
          <div className="mb-8">
            <button
              onClick={openUploadWidget}
              disabled={uploading}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-medium text-lg flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Uploading...
                </>
              ) : videoUrl ? (
                <>
                  ✅ Video Uploaded - Click to Replace
                </>
              ) : (
                <>
                  📹 Choose Video to Upload
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Supported formats: MP4, MOV, AVI, MKV, WebM (Max 100MB)
            </p>
          </div>

          {/* Video Preview */}
          {videoUrl && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Video Preview
              </h3>
              <video
                src={videoUrl}
                controls
                className="w-full rounded-lg border"
                style={{ maxHeight: '400px' }}
              >
                Your browser does not support video playback.
              </video>
              <p className="text-sm text-gray-600 mt-2">
                Duration: {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')} minutes
              </p>
            </div>
          )}

          {/* Metadata Form */}
          <form onSubmit={handleSaveVideo} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Video Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Introduction to Data Structures"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="What will students learn from this video?"
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject *
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select a subject</option>
                <option value="Computer Science">Computer Science</option>
                {/* <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Electronics">Electronics</option>
                <option value="Mechanical">Mechanical Engineering</option>
                <option value="Civil">Civil Engineering</option> */}
                <option value="Business">Electronics and Communication</option>
                <option value="English">Artificial Intelligence and Data Science</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Topics (comma-separated) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Topics (comma-separated)
              </label>
              <input
                type="text"
                value={topics}
                onChange={(e) => setTopics(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Arrays, Linked Lists, Stacks"
              />
              <p className="text-xs text-gray-500 mt-1">
                Separate multiple topics with commas
              </p>
            </div>

            {/* Syllabus Tag */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Syllabus/Course Code
              </label>
              <input
                type="text"
                value={syllabusTag}
                onChange={(e) => setSyllabusTag(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., CS301, MATH201"
              />
            </div>
            {/* Playlist Selection */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Add to Playlist (Optional)
  </label>
  <select
    value={selectedPlaylist}
    onChange={(e) => setSelectedPlaylist(e.target.value)}
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  >
    <option value="">No Playlist (Standalone Video)</option>
    {userPlaylists.map((playlist) => (
      <option key={playlist.id} value={playlist.id}>
        📋 {playlist.title}
      </option>
    ))}
  </select>
  {userPlaylists.length === 0 && (
    <p className="text-xs text-gray-500 mt-1">
      You don't have any playlists yet.{' '}
      <Link href="/playlists" className="text-blue-600 hover:underline">
        Create one
      </Link>
    </p>
  )}
</div>


            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving || !videoUrl}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium text-lg"
            >
              {saving ? 'Publishing...' : 'Publish Video'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

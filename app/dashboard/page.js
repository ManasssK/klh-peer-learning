// app/dashboard/page.js
// 'use client';
// import Link from 'next/link';

'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react'; // <-- Added useState
import { useAuth } from '@/context/AuthContext';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';


export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [featuredPlaylists, setFeaturedPlaylists] = useState([]);


  useEffect(() => {
  // Redirect to login if not authenticated
  if (!loading && !user) {
    router.push('/login');
    return;
  }

  // Fetch featured playlists
  if (user) {
    fetchFeaturedPlaylists();
  }
}, [user, loading, router]);

const fetchFeaturedPlaylists = async () => {
  try {
    const q = query(
      collection(db, 'playlists'),
      orderBy('createdAt', 'desc'),
      limit(3)
    );
    const querySnapshot = await getDocs(q);
    const playlistsData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setFeaturedPlaylists(playlistsData);
  } catch (err) {
    console.error('Error fetching playlists:', err);
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
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b">
  <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
    <h1 className="text-2xl font-bold text-gray-800">
      KLH Peer Learning
    </h1>
    <div className="flex gap-3 items-center">
  <ThemeToggle />
  <Link
    href="/profile"
    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition font-medium"
  >
    👤 Profile
  </Link>
  {user.role === 'admin' && (
    <Link
      href="/admin"
      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition font-medium"
    >
      🛡️ Admin Panel
    </Link>
  )}
  <button
    onClick={signOut}
    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
  >
    Logout
  </button>
</div>


  </div>
</nav>


      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome back, {user.displayName}! 👋
          </h2>
          <p className="text-gray-600">
            Email: {user.email}
          </p>
          <p className="text-gray-600">
            Role: <span className="font-medium capitalize">{user.role}</span>
          </p>
          
          {!user.emailVerified && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
              ⚠️ Please verify your email address to unlock all features.
            </div>
          )}
        </div>

        {/* Quick Actions */}
        
        {/* Quick Actions */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <Link
    href="/upload"
    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition group cursor-pointer"
  >
    <div className="text-4xl mb-4">📹</div>
    <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600">
      Upload Video
    </h3>
    <p className="text-gray-600 text-sm">
      Share your knowledge with peers
    </p>
  </Link>

  <Link
    href="/browse"
    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition group cursor-pointer"
  >
    <div className="text-4xl mb-4">📚</div>
    <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600">
      Browse Videos
    </h3>
    <p className="text-gray-600 text-sm">
      Explore educational content
    </p>
  </Link>

  <Link
  href="/playlists"
  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition group cursor-pointer"
>
  <div className="text-4xl mb-4">📋</div>
  <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600">
    My Playlists
  </h3>
  <p className="text-gray-600 text-sm">
    Organize your learning materials
  </p>
</Link>
{/* Featured Playlists */}
{featuredPlaylists.length > 0 && (
  <div className="mt-12 max-w-6xl mx-auto">
    <div className="flex justify-between items-center mb-6 px-4 md:px-0">
      <h2 className="text-2xl font-bold text-gray-800">
        📋 Discover Playlists
      </h2>
      <Link
        href="/browse"
        className="text-blue-600 hover:underline text-sm font-medium"
      >
        View All →
      </Link>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 px-4 md:px-0">
      {featuredPlaylists.map((playlist) => (
        <Link
          key={playlist.id}
          href={`/playlists/${playlist.id}`}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition group"
        >
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-blue-600 line-clamp-1">
            {playlist.title}
          </h3>
          <p className="text-sm text-gray-600">
            👤 {playlist.ownerName}
          </p>
        </Link>
      ))}
    </div>
  </div>
)}




</div>

      </div>
    </div>
  );
}

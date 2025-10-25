// lib/platform-tools.js
import { db } from '@/lib/firebase';
import { 
  collection, 
  getCountFromServer, 
  query, 
  orderBy, 
  limit, 
  getDocs 
} from 'firebase/firestore';

// Get platform statistics
export async function getPlatformSnapshot() {
  try {
    const [videosCount, playlistsCount] = await Promise.all([
      getCountFromServer(collection(db, 'videos')),
      getCountFromServer(collection(db, 'playlists'))
    ]);

    return {
      counts: {
        videos: videosCount.data().count,
        playlists: playlistsCount.data().count
      }
    };
  } catch (error) {
    console.error('Error getting platform snapshot:', error);
    return {
      counts: {
        videos: 0,
        playlists: 0
      }
    };
  }
}

// Get featured playlists preview
export async function listPlaylistsPreview(n = 5) {
  try {
    const q = query(
      collection(db, 'playlists'),
      orderBy('createdAt', 'desc'),
      limit(n)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title || 'Untitled',
      n: (doc.data().videoIds || []).length
    }));
  } catch (error) {
    console.error('Error listing playlists:', error);
    return [];
  }
}

// Get featured videos preview
export async function listVideosPreview(n = 5) {
  try {
    const q = query(
      collection(db, 'videos'),
      orderBy('createdAt', 'desc'),
      limit(n)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title || 'Untitled',
      subject: doc.data().subject || 'General'
    }));
  } catch (error) {
    console.error('Error listing videos:', error);
    return [];
  }
}

// Get complete platform context
export async function getPlatformContext(userRole = 'student') {
  try {
    const [snapshot, featured] = await Promise.all([
      getPlatformSnapshot(),
      listPlaylistsPreview(3)
    ]);

    return {
      ...snapshot,
      featured,
      userRole
    };
  } catch (error) {
    console.error('Error getting platform context:', error);
    return {
      counts: { videos: 0, playlists: 0 },
      featured: [],
      userRole
    };
  }
}

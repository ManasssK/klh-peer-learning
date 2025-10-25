// components/VideoAnalytics.js
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function VideoAnalytics({ videoId, ownerUid, currentUserUid }) {
  const [analytics, setAnalytics] = useState({
    views: 0,
    comments: 0,
    questions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Get video views (already in video doc, but we'll fetch for completeness)
        // Get comments count
        const commentsQuery = query(
          collection(db, 'comments'),
          where('videoId', '==', videoId)
        );
        const commentsSnapshot = await getDocs(commentsQuery);

        // Get questions count
        const questionsQuery = query(
          collection(db, 'qa_threads'),
          where('videoId', '==', videoId)
        );
        const questionsSnapshot = await getDocs(questionsQuery);

        setAnalytics({
          comments: commentsSnapshot.size,
          questions: questionsSnapshot.size
        });

        setLoading(false);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setLoading(false);
      }
    };

    if (videoId) {
      fetchAnalytics();
    }
  }, [videoId]);

  // Only show to video owner or admin
  if (currentUserUid !== ownerUid && currentUserUid !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="font-semibold text-gray-800 mb-4">Video Analytics</h3>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
          <span className="text-gray-700">💬 Comments</span>
          <span className="font-bold text-gray-800">{analytics.comments}</span>
        </div>
        
        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
          <span className="text-gray-700">❓ Questions</span>
          <span className="font-bold text-gray-800">{analytics.questions}</span>
        </div>

        <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
          <span className="text-gray-700">📊 Engagement</span>
          <span className="font-bold text-gray-800">
            {analytics.comments + analytics.questions} interactions
          </span>
        </div>
      </div>
    </div>
  );
}

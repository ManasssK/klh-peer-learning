'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
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
        const commentsQuery = query(
          collection(db, 'comments'),
          where('videoId', '==', videoId)
        );
        const commentsSnapshot = await getDocs(commentsQuery);

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

    if (videoId) fetchAnalytics();
  }, [videoId]);

  // Only show to video owner or admin
  if (currentUserUid !== ownerUid && currentUserUid !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-black dark:bg-white rounded-lg shadow-md p-6">
        <p className="text-white dark:text-black">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="bg-black dark:bg-white rounded-lg shadow-md p-6">
      <h3 className="font-semibold text-white dark:text-black mb-4">Video Analytics</h3>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center p-3 rounded-lg bg-gray-900 dark:bg-gray-100">
          <span className="text-white dark:text-black">💬 Comments</span>
          <span className="font-bold text-white dark:text-black">{analytics.comments}</span>
        </div>
        
        <div className="flex justify-between items-center p-3 rounded-lg bg-gray-900 dark:bg-gray-100">
          <span className="text-white dark:text-black">❓ Questions</span>
          <span className="font-bold text-white dark:text-black">{analytics.questions}</span>
        </div>

        <div className="flex justify-between items-center p-3 rounded-lg bg-gray-900 dark:bg-gray-100">
          <span className="text-white dark:text-black">📊 Engagement</span>
          <span className="font-bold text-white dark:text-black">
            {analytics.comments + analytics.questions} interactions
          </span>
        </div>
      </div>
    </div>
  );
}

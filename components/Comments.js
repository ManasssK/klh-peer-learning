'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function Comments({ videoId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Real-time comments listener
  useEffect(() => {
    if (!videoId) return;

    const q = query(
      collection(db, 'comments'),
      where('videoId', '==', videoId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const commentsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setComments(commentsData);
        setError('');
      },
      (err) => {
        console.error('Error fetching comments:', err);
        if (err.code === 'failed-precondition') {
          setError(
            'Firestore requires an index for this query. Please create it in Firebase console.'
          );
        } else {
          setError('Failed to load comments');
        }
      }
    );

    return () => unsubscribe();
  }, [videoId]);

  // Add new comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'comments'), {
        videoId,
        authorUid: user.uid,
        authorName: user.displayName,
        authorEmail: user.email,
        body: newComment.trim(),
        parentCommentId: null,
        createdAt: serverTimestamp()
      });
      setNewComment('');
    } catch (err) {
      console.error('Error adding comment:', err);
      alert('Failed to post comment');
    } finally {
      setLoading(false);
    }
  };

  // Add reply to comment
  const handleAddReply = async (e, parentId) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'comments'), {
        videoId,
        authorUid: user.uid,
        authorName: user.displayName,
        authorEmail: user.email,
        body: replyText.trim(),
        parentCommentId: parentId,
        createdAt: serverTimestamp()
      });

      setReplyText('');
      setReplyTo(null);
    } catch (err) {
      console.error('Error adding reply:', err);
      alert('Failed to post reply');
    } finally {
      setLoading(false);
    }
  };

  // Delete comment (only owner or admin)
  const handleDeleteComment = async (commentId, authorUid) => {
    if (user.uid !== authorUid && user.role !== 'admin') {
      alert('You can only delete your own comments');
      return;
    }

    if (!confirm('Delete this comment?')) return;

    try {
      await deleteDoc(doc(db, 'comments', commentId));
    } catch (err) {
      console.error('Error deleting comment:', err);
      alert('Failed to delete comment');
    }
  };

  const getReplies = (parentId) => comments.filter((c) => c.parentCommentId === parentId);
  const topLevelComments = comments.filter((c) => !c.parentCommentId);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        Comments ({comments.length})
      </h3>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {/* Add Comment Form */}
      <form onSubmit={handleAddComment} className="mb-6">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
        />
        <button
          type="submit"
          disabled={loading || !newComment.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
        >
          {loading ? 'Posting...' : 'Post Comment'}
        </button>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {topLevelComments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          topLevelComments.map((comment) => (
            <div key={comment.id} className="border-b pb-4">
              {/* Comment */}
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  {comment.authorName?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800">{comment.authorName}</span>
                    <span className="text-xs text-gray-500">
                      {comment.createdAt
                        ? new Date(comment.createdAt.seconds * 1000).toLocaleString()
                        : 'Just now'}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2">{comment.body}</p>
                  <div className="flex gap-3 text-sm">
                    <button
                      onClick={() => setReplyTo(comment.id)}
                      className="text-blue-600 hover:underline"
                    >
                      Reply
                    </button>
                    {(user.uid === comment.authorUid || user.role === 'admin') && (
                      <button
                        onClick={() => handleDeleteComment(comment.id, comment.authorUid)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </div>

                  {/* Reply Form */}
                  {replyTo === comment.id && (
                    <form onSubmit={(e) => handleAddReply(e, comment.id)} className="mt-3 ml-4">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a reply..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-2 text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={loading || !replyText.trim()}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
                        >
                          Reply
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReplyTo(null);
                            setReplyText('');
                          }}
                          className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Replies */}
                  {getReplies(comment.id).length > 0 && (
                    <div className="mt-3 ml-8 space-y-3">
                      {getReplies(comment.id).map((reply) => (
                        <div key={reply.id} className="flex gap-3">
                          <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-sm">
                            {reply.authorName?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-800 text-sm">{reply.authorName}</span>
                              <span className="text-xs text-gray-500">
                                {reply.createdAt
                                  ? new Date(reply.createdAt.seconds * 1000).toLocaleString()
                                  : 'Just now'}
                              </span>
                            </div>
                            <p className="text-gray-700 text-sm mb-1">{reply.body}</p>
                            {(user.uid === reply.authorUid || user.role === 'admin') && (
                              <button
                                onClick={() => handleDeleteComment(reply.id, reply.authorUid)}
                                className="text-red-600 hover:underline text-xs"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

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
  doc,
  updateDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function QuestionsAndAnswers({ videoId }) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [answerText, setAnswerText] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Real-time questions listener
  useEffect(() => {
    if (!videoId) return;

    const q = query(
      collection(db, 'qa_threads'),
      where('videoId', '==', videoId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const questionsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setQuestions(questionsData);
        setError('');
      },
      (err) => {
        console.error('Error fetching questions:', err);
        if (err.code === 'failed-precondition') {
          setError(
            'Firestore requires an index for this query. Please create it in Firebase console.'
          );
        } else {
          setError('Failed to load questions');
        }
      }
    );

    return () => unsubscribe();
  }, [videoId]);

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'qa_threads'), {
        videoId,
        askerUid: user.uid,
        askerName: user.displayName,
        askerEmail: user.email,
        question: newQuestion.trim(),
        answers: [],
        status: 'open',
        createdAt: serverTimestamp()
      });
      setNewQuestion('');
    } catch (err) {
      console.error('Error asking question:', err);
      alert('Failed to post question');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAnswer = async (e, questionId) => {
    e.preventDefault();
    const answerBody = answerText[questionId];
    if (!answerBody?.trim()) return;

    setLoading(true);
    try {
      const questionRef = doc(db, 'qa_threads', questionId);
      const question = questions.find((q) => q.id === questionId);

      const newAnswer = {
        authorUid: user.uid,
        authorName: user.displayName,
        body: answerBody.trim(),
        createdAt: new Date().toISOString()
      };

      await updateDoc(questionRef, {
        answers: [...(question.answers || []), newAnswer],
        status: 'answered'
      });

      setAnswerText({ ...answerText, [questionId]: '' });
    } catch (err) {
      console.error('Error adding answer:', err);
      alert('Failed to post answer');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId, askerUid) => {
    if (user.uid !== askerUid && user.role !== 'admin') {
      alert('You can only delete your own questions');
      return;
    }

    if (!confirm('Delete this question?')) return;

    try {
      await deleteDoc(doc(db, 'qa_threads', questionId));
    } catch (err) {
      console.error('Error deleting question:', err);
      alert('Failed to delete question');
    }
  };

  const handleMarkResolved = async (questionId, askerUid) => {
    if (user.uid !== askerUid) {
      alert('Only the question asker can mark it as resolved');
      return;
    }

    try {
      await updateDoc(doc(db, 'qa_threads', questionId), {
        status: 'resolved'
      });
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        Questions & Answers ({questions.length})
      </h3>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {/* Ask Question Form */}
      <form onSubmit={handleAskQuestion} className="mb-6">
        <textarea
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          placeholder="Ask a question about this video..."
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
        />
        <button
          type="submit"
          disabled={loading || !newQuestion.trim()}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition"
        >
          {loading ? 'Posting...' : 'Ask Question'}
        </button>
      </form>

      {/* Questions List */}
      <div className="space-y-6">
        {questions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No questions yet. Be the first to ask!
          </p>
        ) : (
          questions.map((question) => (
            <div key={question.id} className="border-l-4 border-blue-500 pl-4 pb-4 border-b">
              {/* Question */}
              <div className="mb-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {question.askerName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-800">{question.askerName}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {question.createdAt
                          ? new Date(question.createdAt.seconds * 1000).toLocaleString()
                          : 'Just now'}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      question.status === 'resolved'
                        ? 'bg-green-100 text-green-800'
                        : question.status === 'answered'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {question.status}
                  </span>
                </div>
                <p className="text-gray-800 font-medium mb-2">❓ {question.question}</p>
                <div className="flex gap-3 text-sm">
                  {user.uid === question.askerUid &&
                    question.status !== 'resolved' &&
                    question.answers?.length > 0 && (
                      <button
                        onClick={() => handleMarkResolved(question.id, question.askerUid)}
                        className="text-green-600 hover:underline"
                      >
                        Mark as Resolved
                      </button>
                    )}
                  {(user.uid === question.askerUid || user.role === 'admin') && (
                    <button
                      onClick={() => handleDeleteQuestion(question.id, question.askerUid)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {/* Answers */}
              {question.answers && question.answers.length > 0 && (
                <div className="ml-6 space-y-3 mb-3">
                  {question.answers.map((answer, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                          {answer.authorName?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-800 text-sm">{answer.authorName}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(answer.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm">{answer.body}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Answer Form */}
              {question.status !== 'resolved' && (
                <form onSubmit={(e) => handleAddAnswer(e, question.id)} className="ml-6">
                  <textarea
                    value={answerText[question.id] || ''}
                    onChange={(e) =>
                      setAnswerText({ ...answerText, [question.id]: e.target.value })
                    }
                    placeholder="Write an answer..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-2 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={loading || !answerText[question.id]?.trim()}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    Post Answer
                  </button>
                </form>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

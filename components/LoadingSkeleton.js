// components/LoadingSkeleton.js
'use client';

export function VideoCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="skeleton aspect-video w-full"></div>
      <div className="p-4 space-y-3">
        <div className="skeleton h-4 w-3/4"></div>
        <div className="skeleton h-3 w-1/2"></div>
        <div className="flex gap-3">
          <div className="skeleton h-3 w-16"></div>
          <div className="skeleton h-3 w-16"></div>
        </div>
      </div>
    </div>
  );
}

export function PlaylistCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="skeleton h-12 w-12 rounded-full mb-4"></div>
      <div className="skeleton h-6 w-3/4 mb-2"></div>
      <div className="skeleton h-4 w-full mb-4"></div>
      <div className="skeleton h-3 w-1/3"></div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
      <div className="flex items-center gap-6 mb-6">
        <div className="skeleton w-24 h-24 rounded-full"></div>
        <div className="flex-1 space-y-3">
          <div className="skeleton h-8 w-48"></div>
          <div className="skeleton h-4 w-64"></div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-24 rounded-lg"></div>
        ))}
      </div>
    </div>
  );
}

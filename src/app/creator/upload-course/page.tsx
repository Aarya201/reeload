'use client';
import { useEffect, useState } from 'react';
import { db, auth, storage } from '@/lib/firebase';
import { ref, set, push, update, get } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import Link from 'next/link';



export default function UploadCourse() {
  const [user, setUser] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('60');
  const [reels, setReels] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const [videos, setVideos] = useState<File[]>([]);
  const [videoNames, setVideoNames] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser) {
        router.push('/login');
      } else {
        setUser(currentUser);
      }
    });
    return unsubscribe;
  }, [router]);

  useEffect(() => {
    
    if (!user) return;

    const creatorRef = ref(db, `creators/${user.uid}`);
    
    get(creatorRef).then((snapshot) => {
      if (!snapshot.exists()) {
        // User is not a creator, redirect to auth-choice
        router.push('/auth-choice');
      }
    });
  }, [user, router]);


const handleVideoChange = (index: number, file: File | null) => {
  if (!file) return;

  // Validate file
  if (!file.type.startsWith('video/')) {
    alert('Please select a video file');
    return;
  }

  if (file.size > 100 * 1024 * 1024) { // 100MB limit
    alert('Video must be less than 100MB');
    return;
  }

  const newVideos = [...videos];
  newVideos[index] = file;
  setVideos(newVideos);

  // Set video name
  const newNames = [...videoNames];
  newNames[index] = file.name;
  setVideoNames(newNames);
};

const handleAddVideo = () => {
  setVideos([...videos, null as any]);
  setVideoNames([...videoNames, '']);
};

const handleRemoveVideo = (index: number) => {
  setVideos(videos.filter((_, i) => i !== index));
  setVideoNames(videoNames.filter((_, i) => i !== index));
  
  // Remove from progress tracking
  const newProgress = { ...uploadProgress };
  delete newProgress[index];
  setUploadProgress(newProgress);
};


const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    if (!title.trim()) {
      setError('Course title is required');
      setLoading(false);
      return;
    }

    const validVideos = videos.filter((v) => v);
    if (validVideos.length === 0) {
      setError('At least one video file is required');
      setLoading(false);
      return;
    }

    // Upload all videos to Firebase Storage
    const videoUrls: string[] = [];

    for (let i = 0; i < validVideos.length; i++) {
      const file = validVideos[i];
      const fileExtension = file.name.split('.').pop();
      const fileName = `${user.uid}/${Date.now()}_${i}.${fileExtension}`;
      const videoStorageRef = storageRef(storage, `course-videos/${fileName}`);

      try {
        await uploadBytes(videoStorageRef, file);
        const downloadUrl = await getDownloadURL(videoStorageRef);
        videoUrls.push(downloadUrl);
        
        // Update progress
        setUploadProgress({
          ...uploadProgress,
          [i]: 100,
        });
      } catch (uploadError) {
        throw new Error(`Failed to upload video ${i + 1}: ${uploadError}`);
      }
    }

    // All videos uploaded successfully, create course
    const courseRef = push(ref(db, 'courses'));

    await set(courseRef, {
      title: title.trim(),
      description: description.trim(),
      price: parseInt(price),
      reelCount: validVideos.length,
      creatorId: user.uid,
      videos: videoUrls,
      createdAt: new Date().toISOString(),
      students: [],
      views: 0,
    });

    // Update creator profile
    const courseId = courseRef.key;
    const creatorRef = ref(db, `creators/${user.uid}`);
    const creatorSnapshot = await get(creatorRef);

    if (creatorSnapshot.exists()) {
      const creatorData = creatorSnapshot.val();
      const createdCourses = creatorData.createdCourses || [];
      createdCourses.push(courseId);
      
      await update(creatorRef, {
        createdCourses: createdCourses,
        coursesPublished: (creatorData.coursesPublished || 0) + 1,
      });
    } else {
      await set(creatorRef, {
        name: user.displayName || user.email.split('@'),
        email: user.email,
        totalEarnings: 0,
        upiId: '',
        createdCourses: [courseId],
        coursesPublished: 1,
        totalStudents: 0,
        createdAt: new Date().toISOString(),
      });
    }

    alert('✅ Course created successfully!');
    router.push('/creator/dashboard');
  } catch (err: any) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-md py-4">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">🎬 ReelLearn Creator</h1>
          <Link href="/creator/dashboard" className="text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </nav>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-8">📹 Create New Course</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg space-y-6">
          
          {/* Course Title */}
          <div>
            <label className="block text-lg font-bold mb-2">Course Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Learn React in 10 Minutes"
              className="w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-lg font-bold mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what students will learn..."
              className="w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 h-24"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-lg font-bold mb-2">Price (₹)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="60"
              min="10"
              className="w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500"
            />
            <p className="text-green-600 font-semibold mb-4">
              
  You will earn ₹{Math.floor(parseInt(price) * 0.67)} per sale
</p>
<p className="text-gray-600 text-sm mb-6">
  📹 Maximum video size: 100MB per file. Supported formats: MP4, WebM, OGG, etc.
</p>

          </div>

          {/* Reels */}
{/* Videos */}
Course Videos *

{videos.map((video, index) => (
  <div key={index} className="mb-4 p-4 border border-gray-300 rounded-lg">
    <label className="block text-gray-700 font-semibold mb-2">
      Video {index + 1}
    </label>
    <input
      type="file"
      accept="video/*"
      onChange={(e) => handleVideoChange(index, e.target.files?.[0] || null)}
      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 mb-2"
    />
    {videoNames[index] && (
      <p className="text-sm text-gray-600 mb-2">
        ✅ Selected: {videoNames[index]}
      </p>
    )}
    {uploadProgress[index] !== undefined && uploadProgress[index] < 100 && (
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all"
          style={{ width: `${uploadProgress[index]}%` }}
        />
      </div>
    )}
    {videos.length > 1 && (
      <button
        type="button"
        onClick={() => handleRemoveVideo(index)}
        className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
      >
        Remove Video
      </button>
    )}
  </div>
))}

<button
  type="button"
  onClick={handleAddVideo}
  className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-bold mb-8"
>
  + Add Another Video
</button>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? '⏳ Creating...' : '🚀 Create Course'}
          </button>
        </form>
      </div>
    </div>
  );
}

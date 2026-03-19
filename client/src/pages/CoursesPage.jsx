import { useState, useEffect, useRef } from 'react'
import {
  Play, Upload, ThumbsUp, ThumbsDown, MessageCircle,
  Search, X, Trash2, Eye, Youtube, ExternalLink
} from 'lucide-react'
import api from '../services/api'

export default function CoursesPage() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    title: '',
    youtube_url: '',
    description: ''
  })
  const user = JSON.parse(localStorage.getItem('user'))
  const canUpload = user && (user.role === 'admin' || user.role === 'faculty' || user.is_committee)

  useEffect(() => {
    fetchVideos()
  }, [])

  useEffect(() => {
    if (selectedVideo) fetchComments(selectedVideo.id)
  }, [selectedVideo])

  const fetchVideos = async () => {
    try {
      const res = await api.getArray('/courses/videos')       // ✅ FIX 1
      setVideos(res.data || [])
    } catch (error) {
      console.error('Failed to fetch videos:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async (videoId) => {
    try {
      const res = await api.getArray(`/courses/videos/${videoId}/comments`)   // ✅ FIX 2
      setComments(res.data || [])
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    }
  }

  const handleAddYoutubeVideo = async () => {
    if (!uploadForm.title.trim() || !uploadForm.youtube_url.trim()) {
      alert('Title and YouTube URL are required')
      return
    }
    setUploading(true)
    try {
      const res = await api.post('/courses/videos', {        // ✅ FIX 3
        title: uploadForm.title,
        youtube_url: uploadForm.youtube_url,
        description: uploadForm.description
      })
      setVideos([res.data, ...videos])
      setShowUploadModal(false)
      setUploadForm({ title: '', youtube_url: '', description: '' })
      alert('Video added successfully!')
    } catch (error) {
      alert('Failed to add video: ' + (error.response?.data?.message || error.message))
    } finally {
      setUploading(false)
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    try {
      const res = await api.post(`/courses/videos/${selectedVideo.id}/comments`, {   // ✅ FIX 4
        content: newComment
      })
      setComments([...comments, res.data])
      setNewComment('')
    } catch (error) {
      alert('Failed to add comment')
    }
  }

  const handleReact = async (commentId, reaction) => {
    try {
      await api.post(`/courses/comments/${commentId}/react`, { reaction })
      fetchComments(selectedVideo.id)
    } catch (error) {
      console.error('React error:', error)
    }
  }

  const handleDeleteVideo = async (videoId) => {
    if (!confirm('Delete this video?')) return
    try {
      await api.delete(`/courses/videos/${videoId}`)
      setVideos(videos.filter(v => v.id !== videoId))
      if (selectedVideo?.id === videoId) setSelectedVideo(null)
    } catch (error) {
      alert('Failed to delete video')
    }
  }

  const filteredVideos = videos.filter(v =>
    v.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getEmbedUrl = (video) => {
    if (video.embed_url) return video.embed_url
    if (video.youtube_id) return `https://www.youtube.com/embed/${video.youtube_id}`
    return null
  }

  const getThumbnail = (video) => {
    if (video.thumbnail_url) return video.thumbnail_url
    if (video.youtube_id) return `https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg`
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center pt-20">
        <div className="text-white text-xl">Loading courses...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pt-20 px-4 pb-12">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Courses & Videos</h1>
            <p className="text-gray-400 mt-1">{videos.length} videos available</p>
          </div>
          {canUpload && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-5 py-3 rounded-xl text-white font-medium transition"
            >
              <Youtube className="w-5 h-5" />
              Add YouTube Video
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-600"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2">
              <X className="w-5 h-5 text-gray-400 hover:text-white" />
            </button>
          )}
        </div>

        {/* Main Content */}
        {selectedVideo ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <button
                onClick={() => setSelectedVideo(null)}
                className="text-blue-400 hover:text-blue-300 flex items-center gap-2 text-sm"
              >
                ← Back to all videos
              </button>

              <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingTop: '56.25%' }}>
                <iframe
                  src={getEmbedUrl(selectedVideo)}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={selectedVideo.title}
                />
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-white">{selectedVideo.title}</h2>
                    {selectedVideo.description && (
                      <p className="text-gray-400 mt-2 text-sm">{selectedVideo.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={selectedVideo.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-red-400 hover:text-red-300 text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      YouTube
                    </a>
                    {(user?.role === 'admin' || selectedVideo.uploaded_by === user?.id) && (
                      <button
                        onClick={() => handleDeleteVideo(selectedVideo.id)}
                        className="p-2 bg-red-600 hover:bg-red-700 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {selectedVideo.views || 0} views
                  </div>
                  <span>•</span>
                  <span>By {selectedVideo.uploader?.full_name || selectedVideo.uploader?.username || 'Unknown'}</span>
                  <span>•</span>
                  <span>{new Date(selectedVideo.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Comments */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Comments ({comments.length})
                </h3>
                <form onSubmit={handleAddComment} className="flex gap-3 mb-6">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-sm font-bold shrink-0">
                    {user?.full_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-600"
                    />
                    <button
                      type="submit"
                      disabled={!newComment.trim()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm disabled:opacity-50"
                    >
                      Post
                    </button>
                  </div>
                </form>
                <div className="space-y-4">
                  {comments.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">No comments yet. Be the first!</p>
                  ) : (
                    comments.map(comment => {
                      const likes = comment.reactions?.filter(r => r.reaction === 'like').length || 0
                      const dislikes = comment.reactions?.filter(r => r.reaction === 'dislike').length || 0
                      return (
                        <div key={comment.id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-600 to-teal-600 flex items-center justify-center text-xs font-bold shrink-0">
                            {comment.commenter?.full_name?.[0]?.toUpperCase() || comment.commenter?.username?.[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-white">
                                {comment.commenter?.full_name || comment.commenter?.username}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(comment.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-gray-300 text-sm">{comment.content}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <button
                                onClick={() => handleReact(comment.id, 'like')}
                                className="flex items-center gap-1 text-xs text-gray-400 hover:text-green-400 transition"
                              >
                                <ThumbsUp className="w-3 h-3" />
                                {likes}
                              </button>
                              <button
                                onClick={() => handleReact(comment.id, 'dislike')}
                                className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-400 transition"
                              >
                                <ThumbsDown className="w-3 h-3" />
                                {dislikes}
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-3">
              <h3 className="font-bold text-white mb-3">More Videos</h3>
              {videos
                .filter(v => v.id !== selectedVideo.id)
                .slice(0, 10)
                .map(video => (
                  <button
                    key={video.id}
                    onClick={() => setSelectedVideo(video)}
                    className="w-full flex gap-3 p-3 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700 transition text-left"
                  >
                    <div className="relative w-28 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-800">
                      {getThumbnail(video) ? (
                        <img src={getThumbnail(video)} alt={video.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-6 h-6 text-gray-500" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition">
                        <Play className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white line-clamp-2">{video.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {video.uploader?.full_name || video.uploader?.username}
                      </p>
                      <p className="text-xs text-gray-600">{video.views || 0} views</p>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        ) : (
          <div>
            {filteredVideos.length === 0 ? (
              <div className="text-center py-20">
                <Youtube className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-400 mb-2">
                  {searchQuery ? 'No videos found' : 'No videos yet'}
                </h3>
                <p className="text-gray-600">
                  {searchQuery
                    ? 'Try a different search term'
                    : canUpload
                    ? 'Add the first YouTube video!'
                    : 'Check back later for course content'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredVideos.map(video => (
                  <div
                    key={video.id}
                    className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition group cursor-pointer"
                  >
                    <div
                      className="relative w-full bg-gray-800 overflow-hidden"
                      style={{ paddingTop: '56.25%' }}
                      onClick={() => setSelectedVideo(video)}
                    >
                      {getThumbnail(video) ? (
                        <img
                          src={getThumbnail(video)}
                          alt={video.title}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                          <Youtube className="w-12 h-12 text-red-500" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                          <Play className="w-6 h-6 text-white ml-1" />
                        </div>
                      </div>
                      <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-red-600 px-2 py-0.5 rounded text-xs text-white font-medium">
                        <Youtube className="w-3 h-3" />
                        YouTube
                      </div>
                    </div>
                    <div className="p-4">
                      <h3
                        className="font-semibold text-white line-clamp-2 text-sm cursor-pointer hover:text-blue-400"
                        onClick={() => setSelectedVideo(video)}
                      >
                        {video.title}
                      </h3>
                      {video.description && (
                        <p className="text-gray-500 text-xs mt-1 line-clamp-2">{video.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <div>
                          <p className="text-xs text-gray-400">
                            {video.uploader?.full_name || video.uploader?.username}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-600 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {video.views || 0}
                            </span>
                          </div>
                        </div>
                        {(user?.role === 'admin' || video.uploaded_by === user?.id) && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteVideo(video.id) }}
                            className="p-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Youtube className="w-6 h-6 text-red-500" />
                Add YouTube Video
              </h2>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Video Title *</label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  placeholder="Enter a descriptive title"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">YouTube URL *</label>
                <input
                  type="url"
                  value={uploadForm.youtube_url}
                  onChange={(e) => setUploadForm({ ...uploadForm, youtube_url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-600"
                />
                <p className="text-xs text-gray-500 mt-1">Supports youtube.com and youtu.be links</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description (optional)</label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  placeholder="What is this video about?"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-600 resize-none"
                  rows="3"
                />
              </div>
              {uploadForm.youtube_url && (() => {
                const match = uploadForm.youtube_url.match(/(?:youtu\.be\/|v=)([^#&?]*)/)
                const ytId = match?.[1]
                return ytId ? (
                  <div className="rounded-xl overflow-hidden">
                    <img
                      src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                      alt="Thumbnail preview"
                      className="w-full h-40 object-cover"
                    />
                    <p className="text-xs text-green-400 mt-1 text-center">✓ Valid YouTube URL</p>
                  </div>
                ) : (
                  <p className="text-xs text-red-400">⚠ Could not detect YouTube video ID</p>
                )
              })()}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddYoutubeVideo}
                disabled={uploading || !uploadForm.title.trim() || !uploadForm.youtube_url.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Youtube className="w-5 h-5" />
                    Add Video
                  </>
                )}
              </button>
              <button
                onClick={() => { setShowUploadModal(false); setUploadForm({ title: '', youtube_url: '', description: '' }) }}
                className="flex-1 bg-gray-800 hover:bg-gray-700 py-3 rounded-xl font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

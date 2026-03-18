import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Search, Plus, Hash, Lock, Users, Phone, Video, 
  MoreVertical, Paperclip, Smile, Send, UserPlus,
  MessageSquare, Bell, Star, ChevronDown, User, Mail, 
  Briefcase, Clock, Check, X
} from 'lucide-react'
import api from '../services/api'

export default function MessagesPage() {
  const { channelId } = useParams()
  const navigate = useNavigate()
  
  // Channel states
  const [channels, setChannels] = useState([])
  const [currentChannel, setCurrentChannel] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Friend system states
  const [activeTab, setActiveTab] = useState('chats') // chats, find, requests, pending
  const [friends, setFriends] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [sentRequests, setSentRequests] = useState([])
  const [receivedRequests, setReceivedRequests] = useState([])
  const [selectedFriend, setSelectedFriend] = useState(null)
  const [directMessages, setDirectMessages] = useState([])
  const [sending, setSending] = useState(false)

  const user = JSON.parse(localStorage.getItem('user'))

  useEffect(() => {
    fetchChannels()
    fetchFriendData()
  }, [])

  useEffect(() => {
    if (channelId) {
      setSelectedFriend(null)
      fetchChannel(channelId)
      fetchChannelMessages(channelId)
    }
  }, [channelId])

  useEffect(() => {
    if (selectedFriend) {
      fetchDirectMessages(selectedFriend.id)
      const interval = setInterval(() => fetchDirectMessages(selectedFriend.id), 3000)
      return () => clearInterval(interval)
    }
  }, [selectedFriend])

  const fetchChannels = async () => {
    try {
      const data = await api.get('/channels')
      setChannels(data || [])
    } catch (error) {
      console.error('Failed to fetch channels:', error)
    }
  }

  const fetchFriendData = async () => {
  try {
    const [friendsRes, usersRes, sentRes, receivedRes] = await Promise.all([
      api.get('/friends/list'),
      api.get('/friends/users'),  
      api.get('/friends/requests/sent'),
      api.get('/friends/requests/received')
    ])
    
    setFriends(friendsRes.data || [])
    setAllUsers(usersRes.data || [])
    setSentRequests(sentRes.data || [])
    setReceivedRequests(receivedRes.data || [])
  } catch (error) {
    console.error('Failed to fetch friend data:', error)
    setFriends([])
    setAllUsers([])
    setSentRequests([])
    setReceivedRequests([])
  }
}


  const fetchChannel = async (id) => {
    try {
      const data = await api.get(`/channels/${id}`)
      setCurrentChannel(data)
    } catch (error) {
      console.error('Failed to fetch channel:', error)
    }
  }

  const fetchChannelMessages = async (id) => {
    try {
      const data = await api.get(`/messages/channel/${id}`)
      setMessages(data || [])
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  const fetchDirectMessages = async (friendId) => {
    try {
      const data = await api.get(`/messages/direct/${friendId}`)
      setDirectMessages(data || [])
    } catch (error) {
      console.error('Failed to fetch direct messages:', error)
    }
  }

  const sendChannelMessage = async () => {
    if (!newMessage.trim() || !channelId) return

    try {
      const data = await api.post('/messages', {
        channel_id: channelId,
        content: newMessage
      })
      setMessages([...messages, data])
      setNewMessage('')
    } catch (error) {
      alert('Failed to send message')
    }
  }

  const sendDirectMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedFriend) return

    setSending(true)
    try {
      await api.post('/messages/direct', {
        receiver_id: selectedFriend.id,
        message: newMessage.trim()
      })

      setNewMessage('')
      fetchDirectMessages(selectedFriend.id)
    } catch (error) {
      console.error('Failed to send message:', error)
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleSendRequest = async (userId) => {
    try {
      await api.post('/friends/request', { receiver_id: userId })
      alert('✅ Friend request sent!')
      fetchFriendData()
    } catch (error) {
      console.error('Send request error:', error)
      alert(error.response?.data?.message || 'Failed to send request')
    }
  }

  const handleAcceptRequest = async (requestId) => {
    try {
      await api.put(`/friends/request/${requestId}/accept`)
      alert('✅ Friend request accepted!')
      fetchFriendData()
    } catch (error) {
      console.error('Accept request error:', error)
      alert('Failed to accept request')
    }
  }

  const handleRejectRequest = async (requestId) => {
    try {
      await api.put(`/friends/request/${requestId}/reject`)
      alert('Request rejected')
      fetchFriendData()
    } catch (error) {
      console.error('Reject request error:', error)
      alert('Failed to reject request')
    }
  }

  const filteredUsers = allUsers.filter(user => {
    const matchesSearch = user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const isFriend = friends.some(f => f.id === user.id)
    const hasPendingRequest = sentRequests.some(r => r.receiver_id === user.id && r.status === 'pending')
    
    return matchesSearch && !isFriend && !hasPendingRequest
  })

  return (
    <div className="h-screen bg-black text-white flex pt-16">
      {/* Sidebar */}
      <div className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Science & Tech Club</h2>
            <button className="text-gray-400 hover:text-white">
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-3">
          {/* Quick Actions */}
          <div className="space-y-1 mb-4">
            <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-800 rounded text-sm text-gray-300">
              <MessageSquare className="w-4 h-4" />
              Threads
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-800 rounded text-sm text-gray-300">
              <Bell className="w-4 h-4" />
              Mentions & reactions
            </button>
          </div>

          {/* Channels */}
          <div className="mb-4">
            <button className="w-full flex items-center justify-between px-3 py-1 hover:bg-gray-800 rounded text-sm font-semibold text-gray-400 mb-1">
              Channels
              <Plus className="w-4 h-4" />
            </button>
            
            <div className="space-y-0.5">
              {(user?.role === 'admin' || user?.is_committee) && (
                <button
                  onClick={() => {
                    setSelectedFriend(null)
                    navigate('/messages/committee')
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-sm ${
                    channelId === 'committee'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  committee
                </button>
              )}

              {channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => {
                    setSelectedFriend(null)
                    navigate(`/messages/${channel.id}`)
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-sm ${
                    channelId === channel.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  {channel.is_private ? <Lock className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
                  {channel.name}
                </button>
              ))}
            </div>
          </div>

          {/* Direct Messages with Tabs */}
          <div>
            <div className="flex items-center justify-between px-3 py-1 mb-2">
              <span className="text-sm font-semibold text-gray-400">Direct Messages</span>
            </div>

            {/* Friend System Tabs */}
            <div className="grid grid-cols-4 gap-1 mb-3">
              <button
                onClick={() => setActiveTab('chats')}
                className={`py-2 px-1 text-center rounded text-xs transition ${
                  activeTab === 'chats' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Chats
              </button>
              <button
                onClick={() => setActiveTab('find')}
                className={`py-2 px-1 text-center rounded text-xs transition ${
                  activeTab === 'find' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Find
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`py-2 px-1 text-center rounded text-xs transition relative ${
                  activeTab === 'requests' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Sent
                {sentRequests.filter(r => r.status === 'pending').length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-yellow-500 text-xs rounded-full w-4 h-4 flex items-center justify-center text-white">
                    {sentRequests.filter(r => r.status === 'pending').length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-2 px-1 text-center rounded text-xs transition relative ${
                  activeTab === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Requests
                {receivedRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full w-4 h-4 flex items-center justify-center text-white">
                    {receivedRequests.length}
                  </span>
                )}
              </button>
            </div>

            {/* Tab Content */}
            <div className="space-y-1">
              {/* Chats Tab */}
              {activeTab === 'chats' && (
                friends.length === 0 ? (
                  <div className="text-center py-6">
                    <Users className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-400 mb-3">No friends yet</p>
                    <button
                      onClick={() => setActiveTab('find')}
                      className="text-xs bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
                    >
                      Find Friends
                    </button>
                  </div>
                ) : (
                  friends.map((friend) => (
                    <button
                      key={friend.id}
                      onClick={() => {
                        setSelectedFriend(friend)
                        setCurrentChannel(null)
                        navigate('/messages')
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition ${
                        selectedFriend?.id === friend.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
                      }`}
                    >
                      {friend.profile_photo_url ? (
                        <img src={friend.profile_photo_url} className="w-7 h-7 rounded-full object-cover" alt="" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-sm font-bold">
                          {friend.full_name?.[0]?.toUpperCase() || friend.username?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <span className="truncate">{friend.full_name || friend.username}</span>
                    </button>
                  ))
                )
              )}

              {/* Find Friends Tab */}
              {activeTab === 'find' && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-6 text-xs text-gray-400">
                      {searchQuery ? 'No users found' : 'All users are friends'}
                    </div>
                  ) : (
                    filteredUsers.map((u) => (
                      <div key={u.id} className="p-3 bg-gray-800 rounded">
                        <div className="flex items-start gap-2 mb-2">
                          {u.profile_photo_url ? (
                            <img src={u.profile_photo_url} className="w-10 h-10 rounded-full object-cover" alt="" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center font-bold">
                              {u.full_name?.[0]?.toUpperCase() || u.username?.[0]?.toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm truncate">{u.full_name || u.username}</h4>
                            <p className="text-xs text-gray-400 truncate">@{u.username}</p>
                          </div>
                        </div>
                        {u.department && (
                          <p className="text-xs text-gray-400 mb-2">
                            {u.department} {u.year && `• Year ${u.year}`}
                          </p>
                        )}
                        <button
                          onClick={() => handleSendRequest(u.id)}
                          className="w-full flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded text-xs font-medium"
                        >
                          <UserPlus className="w-3 h-3" />
                          Add Friend
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Sent Requests Tab */}
              {activeTab === 'requests' && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {sentRequests.length === 0 ? (
                    <div className="text-center py-6 text-xs text-gray-400">No sent requests</div>
                  ) : (
                    sentRequests.map((req) => (
                      <div key={req.id} className="p-3 bg-gray-800 rounded">
                        <div className="flex items-center gap-2">
                          {req.receiver?.profile_photo_url ? (
                            <img src={req.receiver.profile_photo_url} className="w-8 h-8 rounded-full object-cover" alt="" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-sm font-bold">
                              {req.receiver?.full_name?.[0]?.toUpperCase() || req.receiver?.username?.[0]?.toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold truncate">{req.receiver?.full_name || req.receiver?.username}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              req.status === 'pending' ? 'bg-yellow-900/50 text-yellow-400' :
                              req.status === 'accepted' ? 'bg-green-900/50 text-green-400' :
                              'bg-red-900/50 text-red-400'
                            }`}>
                              {req.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Pending Requests Tab */}
              {activeTab === 'pending' && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {receivedRequests.length === 0 ? (
                    <div className="text-center py-6 text-xs text-gray-400">No pending requests</div>
                  ) : (
                    receivedRequests.map((req) => (
                      <div key={req.id} className="p-3 bg-gray-800 rounded">
                        <div className="flex items-start gap-2 mb-2">
                          {req.sender?.profile_photo_url ? (
                            <img src={req.sender.profile_photo_url} className="w-10 h-10 rounded-full object-cover" alt="" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center font-bold">
                              {req.sender?.full_name?.[0]?.toUpperCase() || req.sender?.username?.[0]?.toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm truncate">{req.sender?.full_name || req.sender?.username}</h4>
                            <p className="text-xs text-gray-400 truncate">@{req.sender?.username}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptRequest(req.id)}
                            className="flex-1 flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded text-xs font-medium"
                          >
                            <Check className="w-3 h-3" />
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectRequest(req.id)}
                            className="flex-1 flex items-center justify-center gap-1 bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded text-xs font-medium"
                          >
                            <X className="w-3 h-3" />
                            Reject
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedFriend ? (
          <>
            {/* DM Header */}
            <div className="h-14 border-b border-gray-800 flex items-center justify-between px-6">
              <div className="flex items-center gap-3">
                {selectedFriend.profile_photo_url ? (
                  <img src={selectedFriend.profile_photo_url} className="w-10 h-10 rounded-full object-cover" alt="" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-lg font-bold">
                    {selectedFriend.full_name?.[0]?.toUpperCase() || selectedFriend.username?.[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="font-bold">{selectedFriend.full_name || selectedFriend.username}</h2>
                  <p className="text-xs text-gray-400">@{selectedFriend.username}</p>
                </div>
              </div>
            </div>

            {/* DM Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {directMessages.length === 0 ? (
                <div className="text-center text-gray-400 py-12">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                directMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-md px-6 py-3 rounded-2xl ${
                      msg.sender_id === user.id ? 'bg-blue-600 text-white' : 'bg-gray-800 text-white'
                    }`}>
                      <p className="break-words">{msg.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* DM Input */}
            <form onSubmit={sendDirectMessage} className="p-4 border-t border-gray-800">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  disabled={sending}
                  className="flex-1 px-6 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed p-3 rounded-xl transition"
                >
                  <Send className="w-6 h-6" />
                </button>
              </div>
            </form>
          </>
        ) : currentChannel ? (
          <>
            {/* Channel Header */}
            <div className="h-14 border-b border-gray-800 flex items-center justify-between px-6">
              <div className="flex items-center gap-3">
                <Hash className="w-5 h-5 text-gray-400" />
                <h2 className="font-bold">{currentChannel.name}</h2>
                {currentChannel.members_count && (
                  <span className="text-sm text-gray-400">{currentChannel.members_count} members</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-800 rounded">
                  <Phone className="w-5 h-5 text-gray-400" />
                </button>
                <button className="p-2 hover:bg-gray-800 rounded">
                  <Video className="w-5 h-5 text-gray-400" />
                </button>
                <button className="p-2 hover:bg-gray-800 rounded">
                  <Users className="w-5 h-5 text-gray-400" />
                </button>
                <button className="p-2 hover:bg-gray-800 rounded">
                  <MoreVertical className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Channel Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="flex gap-3 hover:bg-gray-900/50 -mx-6 px-6 py-2">
                  {message.sender_photo ? (
                    <img src={message.sender_photo} className="w-10 h-10 rounded-lg flex-shrink-0" alt="" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                      {message.sender_name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-semibold">{message.sender_name}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-gray-300">{message.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Channel Message Input */}
            <div className="p-4 border-t border-gray-800">
              <div className="bg-gray-800 rounded-lg border border-gray-700 focus-within:border-blue-500">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendChannelMessage()
                    }
                  }}
                  placeholder={`Message #${currentChannel.name}`}
                  className="w-full p-3 bg-transparent text-white placeholder-gray-500 focus:outline-none resize-none"
                  rows={3}
                />
                <div className="flex items-center justify-between px-3 pb-3">
                  <div className="flex gap-2">
                    <button className="p-1.5 hover:bg-gray-700 rounded">
                      <Paperclip className="w-5 h-5 text-gray-400" />
                    </button>
                    <button className="p-1.5 hover:bg-gray-700 rounded">
                      <Smile className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                  <button
                    onClick={sendChannelMessage}
                    disabled={!newMessage.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed p-2 rounded transition"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-700" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">Select a chat</h3>
              <p className="text-gray-500">Choose a channel or friend to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

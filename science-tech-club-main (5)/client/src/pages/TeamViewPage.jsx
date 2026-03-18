import { useState, useEffect } from 'react'
import { Users } from 'lucide-react'
import api from '../services/api'

export default function TeamViewPage() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      const data = await api.get('/public/committee')
      setMembers(data)
    } catch (error) {
      console.error('Failed to fetch members:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-20 px-4 flex items-center justify-center">
        <div className="text-white">Loading team...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pt-20 px-4 pb-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Our Team</h1>
          <p className="text-gray-400">Meet the committee members</p>
        </div>

        {members.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500">No team members yet</p>
          </div>
        )}
      </div>
    </div>
  )
}

function MemberCard({ member }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center hover:border-blue-600 transition">
      {member.profile_photo_url ? (
        <img src={member.profile_photo_url} alt={member.username} className="w-24 h-24 rounded-full mx-auto mb-4 object-cover" />
      ) : (
        <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-blue-600 flex items-center justify-center text-3xl font-bold">
          {member.username[0].toUpperCase()}
        </div>
      )}
      <h3 className="text-xl font-bold text-white mb-2">{member.username}</h3>
      <p className="text-blue-500 text-sm mb-2">{member.committee_post}</p>
      {member.department && <p className="text-gray-500 text-sm">{member.department}</p>}
    </div>
  )
}

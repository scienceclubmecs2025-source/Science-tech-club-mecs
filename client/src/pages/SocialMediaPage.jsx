import { useState, useEffect } from 'react'
import { Instagram, Youtube, Linkedin, Globe, ExternalLink, Twitter } from 'lucide-react'
import api from '../services/api'

export default function SocialMediaPage() {
  const [links, setLinks] = useState({
    instagram: '', youtube: '', linkedin: '', twitter: '', website: '', whatsapp: ''
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/config').then(cfg => {
      if (cfg) {
        setLinks({
          instagram: cfg.instagram  || '',
          youtube:   cfg.youtube    || '',
          linkedin:  cfg.linkedin   || '',
          twitter:   cfg.twitter    || '',
          website:   cfg.website    || '',
          whatsapp:  cfg.whatsapp   || '',
        })
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const socials = [
    { key: 'instagram', label: 'Instagram',  icon: Instagram,  color: 'from-pink-600 to-rose-600',    bg: 'bg-pink-600' },
    { key: 'youtube',   label: 'YouTube',    icon: Youtube,    color: 'from-red-600 to-red-700',       bg: 'bg-red-600' },
    { key: 'linkedin',  label: 'LinkedIn',   icon: Linkedin,   color: 'from-blue-600 to-blue-700',     bg: 'bg-blue-600' },
    { key: 'twitter',   label: 'Twitter/X',  icon: Twitter,    color: 'from-sky-500 to-sky-600',       bg: 'bg-sky-500' },
    { key: 'website',   label: 'Website',    icon: Globe,      color: 'from-green-600 to-emerald-600', bg: 'bg-green-600' },
    { key: 'whatsapp',  label: 'WhatsApp',   icon: Globe,      color: 'from-emerald-500 to-green-600', bg: 'bg-emerald-500' },
  ].filter(s => links[s.key])

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white pt-20 px-4 pb-12">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Instagram className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold">Find Us Online</h1>
          <p className="text-gray-400 mt-2">Follow Science & Tech Club on social media</p>
        </div>

        {socials.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center text-gray-400">
            <Globe className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Social media links not configured yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {socials.map(({ key, label, icon: Icon, color, bg }) => (
              <a key={key} href={links[key]} target="_blank" rel="noopener noreferrer"
                className={`flex items-center justify-between bg-gradient-to-r ${color} p-5 rounded-2xl hover:opacity-90 transition group shadow-lg`}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-lg">{label}</p>
                    <p className="text-white/70 text-sm truncate max-w-[200px]">{links[key]}</p>
                  </div>
                </div>
                <ExternalLink className="w-5 h-5 text-white/70 group-hover:text-white transition" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

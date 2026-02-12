import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useKV } from '@github/spark/hooks'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  SpeakerHigh,
  SpeakerX,
  List,
  X,
  InstagramLogo,
  FacebookLogo,
  SpotifyLogo,
  YoutubeLogo,
  Pencil,
  FloppyDisk,
  ChartLine,
  MagnifyingGlassPlus,
  Download,
  MapPin,
  CalendarBlank,
  Ticket,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'

interface Track {
  id: string
  title: string
  artist: string
  url: string
  artwork?: string
}

interface Gig {
  id: string
  venue: string
  location: string
  date: string
  ticketUrl?: string
  support?: string
}

interface Release {
  id: string
  title: string
  artwork: string
  year: string
  spotify?: string
  soundcloud?: string
  youtube?: string
  bandcamp?: string
}

interface SiteData {
  bio: string
  tracks: Track[]
  gigs: Gig[]
  releases: Release[]
  gallery: string[]
  social: {
    instagram?: string
    facebook?: string
    spotify?: string
    youtube?: string
    soundcloud?: string
    bandcamp?: string
    tiktok?: string
  }
}

function App() {
  const [siteData, setSiteData] = useKV<SiteData>('zardonic-site-data', {
    bio: `THE CLASH OF DISPARATE ELEMENTS ACTIVATES INNOVATION, AND EVERY GENERATION BRINGS US TIMELESS FIGURES WHO ACCIDENTALLY SPARK A NEW REVOLUTIONARY SOUND WITHIN THE MUSIC WORLD. CHUCK BERRY MIXED JAZZ, BLUES, GOSPEL AND COUNTRY MUSIC TO CREATE ROCK N ROLL. A FEW DECADES LATER, OZZY OSBOURNE TURNED UP THE GAIN TO CREATE HEAVY METAL. AND SINCE THE EARLY 2000S, FEDERICO AGREDA ALVAREZ, THE MASKED PERFORMER KNOWN TO THE WORLD AS DJ AND PRODUCER ZARDONIC, HAS HARNESSED THE POWER OF THE NEXUS BETWEEN DRUM & BASS AND HEAVY METAL TO CREATE THE SOUND THAT IS NOW KNOWN AS METAL & BASS.`,
    tracks: [
      {
        id: '1',
        title: 'Revelation',
        artist: 'ZARDONIC',
        url: '',
        artwork: '',
      },
    ],
    gigs: [],
    releases: [],
    gallery: [],
    social: {
      instagram: 'https://instagram.com/zardonic',
      facebook: 'https://facebook.com/zardonic',
      spotify: 'https://open.spotify.com/artist/zardonic',
      youtube: 'https://youtube.com/zardonic',
      soundcloud: 'https://soundcloud.com/zardonic',
      bandcamp: 'https://zardonic.bandcamp.com',
    },
  })

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [volume, setVolume] = useState([80])
  const [progress, setProgress] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showAnalytics, setShowAnalytics] = useState(false)
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    window.spark.user().then(setCurrentUser)
  }, [])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume[0] / 100
    }
  }, [volume])

  const togglePlay = () => {
    if (!audioRef.current) return
    
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const playNext = () => {
    if (!siteData) return
    setCurrentTrackIndex((prev) => (prev + 1) % siteData.tracks.length)
    setIsPlaying(true)
  }

  const playPrevious = () => {
    if (!siteData) return
    setCurrentTrackIndex((prev) => (prev - 1 + siteData.tracks.length) % siteData.tracks.length)
    setIsPlaying(true)
  }

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setMobileMenuOpen(false)
    }
  }

  const saveChanges = () => {
    toast.success('Changes saved successfully')
  }

  const currentTrack = siteData?.tracks[currentTrackIndex]

  if (!siteData) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-foreground">Loading...</p>
    </div>
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster />
      <audio ref={audioRef} src={currentTrack?.url} />

      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-primary"
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <motion.h1
            className="text-2xl md:text-3xl font-bold tracking-tighter text-primary uppercase"
            whileHover={{ scale: 1.05 }}
          >
            ZARDONIC
          </motion.h1>

          <div className="hidden md:flex items-center gap-6">
            {['bio', 'music', 'gigs', 'releases', 'gallery', 'connect'].map((section) => (
              <button
                key={section}
                onClick={() => scrollToSection(section)}
                className="text-sm uppercase tracking-wide hover:text-primary transition-colors"
              >
                {section}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {currentUser?.isOwner && (
              <Button
                size="sm"
                variant={editMode ? 'default' : 'outline'}
                onClick={() => setEditMode(!editMode)}
              >
                <Pencil className="w-4 h-4" />
              </Button>
            )}
            
            <button
              className="md:hidden text-primary"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <List className="w-6 h-6" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-card border-t border-primary overflow-hidden"
            >
              <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
                {['bio', 'music', 'gigs', 'releases', 'gallery', 'connect'].map((section) => (
                  <button
                    key={section}
                    onClick={() => scrollToSection(section)}
                    className="text-left text-sm uppercase tracking-wide hover:text-primary transition-colors"
                  >
                    {section}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      <section className="relative min-h-screen flex items-center justify-center pt-20 scanline-effect">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card opacity-50" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center px-4"
        >
          <h1 className="text-6xl md:text-9xl font-bold tracking-tighter mb-8 uppercase glitch-text">
            <span className="text-foreground drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
              ZARDONIC
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 uppercase tracking-widest">
            Metal & Bass
          </p>
          
          <Badge variant="outline" className="text-sm border-primary text-primary">
            Darktunes Music Group
          </Badge>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-12 flex gap-4 justify-center"
          >
            <Button onClick={() => scrollToSection('music')} size="lg" className="uppercase">
              Listen Now
            </Button>
            <Button onClick={() => scrollToSection('gigs')} size="lg" variant="outline" className="uppercase">
              Tour Dates
            </Button>
          </motion.div>
        </motion.div>

        <div className="hud-corner top-left" />
        <div className="hud-corner top-right" />
        <div className="hud-corner bottom-left" />
        <div className="hud-corner bottom-right" />
      </section>

      <Separator className="bg-primary" />

      <section id="bio" className="py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-12 uppercase tracking-tighter text-primary">
              Biography
            </h2>
            
            {editMode ? (
              <div className="space-y-4">
                <Textarea
                  value={siteData.bio}
                  onChange={(e) => {
                    const newBio = e.target.value
                    setSiteData((data) => {
                      if (!data) return {
                        bio: newBio,
                        tracks: [],
                        gigs: [],
                        releases: [],
                        gallery: [],
                        social: {}
                      }
                      return { ...data, bio: newBio }
                    })
                  }}
                  className="min-h-[300px] font-mono"
                />
                <Button onClick={saveChanges}>
                  <FloppyDisk className="w-4 h-4 mr-2" />
                  Save Bio
                </Button>
              </div>
            ) : (
              <p className="text-lg leading-relaxed text-muted-foreground font-light">
                {siteData.bio}
              </p>
            )}
          </motion.div>
        </div>
      </section>

      <Separator className="bg-primary" />

      <section id="music" className="py-24 px-4 bg-card/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-12 uppercase tracking-tighter text-primary">
              Music Player
            </h2>

            {siteData.tracks.length > 0 && (
              <Card className="p-8 bg-card border-primary/50 relative scanline-effect">
                <div className="grid md:grid-cols-[200px_1fr] gap-8">
                  <div className="aspect-square bg-muted rounded flex items-center justify-center text-6xl">
                    {currentTrack?.artwork ? (
                      <img src={currentTrack.artwork} alt={currentTrack.title} className="w-full h-full object-cover rounded" />
                    ) : (
                      '▶'
                    )}
                  </div>

                  <div className="flex flex-col justify-between">
                    <div>
                      <h3 className="text-2xl font-bold mb-2 uppercase">{currentTrack?.title}</h3>
                      <p className="text-muted-foreground mb-4">{currentTrack?.artist}</p>
                    </div>

                    <div className="space-y-4">
                      <Slider
                        value={[progress]}
                        onValueChange={(val) => setProgress(val[0])}
                        max={100}
                        step={1}
                        className="w-full"
                      />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Button size="icon" variant="ghost" onClick={playPrevious}>
                            <SkipBack className="w-5 h-5" />
                          </Button>
                          
                          <Button size="icon" onClick={togglePlay}>
                            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                          </Button>
                          
                          <Button size="icon" variant="ghost" onClick={playNext}>
                            <SkipForward className="w-5 h-5" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-2 w-32">
                          {volume[0] === 0 ? <SpeakerX className="w-5 h-5" /> : <SpeakerHigh className="w-5 h-5" />}
                          <Slider
                            value={volume}
                            onValueChange={setVolume}
                            max={100}
                            step={1}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="hud-corner top-left" />
                <div className="hud-corner top-right" />
                <div className="hud-corner bottom-left" />
                <div className="hud-corner bottom-right" />
              </Card>
            )}
          </motion.div>
        </div>
      </section>

      <Separator className="bg-primary" />

      <section id="gigs" className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-12 uppercase tracking-tighter text-primary">
              Upcoming Gigs
            </h2>

            {siteData.gigs.length === 0 ? (
              <Card className="p-12 text-center bg-card/50 border-primary/30">
                <p className="text-xl text-muted-foreground uppercase tracking-wide">
                  No upcoming shows - Check back soon
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {siteData.gigs.map((gig) => (
                  <motion.div
                    key={gig.id}
                    whileHover={{ scale: 1.02, borderColor: 'oklch(0.55 0.25 25)' }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="p-6 bg-card border-primary/30 hover:border-primary transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2">
                          <h3 className="text-xl font-bold uppercase">{gig.venue}</h3>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              {gig.location}
                            </span>
                            <span className="flex items-center gap-2">
                              <CalendarBlank className="w-4 h-4" />
                              {new Date(gig.date).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </span>
                          </div>
                          {gig.support && (
                            <p className="text-sm text-muted-foreground">
                              Support: {gig.support}
                            </p>
                          )}
                        </div>

                        {gig.ticketUrl && (
                          <Button asChild>
                            <a href={gig.ticketUrl} target="_blank" rel="noopener noreferrer">
                              <Ticket className="w-4 h-4 mr-2" />
                              Tickets
                            </a>
                          </Button>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <Separator className="bg-primary" />

      <section id="releases" className="py-24 px-4 bg-card/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-12 uppercase tracking-tighter text-primary">
              Releases
            </h2>

            {siteData.releases.length === 0 ? (
              <Card className="p-12 text-center bg-card/50 border-primary/30">
                <p className="text-xl text-muted-foreground uppercase tracking-wide">
                  Releases coming soon
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {siteData.releases.map((release) => (
                  <motion.div
                    key={release.id}
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="overflow-hidden bg-card border-primary/30 hover:border-primary transition-all scanline-effect">
                      <div className="aspect-square bg-muted relative">
                        {release.artwork && (
                          <img src={release.artwork} alt={release.title} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold uppercase text-sm mb-1 truncate">{release.title}</h3>
                        <p className="text-xs text-muted-foreground mb-3">{release.year}</p>
                        
                        <div className="flex flex-wrap gap-2">
                          {release.spotify && (
                            <a href={release.spotify} target="_blank" rel="noopener noreferrer">
                              <SpotifyLogo className="w-5 h-5 hover:text-primary transition-colors" />
                            </a>
                          )}
                          {release.youtube && (
                            <a href={release.youtube} target="_blank" rel="noopener noreferrer">
                              <YoutubeLogo className="w-5 h-5 hover:text-primary transition-colors" />
                            </a>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <Separator className="bg-primary" />

      <section id="gallery" className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-12 uppercase tracking-tighter text-primary">
              Gallery
            </h2>

            {siteData.gallery.length === 0 ? (
              <Card className="p-12 text-center bg-card/50 border-primary/30">
                <p className="text-xl text-muted-foreground uppercase tracking-wide">
                  Gallery coming soon
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {siteData.gallery.map((image, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    className="aspect-square bg-muted rounded overflow-hidden cursor-pointer relative group"
                    onClick={() => setSelectedImage(image)}
                  >
                    <img src={image} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <MagnifyingGlassPlus className="w-8 h-8 text-primary" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <Separator className="bg-primary" />

      <section id="connect" className="py-24 px-4 bg-card/30">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-12 uppercase tracking-tighter text-primary">
              Connect
            </h2>

            <div className="flex flex-wrap justify-center gap-6">
              {siteData.social.instagram && (
                <motion.a
                  href={siteData.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  className="text-foreground hover:text-primary transition-colors"
                >
                  <InstagramLogo className="w-12 h-12" weight="fill" />
                </motion.a>
              )}
              {siteData.social.facebook && (
                <motion.a
                  href={siteData.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  className="text-foreground hover:text-primary transition-colors"
                >
                  <FacebookLogo className="w-12 h-12" weight="fill" />
                </motion.a>
              )}
              {siteData.social.spotify && (
                <motion.a
                  href={siteData.social.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  className="text-foreground hover:text-primary transition-colors"
                >
                  <SpotifyLogo className="w-12 h-12" weight="fill" />
                </motion.a>
              )}
              {siteData.social.youtube && (
                <motion.a
                  href={siteData.social.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  className="text-foreground hover:text-primary transition-colors"
                >
                  <YoutubeLogo className="w-12 h-12" weight="fill" />
                </motion.a>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="py-12 px-4 border-t border-primary">
        <div className="container mx-auto text-center">
          <p className="text-sm text-muted-foreground uppercase tracking-wide">
            © {new Date().getFullYear()} ZARDONIC • Darktunes Music Group
          </p>
        </div>
      </footer>

      <Dialog open={selectedImage !== null} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl bg-background border-primary">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-wide">Gallery</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <img src={selectedImage} alt="Gallery" className="w-full h-auto rounded" />
          )}
        </DialogContent>
      </Dialog>

      {editMode && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed bottom-8 right-8 bg-primary text-primary-foreground p-4 rounded-lg shadow-lg"
        >
          <p className="text-sm uppercase font-bold">Edit Mode Active</p>
        </motion.div>
      )}
    </div>
  )
}

export default App
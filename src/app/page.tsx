"use client"

import { useSession, signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Music, Sparkles, Zap, Users, ArrowRight, Play, Heart, Headphones } from "lucide-react"
import { redirect } from "next/navigation"
import { motion } from "framer-motion"

export default function LandingPage() {
  const { data: session, status } = useSession()

  if (session) {
    redirect("/dashboard")
  }

  const features = [
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: "AI-Powered Curation",
      description: "Advanced GPT-4 technology understands your music preferences and mood"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Instant Generation",
      description: "Generate personalized playlists in seconds with natural language prompts"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "100M+ Songs",
      description: "Access to Spotify's entire catalog for perfect track discovery"
    }
  ]

  const examples = [
    "Upbeat songs for morning workout",
    "Chill indie rock for studying",
    "Road trip classics from the 80s",
    "Romantic dinner jazz",
    "High-energy dance party",
    "Melancholy rainy day vibes"
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">Playlistly</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {status === "loading" ? (
              <div className="h-10 w-20 animate-pulse bg-muted rounded-md" />
            ) : (
              <Button onClick={() => signIn("spotify")} size="lg">
                Get Started
              </Button>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12 md:py-20">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <Badge variant="secondary" className="px-4 py-2">
              <Sparkles className="w-4 h-4 mr-2" />
              Powered by GPT-4
            </Badge>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              Create Perfect
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                {" "}Playlists{" "}
              </span>
              with AI
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Just describe your mood, activity, or vibe. Our AI will curate the perfect Spotify playlist
              tailored to your exact request in seconds.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              size="lg"
              className="px-8 py-3 text-lg"
              onClick={() => signIn("spotify")}
            >
              <Play className="w-5 h-5 mr-2" />
              Start Creating
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            <Button variant="outline" size="lg" className="px-8 py-3 text-lg">
              <Headphones className="w-5 h-5 mr-2" />
              See Examples
            </Button>
          </motion.div>

          {/* Example Prompts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-4"
          >
            <p className="text-sm text-muted-foreground">Try prompts like:</p>
            <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
              {examples.map((example, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="px-3 py-2 text-sm hover:bg-secondary/50 transition-colors cursor-pointer"
                >
                  "{example}"
                </Badge>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-20 md:mt-32"
        >
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Why Choose Playlistly?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Combining the power of AI with Spotify's vast music library for unparalleled playlist creation
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-20 md:mt-32 text-center"
        >
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl md:text-3xl">Ready to discover your next favorite playlist?</CardTitle>
              <CardDescription className="text-lg">
                Connect your Spotify account and start creating AI-curated playlists in minutes
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <Button
                size="lg"
                className="px-12 py-3 text-lg"
                onClick={() => signIn("spotify")}
              >
                <Heart className="w-5 h-5 mr-2" />
                Connect Spotify
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-20 border-t">
        <div className="text-center text-sm text-muted-foreground">
          <p>© 2024 Playlistly. Made with ❤️ for music lovers everywhere.</p>
          <p className="mt-2">Powered by OpenAI GPT-4 and Spotify Web API</p>
        </div>
      </footer>
    </div>
  )
}

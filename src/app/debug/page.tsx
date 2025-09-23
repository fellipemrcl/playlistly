"use client"

import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { signIn, signOut } from "next-auth/react"

export default function DebugPage() {
  const { data: session, status } = useSession()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Debug NextAuth</h1>

      <div className="space-y-4">
        <div>
          <strong>Status:</strong> {status}
        </div>

        {session ? (
          <div>
            <strong>Session:</strong>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
            <Button onClick={() => signOut()} className="mt-4">
              Sign Out
            </Button>
          </div>
        ) : (
          <div>
            <strong>No session found</strong>
            <br />
            <Button onClick={() => signIn("spotify")} className="mt-4">
              Sign In with Spotify
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
import { loginAction } from './actions'

// searchParams is a Promise in Next.js 16 App Router — must be awaited
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-8 w-full max-w-sm">
        <h1 className="text-white text-xl font-bold mb-2">Challenge Tracker</h1>
        <p className="text-[#8b949e] text-sm mb-6">Enter the household password to continue.</p>
        <form action={loginAction} className="flex flex-col gap-4">
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            className="bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-2 text-white placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff]"
          />
          {params.error && (
            <p className="text-[#f85149] text-sm">{decodeURIComponent(params.error)}</p>
          )}
          <button
            type="submit"
            className="bg-[#238636] hover:bg-[#2ea043] text-white rounded-lg py-2 font-medium transition-colors"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  )
}

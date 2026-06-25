import Link from "next/link"

export default function PublicHomePage() {
  return (
    <div className="flex-1 flex flex-col justify-center items-center text-center p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        Hariom Studio Portfolio
      </h1>
      <p className="text-muted-foreground text-lg mb-8 max-w-2xl animate-in fade-in slide-in-from-bottom-6 duration-700">
        Curated showcase of high-end architectural and visualization projects.
      </p>
    </div>
  )
}

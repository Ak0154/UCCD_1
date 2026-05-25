import { useState } from 'react'
import { GhostButton, PrimaryButton } from './ui'

function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconArrowLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M19 12H5M5 12l6 6M5 12l6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function NotFoundWatermark() {
  return (
    <svg
      width="761"
      height="301"
      viewBox="0 0 761 301"
      fill="none"
      aria-hidden
      className="h-auto w-full max-w-[600px] text-accent/8 md:max-w-[700px]"
    >
      <path
        d="M0.596592 241.023V199.119L124.034 4.0909H158.977V63.75H137.67L54.5739 195.426V197.699H226.875V241.023H0.596592ZM139.375 295V228.239L139.943 209.489V4.0909H189.659V295H139.375ZM379.787 300.54C356.397 300.54 336.321 294.621 319.56 282.784C302.893 270.852 290.062 253.665 281.065 231.222C272.164 208.684 267.713 181.553 267.713 149.83C267.808 118.106 272.306 91.1174 281.207 68.8636C290.204 46.5151 303.035 29.4697 319.702 17.7273C336.463 5.98484 356.491 0.113626 379.787 0.113626C403.082 0.113626 423.111 5.98484 439.872 17.7273C456.634 29.4697 469.465 46.5151 478.366 68.8636C487.363 91.2121 491.861 118.201 491.861 149.83C491.861 181.648 487.363 208.826 478.366 231.364C469.465 253.807 456.634 270.947 439.872 282.784C423.205 294.621 403.177 300.54 379.787 300.54ZM379.787 256.08C397.969 256.08 412.315 247.131 422.827 229.233C433.433 211.241 438.736 184.773 438.736 149.83C438.736 126.723 436.321 107.311 431.491 91.5909C426.662 75.8712 419.844 64.0341 411.037 56.0795C402.23 48.0303 391.813 44.0057 379.787 44.0057C361.7 44.0057 347.401 53.0019 336.889 70.9943C326.378 88.892 321.075 115.17 320.98 149.83C320.885 173.03 323.205 192.538 327.94 208.352C332.77 224.167 339.588 236.098 348.395 244.148C357.202 252.102 367.666 256.08 379.787 256.08ZM533.8 241.023V199.119L657.237 4.0909H692.18V63.75H670.874L587.777 195.426V197.699H760.078V241.023H533.8ZM672.578 295V228.239L673.146 209.489V4.0909H722.862V295H672.578Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function NotFound() {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-bg px-4 py-16 md:px-20 md:py-24">
      <div className="pointer-events-none absolute inset-0 hidden items-center justify-center md:flex">
        <NotFoundWatermark />
      </div>

      <div className="z-10 flex flex-col items-center justify-center gap-8 md:gap-12">
        <div className="flex flex-col items-center justify-center gap-4 md:gap-6">
          <h1 className="font-display text-center text-4xl font-semibold tracking-[-0.02em] text-text md:text-6xl">
            We lost this page
          </h1>
          <p className="text-center text-lg text-muted md:text-xl">
            The page you are looking for doesn't exist or has been moved.
          </p>
        </div>

        <SearchBar />

        <div className="flex w-full flex-col items-center justify-center gap-3 md:flex-row">
          <GhostButton
            className="w-full justify-center gap-2 md:w-auto"
            onClick={() => window.history.back()}
          >
            <IconArrowLeft />
            Go back
          </GhostButton>
          <PrimaryButton
            className="w-full justify-center md:w-auto"
            onClick={() => {
              window.location.href = '/'
            }}
          >
            Go Home
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}

function SearchBar() {
  const [query, setQuery] = useState('')

  const handleSearch = () => {
    if (query.trim()) {
      window.location.href = `/#${encodeURIComponent(query.trim())}`
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div className="flex w-full flex-col items-center justify-center gap-4 md:flex-row">
      <div className="relative w-full md:w-72">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
          <IconSearch />
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search our site"
          className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-text placeholder:text-muted outline-none transition focus:border-accent/50 focus:ring-1 focus:ring-accent/30"
        />
      </div>
      <GhostButton
        className="w-full justify-center md:w-auto"
        onClick={handleSearch}
      >
        Search
      </GhostButton>
    </div>
  )
}
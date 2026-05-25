import { useState, useRef, useMemo } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { cn } from '../lib/utils'
import { useAuth } from '../auth/AuthContext'
import type { UserRole } from '../types/complaint'

function redirectFor(role: string) {
  return role === 'SUPERVISOR' ? '/app/supervisor' : '/app/queue'
}

const rolesConfig: { role: UserRole; label: string; email: string }[] = [
  { role: 'AGENT', label: 'Agent', email: 'agent@example.com' },
  { role: 'SUPERVISOR', label: 'Supervisor', email: 'supervisor@example.com' },
  { role: 'COMPLIANCE', label: 'Compliance', email: 'compliance@example.com' },
]

/* ── 3D Dot Matrix ── */

interface ShaderProps {
  source: string
  uniforms: Record<string, { value: number | number[] | number[][]; type: string }>
  maxFps?: number
}

const ShaderMaterialLayer = ({
  source,
  uniforms,
}: {
  source: string
  uniforms: Record<string, { value: number | number[] | number[][]; type: string }>
}) => {
  const { size } = useThree()
  const ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const material = ref.current.material as THREE.ShaderMaterial
    material.uniforms.u_time.value = clock.getElapsedTime()
  })

  const preparedUniforms = useMemo(() => {
    const prep: Record<string, THREE.IUniform> = {}
    for (const name in uniforms) {
      const u = uniforms[name]
      switch (u.type) {
        case 'uniform1f':
          prep[name] = { value: u.value as number }
          break
        case 'uniform1i':
          prep[name] = { value: u.value as number }
          break
        case 'uniform1fv':
          prep[name] = { value: u.value as number[] }
          break
        case 'uniform3fv':
          prep[name] = {
            value: (u.value as number[][]).map((v: number[]) => new THREE.Vector3(v[0], v[1], v[2])),
          }
          break
      }
    }
    prep['u_time'] = { value: 0 }
    prep['u_resolution'] = { value: new THREE.Vector2(size.width * 2, size.height * 2) }
    return prep
  }, [uniforms, size])

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        precision mediump float;
        in vec2 coordinates;
        uniform vec2 u_resolution;
        out vec2 fragCoord;
        void main(){
          float x = position.x;
          float y = position.y;
          gl_Position = vec4(x, y, 0.0, 1.0);
          fragCoord = (position.xy + vec2(1.0)) * 0.5 * u_resolution;
          fragCoord.y = u_resolution.y - fragCoord.y;
        }
      `,
      fragmentShader: source,
      uniforms: preparedUniforms,
      glslVersion: THREE.GLSL3,
      transparent: true,
      blending: THREE.CustomBlending,
      blendSrc: THREE.SrcAlphaFactor,
      blendDst: THREE.OneFactor,
      depthWrite: false,
    })
  }, [size.width, size.height, source])

  return (
    <mesh ref={ref}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

const Shader: React.FC<ShaderProps> = ({ source, uniforms }) => {
  return (
    <Canvas className="absolute inset-0 h-full w-full">
      <ShaderMaterialLayer source={source} uniforms={uniforms} />
    </Canvas>
  )
}

interface DotMatrixProps {
  colors?: number[][]
  opacities?: number[]
  totalSize?: number
  dotSize?: number
  reverse?: boolean
  center?: ('x' | 'y')[]
}

const DotMatrix: React.FC<DotMatrixProps> = ({
  colors = [[0, 0, 0]],
  opacities = [0.04, 0.04, 0.04, 0.04, 0.04, 0.08, 0.08, 0.08, 0.08, 0.14],
  totalSize = 20,
  dotSize = 2,
  reverse = false,
  center = ['x', 'y'],
}) => {
  const uniforms = useMemo(() => {
    let colorsArray = [colors[0], colors[0], colors[0], colors[0], colors[0], colors[0]]
    if (colors.length === 2) {
      colorsArray = [colors[0], colors[0], colors[0], colors[1], colors[1], colors[1]]
    } else if (colors.length === 3) {
      colorsArray = [colors[0], colors[0], colors[1], colors[1], colors[2], colors[2]]
    }
    return {
      u_colors: {
        value: colorsArray.map((c) => [c[0] / 255, c[1] / 255, c[2] / 255]),
        type: 'uniform3fv',
      },
      u_opacities: { value: opacities, type: 'uniform1fv' },
      u_total_size: { value: totalSize, type: 'uniform1f' },
      u_dot_size: { value: dotSize, type: 'uniform1f' },
      u_reverse: { value: reverse ? 1 : 0, type: 'uniform1i' },
    }
  }, [colors, opacities, totalSize, dotSize, reverse])

  return (
    <Shader
      source={`
        precision mediump float;
        in vec2 fragCoord;

        uniform float u_time;
        uniform float u_opacities[10];
        uniform vec3 u_colors[6];
        uniform float u_total_size;
        uniform float u_dot_size;
        uniform vec2 u_resolution;
        uniform int u_reverse;

        out vec4 fragColor;

        float PHI = 1.61803398874989484820459;
        float random(vec2 xy) {
            return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x);
        }
        float map(float value, float min1, float max1, float min2, float max2) {
            return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
        }

        void main() {
            vec2 st = fragCoord.xy;
            ${center.includes('x') ? 'st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));' : ''}
            ${center.includes('y') ? 'st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));' : ''}

            float opacity = step(0.0, st.x);
            opacity *= step(0.0, st.y);

            vec2 st2 = vec2(int(st.x / u_total_size), int(st.y / u_total_size));

            float frequency = 5.0;
            float show_offset = random(st2);
            float rand = random(st2 * floor((u_time / frequency) + show_offset + frequency));
            opacity *= u_opacities[int(rand * 10.0)];
            opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
            opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));

            vec3 color = u_colors[int(show_offset * 6.0)];

            float animation_speed_factor = 0.5;
            vec2 center_grid = u_resolution / 2.0 / u_total_size;
            float dist_from_center = distance(center_grid, st2);

            float timing_offset_intro = dist_from_center * 0.01 + (random(st2) * 0.15);
            float max_grid_dist = distance(center_grid, vec2(0.0, 0.0));
            float timing_offset_outro = (max_grid_dist - dist_from_center) * 0.02 + (random(st2 + 42.0) * 0.2);

            float current_timing_offset;
            if (u_reverse == 1) {
                current_timing_offset = timing_offset_outro;
                opacity *= 1.0 - step(current_timing_offset, u_time * animation_speed_factor);
            } else {
                current_timing_offset = timing_offset_intro;
                opacity *= step(current_timing_offset, u_time * animation_speed_factor);
                opacity *= clamp((1.0 - step(current_timing_offset + 0.1, u_time * animation_speed_factor)) * 1.25, 1.0, 1.25);
            }

            fragColor = vec4(color, opacity);
            fragColor.rgb *= fragColor.a;
        }`}
      uniforms={uniforms}
    />
  )
}

function CanvasRevealEffect({
  containerClassName,
  reverse = false,
}: {
  containerClassName?: string
  reverse?: boolean
}) {
  return (
    <div className={cn('relative h-full w-full', containerClassName)}>
      <DotMatrix
        colors={[[255, 255, 255], [255, 255, 255]]}
        dotSize={6}
        opacities={[0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1]}
        reverse={reverse}
        center={['x', 'y']}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
    </div>
  )
}

/* ── Mini Navbar ── */

function MiniNavbar() {
  return (
    <header className="fixed top-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-8 rounded-full border border-border bg-surface/60 px-6 py-3 backdrop-blur-sm">
      <Link to="/landing" className="flex items-center gap-2 text-text transition-opacity hover:opacity-80">
        <div className="relative flex h-5 w-5 items-center justify-center">
          <span className="absolute top-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-accent/80" />
          <span className="absolute top-1/2 left-0 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-accent/80" />
          <span className="absolute top-1/2 right-0 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-accent/80" />
          <span className="absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-accent/80" />
        </div>
        <span className="text-sm font-medium">UCCD</span>
      </Link>
      <a href="mailto:support@omniresol.tech" className="text-sm text-muted transition-colors hover:text-text">Support</a>
      <a href="https://omniresol.tech/docs" target="_blank" rel="noopener noreferrer" className="text-sm text-muted transition-colors hover:text-text">Docs</a>
      <Link to="/landing" className="text-sm text-muted transition-colors hover:text-text">About</Link>
    </header>
  )
}

/* ── Sign In Page ── */

export function SignInPage() {
  const { login, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [selectedRole, setSelectedRole] = useState<UserRole>('AGENT')
  const [email, setEmail] = useState('agent@example.com')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [initialCanvasVisible, setInitialCanvasVisible] = useState(true)
  const [reverseCanvasVisible, setReverseCanvasVisible] = useState(false)
  const [step, setStep] = useState<'login' | 'success'>('login')

  if (isAuthenticated && user) {
    return <Navigate to={redirectFor(user.role)} replace />
  }

  const handleRoleSelect = (role: UserRole, presetEmail: string) => {
    setSelectedRole(role)
    setEmail(presetEmail)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      const loggedIn = await login({ email, password })
      setReverseCanvasVisible(true)
      setTimeout(() => setInitialCanvasVisible(false), 50)
      setTimeout(() => {
        setStep('success')
        setTimeout(() => {
          const target = (location.state as { from?: string } | null)?.from ?? redirectFor(loggedIn.role)
          navigate(target, { replace: true })
        }, 1200)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-black">
      <div className="absolute inset-0 z-0">
        {initialCanvasVisible && (
          <div className="absolute inset-0">
            <CanvasRevealEffect containerClassName="bg-black" reverse={false} />
          </div>
        )}
        {reverseCanvasVisible && (
          <div className="absolute inset-0">
            <CanvasRevealEffect containerClassName="bg-black" reverse />
          </div>
        )}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,1)_0%,_transparent_100%)]" />
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-black to-transparent" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col">
        <MiniNavbar />

        <div className="flex flex-1 flex-col items-center justify-center lg:flex-row">
          <div className="mt-[120px] w-full max-w-sm px-6">
            <AnimatePresence mode="wait">
              {step === 'login' ? (
                <motion.div
                  key="login-step"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8 text-center"
                >
                  <div className="space-y-4">
                    <h1 className="font-display text-4xl font-bold tracking-tight text-text sm:text-5xl">
                      Sign in to UCCD
                    </h1>
                    <p className="text-base text-muted">Select your role to get started</p>
                  </div>

                  <div className="inline-flex rounded-lg border border-border bg-surface/60 p-1">
                    {rolesConfig.map(({ role, label, email: presetEmail }) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => handleRoleSelect(role, presetEmail)}
                        className={cn(
                          'rounded-md px-5 py-2 text-sm font-medium transition-all',
                          selectedRole === role
                            ? 'bg-accent text-black shadow-sm'
                            : 'text-muted hover:text-text',
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      className="h-12 w-full rounded-lg border border-border bg-surface/60 px-4 text-sm text-text outline-none backdrop-blur-sm transition focus:border-accent/50 focus:ring-1 focus:ring-accent/30"
                      required
                    />

                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="h-12 w-full rounded-lg border border-border bg-surface/60 px-4 pr-12 text-sm text-text outline-none backdrop-blur-sm transition focus:border-accent/50 focus:ring-1 focus:ring-accent/30"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-0 top-0 flex h-12 w-12 items-center justify-center text-muted transition-colors hover:text-text"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>

                    {error && (
                      <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="uccd-glow mt-2 h-12 w-full rounded-full bg-accent px-4 text-sm font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting ? 'Signing in...' : `Sign in as ${rolesConfig.find((r) => r.role === selectedRole)?.label}`}
                    </button>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="success-step"
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="space-y-6 text-center"
                >
                  <div className="space-y-1">
                    <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-text">
                      Welcome back
                    </h1>
                    <p className="text-lg text-muted">
                      Redirecting as <span className="font-semibold text-accent">{rolesConfig.find((r) => r.role === selectedRole)?.label}</span>
                    </p>
                  </div>

                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="py-8"
                  >
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                      <svg className="h-8 w-8 text-black" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
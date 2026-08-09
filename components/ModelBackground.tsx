import { useEffect, useRef, memo } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import {
  getCanvasDpr,
  isDocumentHidden,
  shouldSkipFrame,
  subscribeScrollActivity,
  targetFpsForRuntime,
} from '@/lib/canvas-perf'

/**
 * ModelBackground — renders a .glb/.gltf 3D model as a full-screen page background.
 * Uses vanilla Three.js with a WebGLRenderer in a fixed canvas layer.
 * Frame-budgeted; pauses when tab is hidden; DPR-capped in perfMode.
 */
const ModelBackground = memo(function ModelBackground({
  modelUrl,
  autoRotate = true,
  rotateSpeed = 0.003,
  opacity = 1,
  perfMode = false,
}: {
  modelUrl: string
  autoRotate?: boolean
  rotateSpeed?: number
  opacity?: number
  /** Cap DPR + FPS; thinner GPU load for mobile / stacked media. */
  perfMode?: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = getCanvasDpr(perfMode, 1.25)

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !perfMode,
      alpha: true,
      powerPreference: perfMode ? 'low-power' : 'default',
    })
    renderer.setPixelRatio(dpr)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 0)

    // Scene & camera
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(0, 1.5, 5)

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)
    const directionalLight = new THREE.DirectionalLight(0xaabbff, 1.2)
    directionalLight.position.set(5, 10, 7)
    scene.add(directionalLight)
    const rimLight = new THREE.DirectionalLight(0x3344aa, 0.6)
    rimLight.position.set(-5, -2, -5)
    scene.add(rimLight)

    // Load model
    let model: THREE.Group | null = null
    const loader = new GLTFLoader()
    loader.load(
      modelUrl,
      (gltf) => {
        model = gltf.scene
        // Center & scale model to fit in view
        const box = new THREE.Box3().setFromObject(model)
        const size = box.getSize(new THREE.Vector3())
        const center = box.getCenter(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = 3 / maxDim
        model.scale.setScalar(scale)
        model.position.sub(center.multiplyScalar(scale))
        scene.add(model)
      },
      undefined,
      (err) => {
        console.warn('[ModelBackground] Failed to load 3D model:', err)
      },
    )

    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    // Animation loop
    let animFrame = 0
    let lastDraw = 0
    let isScrolling = false
    let running = true
    const prefersReduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const unsubScroll = subscribeScrollActivity((s) => {
      isScrolling = s
    }, 220)

    const animate = (now: number) => {
      if (!running) return
      animFrame = requestAnimationFrame(animate)

      if (isDocumentHidden()) return
      const fps = targetFpsForRuntime(perfMode, isScrolling)
      if (fps <= 0 || shouldSkipFrame(lastDraw, now, fps)) return
      lastDraw = now

      if (model && autoRotate && !prefersReduced) {
        // Slightly slower spin while scrolling / in perfMode
        const spin = rotateSpeed * (isScrolling || perfMode ? 0.55 : 1)
        model.rotation.y += spin
      }
      renderer.render(scene, camera)
    }
    animFrame = requestAnimationFrame(animate)

    return () => {
      running = false
      cancelAnimationFrame(animFrame)
      window.removeEventListener('resize', handleResize)
      unsubScroll()
      // Dispose all scene objects to free GPU memory (geometries, materials, textures)
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose()
          if (Array.isArray(obj.material)) {
            obj.material.forEach((mat) => {
              Object.values(mat).forEach((v) => {
                if (v instanceof THREE.Texture) v.dispose()
              })
              mat.dispose()
            })
          } else if (obj.material) {
            Object.values(obj.material).forEach((v) => {
              if (v instanceof THREE.Texture) v.dispose()
            })
            obj.material.dispose()
          }
        }
      })
      renderer.dispose()
    }
  }, [modelUrl, autoRotate, rotateSpeed, perfMode])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0, opacity }}
      aria-hidden="true"
    />
  )
})

export default ModelBackground

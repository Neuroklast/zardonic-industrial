import { useEffect, useRef, memo } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

/**
 * ModelBackground — renders a .glb/.gltf 3D model as a full-screen page background.
 * Uses vanilla Three.js with a WebGLRenderer in a fixed canvas layer.
 * The model auto-rotates (optionally) and the scene is darkened to act as background.
 */
const ModelBackground = memo(function ModelBackground({
  modelUrl,
  autoRotate = true,
  rotateSpeed = 0.003,
  opacity = 1,
}: {
  modelUrl: string
  autoRotate?: boolean
  rotateSpeed?: number
  opacity?: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
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
        // Centre & scale model to fit in view
        const box = new THREE.Box3().setFromObject(model)
        const size = box.getSize(new THREE.Vector3())
        const centre = box.getCenter(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = 3 / maxDim
        model.scale.setScalar(scale)
        model.position.sub(centre.multiplyScalar(scale))
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
    let animFrame: number
    const prefersReduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const animate = () => {
      if (model && autoRotate && !prefersReduced) {
        model.rotation.y += rotateSpeed
      }
      renderer.render(scene, camera)
      animFrame = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(animFrame)
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
    }
  }, [modelUrl, autoRotate, rotateSpeed])

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

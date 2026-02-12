import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import modelFile from '@/assets/documents/Model_Compressed.glb'

interface LoadingScreenProps {
  onLoadComplete: () => void
}

export function LoadingScreen({ onLoadComplete }: LoadingScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loadingProgress, setLoadingProgress] = useState(0)

  useEffect(() => {
    if (!canvasRef.current) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
    })

    renderer.setSize(500, 500)
    renderer.setPixelRatio(window.devicePixelRatio)

    camera.position.z = 5

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight1 = new THREE.DirectionalLight(0xff6464, 1.5)
    directionalLight1.position.set(5, 5, 5)
    scene.add(directionalLight1)

    const directionalLight2 = new THREE.DirectionalLight(0x64ffff, 1.0)
    directionalLight2.position.set(-5, -5, 5)
    scene.add(directionalLight2)

    const pointLight = new THREE.PointLight(0xffffff, 1.0)
    pointLight.position.set(0, 0, 3)
    scene.add(pointLight)

    let model: THREE.Object3D | null = null
    let animationFrameId: number

    const loader = new GLTFLoader()
    loader.load(
      modelFile,
      (gltf) => {
        model = gltf.scene
        
        const box = new THREE.Box3().setFromObject(model)
        const center = box.getCenter(new THREE.Vector3())
        model.position.sub(center)
        
        const size = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = 3 / maxDim
        model.scale.setScalar(scale)
        
        scene.add(model)
        setLoadingProgress(100)

        setTimeout(() => {
          onLoadComplete()
        }, 2000)
      },
      (progress) => {
        const percent = (progress.loaded / progress.total) * 100
        setLoadingProgress(percent)
      },
      (error) => {
        console.error('Error loading model:', error)
        setTimeout(() => {
          onLoadComplete()
        }, 1000)
      }
    )

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      if (model) {
        model.rotation.y += 0.01
        model.rotation.x = Math.sin(Date.now() * 0.001) * 0.1
      }

      renderer.render(scene, camera)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationFrameId)
      renderer.dispose()
    }
  }, [onLoadComplete])

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[9999] bg-background flex items-center justify-center"
    >
      <div className="full-page-noise" />
      <div className="scanline-effect absolute inset-0" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex flex-col items-center"
      >
        <canvas
          ref={canvasRef}
          className="w-[500px] h-[500px] max-w-full"
        />
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-primary font-mono text-sm uppercase tracking-widest animate-pulse mb-2">
            // INITIALIZING SYSTEM...
          </p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-48 h-1 bg-border/30 relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-primary"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: loadingProgress / 100 }}
                style={{ transformOrigin: 'left' }}
                transition={{ duration: 0.2 }}
              />
            </div>
            <span className="text-primary font-mono text-xs min-w-[3ch]">
              {Math.floor(loadingProgress)}%
            </span>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

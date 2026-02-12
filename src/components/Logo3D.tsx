import { useRef, Suspense, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, PerspectiveCamera, Center } from '@react-three/drei'
import { Group } from 'three'
import { useScroll } from 'framer-motion'

function FallbackLogo({ scrollYProgress }: { scrollYProgress: any }) {
  const groupRef = useRef<Group>(null)

  useFrame(() => {
    if (groupRef.current) {
      const scrollValue = scrollYProgress.get()
      groupRef.current.rotation.y = scrollValue * Math.PI * 0.3
      groupRef.current.position.y = -scrollValue * 1.5
    }
  })

  return (
    <group ref={groupRef}>
      <Center>
        <mesh>
          <boxGeometry args={[5, 1.2, 0.4]} />
          <meshStandardMaterial 
            color="#b43232" 
            metalness={0.8} 
            roughness={0.2}
            emissive="#b43232"
            emissiveIntensity={0.3}
          />
        </mesh>
        <mesh position={[0, 0, 0.25]}>
          <planeGeometry args={[4.8, 1]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
      </Center>
    </group>
  )
}

function GLBModel({ scrollYProgress }: { scrollYProgress: any }) {
  const groupRef = useRef<Group>(null)
  const gltf = useGLTF('/src/assets/models/zardonictext.glb')

  useFrame(() => {
    if (groupRef.current) {
      const scrollValue = scrollYProgress.get()
      groupRef.current.rotation.y = scrollValue * Math.PI * 0.3
      groupRef.current.position.y = -scrollValue * 1.5
    }
  })

  return (
    <group ref={groupRef}>
      <primitive object={gltf.scene} scale={2} />
    </group>
  )
}

function ZardonicModel({ scrollYProgress }: { scrollYProgress: any }) {
  const [useGLB, setUseGLB] = useState(true)

  return (
    <Suspense fallback={<FallbackLogo scrollYProgress={scrollYProgress} />}>
      {useGLB ? (
        <GLBModel scrollYProgress={scrollYProgress} />
      ) : (
        <FallbackLogo scrollYProgress={scrollYProgress} />
      )}
    </Suspense>
  )
}

function Scene() {
  const { scrollYProgress } = useScroll()

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} color="#b43232" />
      <directionalLight position={[-10, -10, -5]} intensity={0.8} color="#64ffff" />
      <pointLight position={[0, 0, 5]} intensity={1} color="#b43232" />
      <spotLight 
        position={[0, 5, 5]} 
        intensity={1.5} 
        angle={0.5} 
        penumbra={1} 
        color="#b43232"
        castShadow
      />
      <ZardonicModel scrollYProgress={scrollYProgress} />
    </>
  )
}

export function Logo3D() {
  return (
    <div className="w-full h-[350px] md:h-[450px] relative">
      <Canvas gl={{ antialias: true, alpha: true }}>
        <Scene />
      </Canvas>
    </div>
  )
}


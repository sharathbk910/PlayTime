import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, Text } from '@react-three/drei';
import * as THREE from 'three';

import { TRACK_LANES } from '../utils/constants';

// 3D Model: Mooshak the Divine Celestial Vahana
function MooshakPlayer({
  x,
  y,
  z,
  isJumping,
  isSliding,
  isInvulnerable,
  isFouled
}) {
  const groupRef = useRef();
  const bodyRef = useRef();
  const tailRef = useRef();
  const earsRef = useRef();

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Smooth lateral lerp to target X lane
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, x, delta * 16);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, y, delta * 20);
    groupRef.current.position.z = z;

    const time = state.clock.elapsedTime;

    // Running trot bobbing when grounded
    if (!isJumping && !isSliding && !isFouled) {
      if (bodyRef.current) {
        bodyRef.current.position.y = 0.35 + Math.sin(time * 20) * 0.05;
        bodyRef.current.rotation.x = Math.sin(time * 20) * 0.06;
      }
      if (tailRef.current) {
        tailRef.current.rotation.z = Math.sin(time * 16) * 0.35;
        tailRef.current.rotation.y = Math.cos(time * 16) * 0.25;
      }
      if (earsRef.current) {
        earsRef.current.rotation.x = Math.sin(time * 20) * 0.1;
      }
    } else if (isJumping) {
      // Jump pose: body tilts up slightly, tail curls down
      if (bodyRef.current) {
        bodyRef.current.rotation.x = -0.28;
      }
      if (tailRef.current) {
        tailRef.current.rotation.x = -0.5;
      }
    } else if (isSliding) {
      // Slide pose: squash flat and lengthen
      if (bodyRef.current) {
        bodyRef.current.position.y = 0.15;
        bodyRef.current.scale.set(1.25, 0.45, 1.35);
        bodyRef.current.rotation.x = 0.05;
      }
    }

    if (!isSliding && bodyRef.current) {
      bodyRef.current.scale.set(1, 1, 1);
    }
  });

  return (
    <group ref={groupRef} position={[x, y, z]}>
      
      {/* Invulnerability Divine Aura Shield */}
      {isInvulnerable && (
        <mesh position={[0, 0.45, 0]}>
          <sphereGeometry args={[1.05, 24, 24]} />
          <meshStandardMaterial
            color="#FFD700"
            emissive="#FFA000"
            emissiveIntensity={1.4}
            transparent
            opacity={0.45}
            wireframe
          />
        </mesh>
      )}

      {/* Main Mooshak Body Assembly */}
      <group ref={bodyRef} position={[0, 0.35, 0]}>
        
        {/* Plump Mouse Torso */}
        <mesh position={[0, 0, 0]} castShadow>
          <sphereGeometry args={[0.42, 20, 20]} />
          <meshStandardMaterial color="#A97142" roughness={0.6} />
        </mesh>

        {/* Snout & Head (Facing forward towards +Z) */}
        <mesh position={[0, 0.12, 0.38]} castShadow>
          <coneGeometry args={[0.26, 0.45, 16]} />
          <meshStandardMaterial color="#B07D4F" roughness={0.6} />
        </mesh>

        {/* Little Pink Nose */}
        <mesh position={[0, 0.12, 0.62]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial color="#FF80AB" roughness={0.3} />
        </mesh>

        {/* Big Rounded Mouse Ears */}
        <group ref={earsRef} position={[0, 0.32, 0.2]}>
          {/* Left Ear */}
          <mesh position={[-0.26, 0.1, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.03, 16]} />
            <meshStandardMaterial color="#A97142" />
          </mesh>
          <mesh position={[-0.26, 0.1, 0.02]}>
            <cylinderGeometry args={[0.13, 0.13, 0.03, 16]} />
            <meshStandardMaterial color="#FF80AB" />
          </mesh>

          {/* Right Ear */}
          <mesh position={[0.26, 0.1, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.03, 16]} />
            <meshStandardMaterial color="#A97142" />
          </mesh>
          <mesh position={[0.26, 0.1, 0.02]}>
            <cylinderGeometry args={[0.13, 0.13, 0.03, 16]} />
            <meshStandardMaterial color="#FF80AB" />
          </mesh>
        </group>

        {/* Golden Mukut (Divine Crown) */}
        <mesh position={[0, 0.42, 0.18]}>
          <coneGeometry args={[0.16, 0.28, 12]} />
          <meshStandardMaterial
            color="#FFD700"
            emissive="#FFA000"
            emissiveIntensity={0.8}
            metalness={0.9}
            roughness={0.2}
          />
        </mesh>

        {/* Royal Saffron & Gold Saddle */}
        <mesh position={[0, 0.28, -0.05]}>
          <boxGeometry args={[0.5, 0.1, 0.42]} />
          <meshStandardMaterial
            color="#FF7722"
            emissive="#E65100"
            emissiveIntensity={0.5}
            roughness={0.4}
          />
        </mesh>

        {/* Tail */}
        <group ref={tailRef} position={[0, 0.12, -0.42]}>
          <mesh position={[0, 0.15, -0.28]} rotation={[0.4, 0, 0]}>
            <cylinderGeometry args={[0.04, 0.02, 0.65, 8]} />
            <meshStandardMaterial color="#D4A373" />
          </mesh>
        </group>

        {/* Stardust Aura Jet underneath */}
        <mesh position={[0, -0.25, -0.2]}>
          <coneGeometry args={[0.2, 0.35, 8]} />
          <meshBasicMaterial color="#FFA000" transparent opacity={0.65} />
        </mesh>

      </group>

      {/* Floating overhead tag */}
      <Text
        position={[0, 1.45, 0]}
        fontSize={0.26}
        color="#FFF8E1"
        anchorX="center"
        anchorY="middle"
      >
        Mooshak (You)
      </Text>
    </group>
  );
}

// 3D Model: Collectible Golden Modak
function ModakItem({ x, y = 0.5, z, collected }) {
  const modakRef = useRef();

  useFrame((state, delta) => {
    if (modakRef.current && !collected) {
      modakRef.current.rotation.y += delta * 2.8;
      modakRef.current.position.y = y + Math.sin(state.clock.elapsedTime * 4 + z) * 0.12;
    }
  });

  if (collected) return null;

  return (
    <group position={[x, y, z]} ref={modakRef}>
      {/* Golden Modak Cone Top */}
      <mesh position={[0, 0.22, 0]}>
        <coneGeometry args={[0.24, 0.38, 14]} />
        <meshStandardMaterial
          color="#FFE082"
          emissive="#FFB300"
          emissiveIntensity={0.9}
          metalness={0.4}
          roughness={0.3}
        />
      </mesh>

      {/* Golden Modak Base Sphere */}
      <mesh position={[0, 0.03, 0]}>
        <sphereGeometry args={[0.27, 16, 16]} />
        <meshStandardMaterial
          color="#FFD54F"
          emissive="#FF8F00"
          emissiveIntensity={0.7}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>

      {/* Golden Aura Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.32, 0.42, 16]} />
        <meshBasicMaterial color="#FFD700" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// 3D Obstacle: Rolling Pillar / Log (Low: JUMP OVER)
function RollingPillarObstacle({ x, z }) {
  const rollerRef = useRef();

  useFrame((state, delta) => {
    if (rollerRef.current) {
      rollerRef.current.rotation.x -= delta * 5; // Rolling towards player
    }
  });

  return (
    <group position={[x, 0.4, z]}>
      {/* Stone / Bronze Cylinder */}
      <mesh ref={rollerRef} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.38, 0.38, 2.1, 20]} />
        <meshStandardMaterial color="#8D6E63" metalness={0.5} roughness={0.5} />
      </mesh>

      {/* Golden Hazard Spikes / Bands */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.42, 0.42, 0.2, 16]} />
        <meshStandardMaterial color="#FF9933" emissive="#FF5722" emissiveIntensity={0.8} />
      </mesh>

      {/* Warning Diya Lights at edges */}
      <mesh position={[-1.1, 0, 0]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshBasicMaterial color="#FF3D00" />
      </mesh>
      <mesh position={[1.1, 0, 0]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshBasicMaterial color="#FF3D00" />
      </mesh>
    </group>
  );
}

// 3D Obstacle: Sacred Fire Pit (Low: JUMP OVER)
function FirePitObstacle({ x, z }) {
  const flameRef = useRef();

  useFrame((state) => {
    if (flameRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 10 + z) * 0.15;
      flameRef.current.scale.set(s, s * 1.2, s);
    }
  });

  return (
    <group position={[x, 0.05, z]}>
      {/* Lava Rift Base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.9, 1.8]} />
        <meshStandardMaterial color="#210505" roughness={0.9} />
      </mesh>

      {/* Glowing Inner Magma */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[1.6, 1.4]} />
        <meshBasicMaterial color="#FF3D00" />
      </mesh>

      {/* Flickering Fire Core */}
      <group ref={flameRef} position={[0, 0.4, 0]}>
        <mesh>
          <coneGeometry args={[0.5, 0.8, 8]} />
          <meshStandardMaterial
            color="#FF9100"
            emissive="#FF3D00"
            emissiveIntensity={1.4}
            transparent
            opacity={0.85}
          />
        </mesh>
      </group>
    </group>
  );
}

// 3D Obstacle: High Floating Demon Torana / Arch (High: SLIDE UNDER)
function FloatingArchObstacle({ x, z }) {
  const bladeRef = useRef();

  useFrame((state) => {
    if (bladeRef.current) {
      bladeRef.current.position.y = 1.6 + Math.sin(state.clock.elapsedTime * 4) * 0.12;
    }
  });

  return (
    <group position={[x, 0, z]}>
      {/* Left Pillar */}
      <mesh position={[-1.1, 1.4, 0]}>
        <cylinderGeometry args={[0.15, 0.18, 2.8, 12]} />
        <meshStandardMaterial color="#311B92" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Right Pillar */}
      <mesh position={[1.1, 1.4, 0]}>
        <cylinderGeometry args={[0.15, 0.18, 2.8, 12]} />
        <meshStandardMaterial color="#311B92" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* High Torana Crossbar */}
      <mesh position={[0, 2.5, 0]}>
        <boxGeometry args={[2.5, 0.35, 0.4]} />
        <meshStandardMaterial color="#D50000" emissive="#FF1744" emissiveIntensity={0.6} />
      </mesh>

      {/* Floating Demonic Pendulum at Head Height */}
      <group ref={bladeRef}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.8, 0.45, 0.25]} />
          <meshStandardMaterial
            color="#D50000"
            emissive="#FF1744"
            emissiveIntensity={1.0}
            metalness={0.8}
          />
        </mesh>
        <Text
          position={[0, 0, 0.16]}
          fontSize={0.2}
          color="#FFE082"
          anchorX="center"
          anchorY="middle"
        >
          SLIDE!
        </Text>
      </group>
    </group>
  );
}

// 3D Obstacle: Stationary Asura Demon Spirit (Full Lane: SWITCH LANES)
function DemonGuardianObstacle({ x, z }) {
  const demonRef = useRef();

  useFrame((state, delta) => {
    if (demonRef.current) {
      demonRef.current.position.y = 1.0 + Math.sin(state.clock.elapsedTime * 3 + z) * 0.18;
      demonRef.current.rotation.y += delta * 1.5;
    }
  });

  return (
    <group position={[x, 0, z]}>
      <group ref={demonRef}>
        {/* Demonic Spirit Core */}
        <mesh position={[0, 0, 0]}>
          <octahedronGeometry args={[0.65, 1]} />
          <meshStandardMaterial
            color="#4A148C"
            emissive="#880E4F"
            emissiveIntensity={1.2}
            roughness={0.3}
          />
        </mesh>

        {/* Demonic Horns */}
        <mesh position={[-0.35, 0.5, 0]} rotation={[0, 0, 0.4]}>
          <coneGeometry args={[0.12, 0.4, 8]} />
          <meshStandardMaterial color="#B71C1C" emissive="#FF1744" emissiveIntensity={0.8} />
        </mesh>
        <mesh position={[0.35, 0.5, 0]} rotation={[0, 0, -0.4]}>
          <coneGeometry args={[0.12, 0.4, 8]} />
          <meshStandardMaterial color="#B71C1C" emissive="#FF1744" emissiveIntensity={0.8} />
        </mesh>

        {/* Glowing Evil Eyes */}
        <mesh position={[-0.18, 0.1, 0.48]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshBasicMaterial color="#FFD600" />
        </mesh>
        <mesh position={[0.18, 0.1, 0.48]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshBasicMaterial color="#FFD600" />
        </mesh>
      </group>
    </group>
  );
}

// Multiplayer Concurrent Ghost Runner
function MultiplayerGhost({ ghost, playerZ }) {
  const ghostRef = useRef();

  useFrame((state, delta) => {
    if (!ghostRef.current) return;
    if (typeof ghost.targetX === 'number') {
      ghostRef.current.position.x = THREE.MathUtils.lerp(
        ghostRef.current.position.x,
        ghost.targetX,
        delta * 10
      );
    }
    ghostRef.current.position.y = 0.35;
    ghostRef.current.position.z = ghost.z;
  });

  if (Math.abs(ghost.z - playerZ) > 90) return null;

  return (
    <group ref={ghostRef} position={[ghost.x || 0, 0.35, ghost.z || 0]}>
      {/* Translucent Glowing Holographic Avatar */}
      <mesh>
        <sphereGeometry args={[0.42, 16, 16]} />
        <meshStandardMaterial
          color={ghost.color || '#00E5FF'}
          emissive={ghost.color || '#00E5FF'}
          emissiveIntensity={1.4}
          transparent
          opacity={0.65}
          wireframe
        />
      </mesh>

      {/* Aura Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.65, 16]} />
        <meshBasicMaterial
          color={ghost.color || '#00E5FF'}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Ghost Tag */}
      <Text
        position={[0, 1.15, 0]}
        fontSize={0.22}
        color="#E0F7FA"
        anchorX="center"
        anchorY="middle"
      >
        {ghost.username}
      </Text>
    </group>
  );
}

// Endless Runner Cosmic 3-Lane Track Tiles
function CosmicTrackSegment({ startZ, length = 160 }) {
  return (
    <group position={[0, 0, startZ + length / 2]}>
      {/* Main Track Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[8.4, length]} />
        <meshStandardMaterial
          color="#0F0926"
          roughness={0.7}
          metalness={0.3}
        />
      </mesh>

      {/* 3-Lane Separator Lines (Golden Inlays) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1.25, 0.01, 0]}>
        <planeGeometry args={[0.08, length]} />
        <meshBasicMaterial color="#FFB300" transparent opacity={0.65} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.25, 0.01, 0]}>
        <planeGeometry args={[0.08, length]} />
        <meshBasicMaterial color="#FFB300" transparent opacity={0.65} />
      </mesh>

      {/* Outer Track Glowing Borders */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4.1, 0.02, 0]}>
        <planeGeometry args={[0.2, length]} />
        <meshStandardMaterial color="#FF7722" emissive="#FF5722" emissiveIntensity={0.8} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4.1, 0.02, 0]}>
        <planeGeometry args={[0.2, length]} />
        <meshStandardMaterial color="#FF7722" emissive="#FF5722" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

// Side Decorative Temple Diyas & Floating Lotus Pillars
function SideTempleDecorations({ playerZ }) {
  const baseZ = Math.floor(playerZ / 25) * 25;
  const decorPositions = useMemo(() => {
    const list = [];
    for (let offset = -25; offset <= 120; offset += 20) {
      list.push(baseZ + offset);
    }
    return list;
  }, [baseZ]);

  return (
    <group>
      {decorPositions.map((z) => (
        <React.Fragment key={z}>
          {/* Left Diya Pillar */}
          <group position={[-5.2, 0, z]}>
            <mesh position={[0, 0.8, 0]}>
              <cylinderGeometry args={[0.25, 0.35, 1.6, 12]} />
              <meshStandardMaterial color="#2E1850" roughness={0.5} />
            </mesh>
            <mesh position={[0, 1.7, 0]}>
              <sphereGeometry args={[0.18, 12, 12]} />
              <meshStandardMaterial
                color="#FFD700"
                emissive="#FF9933"
                emissiveIntensity={1.5}
              />
            </mesh>
          </group>

          {/* Right Diya Pillar */}
          <group position={[5.2, 0, z]}>
            <mesh position={[0, 0.8, 0]}>
              <cylinderGeometry args={[0.25, 0.35, 1.6, 12]} />
              <meshStandardMaterial color="#2E1850" roughness={0.5} />
            </mesh>
            <mesh position={[0, 1.7, 0]}>
              <sphereGeometry args={[0.18, 12, 12]} />
              <meshStandardMaterial
                color="#FFD700"
                emissive="#FF9933"
                emissiveIntensity={1.5}
              />
            </mesh>
          </group>
        </React.Fragment>
      ))}
    </group>
  );
}

// Dynamic 3rd Person Follow Camera
function FollowCamera({ playerX, playerY, playerZ }) {
  useFrame((state, delta) => {
    const cam = state.camera;
    // Behind player on Z, slightly elevated on Y, following lane on X
    const targetCamX = playerX * 0.7;
    const targetCamY = playerY + 3.4;
    const targetCamZ = playerZ - 7.2;

    cam.position.x = THREE.MathUtils.lerp(cam.position.x, targetCamX, delta * 12);
    cam.position.y = THREE.MathUtils.lerp(cam.position.y, targetCamY, delta * 12);
    cam.position.z = THREE.MathUtils.lerp(cam.position.z, targetCamZ, delta * 20);

    // Look straight ahead of Mooshak
    cam.lookAt(playerX * 0.4, playerY + 1.2, playerZ + 8.5);
  });

  return null;
}

// Main Game Viewport Canvas Component
export default function GameViewport({
  playerX = 0,
  playerY = 0,
  playerZ = 0,
  isJumping = false,
  isSliding = false,
  isInvulnerable = false,
  isFouled = false,
  obstacles = [],
  modaks = [],
  ghosts = []
}) {
  return (
    <div className="w-full h-full relative cursor-default select-none">
      <Canvas
        camera={{ position: [0, 4, -7.5], fov: 58 }}
        shadows
        className="w-full h-full"
      >
        <color attach="background" args={['#070410']} />

        {/* Dynamic Follow Camera */}
        <FollowCamera playerX={playerX} playerY={playerY} playerZ={playerZ} />

        {/* Ambient & Thematic Lights */}
        <ambientLight intensity={0.65} />
        <pointLight position={[0, 8, playerZ + 4]} intensity={2.4} color="#FFE082" distance={30} />
        <directionalLight position={[10, 16, playerZ - 5]} intensity={1.2} color="#FF9933" />
        <directionalLight position={[-10, 12, playerZ + 15]} intensity={0.8} color="#7C4DFF" />

        {/* Cosmic Celestial Stars */}
        <Stars radius={120} depth={60} count={3200} factor={4} saturation={0.7} fade speed={1.2} />

        {/* Infinite Cosmic 3-Lane Track Tiles */}
        <CosmicTrackSegment startZ={playerZ - 20} length={150} />
        <SideTempleDecorations playerZ={playerZ} />

        {/* 3D Animated Mooshak Player */}
        <MooshakPlayer
          x={playerX}
          y={playerY}
          z={playerZ}
          isJumping={isJumping}
          isSliding={isSliding}
          isInvulnerable={isInvulnerable}
          isFouled={isFouled}
        />

        {/* Active Modaks along the track */}
        {modaks.map((m) => {
          if (Math.abs(m.z - playerZ) > 85) return null;
          return <ModakItem key={m.id} x={m.x} y={m.y || 0.5} z={m.z} collected={m.collected} />;
        })}

        {/* Active Obstacles along the track */}
        {obstacles.map((obs) => {
          if (Math.abs(obs.z - playerZ) > 90) return null;

          switch (obs.type) {
            case 'rolling_pillar':
              return <RollingPillarObstacle key={obs.id} x={obs.x} z={obs.z} />;
            case 'fire_pit':
              return <FirePitObstacle key={obs.id} x={obs.x} z={obs.z} />;
            case 'floating_arch':
              return <FloatingArchObstacle key={obs.id} x={obs.x} z={obs.z} />;
            case 'demon_guardian':
              return <DemonGuardianObstacle key={obs.id} x={obs.x} z={obs.z} />;
            default:
              return <RollingPillarObstacle key={obs.id} x={obs.x} z={obs.z} />;
          }
        })}

        {/* Live Multiplayer Concurrent Ghost Racers */}
        {ghosts.map((ghost) => (
          <MultiplayerGhost key={ghost.id} ghost={ghost} playerZ={playerZ} />
        ))}
      </Canvas>
    </div>
  );
}

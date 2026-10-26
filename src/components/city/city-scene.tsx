"use client";
import { useState, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, OrthographicCamera } from "@react-three/drei";
import type { DirectionalLight } from "three";
import { Ground } from "./ground";
import { FinanceDistrict } from "./district-finance";
import { FitnessDistrict } from "./district-fitness";
import { Decorations } from "./decorations";
import { StatsCard } from "./stats-card";
import type { CityData, SelectedBuilding } from "./city-types";

type Selection = {
  id: string;
  pos: [number, number, number];
  building: SelectedBuilding;
};

type Props = {
  data: CityData;
};

export function CityScene({ data }: Props) {
  const [selected, setSelected] = useState<Selection | null>(null);
  const lightRef = useRef<DirectionalLight>(null);

  useEffect(() => {
    if (!lightRef.current) return;
    lightRef.current.shadow.mapSize.width = 1024;
    lightRef.current.shadow.mapSize.height = 1024;
    lightRef.current.shadow.camera.near = 0.5;
    lightRef.current.shadow.camera.far = 60;
    lightRef.current.shadow.camera.left = -18;
    lightRef.current.shadow.camera.right = 18;
    lightRef.current.shadow.camera.top = 14;
    lightRef.current.shadow.camera.bottom = -14;
    lightRef.current.shadow.camera.updateProjectionMatrix();
  }, []);

  function handleSelect(id: string, pos: [number, number, number], building: SelectedBuilding) {
    setSelected((prev) => (prev?.id === id ? null : { id, pos, building }));
  }

  return (
    <div className="relative h-[540px] w-full overflow-hidden rounded-xl border bg-gradient-to-b from-sky-100 to-blue-50 dark:from-slate-800 dark:to-slate-900">
      <Canvas
        gl={{ antialias: true }}
        shadows
        onPointerMissed={() => setSelected(null)}
      >
        <OrthographicCamera
          makeDefault
          position={[12, 10, 12]}
          zoom={30}
          near={0.1}
          far={300}
        />

        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <hemisphereLight args={["#b0d0ff", "#c8e8c0", 0.6]} />
        <directionalLight
          ref={lightRef}
          position={[8, 14, 8]}
          intensity={1.0}
          castShadow
        />

        <Ground />
        <FinanceDistrict
          data={data.finance}
          selectedId={selected?.id ?? null}
          onSelect={handleSelect}
        />
        <FitnessDistrict
          selectedId={selected?.id ?? null}
          onSelect={handleSelect}
        />
        <Decorations />

        {selected && (
          <StatsCard
            pos={selected.pos}
            building={selected.building}
            onClose={() => setSelected(null)}
          />
        )}

        <OrbitControls
          enablePan={false}
          minPolarAngle={Math.PI / 7}
          maxPolarAngle={Math.PI / 2.3}
          minZoom={18}
          maxZoom={90}
          enableDamping
          dampingFactor={0.06}
        />
      </Canvas>

      {/* Hint */}
      <p className="pointer-events-none absolute bottom-3 right-3 text-xs text-muted-foreground/60">
        Drag to rotate · scroll to zoom
      </p>
    </div>
  );
}

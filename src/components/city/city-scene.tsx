"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, OrthographicCamera } from "@react-three/drei";
import { useRouter } from "next/navigation";
import { Ground } from "./ground";
import { FinanceDistrict } from "./district-finance";
import { FitnessDistrict } from "./district-fitness";
import { Decorations } from "./decorations";
import type { CityData } from "./city-types";

type Props = {
  data: CityData;
};

export function CityScene({ data }: Props) {
  const router = useRouter();

  function navigate(href: string) {
    router.push(href);
  }

  return (
    <div className="relative h-[520px] w-full overflow-hidden rounded-xl border bg-gradient-to-b from-sky-100 to-blue-50 dark:from-slate-800 dark:to-slate-900">
      <Canvas gl={{ antialias: true }} shadows>
        <OrthographicCamera
          makeDefault
          position={[12, 10, 12]}
          zoom={34}
          near={0.1}
          far={300}
        />
        <ambientLight intensity={0.75} />
        <directionalLight
          position={[8, 14, 8]}
          intensity={1.0}
          castShadow
        />
        <Ground />
        <FinanceDistrict data={data.finance} onNavigate={navigate} />
        <FitnessDistrict onNavigate={navigate} />
        <Decorations />
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

      {/* Legend overlay */}
      <div className="pointer-events-none absolute bottom-3 left-3 flex gap-2 flex-wrap">
        {[
          { color: "#5a9be8", label: "Income" },
          { color: "#7abde8", label: "Goals" },
          { color: "#b07ae0", label: "Budget" },
          { color: "#d0c8d0", label: "Subscriptions" },
          { color: "#c878b8", label: "Fitness" },
        ].map(({ color, label }) => (
          <div
            key={label}
            className="flex items-center gap-1.5 rounded-full border bg-card/80 px-2 py-0.5 text-xs backdrop-blur-sm"
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: color }}
            />
            {label}
          </div>
        ))}
      </div>

      {/* Hint */}
      <p className="pointer-events-none absolute bottom-3 right-3 text-xs text-muted-foreground/60">
        Drag to rotate · scroll to zoom
      </p>
    </div>
  );
}

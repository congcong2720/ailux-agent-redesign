import { useEffect, useMemo, useRef, useState } from "react";
import * as $3Dmol from "3dmol";

import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type Lang = "zh" | "en";
type PdbRenderMode = "cartoon" | "stick" | "sphere";

type PdbViewerProps = {
  lang: Lang;
  pdbText: string;
  fileName: string;
};

const labels = {
  zh: {
    displayMode: "显示模式",
    autoRotate: "自动旋转",
    caption: "基于当前输入 PDB 的三维结构预览，可用于演示结构结果卡片。",
    structureSource: "结构源文件",
    modes: {
      cartoon: "Cartoon",
      stick: "Stick",
      sphere: "Sphere",
    },
  },
  en: {
    displayMode: "Display mode",
    autoRotate: "Auto-rotate",
    caption: "Interactive 3D structure preview from the current input PDB for the structure result card demo.",
    structureSource: "Structure source file",
    modes: {
      cartoon: "Cartoon",
      stick: "Stick",
      sphere: "Sphere",
    },
  },
} as const;

function getStyle(mode: PdbRenderMode) {
  if (mode === "stick") {
    return { stick: { radius: 0.18, colorscheme: "cyanCarbon" } };
  }

  if (mode === "sphere") {
    return { sphere: { scale: 0.28, colorscheme: "cyanCarbon" } };
  }

  return { cartoon: { color: "spectrum" } };
}

export function PdbViewer({ lang, pdbText, fileName }: PdbViewerProps) {
  const text = labels[lang];
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<$3Dmol.GLViewer | null>(null);
  const loadedPdbRef = useRef<string | null>(null);
  const frameRef = useRef<number | null>(null);
  const [mode, setMode] = useState<PdbRenderMode>("cartoon");
  const [autoRotate, setAutoRotate] = useState(true);
  const viewerStyle = useMemo(() => getStyle(mode), [mode]);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!viewerRef.current) {
      viewerRef.current = $3Dmol.createViewer(containerRef.current, {
        backgroundColor: "#F8FAFF",
        antialias: true,
      });
    }

    const viewer = viewerRef.current;

    if (loadedPdbRef.current !== pdbText) {
      viewer.clear();
      viewer.addModel(pdbText, "pdb");
      viewer.zoomTo();
      loadedPdbRef.current = pdbText;
    }

    viewer.setStyle({}, {});
    viewer.setStyle({}, viewerStyle);
    viewer.render();

    const handleResize = () => viewer.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [pdbText, viewerStyle]);

  useEffect(() => {
    if (!viewerRef.current || !autoRotate) return;

    const viewer = viewerRef.current;

    const animate = () => {
      viewer.rotate(0.6, "y");
      viewer.render();
      frameRef.current = window.requestAnimationFrame(animate);
    };

    frameRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [autoRotate, mode]);

  return (
    <div className="isolate rounded-[18px] border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,255,0.98),rgba(255,255,255,1))] p-5">
      <div className="relative z-10 space-y-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{text.structureSource}</p>
          <p className="mt-1 break-all text-[13px] font-semibold text-[#070261]">{fileName}</p>
          <p className="mt-2 text-[11px] leading-5 text-slate-400">{text.caption}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div>
            <p className="mb-2 text-[12px] font-medium text-slate-700">{text.displayMode}</p>
            <ToggleGroup
              type="single"
              value={mode}
              onValueChange={(value) => {
                if (value) setMode(value as PdbRenderMode);
              }}
              variant="outline"
              className="rounded-xl border border-slate-200 bg-white"
            >
              <ToggleGroupItem value="cartoon" className="px-3 text-[12px] text-slate-600 data-[state=on]:text-[#161FAD]">
                {text.modes.cartoon}
              </ToggleGroupItem>
              <ToggleGroupItem value="stick" className="px-3 text-[12px] text-slate-600 data-[state=on]:text-[#161FAD]">
                {text.modes.stick}
              </ToggleGroupItem>
              <ToggleGroupItem value="sphere" className="px-3 text-[12px] text-slate-600 data-[state=on]:text-[#161FAD]">
                {text.modes.sphere}
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <label className="mt-[22px] inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-600">
            <Switch checked={autoRotate} onCheckedChange={setAutoRotate} />
            <span>{text.autoRotate}</span>
          </label>
        </div>
      </div>

      <div className="relative z-0 mt-6 overflow-hidden rounded-[18px] border border-slate-200 bg-[#F8FAFF] shadow-inner">
        <div ref={containerRef} className="relative h-[420px] w-full min-h-[420px] overflow-hidden" />
      </div>
    </div>
  );
}

import type { ReactNode } from "react";

export type IngredientId = "flour" | "egg" | "milk" | "butter" | "sugar";

export type ToppingId =
  | "syrup"
  | "butter"
  | "berries"
  | "chocolate"
  | "whipped";

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

function donenessColor(t: number) {
  const stops = [
    [238, 200, 110],
    [211, 155, 46],
    [63, 42, 20],
  ] as const;
  const seg = Math.min(Math.max(t, 0), 1) * 2;
  const i = Math.min(1, Math.floor(seg));
  const f = seg - i;
  const a = stops[i];
  const b = stops[i + 1] ?? stops[1];
  return `rgb(${lerp(a[0], b[0], f)}, ${lerp(a[1], b[1], f)}, ${lerp(
    a[2],
    b[2],
    f
  )})`;
}

function mix(towards: string, t: number) {
  const c = [63, 42, 20];
  return `rgb(${lerp(c[0], 255, t)}, ${lerp(c[1], 252, t)}, ${lerp(
    c[2],
    230,
    t
  )})`;
}

const TOPPING_GLYPHS: Record<ToppingId, ReactNode> = {
  syrup: (
    <g>
      <ellipse cx={36} cy={36} rx={13} ry={7} fill="rgba(217,154,40,0.9)" />
      <ellipse cx={66} cy={48} rx={14} ry={7} fill="rgba(199,138,34,0.9)" />
      <ellipse cx={42} cy={66} rx={10} ry={6} fill="rgba(217,154,40,0.85)" />
      <ellipse cx={76} cy={84} rx={12} ry={7} fill="rgba(199,138,34,0.9)" />
    </g>
  ),
  butter: (
    <g>
      <rect x={58} y={18} width={9} height={7} rx={2} fill="#ffdf6b" />
      <rect x={50} y={30} width={8} height={6} rx={2} fill="#f7ce4a" />
      <rect x={66} y={36} width={8} height={6} rx={2} fill="#ffe473" />
    </g>
  ),
  berries: (
    <g>
      <circle cx={24} cy={30} r={3.4} fill="#7a4bf0" />
      <circle cx={24} cy={30} r={1.1} fill="#c9b6ff" />
      <circle cx={34} cy={40} r={3} fill="#e85d75" />
      <circle cx={34} cy={40} r={1} fill="#ffc2ce" />
      <circle cx={46} cy={30} r={3} fill="#3a6df0" />
      <circle cx={46} cy={30} r={1} fill="#aec6ff" />
      <circle cx={26} cy={50} r={3} fill="#7a4bf0" />
      <circle cx={58} cy={36} r={3.2} fill="#e85d75" />
    </g>
  ),
  chocolate: (
    <g>
      <rect x={14} y={48} width={8} height={6} rx={1.6} fill="#6b3a1f" />
      <rect x={14} y={48} width={8} height={3} rx={1.6} fill="#8a5233" />
      <rect x={22} y={56} width={7} height={5} rx={1.6} fill="#5a2f18" />
      <rect x={40} y={52} width={8} height={6} rx={1.6} fill="#6b3a1f" />
      <rect x={40} y={52} width={8} height={3} rx={1.6} fill="#8a5233" />
    </g>
  ),
  whipped: (
    <g>
      <circle cx={22} cy={14} r={7} fill="#fffdf7" />
      <circle cx={22} cy={14} r={3.4} fill="#f0ead8" />
      <circle cx={38} cy={12} r={6} fill="#fffdf7" />
      <circle cx={52} cy={18} r={7} fill="#fffdf7" />
      <circle cx={52} cy={18} r={3.4} fill="#f0ead8" />
      <circle cx={68} cy={26} r={5.6} fill="#fffdf7" />
    </g>
  ),
};

export function TopWaffle({
  doneness,
  toppings,
}: {
  doneness: number;
  toppings: ToppingId[];
}) {
  const base = donenessColor(doneness);
  const light = mix(base, 0.55);
  const dark = mix(base, -0.35);
  const cells: ReactNode[] = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const x = 5 + c * 19;
      const y = 5 + r * 19;
      cells.push(
        <g key={`${r}-${c}`}>
          <rect
            x={x}
            y={y}
            width={18}
            height={18}
            rx={3}
            fill={light}
            stroke={dark}
            strokeOpacity={0.35}
            strokeWidth={1}
          />
          <circle cx={x + 9} cy={y + 9} r={2.1} fill={dark} opacity={0.22} />
        </g>
      );
    }
  }
  return (
    <svg
      viewBox="0 0 105 105"
      className="h-full w-full select-none"
      aria-hidden="true"
    >
      <rect
        x={2}
        y={2}
        width={101}
        height={101}
        rx={12}
        fill={base}
        stroke={dark}
        strokeOpacity={0.6}
        strokeWidth={2}
      />
      {cells}
      {toppings.map((t, i) => (
        <g key={`${t}-${i}`} className="anim-drop">
          {TOPPING_GLYPHS[t]}
        </g>
      ))}
    </svg>
  );
}

export function CellPlate({ className }: { className?: string }) {
  const cells: ReactNode[] = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      cells.push(
        <rect
          key={`${r}-${c}`}
          x={5 + c * 19}
          y={5 + r * 19}
          width={18}
          height={18}
          rx={3}
          fill="#1e2126"
          stroke="#000"
          strokeOpacity={0.5}
        />
      );
    }
  }
  return (
    <svg
      viewBox="0 0 105 105"
      className={`h-full w-full select-none ${className ?? ""}`}
      aria-hidden="true"
    >
      {cells}
    </svg>
  );
}

export function IngredientGlyph({
  id,
  className,
}: {
  id: IngredientId;
  className?: string;
}) {
  const cls = `h-11 w-11 select-none ${className ?? ""}`;
  switch (id) {
    case "flour":
      return (
        <svg viewBox="0 0 40 40" className={cls} aria-hidden="true">
          <circle cx={20} cy={30} r={12} fill="#f8f0dc" stroke="#d9cba6" />
          <ellipse cx={20} cy={26} rx={10} ry={5} fill="#fdfaf2" />
          <circle cx={12} cy={22} r={2} fill="#fdfaf2" />
          <circle cx={24} cy={21} r={2} fill="#fdfaf2" />
        </svg>
      );
    case "egg":
      return (
        <svg viewBox="0 0 40 40" className={cls} aria-hidden="true">
          <ellipse cx={20} cy={22} rx={12} ry={14} fill="#f7edd2" stroke="#d8c393" />
          <ellipse cx={20} cy={24} rx={5.5} ry={5.5} fill="#f5b83d" />
          <circle cx={18.5} cy={22.5} r={1.6} fill="#fff" opacity={0.8} />
        </svg>
      );
    case "milk":
      return (
        <svg viewBox="0 0 40 40" className={cls} aria-hidden="true">
          <rect x={12} y={10} width={16} height={26} rx={2} fill="#eaf2fb" stroke="#b9cfe8" />
          <path d="M12 14 L28 8 V14 Z" fill="#b9cfe8" />
          <rect x={17} y={20} width={6} height={6} rx={1} fill="#f3f7fd" />
        </svg>
      );
    case "butter":
      return (
        <svg viewBox="0 0 40 40" className={cls} aria-hidden="true">
          <rect x={10} y={14} width={20} height={13} rx={2} fill="#ffd94a" stroke="#d9b230" />
          <rect x={10} y={14} width={20} height={6} rx={2} fill="#ffe473" />
          <circle cx={24} cy={21} r={1.4} fill="#e8c237" />
        </svg>
      );
    case "sugar":
      return (
        <svg viewBox="0 0 40 40" className={cls} aria-hidden="true">
          <rect x={15} y={18} width={10} height={9} rx={1.5} fill="#fffdf6" stroke="#dcd5c2" />
          <rect x={11} y={27} width={18} height={8} rx={1.5} fill="#fbf7ea" stroke="#dcd5c2" />
        </svg>
      );
  }
}
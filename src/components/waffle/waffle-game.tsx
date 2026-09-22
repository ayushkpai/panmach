"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  CellPlate,
  IngredientGlyph,
  TopWaffle,
  type IngredientId,
  type ToppingId,
} from "./waffle-art";

const INGREDIENTS: { id: IngredientId; name: string }[] = [
  { id: "flour", name: "Flour" },
  { id: "egg", name: "Egg" },
  { id: "milk", name: "Milk" },
  { id: "butter", name: "Butter" },
  { id: "sugar", name: "Sugar" },
];

const TOPPINGS: { id: ToppingId; name: string }[] = [
  { id: "syrup", name: "Maple Syrup" },
  { id: "butter", name: "Butter" },
  { id: "berries", name: "Berries" },
  { id: "chocolate", name: "Chocolate" },
  { id: "whipped", name: "Whipped Cream" },
];

interface Order {
  name: string;
  recipe: IngredientId[];
  required: ToppingId[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeOrder(): Order {
  const ids: IngredientId[] = ["flour", "egg", "milk", "butter", "sugar"];
  const recipe = shuffle(ids).slice(0, 3);
  const required = shuffle(TOPPINGS.map((t) => t.id)).slice(
    0,
    Math.random() > 0.5 ? 2 : 1
  );
  const names = TOPPINGS.filter((t) => required.includes(t.id)).map(
    (t) => t.name
  );
  return {
    name: `Waffle with ${names.join(" & ")}`,
    recipe,
    required,
  };
}

type Phase = "mix" | "cook" | "serve";
type Screen = "start" | "play" | "over";
type CookRating = "golden" | "crisp" | null;

const GOLDEN_MIN = 0.38;
const GOLDEN_MAX = 0.6;
const CRISP_MAX = 0.75;

const ZONES = [
  { from: 0, to: 0.3, label: "raw" },
  { from: 0.3, to: 0.38, label: "faint" },
  { from: 0.38, to: 0.6, label: "GOLDEN" },
  { from: 0.6, to: 0.75, label: "crisp" },
  { from: 0.75, to: 1, label: "burnt" },
];

function toppingColor(id: ToppingId) {
  switch (id) {
    case "syrup":
      return "#d99a28";
    case "butter":
      return "#ffd94a";
    case "berries":
      return "#7a4bf0";
    case "chocolate":
      return "#6b3a1f";
    case "whipped":
      return "#f5f0e2";
  }
}

export default function WaffleGame() {
  const [screen, setScreen] = useState<Screen>("start");
  const [phase, setPhase] = useState<Phase>("mix");
  const [order, setOrder] = useState<Order>(() => makeOrder());
  const [pantry, setPantry] = useState<IngredientId[]>(() =>
    shuffle(INGREDIENTS.map((i) => i.id))
  );
  const [step, setStep] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [cooking, setCooking] = useState(false);
  const [cook, setCook] = useState(0);
  const [cookSpeed, setCookSpeed] = useState(0.13);
  const [doneness, setDoneness] = useState(0);
  const [toppings, setToppings] = useState<ToppingId[]>([]);
  const [score, setScore] = useState(0);
  const [served, setServed] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [shakeId, setShakeId] = useState<IngredientId | null>(null);
  const [rating, setRating] = useState<CookRating>(null);
  const clickLock = useRef(false);

  const showToast = (msg: string) => {
    setToast(null);
    requestAnimationFrame(() => setToast(msg));
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const failCook = () => {
    clickLock.current = true;
    setCooking(false);
    setCook(0);
    setDoneness(0);
    const left = hearts - 1;
    setHearts(left);
    showToast("Burnt to a crisp! -1 heart");
    setTimeout(() => {
      clickLock.current = false;
      if (left <= 0) {
        setScreen("over");
        return;
      }
      setPhase("mix");
      setStep(0);
      setMistakes(0);
      setToppings([]);
      setRating(null);
    }, 900);
  };

  useEffect(() => {
    if (phase !== "cook" || !cooking) return;
    let raf = 0;
    let last = performance.now();
    let progress = 0;
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      progress = Math.min(progress + dt * cookSpeed, 1);
      setCook(progress);
      setDoneness(Math.min(progress * 0.95, 0.97));
      if (progress >= 1) {
        failCook();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, cooking, cookSpeed]);

  const tryIngredient = (id: IngredientId) => {
    if (phase !== "mix" || clickLock.current) return;
    if (id === order.recipe[step]) {
      const name = INGREDIENTS.find((i) => i.id === id)?.name;
      const done = step + 1 === order.recipe.length;
      setStep((s) => s + 1);
      setScore((s) => s + 4);
      showToast(`+$4  ${name} in!`);
      clickLock.current = true;
      setTimeout(() => {
        clickLock.current = false;
        if (done) {
          showToast("Batter is ready. Pour it in and cook.");
          setPhase("cook");
          setCooking(false);
          setCook(0);
          setDoneness(0);
        }
      }, 450);
    } else {
      const next = mistakes + 1;
      setMistakes(next);
      setShakeId(id);
      setTimeout(() => setShakeId(null), 420);
      if (next >= 3) {
        const left = hearts - 1;
        setHearts(left);
        setMistakes(0);
        showToast("Recipe ruined! -1 heart");
        clickLock.current = true;
        setTimeout(() => {
          clickLock.current = false;
          if (left <= 0) setScreen("over");
        }, 900);
      } else {
        showToast(`Not the next ingredient. (${next}/3 mistakes)`);
      }
    }
  };

  const toggleIron = () => {
    if (phase !== "cook" || clickLock.current) return;
    if (!cooking) {
      setCooking(true);
      showToast("Sizzle.... open it when the needle hits GOLDEN!");
      return;
    }
    // closed and cooking: time to check the doneness
    if (cook < GOLDEN_MIN) return; // still raw on the inside
    if (cook > CRISP_MAX) {
      failCook();
      return;
    }
    const rate: CookRating = cook <= GOLDEN_MAX ? "golden" : "crisp";
    const bonus = rate === "golden" ? 12 : 6;
    clickLock.current = true;
    setRating(rate);
    setCooking(false);
    setScore((s) => s + bonus);
    showToast(
      rate === "golden" ? "Perfect golden waffle! +$12" : "A bit crispy. +$6"
    );
    setTimeout(() => {
      clickLock.current = false;
      setPhase("serve");
    }, 900);
  };

  const addTopping = (id: ToppingId) => {
    if (phase !== "serve" || clickLock.current) return;
    if (toppings.length >= 8) return;
    setToppings((t) => [...t, id]);
  };

  const serve = () => {
    if (phase !== "serve" || clickLock.current) return;
    const hasRequired = order.required.every((r) => toppings.includes(r));
    if (!hasRequired) {
      showToast("Missing something the customer ordered!");
      return;
    }
    const optional = toppings.filter((t) => !order.required.includes(t)).length;
    const pay = 6 + 3 * order.required.length + 2 * optional;
    setScore((s) => s + pay);
    setServed((s) => s + 1);
    showToast(`Delivered! +$${pay}`);
    clickLock.current = true;
    setTimeout(() => {
      clickLock.current = false;
      setOrder(makeOrder());
      setPantry(shuffle(INGREDIENTS.map((i) => i.id)));
      setPhase("mix");
      setStep(0);
      setMistakes(0);
      setToppings([]);
      setRating(null);
      setCookSpeed(0.11 + Math.random() * 0.07);
    }, 1100);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" || screen !== "play") return;
      e.preventDefault();
      if (phase === "cook") toggleIron();
      else if (phase === "serve") serve();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, phase, cooking, cook, toppings, order, hearts]);

  const startOver = () => {
    setScreen("play");
    setOrder(makeOrder());
    setHearts(3);
    setScore(0);
    setServed(0);
    setStep(0);
    setMistakes(0);
    setPhase("mix");
    setCookSpeed(0.13);
    setCooking(false);
    setCook(0);
    setDoneness(0);
    setToppings([]);
    setRating(null);
  };

  if (screen === "start") {
    return (
      <Panel>
        <h1 className="text-3xl font-black tracking-tight text-amber-900">
          Waffle Prime
        </h1>
        <p className="text-sm text-amber-800/80">
          Run the stand. Mix the batter, nail the cook, serve what each customer
          ordered.
        </p>
        <ol className="w-full max-w-xs space-y-1.5 text-left text-sm text-amber-900">
          <li>1. Add the 3 recipe ingredients in order.</li>
          <li>2. Close the iron and open it in the GOLDEN zone.</li>
          <li>3. Add every topping on the ticket, then serve.</li>
        </ol>
        <button
          onClick={startOver}
          className="rounded-full bg-amber-700 px-8 py-3 text-lg font-bold text-amber-50 shadow-lg transition hover:bg-amber-800 active:scale-95"
        >
          Open the Shop
        </button>
      </Panel>
    );
  }

  if (screen === "over") {
    return (
      <Panel>
        <h1 className="text-2xl font-black text-amber-900">Out of waffle love!</h1>
        <p className="text-amber-800/80">
          You served{" "}
          <span className="font-bold text-amber-900">{served} orders</span> and
          earned <span className="font-bold text-amber-900">${score}</span>.
        </p>
        <div className="flex h-40 w-40 items-center justify-center">
          <div className="anim-floaty h-32 w-32 opacity-90">
            <TopWaffle doneness={0.55} toppings={["syrup", "whipped"]} />
          </div>
        </div>
        <button
          onClick={startOver}
          className="rounded-full bg-amber-700 px-8 py-3 text-lg font-bold text-amber-50 shadow-lg transition hover:bg-amber-800 active:scale-95"
        >
          Open Again
        </button>
      </Panel>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-4 py-8">
      <header className="flex w-full items-center justify-between text-amber-950">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-black tracking-tight">Waffle Prime</h1>
          <span className="text-sm text-amber-800/70">Order #{served + 1}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-lg font-bold">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700/70">
              cash{" "}
            </span>
            ${score}
          </div>
          <div aria-label={`${hearts} hearts left`} className="flex items-center gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <span
                key={i}
                className={`h-3.5 w-3.5 rotate-45 rounded-[3px] border ${
                  i < hearts
                    ? "border-red-500 bg-red-500"
                    : "border-red-300/60 bg-transparent"
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      <div className="w-full rounded-2xl bg-amber-100/70 p-3 text-center text-sm font-semibold text-amber-900 shadow-sm">
        {phase === "mix" && (
          <span>Mix the batter: add the 3 ingredients on the recipe card, in order.</span>
        )}
        {phase === "cook" && (
          <span>
            {cooking
              ? "Click (or press space) to open the iron when the needle hits GOLDEN!"
              : "Pour the batter and close the iron."}
          </span>
        )}
        {phase === "serve" && (
          <span>Add what the customer ordered, garnish how you like, then serve.</span>
        )}
      </div>

      {toast && (
        <div className="anim-toast rounded-full bg-amber-950 px-5 py-2 text-sm font-semibold text-amber-100 shadow-lg">
          {toast}
        </div>
      )}

      <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
        <section className="flex flex-col items-center gap-3">
          <div className="relative h-60 w-60 rounded-3xl border-8 border-zinc-800 bg-zinc-900 p-1.5 shadow-2xl sm:h-72 sm:w-72">
            <div className="absolute inset-2.5 overflow-hidden rounded-2xl">
              <CellPlate className="opacity-70" />
            </div>
            {phase !== "mix" && (
              <div className="absolute inset-1.5">
                <TopWaffle doneness={doneness} toppings={toppings} />
              </div>
            )}
            {phase === "cook" && cooking && (
              <div className="steam pointer-events-none absolute inset-x-0 bottom-2 flex items-end justify-center gap-2 overflow-hidden">
                <span style={{ animationDelay: "0s" }} />
                <span style={{ animationDelay: "0.4s" }} />
                <span style={{ animationDelay: "0.8s" }} />
              </div>
            )}
          </div>
          <div className="text-xs uppercase tracking-wider text-amber-800/60">
            {phase === "serve" && rating === "golden" && "golden grade"}
            {phase === "serve" && rating === "crisp" && "crispy grade"}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          {phase === "mix" && (
            <>
              <div className="rounded-2xl bg-amber-50 p-3 shadow-sm">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-700/70">
                  Recipe card
                </div>
                <div className="flex items-center gap-2">
                  {order.recipe.map((rid, i) => (
                    <div key={rid} className="flex items-center gap-2">
                      {i > 0 && <span className="text-amber-400">→</span>}
                      <div
                        className={`flex flex-col items-center rounded-xl border px-2.5 py-1.5 ${
                          i < step
                            ? "border-emerald-300 bg-emerald-100"
                            : i === step
                              ? "anim-pop border-amber-400 bg-amber-200"
                              : "border-amber-200 bg-white/70"
                        }`}
                      >
                        <IngredientGlyph id={rid} className="h-9 w-9" />
                        <span className="mt-1 text-sm font-bold text-amber-900">
                          {i + 1}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl bg-amber-50 p-3 shadow-sm">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-700/70">
                  Pantry
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {pantry.map((id) => (
                    <button
                      key={id}
                      onClick={() => tryIngredient(id)}
                      className={`flex flex-col items-center gap-1 rounded-xl border bg-white p-2 shadow-sm transition ${
                        shakeId === id
                          ? "anim-shake border-red-300"
                          : "border-amber-200 hover:border-amber-400 active:scale-95"
                      }`}
                    >
                      <IngredientGlyph id={id} className="h-11 w-11" />
                      <span className="text-[11px] font-semibold text-amber-900">
                        {INGREDIENTS.find((i) => i.id === id)?.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {phase === "cook" && (
            <CookPanel cook={cook} cooking={cooking} toggleIron={toggleIron} />
          )}

          {phase === "serve" && (
            <ServePanel
              order={order}
              toppings={toppings}
              addTopping={addTopping}
              serve={serve}
            />
          )}
        </section>
      </div>
    </div>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
      {children}
    </div>
  );
}

function CookPanel({
  cook,
  cooking,
  toggleIron,
}: {
  cook: number;
  cooking: boolean;
  toggleIron: () => void;
}) {
  const pct = Math.round(cook * 100);
  return (
    <div className="flex flex-1 flex-col justify-center gap-4">
      <div className="rounded-2xl bg-amber-50 p-4 shadow-sm">
        <div className="mb-2 flex justify-between text-xs font-semibold text-amber-700/70">
          <span>Doneness</span>
          <span>{pct}%</span>
        </div>
        <div className="relative h-5 w-full rounded-full bg-zinc-200">
          {ZONES.map((z) => (
            <div
              key={z.label}
              className="absolute top-0 h-full first:rounded-l-full last:rounded-r-full"
              style={{
                left: `${z.from * 100}%`,
                width: `${(z.to - z.from) * 100}%`,
                backgroundColor: toppingColorForZone(z.label),
                opacity: z.label === "GOLDEN" ? 1 : 0.65,
              }}
              title={z.label}
            />
          ))}
          <div
            className="absolute top-[-5px] z-10 h-9 w-1.5 rounded-full bg-zinc-900 shadow"
            style={{ left: `calc(${pct}% - 3px)` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[11px] font-semibold uppercase tracking-wide text-amber-700/60">
          <span>raw</span>
          <span className="text-amber-700">golden</span>
          <span>burnt</span>
        </div>
      </div>
      <button
        onClick={toggleIron}
        className="rounded-full bg-amber-700 px-8 py-3 text-lg font-bold text-amber-50 shadow-lg transition hover:bg-amber-800 active:scale-95"
      >
        {cooking ? "Open the Iron!" : "Close & Start Cooking"}
      </button>
      <p className="text-center text-xs text-amber-800/60">
        open it when the needle hits gold
      </p>
    </div>
  );
}

function toppingColorForZone(label: string) {
  switch (label) {
    case "GOLDEN":
      return "#d99a28";
    case "burnt":
      return "#3f2a14";
    case "crisp":
      return "#e07a2f";
    case "faint":
      return "#fcd34d";
    default:
      return "#a8a29e";
  }
}

function ServePanel({
  order,
  toppings,
  addTopping,
  serve,
}: {
  order: Order;
  toppings: ToppingId[];
  addTopping: (id: ToppingId) => void;
  serve: () => void;
}) {
  const count = (id: ToppingId) => toppings.filter((t) => t === id).length;
  return (
    <div className="flex flex-1 flex-col justify-center gap-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-700/70">
          Ticket
        </div>
        <div className="font-bold text-amber-950">{order.name}</div>
        <ul className="mt-2 space-y-1 text-sm text-amber-900">
          {order.required.map((t) => {
            const has = count(t) > 0;
            return (
              <li key={t} className="flex items-center gap-2">
                <span
                  className={`inline-block h-3 w-3 rounded-full border ${
                    has ? "border-emerald-500 bg-emerald-400" : "border-zinc-300 bg-white"
                  }`}
                />
                <span>{TOPPINGS.find((x) => x.id === t)?.name}</span>
                {has && <span className="text-emerald-600">ok</span>}
              </li>
            );
          })}
        </ul>
      </div>
      <div className="rounded-2xl bg-amber-50 p-3 shadow-sm">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-700/70">
          Toppings
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {TOPPINGS.map((t) => (
            <button
              key={t.id}
              onClick={() => addTopping(t.id)}
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-white px-3 py-1.5 text-sm font-semibold text-amber-900 shadow-sm transition hover:border-amber-500 active:scale-95"
            >
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: toppingColor(t.id) }}
              />
              {t.name}
              {count(t.id) > 0 && (
                <span className="text-amber-500">x{count(t.id)}</span>
              )}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={serve}
        className="rounded-full bg-emerald-600 px-8 py-3 text-lg font-bold text-white shadow-lg transition hover:bg-emerald-700 active:scale-95"
      >
        Serve & Ring Up
      </button>
    </div>
  );
}
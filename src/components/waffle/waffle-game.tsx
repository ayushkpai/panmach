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
  dineIn: boolean;
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
    dineIn: Math.random() < 0.5,
  };
}

type Phase = "mix" | "cook" | "serve" | "table" | "delivery";
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

const WARM_MAX = 100;
const WARM_DRAIN = WARM_MAX / 16;
const DELIVERY_BLOCKS = 6;
const PEDAL_BASE = 0.55;
const PEDAL_STEP = 0.05;
const PEDAL_MAX = 1.2;
const STREETS = [
  "Batter Ave",
  "Syrup St",
  "Maple Blvd",
  "Waffle Way",
  "Honey Dr",
  "Griddle Ct",
];

function randomAddress() {
  const street = STREETS[Math.floor(Math.random() * STREETS.length)];
  const num = Math.floor(Math.random() * 900) + 10;
  return `${num} ${street}`;
}

function tipFor(warmth: number): { tip: number; note: string } {
  if (warmth >= 70) return { tip: 14, note: "Piping hot delivery!" };
  if (warmth >= 45) return { tip: 8, note: "Warm and happy customer!" };
  if (warmth >= 20) return { tip: 3, note: "A bit lukewarm..." };
  return { tip: 1, note: "Cold waffle, tiny tip." };
}

const PATIENCE_MAX = 100;
const PATIENCE_DRAIN = PATIENCE_MAX / 15;

function tipForFreshness(patience: number): { tip: number; note: string } {
  if (patience >= 70) return { tip: 8, note: "Right from the iron! Great tip." };
  if (patience >= 45) return { tip: 5, note: "Still nice and hot. Good tip." };
  if (patience >= 20) return { tip: 3, note: "A little slow off the iron..." };
  return { tip: 2, note: "They waited a while. Small tip." };
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
  const [warmth, setWarmth] = useState(WARM_MAX);
  const [blocksLeft, setBlocksLeft] = useState(DELIVERY_BLOCKS);
  const [cooldown, setCooldown] = useState(0);
  const [street, setStreet] = useState(() => randomAddress());
  const [road, setRoad] = useState(0);
  const [patience, setPatience] = useState(PATIENCE_MAX);
  const clickLock = useRef(false);
  const roadRef = useRef(0);
  const patienceRef = useRef(PATIENCE_MAX);
  const warmthRef = useRef(WARM_MAX);
  const blocksRef = useRef(DELIVERY_BLOCKS);
  const cooldownRef = useRef(0);
  const pedalCountRef = useRef(0);

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

  const startNextOrder = () => {
    setOrder(makeOrder());
    setPantry(shuffle(INGREDIENTS.map((i) => i.id)));
    setPhase("mix");
    setStep(0);
    setMistakes(0);
    setToppings([]);
    setRating(null);
    setCookSpeed(0.11 + Math.random() * 0.07);
    warmthRef.current = WARM_MAX;
    setWarmth(WARM_MAX);
    blocksRef.current = DELIVERY_BLOCKS;
    setBlocksLeft(DELIVERY_BLOCKS);
    cooldownRef.current = 0;
    setCooldown(0);
    roadRef.current = 0;
    setRoad(0);
    pedalCountRef.current = 0;
    setStreet(randomAddress());
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
    clickLock.current = true;
    if (order.dineIn) {
      showToast(`Rung up! +$${pay} — take the plate to the table!`);
      setTimeout(() => {
        clickLock.current = false;
        patienceRef.current = PATIENCE_MAX;
        setPatience(PATIENCE_MAX);
        setPhase("table");
      }, 1100);
      return;
    }
    showToast(`Rung up! +$${pay} — now deliver it hot.`);
    clickLock.current = true;
    setTimeout(() => {
      clickLock.current = false;
      warmthRef.current = WARM_MAX;
      setWarmth(WARM_MAX);
      blocksRef.current = DELIVERY_BLOCKS;
      setBlocksLeft(DELIVERY_BLOCKS);
cooldownRef.current = 0;
    setCooldown(0);
    roadRef.current = 0;
    setRoad(0);
    patienceRef.current = PATIENCE_MAX;
    setPatience(PATIENCE_MAX);
    pedalCountRef.current = 0;
      setStreet(randomAddress());
      setPhase("delivery");
    }, 1100);
  };

  const serveTable = () => {
    if (phase !== "table" || clickLock.current) return;
    const { tip, note } = tipForFreshness(patienceRef.current);
    clickLock.current = true;
    setScore((s) => s + tip);
    setServed((s) => s + 1);
    showToast(`${note} +$${tip} tip`);
    setTimeout(() => {
      clickLock.current = false;
      startNextOrder();
    }, 1200);
  };

  const pedal = () => {
    if (phase !== "delivery" || clickLock.current) return;
    if (blocksRef.current <= 0 || warmthRef.current <= 0) return;
    if (cooldownRef.current > 0) return;
    const left = blocksRef.current - 1;
    blocksRef.current = left;
    setBlocksLeft(left);
    const cd = Math.min(
      PEDAL_BASE + pedalCountRef.current * PEDAL_STEP,
      PEDAL_MAX
    );
    pedalCountRef.current += 1;
    cooldownRef.current = cd;
    setCooldown(cd);
    if (left <= 0) {
      arrive(warmthRef.current);
    }
  };

  const arrive = (w: number) => {
    const { tip, note } = tipFor(w);
    clickLock.current = true;
    setScore((s) => s + tip);
    setServed((s) => s + 1);
    showToast(`${note} +$${tip} tip`);
    setTimeout(() => {
      clickLock.current = false;
      startNextOrder();
    }, 1300);
  };

  const failDelivery = () => {
    if (clickLock.current) return;
    clickLock.current = true;
    warmthRef.current = 0;
    setWarmth(0);
    const left = hearts - 1;
    setHearts(left);
    showToast("The waffle went cold in the bag. -1 heart");
    setTimeout(() => {
      clickLock.current = false;
      if (left <= 0) {
        setScreen("over");
        return;
      }
      startNextOrder();
    }, 1100);
  };

  useEffect(() => {
    if (phase !== "delivery") return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (blocksRef.current <= 0) return; // arrived, just waiting to move on
      roadRef.current += dt * (cooldownRef.current > 0 ? 1 : 0.3);
      setRoad(roadRef.current);
      warmthRef.current = Math.max(warmthRef.current - dt * WARM_DRAIN, 0);
      setWarmth(warmthRef.current);
      cooldownRef.current = Math.max(cooldownRef.current - dt, 0);
      setCooldown(cooldownRef.current);
      if (warmthRef.current <= 0) {
        failDelivery();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (phase !== "table") return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      patienceRef.current = Math.max(
        patienceRef.current - dt * PATIENCE_DRAIN,
        0
      );
      setPatience(patienceRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" || screen !== "play") return;
      e.preventDefault();
      if (phase === "cook") toggleIron();
      else if (phase === "serve") serve();
      else if (phase === "table") serveTable();
      else if (phase === "delivery") pedal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, phase, cooking, cook, toppings, order, hearts, cooldown]);

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
    warmthRef.current = WARM_MAX;
    setWarmth(WARM_MAX);
    blocksRef.current = DELIVERY_BLOCKS;
    setBlocksLeft(DELIVERY_BLOCKS);
    cooldownRef.current = 0;
    setCooldown(0);
    roadRef.current = 0;
    setRoad(0);
    patienceRef.current = PATIENCE_MAX;
    setPatience(PATIENCE_MAX);
    pedalCountRef.current = 0;
    setStreet(randomAddress());
  };

  if (screen === "start") {
    return (
      <Panel>
        <div className="flex flex-col items-center gap-3">
          <div className="grid h-16 w-16 place-items-center rounded-3xl bg-amber-700 shadow-lg">
            <MiniWaffle className="h-11 w-11" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-amber-950">
            Waffle Prime
          </h1>
          <p className="text-sm text-amber-800/80">
            Run the stand. Mix the batter, nail the cook, serve what each customer
            ordered.
          </p>
        </div>
        <ol className="w-full max-w-xs space-y-2.5 text-left text-sm text-amber-900">
          {[
            "Add the 3 recipe ingredients in order.",
            "Close the iron and open it in the GOLDEN zone.",
            "Add every topping on the ticket, then serve.",
            "Pedal to the address before the waffle cools.",
          ].map((item, i) => (
            <li key={item} className="flex items-center gap-2.5">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-amber-200 text-xs font-black text-amber-900">
                {i + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
        <button
          onClick={startOver}
          className="btn-primary rounded-full px-8 py-3 text-lg font-bold"
        >
          Open the Shop
        </button>
      </Panel>
    );
  }

  if (screen === "over") {
    return (
      <Panel>
        <h1 className="text-2xl font-black text-amber-950">Out of waffle love!</h1>
        <p className="text-amber-800/80">
          You served{" "}
          <span className="font-black text-amber-950">{served} orders</span> and
          earned <span className="font-black text-amber-950">${score}</span>.
        </p>
        <div className="flex h-44 w-44 items-center justify-center rounded-full border-4 border-dashed border-amber-300 bg-amber-100/60">
          <div className="anim-floaty h-32 w-32 drop-shadow-lg">
            <TopWaffle doneness={0.55} toppings={["syrup", "whipped"]} />
          </div>
        </div>
        <button
          onClick={startOver}
          className="btn-primary rounded-full px-8 py-3 text-lg font-bold"
        >
          Open Again
        </button>
      </Panel>
    );
  }

  const inGoldenZone = cook >= GOLDEN_MIN && cook <= GOLDEN_MAX;

  return (
    <div className="shop-bg flex min-h-[100dvh] w-full items-start justify-center px-3 py-5 sm:px-4 sm:py-8">
      <div className="flex w-full max-w-3xl flex-col items-center gap-3 sm:gap-4">
        <header className="flex w-full items-center justify-between rounded-3xl border border-amber-200 bg-white/70 px-4 py-2.5 shadow-sm backdrop-blur sm:px-5 sm:py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-b from-amber-600 to-amber-800 shadow-md sm:h-11 sm:w-11">
              <MiniWaffle className="h-7 w-7 sm:h-8 sm:w-8" />
            </div>
            <div className="leading-tight">
              <div className="text-base font-black tracking-tight text-amber-950 sm:text-lg">
                Waffle Prime
              </div>
              <div className="flex items-center gap-1.5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-amber-700/70 sm:text-[11px]">
                  order{" "}
                  <span className="text-amber-900">#{served + 1}</span>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-wider ${
                    order.dineIn
                      ? "bg-sky-100 text-sky-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {order.dineIn ? "dine-in" : "delivery"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 sm:px-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">
                cash
              </span>
              <span className="text-base font-black text-amber-950 sm:text-lg">
                ${score}
              </span>
            </div>
            <div
              aria-label={`${hearts} hearts left`}
              className="flex items-center gap-1"
            >
              {Array.from({ length: 3 }).map((_, i) => (
                <span
                  key={i}
                  className={`h-3 w-3 rotate-45 rounded-[3px] border transition sm:h-3.5 sm:w-3.5 ${
                    i < hearts
                      ? "border-red-500 bg-red-500 shadow-[0_2px_4px_rgba(220,38,38,0.5)]"
                      : "border-red-300/60 bg-transparent"
                  }`}
                />
              ))}
            </div>
          </div>
        </header>

        <div className="flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-2.5 text-center text-sm font-bold text-amber-900 shadow-sm sm:py-3">
          <span
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${
              phase === "delivery"
                ? "bg-emerald-500"
                : phase === "table"
                  ? "bg-sky-500"
                  : phase === "cook"
                    ? "bg-orange-500"
                    : "bg-amber-500"
            }`}
          />
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
            <span>
              {order.dineIn
                ? "Serve it at the counter — this customer is eating in!"
                : `Add what they ordered, then deliver it to ${street}.`}
            </span>
          )}
          {phase === "table" && (
            <span>Carry the plate to the table before it gets cold!</span>
          )}
          {phase === "delivery" && (
            <span>Pedal to {street} fast — the warm meter is draining!</span>
          )}
        </div>

        {toast && (
          <div className="anim-toast z-20 rounded-full border border-amber-600/70 bg-amber-950 px-5 py-2 text-sm font-bold text-amber-100 shadow-xl">
            {toast}
          </div>
        )}

        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 sm:gap-5">
          <section className="card-paper flex flex-col items-center gap-3 rounded-3xl border border-amber-200 p-5 shadow-sm sm:gap-4">
            <div className="relative h-56 w-56 sm:h-64 sm:w-64">
              <div className="grid h-full w-full place-items-center rounded-[2rem] border-[10px] border-zinc-700 bg-gradient-to-br from-zinc-600 via-zinc-800 to-zinc-950 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1),0_24px_44px_-22px_rgba(0,0,0,0.7)]">
                <div className="relative h-[calc(100%-1rem)] w-[calc(100%-1rem)] overflow-hidden rounded-2xl bg-zinc-900 p-2">
                  <CellPlate className="opacity-80" />
                  {phase !== "mix" && (
                    <div className="absolute inset-2">
                      <TopWaffle doneness={doneness} toppings={toppings} />
                    </div>
                  )}
                  {phase === "cook" && cooking && (
                    <div className="steam pointer-events-none absolute inset-x-0 bottom-1 flex items-end justify-center gap-2 overflow-hidden">
                      <span style={{ animationDelay: "0s" }} />
                      <span style={{ animationDelay: "0.4s" }} />
                      <span style={{ animationDelay: "0.8s" }} />
                    </div>
                  )}
                  {inGoldenZone && (
                    <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_36px_14px_rgba(251,191,36,0.5)]" />
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-amber-700">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  phase === "mix"
                    ? "bg-amber-400"
                    : phase === "cook"
                      ? cooking
                        ? "bg-orange-500 animate-pulse"
                        : "bg-orange-400"
                      : phase === "serve"
                        ? rating === "golden"
                          ? "bg-amber-500"
                          : "bg-amber-400"
                        : "bg-emerald-500"
                }`}
              />
              {phase === "mix" && "prepare the batter"}
              {phase === "cook" && (cooking ? "cooking..." : "ready to cook")}
              {phase === "serve" &&
                (rating === "golden"
                  ? "golden grade"
                  : rating === "crisp"
                    ? "crispy grade"
                    : "build your waffle")}
              {phase === "table" && "serve the table"}
              {phase === "delivery" && "hot delivery zone"}
            </div>
          </section>

          <section className="flex flex-col gap-3 sm:gap-4">
            {phase === "mix" && (
              <>
                <div className="card-paper rounded-2xl border border-amber-200 p-3 shadow-sm sm:p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700">
                      <MiniWaffle className="h-4 w-4" />
                      Recipe card
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700/70">
                      {step}/{order.recipe.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {order.recipe.map((rid, i) => {
                      const done = i < step;
                      const now = i === step;
                      return (
                        <div key={rid} className="flex items-center gap-1.5">
                          {i > 0 && (
                            <span className="text-sm font-black text-amber-400">→</span>
                          )}
                          <div
                            className={`relative flex flex-col items-center gap-1 rounded-2xl border-2 px-2.5 py-2 transition ${
                              done
                                ? "border-emerald-300 bg-emerald-50"
                                : now
                                  ? "anim-pop border-amber-400 bg-amber-100 ring-2 ring-amber-300"
                                  : "border-amber-200 bg-white"
                            }`}
                          >
                            {done && (
                              <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-[10px] font-black text-white shadow">
                                ✓
                              </span>
                            )}
                            <IngredientGlyph id={rid} className="h-9 w-9" />
                            <span
                              className={`grid h-5 w-5 place-items-center rounded-full text-xs font-black ${
                                done
                                  ? "bg-emerald-200 text-emerald-800"
                                  : now
                                    ? "bg-amber-500 text-white"
                                    : "bg-zinc-100 text-zinc-500"
                              }`}
                            >
                              {i + 1}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="card-paper rounded-2xl border border-amber-200 p-3 shadow-sm sm:p-4">
                  <div className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-700">
                    Pantry shelf
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {pantry.map((id) => (
                      <button
                        key={id}
                        onClick={() => tryIngredient(id)}
                        className={`btn-soft flex flex-col items-center gap-1 rounded-2xl p-2 hover:-translate-y-0.5 ${
                          shakeId === id
                            ? "anim-shake !border-red-400"
                            : ""
                        }`}
                      >
                        <IngredientGlyph id={id} className="h-11 w-11" />
                        <span className="text-[11px] font-bold text-amber-900">
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

            {phase === "table" && (
              <TablePanel
                patience={patience}
                doneness={doneness}
                toppings={toppings}
                serveTable={serveTable}
              />
            )}

            {phase === "delivery" && (
              <DeliveryPanel
                road={road}
                street={street}
                warmth={warmth}
                blocksLeft={blocksLeft}
                cooldown={cooldown}
                pedal={pedal}
              />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <div className="shop-bg flex min-h-[100dvh] w-full items-center justify-center px-4 py-10">
      <div className="card-paper flex w-full max-w-md flex-col items-center gap-5 rounded-3xl border border-amber-200 p-8 text-center shadow-2xl">
        {children}
      </div>
    </div>
  );
}

function MiniWaffle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={`select-none ${className ?? ""}`}
      aria-hidden="true"
    >
      <rect x={1} y={1} width={30} height={30} rx={6} fill="#d39b2e" />
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((c) => {
          const x = 4 + c * 8;
          const y = 4 + r * 8;
          return (
            <rect
              key={`${r}-${c}`}
              x={x}
              y={y}
              width={7}
              height={7}
              rx={1.6}
              fill="#f2c96a"
            />
          );
        })
      )}
    </svg>
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
  const inGolden = pct >= 38 && pct <= 60;
  return (
    <div className="flex flex-1 flex-col justify-center gap-4">
      <div className="card-paper rounded-2xl border border-amber-200 p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-amber-700">
          <span>Doneness</span>
          <span
            className={`rounded-full px-2 py-0.5 ${
              inGolden ? "bg-amber-200 text-amber-900" : "bg-amber-100 text-amber-700"
            }`}
          >
            {pct}%
          </span>
        </div>
        <div
          className={`relative h-5 w-full overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 ${
            inGolden ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-white" : ""
          }`}
        >
          {ZONES.map((z) => (
            <div
              key={z.label}
              className="absolute top-0 h-full transition-colors first:rounded-l-full last:rounded-r-full"
              style={{
                left: `${z.from * 100}%`,
                width: `${(z.to - z.from) * 100}%`,
                backgroundColor: toppingColorForZone(z.label),
                opacity: z.label === "GOLDEN" ? 0.95 : 0.55,
              }}
              title={z.label}
            />
          ))}
          <div
            className="absolute top-[46%] z-10 h-8 w-2 -translate-y-1/2 rounded-full bg-zinc-900 shadow ring-1 ring-white"
            style={{ left: `calc(${pct}% - 4px)` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wide">
          <span className="text-zinc-400">raw</span>
          <span className={inGolden ? "text-amber-600" : "text-amber-700/60"}>
            golden
          </span>
          <span className="text-zinc-400">burnt</span>
        </div>
      </div>
      <button
        onClick={toggleIron}
        className="btn-primary rounded-full px-8 py-3 text-lg font-bold"
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
  const allSet = order.required.every((r) => count(r) > 0);
  return (
    <div className="flex flex-1 flex-col justify-center gap-4">
      <div className="relative rounded-2xl border border-amber-200 bg-[#fffef8] px-5 pb-4 pt-5 font-mono shadow-sm">
        <div className="absolute inset-x-4 top-2 h-1 rounded border-t-2 border-dashed border-amber-300" />
        <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700">
          Waffle Prime
        </div>
        <div className="text-[10px] uppercase tracking-widest text-amber-800/60">
          Order ticket
        </div>
        <div className="mt-2 text-lg font-black leading-tight text-amber-950">
          {order.name}
        </div>
        <div className="mt-1">
          <span
            className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
              order.dineIn
                ? "bg-sky-100 text-sky-700"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {order.dineIn ? "dine-in · eat here" : "delivery · to go"}
          </span>
        </div>
        <ul className="mt-3 space-y-1.5 text-sm text-amber-900">
          {order.required.map((t) => {
            const has = count(t) > 0;
            return (
              <li key={t} className="flex items-center gap-2">
                <span
                  className={`grid h-4 w-4 place-items-center rounded-full border font-bold text-[10px] ${
                    has
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-amber-300 bg-white text-amber-300"
                  }`}
                >
                  {has ? "✓" : ""}
                </span>
                <span className={has ? "line-through decoration-emerald-400" : ""}>
                  {TOPPINGS.find((x) => x.id === t)?.name}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 border-t border-dashed border-amber-300 pt-2 text-[11px] font-bold text-amber-700">
          {allSet ? "Ready to ring up" : "Add the items above"}
        </div>
      </div>
      <div className="card-paper rounded-2xl border border-amber-200 p-3 shadow-sm">
        <div className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-700">
          Toppings
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {TOPPINGS.map((t) => {
            const n = count(t.id);
            return (
              <button
                key={t.id}
                onClick={() => addTopping(t.id)}
                className={`btn-soft inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold ${
                  n > 0 ? "!border-amber-500 bg-amber-100" : ""
                } ${n >= 8 ? "opacity-50" : ""}`}
              >
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: toppingColor(t.id) }}
                />
                {t.name}
                {n > 0 && <span className="text-amber-600">x{n}</span>}
              </button>
            );
          })}
        </div>
      </div>
<button
          onClick={serve}
          className="btn-go rounded-full px-8 py-3 text-lg font-bold disabled:opacity-40"
        >
          {order.dineIn ? "Serve at the Counter" : "Serve & Ring Up"}
        </button>
    </div>
  );
}

function TablePanel({
  patience,
  doneness,
  toppings,
  serveTable,
}: {
  patience: number;
  doneness: number;
  toppings: ToppingId[];
  serveTable: () => void;
}) {
  const [served, setServed] = useState(false);
  const patiencePct = Math.round(patience);
  const freshColor =
    patiencePct >= 70
      ? "from-sky-500 to-sky-400"
      : patiencePct >= 45
        ? "from-amber-500 to-amber-400"
        : "from-red-500 to-red-400";
  return (
    <div className="flex flex-1 flex-col justify-center gap-4">
      <TableScene
        patience={patiencePct}
        doneness={doneness}
        toppings={toppings}
        served={served}
      />
      <div className="card-paper rounded-2xl border border-amber-200 p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-amber-700">
          <span>Freshness</span>
          <span
            className={`rounded-full px-2 py-0.5 ${
              patiencePct >= 70
                ? "bg-sky-100 text-sky-700"
                : patiencePct >= 45
                  ? "bg-amber-100 text-amber-700"
                  : "bg-red-100 text-red-700"
            }`}
          >
            {patiencePct}%
          </span>
        </div>
        <div className="h-5 w-full overflow-hidden rounded-full border border-zinc-200 bg-zinc-100">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${freshColor} transition-all duration-150`}
            style={{ width: `${patiencePct}%` }}
          />
        </div>
        <div className="mt-2 grid grid-cols-4 gap-1 text-center text-[10px] font-bold uppercase tracking-wide">
          <span className="rounded bg-sky-500/15 px-1 py-0.5 text-sky-700">
            70+ = $8
          </span>
          <span className="rounded bg-amber-400/25 px-1 py-0.5 text-amber-700">
            45+ = $5
          </span>
          <span className="rounded bg-orange-500/15 px-1 py-0.5 text-orange-700">
            20+ = $3
          </span>
          <span className="rounded bg-red-500/15 px-1 py-0.5 text-red-700">
            0 = $2
          </span>
        </div>
      </div>
      <button
        onClick={() => {
          setServed(true);
          serveTable();
        }}
        disabled={served}
        className="btn-go rounded-full px-8 py-3 text-lg font-bold disabled:opacity-40"
      >
        {served ? "Plate is down!" : "Serve the Table! (space)"}
      </button>
      {!served && patiencePct < 30 && (
        <p className="-mt-2 text-center text-xs text-red-700/80">
          they&apos;re getting impatient...
        </p>
      )}
    </div>
  );
}

function TableScene({
  patience,
  doneness,
  toppings,
  served,
}: {
  patience: number;
  doneness: number;
  toppings: ToppingId[];
  served: boolean;
}) {
  const impatient = patience < 30 && !served;
  return (
    <div className="relative h-44 overflow-hidden rounded-2xl border border-amber-200/70 shadow-inner">
      {/* wall */}
      <div className="absolute inset-x-0 top-0 bottom-[40%] bg-gradient-to-b from-[#f7e6c4] to-[#eed7a8]" />
      {/* window */}
      <div className="absolute right-3 top-3 h-14 w-20 overflow-hidden rounded-lg border-4 border-[#b48a4a] bg-[#bfe0e8]">
        <div className="absolute left-1.5 top-1.5 h-3.5 w-3.5 rounded-full bg-yellow-300" />
        <div className="absolute bottom-1.5 left-3 h-2 w-9 rounded-full bg-white/80" />
        <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-[#b48a4a]" />
        <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-[#b48a4a]" />
      </div>
      {/* wall sign */}
      <div className="absolute left-3 top-3 rounded-md bg-amber-800 px-2 py-1 text-[8px] font-black uppercase tracking-wider text-amber-100 shadow">
        Waffle Prime
      </div>
      {/* floor */}
      <div
        className="absolute inset-x-0 bottom-0 h-[40%]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, #c98d4f 0 28px, #b97e44 28px 56px)",
        }}
      />
      <div className="absolute inset-x-0 bottom-[40%] h-1.5 bg-[#a86f3b]" />
      {/* table */}
      <div className="absolute bottom-[18%] left-1/2 flex -translate-x-1/2 flex-col items-center">
        <div className="h-3 w-44 rounded-full bg-[#8a5a33] shadow-md" />
        <div className="h-10 w-2 bg-[#6f4628]" />
        <div className="-mt-0.5 h-2 w-16 rounded bg-[#6f4628]" />
      </div>
      {/* plate + waffle */}
      <div className="absolute bottom-[24%] left-1/2 z-10 flex -translate-x-1/2 flex-col items-center">
        <div className="h-16 w-16 drop-shadow-lg">
          <TopWaffle doneness={doneness} toppings={toppings} />
        </div>
        <div className="-mt-1.5 h-3.5 w-32 rounded-full border border-zinc-100 bg-white shadow" />
      </div>
      {/* customer */}
      <div className="absolute bottom-[22%] right-[5%] flex flex-col items-center">
        <div className="relative">
          <div className="h-7 w-7 rounded-full bg-[#f0c396]" />
          <div className="absolute left-0 top-0 h-3 w-7 rounded-t-full bg-[#5b4636]" />
          <div className="mx-auto -mt-1 h-9 w-10 rounded-t-3xl bg-[#4aa3df]" />
        </div>
        <div className="-mt-1 h-2 w-12 rounded bg-[#8a5a33]" />
        <div className="h-6 w-1.5 bg-[#6f4628]" />
      </div>
      {impatient && (
        <div className="anim-pop absolute right-[10%] top-[28%] grid h-6 w-6 place-items-center rounded-full bg-rose-100 text-sm font-black text-rose-600 shadow">
          !
        </div>
      )}
      {served && (
        <>
          <div className="anim-pop absolute right-[6%] top-[26%] rounded-xl bg-pink-100 px-2 py-1 text-[10px] font-black text-rose-600 shadow">
            Yum!
          </div>
          <div className="anim-floaty absolute right-[4%] top-[12%] h-3 w-3 rotate-45 rounded-[2px] bg-rose-500" />
        </>
      )}
    </div>
  );
}

const ROAD_TILE = 200;
const ROAD_TILES = 8;
const CROSS_STREETS = [
  "Maple St",
  "Oak Ave",
  "Cedar Ln",
  "Birch Ave",
  "Elm St",
  "Pine Rd",
  "Willow Ln",
  "Ash Ave",
];

function RoadScene({
  road,
  drive,
  street,
  arrived,
}: {
  road: number;
  drive: boolean;
  street: string;
  arrived: boolean;
}) {
  const scroll = road * 110; // px of street scrolled
  const wrap = ROAD_TILE * ROAD_TILES;
  const lean = (drive ? 8 : 0) * Math.sin(road * 7);
  const bob = (drive ? Math.abs(Math.sin(road * 15)) : 0.15) * 3;
  return (
    <div className="relative h-44 overflow-hidden rounded-2xl border border-amber-200/70 shadow-inner">
      <div className="absolute inset-0 bg-gradient-to-b from-sky-400 via-sky-200 to-emerald-200" />
      <div className="absolute right-4 top-2 h-9 w-9 rounded-full bg-yellow-300 shadow-[0_0_28px_8px_rgba(253,224,71,0.55)]" />
      {[
        { top: 10, size: 52 },
        { top: 24, size: 74 },
        { top: 6, size: 42 },
      ].map((cld, i) => {
        const cx = (((i * 205 + 40 - scroll * 0.15) % 640) + 640) % 640 - 90;
        return (
          <div
            key={i}
            className="absolute h-4 rounded-full bg-white/85"
            style={{ top: `${cld.top}%`, left: cx, width: cld.size }}
          />
        );
      })}

      {/* far skyline, slow parallax */}
      <div
        className="absolute inset-x-0"
        style={{ top: "24%", transform: `translateX(${-(scroll * 0.3) % 800}px)` }}
      >
        <div className="flex">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex">
              {[13, 22, 10, 26, 18, 9, 24, 15].map((h, i) => (
                <div key={i} className="flex h-7 items-end" style={{ width: 100 }}>
                  <div className="w-full rounded-t-sm bg-zinc-600/40" style={{ height: h }} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* road */}
      <div className="absolute inset-x-0 bottom-0 h-[32%]">
        <div className="absolute inset-0 bg-zinc-700" />
        <div className="absolute inset-x-0 top-1 h-2.5 bg-zinc-300" />
        <div
          className="absolute left-0 top-[42%] h-[3px] w-full"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, rgba(255,255,255,0.3) 0 10px, transparent 10px 90px)",
            transform: `translateX(${-(scroll % 100)}px)`,
          }}
        />
        <div
          className="absolute left-0 top-[58%] h-[3px] w-full"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, rgba(251,191,36,0.85) 0 14px, transparent 14px 54px)",
            transform: `translateX(${-(scroll % 54)}px)`,
          }}
        />
      </div>

      {/* street props scrolling past */}
      {Array.from({ length: ROAD_TILES }).map((_, i) => {
        const x = (((i * ROAD_TILE - scroll) % wrap) + wrap) % wrap - 60;
        return (
          <div key={i} className="absolute" style={{ bottom: "32.5%", left: x }}>
            <StreetTile index={i} />
          </div>
        );
      })}

      {/* destination sign pin */}
      <div className="absolute bottom-[30%] left-3 z-10">
        <div className="flex items-center gap-1.5 rounded-md bg-emerald-800 px-2 py-1 shadow-md">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-300" />
          <span className="text-[9px] font-black uppercase tracking-wider text-white">
            {street}
          </span>
        </div>
      </div>

      {/* scooter */}
      <div
        className="absolute bottom-[6%] left-1/2 z-10"
        style={{
          transform: `translateX(-50%) rotate(${arrived ? 0 : lean}deg) translateY(${
            arrived ? 0 : -bob
          }px)`,
          transition: drive ? "none" : "transform 0.4s ease",
        }}
      >
        <Scooter />
      </div>

      {drive && !arrived && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-1/2 overflow-hidden">
          {[18, 34, 52, 70, 86].map((top, i) => (
            <span key={i} className="speedstreak" style={{ top: `${top}%`, animationDelay: `${i * 0.12}s` }} />
          ))}
        </div>
      )}

      {arrived && (
        <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center bg-emerald-950/40">
          <div className="anim-pop rounded-full bg-emerald-600 px-5 py-2 text-sm font-black text-white shadow-lg">
            Delivered!
          </div>
        </div>
      )}
    </div>
  );
}

function Scooter() {
  return (
    <svg viewBox="0 0 62 46" className="h-16 w-[104px] drop-shadow-md" aria-hidden="true">
      <g>
        <circle cx={15} cy={36} r={9} fill="none" stroke="#f5f5f4" strokeWidth={3.5} />
        <circle cx={15} cy={36} r={2.5} fill="#a8a29e" />
      </g>
      <g>
        <circle cx={46} cy={36} r={9} fill="none" stroke="#f5f5f4" strokeWidth={3.5} />
        <circle cx={46} cy={36} r={2.5} fill="#a8a29e" />
      </g>
      <path
        d="M15 36 L46 36 M15 36 L26 18 H34 M34 18 L46 36"
        stroke="#f59e0b"
        strokeWidth={3}
        fill="none"
        strokeLinejoin="round"
      />
      <path d="M20 18 Q26 14 33 15" stroke="#f59e0b" strokeWidth={3} fill="none" />
      <path d="M24 35 L42 31" stroke="#a8a29e" strokeWidth={2.5} />
      <rect x={18} y={28} width={10} height={6} rx={1.5} fill="#e11d48" />
    </svg>
  );
}

function StreetTile({ index }: { index: number }) {
  const k = index % 4;
  if (k === 0) {
    return <Building i={index} />;
  }
  if (k === 1) {
    return (
      <div className="flex items-end gap-2">
        {index % 8 === 1 && <StreetSign name={CROSS_STREETS[Math.floor(index / 2) % CROSS_STREETS.length]} />}
        <Building i={index} tall />
      </div>
    );
  }
  if (k === 2) {
    return (
      <div className="flex items-end gap-1.5">
        <Tree />
        <Tree />
        <Lamp />
      </div>
    );
  }
  return (
    <div className="flex items-end gap-2">
      <Building i={index + 3} />
      <Tree />
    </div>
  );
}

function Building({ i, tall }: { i: number; tall?: boolean }) {
  const palette = ["#b4693f", "#e0d7c6", "#90a08e", "#cc7f63"];
  const color = palette[i % palette.length];
  const roof = palette[(i + 1) % palette.length];
  const w = tall ? 128 : 104;
  const h = tall ? 84 : 58;
  const cols = tall ? 5 : 3;
  const rows = tall ? 5 : 3;
  return (
    <div className="relative" style={{ width: w, height: h }}>
      <div
        className="absolute left-1/2 top-0 z-10 h-2.5 w-[112%] -translate-x-1/2 rounded-sm"
        style={{ backgroundColor: roof }}
      />
      <div
        className="absolute inset-x-0 bottom-0 rounded-t-md border border-black/10"
        style={{ backgroundColor: color, height: h - 8 }}
      >
        <div
          className="grid content-center gap-x-2 gap-y-1.5 px-3 pt-2"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {Array.from({ length: cols * rows }).map((_, wi) => {
            const lit = (wi + i * 2) % 3 === 0;
            return (
              <div
                key={wi}
                className="h-2 rounded-[1px]"
                style={{
                  backgroundColor: lit ? "#fde68a" : "#3f3f46",
                  opacity: lit ? 0.95 : 0.5,
                }}
              />
            );
          })}
        </div>
        <div className="absolute bottom-0 left-1/2 h-6 w-7 -translate-x-1/2 rounded-t bg-[#4b3f35]" />
      </div>
    </div>
  );
}

function Tree() {
  return (
    <div className="relative" style={{ width: 34, height: 48 }}>
      <div className="absolute bottom-0 left-1/2 h-7 w-2 -translate-x-1/2 rounded-sm bg-[#7c5a3a]" />
      <div className="absolute bottom-6 left-1/2 h-10 w-14 -translate-x-1/2 rounded-[50%] bg-[#7aa66b]" />
      <div className="absolute bottom-9 left-2 h-6 w-6 rounded-[50%] bg-[#6b9c5c]" />
    </div>
  );
}

function Lamp() {
  return (
    <div className="relative" style={{ width: 22, height: 58 }}>
      <div className="absolute bottom-0 left-1/2 h-[54px] w-[3px] -translate-x-1/2 rounded bg-zinc-800" />
      <div className="absolute bottom-[50px] left-1/2 h-[3px] w-6 -translate-x-1/2 rounded bg-zinc-800" />
      <div className="absolute bottom-[50px] left-[16px] h-4 w-4 rounded-full bg-amber-200 shadow-[0_0_12px_4px_rgba(253,230,138,0.6)]" />
    </div>
  );
}

function StreetSign({ name }: { name: string }) {
  return (
    <div className="relative" style={{ width: 74, height: 40 }}>
      <div className="absolute bottom-0 left-6 h-10 w-1.5 bg-zinc-700" />
      <div className="absolute top-0 flex h-9 w-full items-center justify-center rounded-md bg-emerald-800 px-2 shadow-md">
        <span className="text-[9px] font-black uppercase tracking-wider text-white">
          {name}
        </span>
      </div>
    </div>
  );
}

function DeliveryPanel({
  road,
  street,
  warmth,
  blocksLeft,
  cooldown,
  pedal,
}: {
  road: number;
  street: string;
  warmth: number;
  blocksLeft: number;
  cooldown: number;
  pedal: () => void;
}) {
  const warmthPct = Math.round(warmth);
  const canPedal = cooldown <= 0;
  const drive = cooldown > 0;
  const arrived = blocksLeft <= 0;
  const warmColor =
    warmthPct >= 70
      ? "from-emerald-500 to-emerald-400"
      : warmthPct >= 45
        ? "from-amber-500 to-amber-400"
        : "from-red-500 to-red-400";
  return (
    <div className="flex flex-1 flex-col justify-center gap-4">
      <div className="card-paper rounded-2xl border border-amber-200 p-4 shadow-sm">
        <div className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700">
          <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
          Delivery address
        </div>
        <div className="text-lg font-black text-amber-950">{street}</div>
        <div className="mt-1 flex items-center gap-2 text-sm text-amber-800">
          <span className="text-amber-500">●</span>
          {blocksLeft > 0
            ? `${blocksLeft} block${blocksLeft > 1 ? "s" : ""} to go`
            : "Arriving!"}
        </div>
      </div>
      <div className="card-paper rounded-2xl border border-amber-200 p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-amber-700">
          <span>Warmth</span>
          <span
            className={`rounded-full px-2 py-0.5 ${
              warmthPct >= 70
                ? "bg-emerald-100 text-emerald-700"
                : warmthPct >= 45
                  ? "bg-amber-100 text-amber-700"
                  : "bg-red-100 text-red-700"
            }`}
          >
            {warmthPct}%
          </span>
        </div>
        <div className="h-5 w-full overflow-hidden rounded-full border border-zinc-200 bg-zinc-100">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${warmColor} transition-all duration-150`}
            style={{ width: `${warmthPct}%` }}
          />
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1 text-center text-[10px] font-bold uppercase tracking-wide">
          <span className="rounded bg-emerald-500/15 px-1 py-0.5 text-emerald-700">
            70+ = $14
          </span>
          <span className="rounded bg-amber-400/25 px-1 py-0.5 text-amber-700">
            45+ = $8
          </span>
          <span className="rounded bg-red-500/15 px-1 py-0.5 text-red-700">
            20+ = $3
          </span>
        </div>
      </div>
      <RoadScene road={road} drive={drive} street={street} arrived={arrived} />
      <button
        onClick={pedal}
        disabled={!canPedal}
        className="btn-primary rounded-full px-8 py-3 text-lg font-bold disabled:cursor-not-allowed disabled:opacity-40"
      >
        {canPedal ? "Pedal! (space)" : "pedaling..."}
      </button>
      {!canPedal && (
        <p className="-mt-2 text-center text-xs text-amber-800/60">
          catching your breath...
        </p>
      )}
    </div>
  );
}
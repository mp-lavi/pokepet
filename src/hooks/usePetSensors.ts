import { useCallback, useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Motion } from '@capacitor/motion';

export interface TiltOffset {
  x: number; // -1 to 1
  y: number; // -1 to 1
}

interface UsePetSensorsOptions {
  enabled: boolean;
  onPet: () => void;
  onPoke: (isOverPoked: boolean) => void;
  onShake: () => void;
}

const PET_HOLD_THRESHOLD_MS = 1000;
const PET_PULSE_INTERVAL_MS = 450;
const POKE_WINDOW_MS = 3000;
const OVER_POKE_COUNT = 5;
const SHAKE_DELTA_THRESHOLD = 16.5;
const SHAKE_COOLDOWN_MS = 750;

export async function triggerHapticLight() {
  try {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Light });
    } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(18);
    }
  } catch {
    // Ignore unsupported haptic errors
  }
}

export async function triggerHapticVibrate(duration = 160) {
  try {
    if (Capacitor.isNativePlatform()) {
      await Haptics.vibrate({ duration });
    } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(duration);
    }
  } catch {
    // Ignore unsupported haptic errors
  }
}

export async function triggerHapticMedium() {
  try {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(35);
    }
  } catch {
    // Ignore unsupported haptic errors
  }
}

export function usePetSensors({
  enabled,
  onPet,
  onPoke,
  onShake,
}: UsePetSensorsOptions) {
  const [tilt, setTilt] = useState<TiltOffset>({ x: 0, y: 0 });
  const [isPetting, setIsPetting] = useState(false);
  const [motionActive, setMotionActive] = useState(false);

  // Pointer gesture refs
  const pointerActiveRef = useRef(false);
  const pointerStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const pointerDownTimeRef = useRef<number>(0);
  const petMoveAccumulatedMsRef = useRef<number>(0);
  const lastMoveTimestampRef = useRef<number>(0);
  const lastPetPulseRef = useRef<number>(0);
  const movedDistanceRef = useRef<number>(0);
  const pokeTimestampsRef = useRef<number[]>([]);

  // Motion sensor refs
  const lastAccelRef = useRef<{ x: number; y: number; z: number } | null>(null);
  const lastShakeAtRef = useRef<number>(0);

  const onPetRef = useRef(onPet);
  const onPokeRef = useRef(onPoke);
  const onShakeRef = useRef(onShake);
  onPetRef.current = onPet;
  onPokeRef.current = onPoke;
  onShakeRef.current = onShake;

  const handleAccelSample = useCallback((ax: number, ay: number, az: number) => {
    // Smooth low-pass filter for tilt (-9.8..9.8 m/s^2 -> -1..1)
    const normX = Math.max(-1, Math.min(1, -ax / 7.5));
    const normY = Math.max(-1, Math.min(1, ay / 7.5));

    setTilt((prev) => ({
      x: prev.x * 0.78 + normX * 0.22,
      y: prev.y * 0.78 + normY * 0.22,
    }));

    const prev = lastAccelRef.current;
    lastAccelRef.current = { x: ax, y: ay, z: az };
    if (!prev) return;

    const delta = Math.sqrt(
      Math.pow(ax - prev.x, 2) +
        Math.pow(ay - prev.y, 2) +
        Math.pow(az - prev.z, 2)
    );

    const now = Date.now();
    if (delta > SHAKE_DELTA_THRESHOLD && now - lastShakeAtRef.current > SHAKE_COOLDOWN_MS) {
      lastShakeAtRef.current = now;
      onShakeRef.current();
    }
  }, []);

  // Subscribe to Capacitor Motion (native) or Web DeviceMotionEvent
  useEffect(() => {
    if (!enabled) return;

    let capRemove: (() => void) | null = null;
    let webAttached = false;

    const handleWebMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity ?? event.acceleration;
      if (!acc) return;
      const ax = acc.x ?? 0;
      const ay = acc.y ?? 0;
      const az = acc.z ?? 0;
      setMotionActive(true);
      handleAccelSample(ax, ay, az);
    };

    const startMotion = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const handle = await Motion.addListener('accel', (event) => {
            setMotionActive(true);
            handleAccelSample(
              event.accelerationIncludingGravity.x,
              event.accelerationIncludingGravity.y,
              event.accelerationIncludingGravity.z
            );
          });
          capRemove = () => {
            void handle.remove();
          };
          return;
        } catch {
          // Fall back to web DeviceMotionEvent
        }
      }

      if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
        window.addEventListener('devicemotion', handleWebMotion);
        webAttached = true;
      }
    };

    void startMotion();

    return () => {
      if (capRemove) capRemove();
      if (webAttached) {
        window.removeEventListener('devicemotion', handleWebMotion);
      }
    };
  }, [enabled, handleAccelSample]);

  const requestMotionPermission = useCallback(async () => {
    const dm = DeviceMotionEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };
    if (typeof dm?.requestPermission === 'function') {
      try {
        const res = await dm.requestPermission();
        return res === 'granted';
      } catch {
        return false;
      }
    }
    return true;
  }, []);

  const resetPointerGesture = useCallback(() => {
    pointerActiveRef.current = false;
    pointerStartPosRef.current = null;
    petMoveAccumulatedMsRef.current = 0;
    lastMoveTimestampRef.current = 0;
    movedDistanceRef.current = 0;
    setIsPetting(false);
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!enabled) return;
      pointerActiveRef.current = true;
      pointerStartPosRef.current = { x: e.clientX, y: e.clientY };
      pointerDownTimeRef.current = Date.now();
      petMoveAccumulatedMsRef.current = 0;
      lastMoveTimestampRef.current = Date.now();
      movedDistanceRef.current = 0;
    },
    [enabled]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!enabled || !pointerActiveRef.current) return;

      const now = Date.now();
      const start = pointerStartPosRef.current;
      if (start) {
        const dist = Math.hypot(e.clientX - start.x, e.clientY - start.y);
        movedDistanceRef.current = Math.max(movedDistanceRef.current, dist);
      }

      const dt = Math.min(200, now - lastMoveTimestampRef.current);
      lastMoveTimestampRef.current = now;

      // Accumulate continuous movement time over the pet
      if (movedDistanceRef.current > 8) {
        petMoveAccumulatedMsRef.current += dt;
      }

      if (petMoveAccumulatedMsRef.current >= PET_HOLD_THRESHOLD_MS) {
        setIsPetting(true);
        if (now - lastPetPulseRef.current >= PET_PULSE_INTERVAL_MS) {
          lastPetPulseRef.current = now;
          void triggerHapticLight();
          onPetRef.current();
        }
      }
    },
    [enabled]
  );

  const onPointerUp = useCallback(() => {
    if (!enabled || !pointerActiveRef.current) {
      resetPointerGesture();
      return;
    }

    const elapsed = Date.now() - pointerDownTimeRef.current;
    const wasPetting = petMoveAccumulatedMsRef.current >= PET_HOLD_THRESHOLD_MS;

    // Quick tap without dragging => Cutucada (Poke)
    if (!wasPetting && elapsed < 320 && movedDistanceRef.current < 18) {
      const now = Date.now();
      const recent = pokeTimestampsRef.current.filter((t) => now - t <= POKE_WINDOW_MS);
      recent.push(now);
      pokeTimestampsRef.current = recent;

      const isOverPoked = recent.length > OVER_POKE_COUNT;
      if (isOverPoked) {
        pokeTimestampsRef.current = []; // reset window after triggering dizzy/angry
        void triggerHapticVibrate(200);
      } else {
        void triggerHapticLight();
      }
      onPokeRef.current(isOverPoked);
    }

    resetPointerGesture();
  }, [enabled, resetPointerGesture]);

  const triggerSimulatedShake = useCallback(() => {
    const now = Date.now();
    if (now - lastShakeAtRef.current < SHAKE_COOLDOWN_MS) return;
    lastShakeAtRef.current = now;
    void triggerHapticMedium();
    onShakeRef.current();
  }, []);

  return {
    tilt,
    isPetting,
    motionActive,
    requestMotionPermission,
    triggerSimulatedShake,
    gestureHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: resetPointerGesture,
      onPointerLeave: resetPointerGesture,
    },
  };
}

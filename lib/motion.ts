export const spring = { type: "spring" as const, stiffness: 260, damping: 30 };
export const softSpring = { type: "spring" as const, stiffness: 200, damping: 26 };

export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};
export const riseItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: spring },
};

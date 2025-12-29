import { motion } from 'framer-motion'

export function BackgroundFlares() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Top center glow */}
      <div
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px]"
        style={{
          background: `radial-gradient(
            ellipse at center,
            rgba(168, 85, 247, 0.15) 0%,
            rgba(236, 72, 153, 0.05) 40%,
            transparent 70%
          )`,
          filter: 'blur(40px)',
        }}
      />

      {/* Right side accent */}
      <motion.div
        className="absolute top-20 -right-20 w-[300px] h-[300px]"
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background: `radial-gradient(
            circle,
            rgba(168, 85, 247, 0.3) 0%,
            transparent 70%
          )`,
          filter: 'blur(60px)',
        }}
      />

      {/* Bottom left accent */}
      <div
        className="absolute -bottom-20 -left-20 w-[400px] h-[300px]"
        style={{
          background: `radial-gradient(
            circle,
            rgba(34, 197, 94, 0.1) 0%,
            transparent 70%
          )`,
          filter: 'blur(80px)',
        }}
      />
    </div>
  )
}

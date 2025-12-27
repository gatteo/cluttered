import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  formatter?: (value: number) => string;
  className?: string;
}

export function AnimatedNumber({
  value,
  formatter = String,
  className = '',
}: AnimatedNumberProps) {
  const spring = useSpring(0, {
    mass: 1,
    stiffness: 75,
    damping: 15,
  });

  const display = useTransform(spring, (current) => formatter(Math.round(current)));

  const [displayValue, setDisplayValue] = useState(formatter(0));

  useEffect(() => {
    spring.set(value);

    const unsubscribe = display.on('change', (v) => {
      setDisplayValue(v);
    });

    return () => unsubscribe();
  }, [value, spring, display]);

  return (
    <motion.span className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {displayValue}
    </motion.span>
  );
}

import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  variant?: 'rect' | 'circle' | 'text';
  width?: string | number;
  height?: string | number;
}

export default function Skeleton({ className = '', variant = 'rect', width, height }: SkeletonProps) {
  const borderRadius = variant === 'circle' ? '50%' : variant === 'text' ? '4px' : '1rem';
  
  return (
    <motion.div
      className={`bg-white/5 relative overflow-hidden ${className}`}
      style={{ 
        width: width || '100%', 
        height: height || (variant === 'text' ? '1rem' : '100%'),
        borderRadius 
      }}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ 
        duration: 1.5, 
        repeat: Infinity, 
        ease: "easeInOut" 
      }}
    >
      <motion.div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{ 
          duration: 2, 
          repeat: Infinity, 
          ease: "linear" 
        }}
      />
    </motion.div>
  );
}

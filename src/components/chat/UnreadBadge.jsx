import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

export default function UnreadBadge({ count, className }) {
  if (!count || count === 0) return null;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={cn(
        'flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold',
        className
      )}
    >
      {count > 99 ? '99+' : count}
    </motion.div>
  );
}

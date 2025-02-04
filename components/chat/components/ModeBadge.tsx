import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { ModeType } from '../interfaces/Message';

interface BadgeProps {
  mode: ModeType;
  className?: string;
}

export const getBadgeStylesUtil = (mode: ModeType): string => {
  switch (mode) {
    case 'kid': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'expert': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'inshort': return 'bg-green-100 text-green-800 border-green-200';
    default: return '';
  }
};

export const ModeBadge = memo(({ mode, className = '' }: BadgeProps) => {
  if (!mode) return null;

  const label = {
    'kid': 'Kid-Friendly',
    'expert': 'Expert',
    'inshort': 'Concise'
  }[mode];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`mb-1 px-2 py-0.5 text-xs rounded-full border ${getBadgeStylesUtil(mode)} ${className}`}
    >
      {label}
    </motion.div>
  );
});

ModeBadge.displayName = 'ModeBadge';
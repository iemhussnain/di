'use client'

import { motion } from 'framer-motion'

/**
 * Container for staggered children animations
 */
export function StaggerContainer({ children, className = '', staggerDelay = 0.05 }) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * Individual item in stagger animation
 */
export function StaggerItem({ children, className = '' }) {
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  }

  return (
    <motion.div variants={item} className={className}>
      {children}
    </motion.div>
  )
}

/**
 * Table row with stagger animation
 */
export function StaggerTableRow({ children, className = '' }) {
  const item = {
    hidden: { opacity: 0, x: -20 },
    show: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
  }

  return (
    <motion.tr variants={item} className={className}>
      {children}
    </motion.tr>
  )
}

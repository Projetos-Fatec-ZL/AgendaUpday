import React from 'react';
import { motion } from 'framer-motion';

// O "icon: Icon" renomeia a prop 'icon' para 'Icon' para que possamos usá-la como um componente JSX.
export default function StatCard({ title, value, icon: Icon, gradient, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay, duration: 0.5 }}
      className={`p-6 rounded-xl text-white flex items-center justify-between ${gradient}`}
    >
      <div className="text-left">
        <p className="text-sm opacity-80">{title}</p>
        <p className="text-3xl font-bold">{value}</p>
      </div>
      <div className="bg-white/20 p-3 rounded-lg">
        {Icon && <Icon className="w-6 h-6" />}
      </div>
    </motion.div>
  );
}
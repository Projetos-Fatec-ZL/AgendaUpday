import { motion } from 'framer-motion';

export default function StatCard({ title, value, icon: Icon, gradient, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay, duration: 0.5 }}
      whileHover={{ y: -4, scale: 1.05 }} 
      className={`p-6 rounded-xl text-white flex items-center justify-between ${gradient} transition-shadow duration-200 hover:shadow-2xl`}
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
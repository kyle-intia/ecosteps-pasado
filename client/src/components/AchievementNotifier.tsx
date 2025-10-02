// client/src/components/AchievementNotifier.tsx - Continued
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const AchievementNotifier = ({ notifications = [], onDismiss, soundEnabled = true }) => {
  const [audioContext, setAudioContext] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.AudioContext) {
      const ctx = new (window.AudioContext || window.AudioContext)();
      setAudioContext(ctx);
    }
  }, []);

  const playAchievementSound = () => {
    if (!soundEnabled || !audioContext) return;
    
    try {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.warn('Could not play achievement sound:', error);
    }
  };

  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[0];
      if (!latestNotification.read && latestNotification.type === 'achievement_unlock') {
        playAchievementSound();
      }
    }
  }, [notifications, soundEnabled]);

  const getTierIcon = (tier) => {
    switch (tier) {
      case 'bronze': return '🥉';
      case 'silver': return '🥈';
      case 'gold': return '🥇';
      case 'platinum': return '💎';
      default: return '🏆';
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {notifications.slice(0, 3).map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 30,
              duration: 0.4 
            }}
          >
            <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <Trophy className="h-8 w-8 text-yellow-500" />
                        <motion.div
                          className="absolute -top-1 -right-1"
                          animate={{ 
                            scale: [1, 1.3, 1],
                            rotate: [0, 10, -10, 0]
                          }}
                          transition={{ 
                            duration: 0.6,
                            repeat: 2,
                            repeatType: "reverse"
                          }}
                        >
                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        </motion.div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 text-sm">
                          Achievement Unlocked!
                        </h4>
                        <span className="text-lg">
                          {getTierIcon(notification.achievement?.tier)}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-800">
                        {notification.achievement?.name}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {notification.achievement?.description}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                    onClick={() => onDismiss(notification.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default AchievementNotifier;
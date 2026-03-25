const User = require('../models/User');
const Snippet = require('../models/Snippet');

const ACHIEVEMENTS = [
  { id: 'first_snippet', name: 'First Contact', icon: '🚀' },
  { id: 'polyglot', name: 'Polyglot', icon: '🌍' },
  { id: 'socialite', name: 'Socialite', icon: '🤝' },
  { id: 'overachiever', name: 'Overachiever', icon: '🏆' },
];

async function checkAndAwardAchievements(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const snippets = await Snippet.find({ user_id: userId });
    const userAchievements = user.achievements.map(a => a.id);
    const newAchievements = [];

    // 1. First Contact
    if (snippets.length >= 1 && !userAchievements.includes('first_snippet')) {
      newAchievements.push(ACHIEVEMENTS.find(a => a.id === 'first_snippet'));
    }

    // 2. Polyglot (3+ languages)
    const languages = new Set(snippets.map(s => s.language));
    if (languages.size >= 3 && !userAchievements.includes('polyglot')) {
      newAchievements.push(ACHIEVEMENTS.find(a => a.id === 'polyglot'));
    }

    // 3. Overachiever (5+ snippets)
    if (snippets.length >= 5 && !userAchievements.includes('overachiever')) {
      newAchievements.push(ACHIEVEMENTS.find(a => a.id === 'overachiever'));
    }

    // 4. Socialite (received a like)
    const totalLikes = snippets.reduce((acc, s) => acc + (s.likes?.length || 0), 0);
    if (totalLikes >= 1 && !userAchievements.includes('socialite')) {
      newAchievements.push(ACHIEVEMENTS.find(a => a.id === 'socialite'));
    }

    if (newAchievements.length > 0) {
      user.achievements.push(...newAchievements);
      await user.save();
      return newAchievements;
    }

    return [];
  } catch (err) {
    console.error('Error awarding achievements:', err);
    return [];
  }
}

module.exports = { checkAndAwardAchievements };

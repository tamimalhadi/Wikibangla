/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  Timestamp, 
  FirebaseUser,
  OperationType,
  handleFirestoreError
} from './firebase';
import { Article, UserProfile, CATEGORIES } from './types';
import { Search, Menu, X, Plus, Edit, Trash2, Home, BookOpen, User, LogIn, LogOut, ChevronRight, Globe, TrendingUp, Clock, Hash } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// --- Context ---
interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// --- Components ---

const Navbar = ({ onSearch, onNavigate }: { onSearch: (q: string) => void, onNavigate: (page: string) => void }) => {
  const { user, profile, login, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-md">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div 
              className="flex items-center cursor-pointer group"
              onClick={() => onNavigate('home')}
            >
              <div className="bg-blue-600 text-white p-1.5 rounded-lg mr-2 group-hover:bg-blue-700 transition-colors">
                <BookOpen size={24} />
              </div>
              <span className="text-xl font-bold tracking-tight text-gray-900">
                Wiki<span className="text-blue-600">Bangla</span>.pro
              </span>
            </div>
          </div>

          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <input
                type="text"
                placeholder="নিবন্ধ খুঁজুন..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-full text-sm transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </form>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => onNavigate('editor')}
                  className="hidden sm:flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <Plus size={18} />
                  <span>তৈরি করুন</span>
                </button>
                <div className="flex items-center gap-2 group cursor-pointer" onClick={() => onNavigate('profile')}>
                  <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-gray-200" referrerPolicy="no-referrer" />
                  <span className="hidden lg:block text-sm font-medium text-gray-700">{user.displayName}</span>
                </div>
                <button onClick={logout} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <button 
                onClick={login}
                className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-all active:scale-95"
              >
                <LogIn size={18} />
                <span>লগইন</span>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden absolute top-16 left-0 w-full bg-white border-b border-gray-200 shadow-xl"
          >
            <div className="px-4 pt-2 pb-6 space-y-2">
              <form onSubmit={handleSearch} className="relative mb-4">
                <input
                  type="text"
                  placeholder="নিবন্ধ খুঁজুন..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
              </form>
              <button onClick={() => { onNavigate('home'); setIsMenuOpen(false); }} className="flex items-center gap-3 w-full p-3 text-gray-700 hover:bg-gray-50 rounded-xl">
                <Home size={20} />
                <span>হোম</span>
              </button>
              {user && (
                <button onClick={() => { onNavigate('editor'); setIsMenuOpen(false); }} className="flex items-center gap-3 w-full p-3 text-blue-600 hover:bg-blue-50 rounded-xl">
                  <Plus size={20} />
                  <span>নতুন নিবন্ধ</span>
                </button>
              )}
              <div className="pt-4 border-t border-gray-100">
                <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">বিভাগসমূহ</p>
                {CATEGORIES.map(cat => (
                  <button 
                    key={cat} 
                    onClick={() => { onSearch(cat); setIsMenuOpen(false); }}
                    className="flex items-center gap-3 w-full p-3 text-gray-600 hover:bg-gray-50 rounded-xl text-sm"
                  >
                    <Hash size={16} />
                    <span>{cat}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Sidebar = ({ onCategorySelect }: { onCategorySelect: (cat: string) => void }) => {
  return (
    <aside className="hidden lg:block w-64 flex-shrink-0">
      <div className="sticky top-24 space-y-8">
        <section>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <TrendingUp size={14} />
            জনপ্রিয় বিভাগ
          </h3>
          <div className="space-y-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => onCategorySelect(cat)}
                className="flex items-center justify-between w-full px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all group"
              >
                <span>{cat}</span>
                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </section>

        <section className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
          <h4 className="font-bold mb-2">অবদান রাখুন</h4>
          <p className="text-sm text-blue-100 mb-4 leading-relaxed">
            আপনার জ্ঞান সবার সাথে শেয়ার করুন এবং উইকিবাংলাকে সমৃদ্ধ করুন।
          </p>
          <button className="w-full py-2 bg-white text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-50 transition-colors">
            শুরু করুন
          </button>
        </section>
      </div>
    </aside>
  );
};

const ArticleCard = ({ article, onClick }: { article: Article, onClick: () => void }) => {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="group bg-white border border-gray-100 p-6 rounded-2xl hover:shadow-xl hover:border-blue-100 transition-all cursor-pointer"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-2">
          {article.categories?.slice(0, 2).map(cat => (
            <span key={cat} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider rounded-md">
              {cat}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1 text-gray-400 text-xs">
          <Clock size={12} />
          <span>{article.createdAt.toDate().toLocaleDateString('bn-BD')}</span>
        </div>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors leading-tight">
        {article.title}
      </h3>
      <p className="text-gray-600 text-sm line-clamp-3 mb-4 leading-relaxed">
        {article.content.replace(/[#*`]/g, '')}
      </p>
      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-500">
            {article.authorName?.[0]}
          </div>
          <span className="text-xs font-medium text-gray-500">{article.authorName}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Globe size={12} />
          <span>{article.views} ভিউ</span>
        </div>
      </div>
    </motion.div>
  );
};

const ArticleView = ({ article, onEdit, onDelete }: { article: Article, onEdit: () => void, onDelete: () => void }) => {
  const { user, profile } = useAuth();
  const canModify = user && (user.uid === article.authorId || profile?.role === 'admin' || profile?.role === 'editor');

  useEffect(() => {
    // Increment view count
    const incrementViews = async () => {
      try {
        await updateDoc(doc(db, 'articles', article.id), {
          views: article.views + 1
        });
      } catch (error) {
        console.error('Error incrementing views:', error);
      }
    };
    incrementViews();
  }, [article.id]);

  return (
    <motion.article 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
    >
      <div className="p-8 sm:p-12">
        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-6">
            {article.categories?.map(cat => (
              <span key={cat} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wider rounded-full">
                {cat}
              </span>
            ))}
          </div>
          <div className="flex justify-between items-start">
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 leading-tight mb-6">
              {article.title}
            </h1>
            {canModify && (
              <div className="flex gap-2">
                <button onClick={onEdit} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                  <Edit size={20} />
                </button>
                <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                  <Trash2 size={20} />
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500 border-b border-gray-100 pb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                {article.authorName?.[0]}
              </div>
              <span className="font-semibold text-gray-900">{article.authorName}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Clock size={16} />
              <span>আপডেট করা হয়েছে: {article.updatedAt.toDate().toLocaleDateString('bn-BD')}</span>
            </div>
          </div>
        </header>

        <div className="prose prose-blue max-w-none prose-headings:font-black prose-p:leading-relaxed prose-p:text-gray-700 prose-img:rounded-2xl">
          <ReactMarkdown>{article.content}</ReactMarkdown>
        </div>
      </div>
    </motion.article>
  );
};

const ArticleEditor = ({ article, onSave, onCancel }: { article?: Article, onSave: (data: Partial<Article>) => void, onCancel: () => void }) => {
  const [title, setTitle] = useState(article?.title || '');
  const [content, setContent] = useState(article?.content || '');
  const [selectedCats, setSelectedCats] = useState<string[]>(article?.categories || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleCategory = (cat: string) => {
    setSelectedCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    setIsSubmitting(true);
    await onSave({ title, content, categories: selectedCats });
    setIsSubmitting(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
    >
      <form onSubmit={handleSubmit} className="p-8 sm:p-12">
        <h2 className="text-3xl font-black text-gray-900 mb-8">
          {article ? 'নিবন্ধ সম্পাদনা করুন' : 'নতুন নিবন্ধ তৈরি করুন'}
        </h2>
        
        <div className="space-y-8">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">শিরোনাম</label>
            <input
              type="text"
              required
              className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl text-xl font-bold transition-all outline-none"
              placeholder="নিবন্ধের শিরোনাম লিখুন..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">বিভাগসমূহ</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-bold transition-all border-2",
                    selectedCats.includes(cat) 
                      ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200" 
                      : "bg-white border-gray-100 text-gray-500 hover:border-blue-200 hover:text-blue-500"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-bold text-gray-700">বিষয়বস্তু (Markdown সমর্থিত)</label>
              <span className="text-xs text-gray-400"># শিরোনাম, **বোল্ড**, *ইটালিক*</span>
            </div>
            <textarea
              required
              rows={15}
              className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl text-gray-700 leading-relaxed transition-all outline-none resize-none font-mono text-sm"
              placeholder="আপনার নিবন্ধের বিস্তারিত লিখুন..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-200 transition-all active:scale-95"
            >
              {isSubmitting ? 'সংরক্ষণ করা হচ্ছে...' : 'নিবন্ধ প্রকাশ করুন'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-8 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
            >
              বাতিল
            </button>
          </div>
        </div>
      </form>
    </motion.div>
  );
};

// --- Main App Component ---

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Fetch or create profile
        const profileDoc = await getDoc(doc(db, 'users', u.uid));
        if (profileDoc.exists()) {
          setProfile(profileDoc.data() as UserProfile);
        } else {
          const newProfile: UserProfile = {
            uid: u.uid,
            displayName: u.displayName || 'Anonymous',
            email: u.email || '',
            role: 'user',
            createdAt: Timestamp.now()
          };
          await setDoc(doc(db, 'users', u.uid), newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const WikiApp = () => {
  const { user, profile } = useAuth();
  const [page, setPage] = useState('home');
  const [articles, setArticles] = useState<Article[]>([]);
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'articles'), orderBy('createdAt', 'desc'), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
      setArticles(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'articles');
    });
    return () => unsubscribe();
  }, []);

  const handleSaveArticle = async (data: Partial<Article>) => {
    if (!user) return;
    try {
      if (currentArticle && page === 'editor') {
        // Update
        const path = `articles/${currentArticle.id}`;
        await updateDoc(doc(db, 'articles', currentArticle.id), {
          ...data,
          updatedAt: Timestamp.now()
        });
      } else {
        // Create
        const newArticleRef = doc(collection(db, 'articles'));
        const newArticle: Omit<Article, 'id'> = {
          title: data.title!,
          content: data.content!,
          authorId: user.uid,
          authorName: user.displayName || 'Anonymous',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          categories: data.categories || [],
          language: 'bn',
          views: 0
        };
        await setDoc(newArticleRef, newArticle);
      }
      setPage('home');
      setCurrentArticle(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'articles');
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে আপনি এই নিবন্ধটি মুছে ফেলতে চান?')) return;
    try {
      await deleteDoc(doc(db, 'articles', articleId));
      setPage('home');
      setCurrentArticle(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `articles/${articleId}`);
    }
  };

  const filteredArticles = articles.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.categories.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const seedData = async () => {
    if (profile?.role !== 'admin' && user?.email !== 'tamimalhadi2007@gmail.com') return;
    const initialArticles = [
      {
        title: 'বাংলা ভাষা ও সাহিত্যের ইতিহাস',
        content: '# বাংলা ভাষা ও সাহিত্যের ইতিহাস\n\nবাংলা ভাষা একটি ইন্দো-আর্য ভাষা, যা দক্ষিণ এশিয়ার বঙ্গ অঞ্চলের মানুষের প্রধান ভাষা। এটি বিশ্বের অন্যতম বহুল প্রচলিত ভাষা।\n\n## প্রাচীন যুগ\nবাংলা সাহিত্যের প্রাচীনতম নিদর্শন হলো **চর্যাপদ**। এটি অষ্টম থেকে দ্বাদশ শতাব্দীর মধ্যে রচিত বৌদ্ধ সহজিয়াদের গান।\n\n## মধ্যযুগ\nমধ্যযুগে মঙ্গলকাব্য, বৈষ্ণব পদাবলি এবং অনুবাদ সাহিত্যের ব্যাপক প্রসার ঘটে। শ্রীকৃষ্ণকীর্তন কাব্য এই যুগের অন্যতম প্রধান নিদর্শন।\n\n## আধুনিক যুগ\nঊনবিংশ শতাব্দীতে রাজা রামমোহন রায়, ঈশ্বরচন্দ্র বিদ্যাসাগর এবং বঙ্কিমচন্দ্র চট্টোপাধ্যায়ের হাত ধরে আধুনিক বাংলা গদ্যের সূচনা হয়। রবীন্দ্রনাথ ঠাকুর এবং কাজী নজরুল ইসলাম এই সাহিত্যকে বিশ্বদরবারে পৌঁছে দেন।',
        categories: ['ইতিহাস', 'সাহিত্য', 'সংস্কৃতি'],
        language: 'bn',
        views: 1250
      },
      {
        title: 'সুন্দরবন: বিশ্বের বৃহত্তম ম্যানগ্রোভ বন',
        content: '# সুন্দরবন\n\nসুন্দরবন হলো বঙ্গোপসাগর উপকূলবর্তী অঞ্চলে অবস্থিত একটি বিশাল বনভূমি যা বিশ্বের বৃহত্তম ম্যানগ্রোভ বন।\n\n## ভৌগোলিক অবস্থান\nএটি বাংলাদেশ ও ভারতের পশ্চিমবঙ্গ জুড়ে বিস্তৃত। এর অধিকাংশ এলাকা (প্রায় ৬০%) বাংলাদেশে অবস্থিত।\n\n## জীববৈচিত্র্য\nসুন্দরবন তার বিখ্যাত **রয়্যাল বেঙ্গল টাইগার**-এর জন্য পরিচিত। এছাড়া এখানে চিত্রা হরিণ, কুমির এবং অসংখ্য প্রজাতির পাখি ও উদ্ভিদ পাওয়া যায়।\n\n> "সুন্দরবন আমাদের জাতীয় সম্পদ, একে রক্ষা করা আমাদের সবার দায়িত্ব।"\n\n![Sundarbans](https://picsum.photos/seed/sundarbans/800/400)',
        categories: ['ভূগোল', 'বিজ্ঞান'],
        language: 'bn',
        views: 3420
      }
    ];

    try {
      for (const art of initialArticles) {
        const ref = doc(collection(db, 'articles'));
        await setDoc(ref, {
          ...art,
          authorId: user?.uid,
          authorName: user?.displayName,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
      }
      alert('Seed data added!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'articles');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar 
        onSearch={(q) => { setSearchQuery(q); setPage('home'); }} 
        onNavigate={(p) => { setPage(p); if (p !== 'editor') setCurrentArticle(null); }} 
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {page === 'home' && (
            <>
              <Sidebar onCategorySelect={(cat) => setSearchQuery(cat)} />
              <div className="flex-1">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 mb-2">
                      {searchQuery ? `"${searchQuery}" এর ফলাফল` : 'সাম্প্রতিক নিবন্ধসমূহ'}
                    </h2>
                    <p className="text-gray-500 font-medium">উইকিবাংলায় বর্তমানে {articles.length}টি নিবন্ধ রয়েছে</p>
                  </div>
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-64 bg-white rounded-2xl animate-pulse border border-gray-100" />
                    ))}
                  </div>
                ) : filteredArticles.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredArticles.map(article => (
                      <ArticleCard 
                        key={article.id} 
                        article={article} 
                        onClick={() => { setCurrentArticle(article); setPage('view'); }} 
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
                    <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Search className="text-gray-300" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">কোনো নিবন্ধ পাওয়া যায়নি</h3>
                    <p className="text-gray-500 mb-8">অন্য কোনো শব্দ দিয়ে চেষ্টা করুন অথবা নতুন নিবন্ধ তৈরি করুন।</p>
                    {user && (
                      <button 
                        onClick={() => setPage('editor')}
                        className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all"
                      >
                        নতুন নিবন্ধ তৈরি করুন
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {page === 'view' && currentArticle && (
            <div className="flex-1">
              <button 
                onClick={() => setPage('home')}
                className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-bold mb-8 transition-colors group"
              >
                <div className="p-1.5 bg-white border border-gray-200 rounded-lg group-hover:border-blue-200 group-hover:bg-blue-50">
                  <Home size={18} />
                </div>
                <span>হোমে ফিরে যান</span>
              </button>
              <ArticleView 
                article={currentArticle} 
                onEdit={() => setPage('editor')} 
                onDelete={() => handleDeleteArticle(currentArticle.id)}
              />
            </div>
          )}

          {page === 'editor' && (
            <div className="flex-1">
              <ArticleEditor 
                article={currentArticle || undefined} 
                onSave={handleSaveArticle} 
                onCancel={() => { setPage('home'); setCurrentArticle(null); }} 
              />
            </div>
          )}

          {page === 'profile' && user && (
            <div className="flex-1 max-w-2xl mx-auto">
              <div className="bg-white rounded-3xl p-12 border border-gray-100 shadow-sm text-center">
                <img src={user.photoURL || ''} alt="" className="w-32 h-32 rounded-full mx-auto mb-6 border-4 border-blue-50 shadow-xl" referrerPolicy="no-referrer" />
                <h2 className="text-3xl font-black text-gray-900 mb-2">{user.displayName}</h2>
                <p className="text-gray-500 mb-8">{user.email}</p>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-bold uppercase tracking-wider">
                  <User size={16} />
                  <span>{profile?.role || 'User'}</span>
                </div>
                
                <div className="flex justify-center gap-4 mt-12 pt-12 border-t border-gray-50">
                  <div className="text-center">
                    <p className="text-2xl font-black text-gray-900">{articles.filter(a => a.authorId === user.uid).length}</p>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">নিবন্ধসমূহ</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-gray-900">
                      {articles.filter(a => a.authorId === user.uid).reduce((acc, curr) => acc + curr.views, 0)}
                    </p>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">মোট ভিউ</p>
                  </div>
                </div>
                
                {profile?.role === 'admin' && (
                  <button 
                    onClick={seedData}
                    className="mt-8 text-xs text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    Seed Initial Data
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-12 mt-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="bg-gray-900 text-white p-1 rounded-md">
              <BookOpen size={20} />
            </div>
            <span className="text-lg font-bold text-gray-900">WikiBangla.pro</span>
          </div>
          <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto leading-relaxed">
            উইকিবাংলা একটি উন্মুক্ত বিশ্বকোষ, যেখানে যে কেউ অবদান রাখতে পারে। আমাদের লক্ষ্য বাংলা ভাষায় জ্ঞানকে সবার কাছে পৌঁছে দেওয়া।
          </p>
          <div className="flex justify-center gap-8 text-xs font-bold text-gray-400 uppercase tracking-widest">
            <a href="#" className="hover:text-blue-600 transition-colors">গোপনীয়তা নীতি</a>
            <a href="#" className="hover:text-blue-600 transition-colors">ব্যবহারের শর্তাবলী</a>
            <a href="#" className="hover:text-blue-600 transition-colors">আমাদের সম্পর্কে</a>
          </div>
          <p className="mt-12 text-xs text-gray-400">© ২০২৪ উইকিবাংলা.প্রো - সকল স্বত্ব সংরক্ষিত</p>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <WikiApp />
    </AuthProvider>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Clock, Star, Filter, Loader2, Bookmark } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import { searchService, SearchResult, SearchFilters } from '../services/searchService';
import { analyticsService } from '../services/analyticsService';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';

export function GlobalSearch() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      loadRecentSearches();
      loadSavedSearches();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.length > 2) {
      const debounce = setTimeout(() => {
        handleSearch();
      }, 300);
      return () => clearTimeout(debounce);
    } else {
      setResults([]);
    }
  }, [query, filters]);

  const loadRecentSearches = async () => {
    const history = await searchService.getSearchHistory(5);
    setRecentSearches(history);
  };

  const loadSavedSearches = async () => {
    const saved = await searchService.getSavedSearches();
    setSavedSearches(saved);
  };

  const handleSearch = async () => {
    if (query.length < 3) return;

    try {
      setLoading(true);
      const searchResults = await searchService.globalSearch(query, filters);
      setResults(searchResults);
      analyticsService.trackSearch(query, filters, searchResults.length);
    } catch (error) {
      console.error('Search failed:', error);
      analyticsService.trackError(error as Error, { context: 'global_search' });
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    analyticsService.trackClick(result.id, 'search_result', {
      type: result.type,
      query,
    });
    navigate(result.url);
    setIsOpen(false);
  };

  const handleSaveSearch = async () => {
    const name = prompt('Name this search:');
    if (name) {
      await searchService.saveSearch(name, query, filters);
      loadSavedSearches();
    }
  };

  const getResultIcon = (type: string) => {
    const icons: Record<string, string> = {
      job: '💼',
      event: '📅',
      marketplace: '🛒',
      education: '🎓',
      community: '👥',
      au_pair: '👶',
      visa: '✈️',
    };
    return icons[type] || '📄';
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <Search className="w-4 h-4 text-gray-600" />
        <span className="text-sm text-gray-600">{t('common.searchPlaceholder')}</span>
        <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-300 rounded text-xs">
          <span>⌘</span>K
        </kbd>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20 px-4">
          <div
            ref={searchRef}
            className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-gray-400" />
                <Input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('common.searchPlaceholder')}
                  className="flex-1 border-0 focus:ring-0"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="w-4 h-4" />
                </Button>
                {query && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSaveSearch}
                  >
                    <Bookmark className="w-4 h-4" />
                  </Button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {showFilters && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">{t('search.modules')}</label>
                    <Select
                      multiple
                      value={filters.modules?.join(',') || ''}
                      onChange={(e) => setFilters({ ...filters, modules: e.target.value.split(',') })}
                    >
                      <option value="job">{t('search.module.job')}</option>
                      <option value="event">{t('search.module.event')}</option>
                      <option value="marketplace">{t('search.module.marketplace')}</option>
                      <option value="education">{t('search.module.education')}</option>
                      <option value="community">{t('search.module.community')}</option>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">{t('search.location')}</label>
                    <Input
                      value={filters.location || ''}
                      onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                      placeholder={t('search.anyLocation')}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              )}

              {!loading && results.length > 0 && (
                <div className="divide-y divide-gray-100">
                  {results.map((result) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleResultClick(result)}
                      className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{getResultIcon(result.type)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900 truncate">{result.title}</h3>
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                              {t(`search.module.${result.type}`) || result.type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{result.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {!loading && query.length > 2 && results.length === 0 && (
                <div className="py-12 text-center text-gray-500">
                  <p>{t('common.noResults')} "{query}"</p>
                </div>
              )}

              {!query && (
                <div className="p-4 space-y-4">
                  {savedSearches.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        {t('search.savedSearches')}
                      </h3>
                      <div className="space-y-1">
                        {savedSearches.map((saved) => (
                          <button
                            key={saved.id}
                            onClick={() => {
                              setQuery(saved.query);
                              setFilters(saved.filters);
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 rounded"
                          >
                            {saved.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {recentSearches.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {t('search.recentSearches')}
                      </h3>
                      <div className="space-y-1">
                        {recentSearches.map((search) => (
                          <button
                            key={search.id}
                            onClick={() => {
                              setQuery(search.query);
                              setFilters(search.filters);
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 rounded"
                          >
                            <span className="text-gray-700">{search.query}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              ({search.result_count} {t('search.results')})
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span>↑↓ {t('search.navigate')}</span>
                  <span>↵ {t('search.select')}</span>
                  <span>ESC {t('search.close')}</span>
                </div>
                <span>{results.length} {t('search.results')}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

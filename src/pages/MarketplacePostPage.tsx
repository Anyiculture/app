import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { marketplaceService } from '../services/marketplaceService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { MultiSelectField } from '../components/ui/MultiSelectField';
import { useToast } from '../components/ui/Toast';
import { ShoppingBag, ArrowLeft, Upload, DollarSign, MapPin, MessageCircle, Package, Ruler, Loader2 } from 'lucide-react';
import { MARKETPLACE_CATEGORIES, CONDITION_OPTIONS, CURRENCY_OPTIONS, getSubcategories, getBrands, Subcategory, SIZE_OPTIONS } from '../constants/marketplaceCategories';
import { getCitiesForProvince, getAllProvinces } from '../constants/chinaLocations';
import { getCityCoordinates } from '../utils/geolocation';

export function MarketplacePostPage() {
  const { user } = useAuth();
  const { language, t } = useI18n();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [availableCities, setAvailableCities] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  const [availableSubcategories, setAvailableSubcategories] = useState<Subcategory[]>([]);
  const [isCustomBrand, setIsCustomBrand] = useState(false);
  
  const contactMethods = useMemo<{ value: string; label: string; id: string }[]>(() => [
    { value: 'in_app', label: t('marketplacePost.contact_methods.in_app') || 'In-app Messaging', id: 'in_app' },
    { value: 'phone', label: t('marketplacePost.contact_methods.phone') || 'Phone', id: 'phone' },
    { value: 'wechat', label: t('marketplacePost.contact_methods.wechat') || 'WeChat', id: 'wechat' },
    { value: 'email', label: t('marketplacePost.contact_methods.email') || 'Email', id: 'email' },
  ], [t]);

  const [formData, setFormData] = useState({
    // Basic Info
    title: '',
    title_zh: '',
    description: '',
    description_zh: '',
    price: '',
    currency: 'CNY',
    negotiable: false,
    
    // Category
    category: '',
    subcategory: '',
    
    // Product Details
    brand: '',
    model: '',
    color: '',
    size: '',
    dimensions: '',
    weight: '',
    material: '',
    quantity_available: '1',
    
    // Location
    location_province: '',
    location_city: '',
    location_area: '',
    meetup_location: '',
    
    // Condition
    condition: 'good',
    
    // Media
    images: [] as string[],
    
    // Contact
    contact_options: ['in_app'] as string[],
    contact_wechat: '',
    contact_email: '',
    contact_phone: '',
  });

  // Update cities when province changes
  useEffect(() => {
    if (selectedProvince) {
      const cities = getCitiesForProvince(selectedProvince);
      setAvailableCities(cities);
      setFormData(prev => ({ ...prev, location_province: selectedProvince, location_city: '' }));
    } else {
      setAvailableCities([]);
    }
  }, [selectedProvince]);

  // Update subcategories when category changes
  useEffect(() => {
    setIsCustomBrand(false); // Reset custom brand when category changes
    if (selectedCategory) {
      const subcats = getSubcategories(selectedCategory);
      setAvailableSubcategories(subcats);
      setFormData(prev => ({ ...prev, category: selectedCategory, subcategory: '', brand: '' }));
    } else {
      setAvailableSubcategories([]);
    }
  }, [selectedCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/signin');
      return;
    }

    // Validation
    if (!formData.title || !formData.description || !formData.price || !formData.category || 
        !formData.location_province || !formData.location_city || !formData.condition) {
      showToast('error', t('marketplacePost.requiredFields'));
      return;
    }

    if (formData.images.length === 0) {
      showToast('error', t('marketplacePost.toast.upload_one'));
      return;
    }

    if (formData.contact_options.length === 0) {
      showToast('error', t('marketplacePost.toast.select_contact'));
      return;
    }

    try {
      setLoading(true);
      
      // Get coordinates for the city if available
      const coordinates = getCityCoordinates(formData.location_city);
      
      const item = await marketplaceService.createItem({
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        negotiable: formData.negotiable,
        category: formData.category,
        subcategory: formData.subcategory || undefined,
        condition: formData.condition,
        
        // Product Details
        brand: formData.brand || undefined,
        model: formData.model || undefined,
        color: formData.color || undefined,
        size: formData.size || undefined,
        dimensions: formData.dimensions || undefined,
        weight: formData.weight || undefined,
        material: formData.material || undefined,
        quantity_available: parseInt(formData.quantity_available) || 1,
        
        // Location
        location_province: formData.location_province,
        location_city: formData.location_city,
        location_area: formData.location_area || undefined,
        meetup_location: formData.meetup_location || undefined,
        latitude: coordinates?.latitude,
        longitude: coordinates?.longitude,
        
        // Media
        images: formData.images,
        
        // Contact
        contact_options: formData.contact_options,
        contact_wechat: formData.contact_wechat || undefined,
      });
      
      showToast('success', t('marketplacePost.toast.create_success'));
      navigate(`/marketplace/${item.id}`);
    } catch (error: any) {
      console.error('Error creating item:', error);
      showToast('error', error.message || t('marketplacePost.toast.create_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | boolean | number | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (formData.images.length >= 10) {
      showToast('error', t('marketplacePost.toast.max_images'));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('error', t('marketplacePost.toast.image_size'));
      return;
    }

    try {
      setUploading(true);
      const url = await marketplaceService.uploadImage(file);
      setFormData(prev => ({ ...prev, images: [...prev.images, url] }));
      showToast('success', t('marketplacePost.toast.upload_success'));
    } catch (error: any) {
      console.error('Error uploading image:', error);
      showToast('error', error.message || t('marketplaceEdit.updateError'));
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  if (!user) {
    navigate(`/signin?returnTo=${encodeURIComponent(window.location.pathname)}`);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.redirecting')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/marketplace')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          {t('marketplacePost.backToMarketplace')}
        </button>

        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-blue-100 rounded-xl">
              <ShoppingBag className="text-blue-600" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('marketplacePost.title')}</h1>
              <p className="text-gray-600">{t('marketplacePost.subtitle')}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Seller Tips */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5">
              <h3 className="font-bold text-blue-900 mb-3 text-lg flex items-center gap-2">
                <ShoppingBag size={20} />
                {t('marketplacePost.tipsTitle')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                <div>
                  <p className="font-semibold mb-2">{t('marketplacePost.qualityListing')}</p>
                  <ul className="space-y-1">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>{t('marketplacePost.qualityTip1')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>{t('marketplacePost.qualityTip2')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>{t('marketplacePost.qualityTip3')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>{t('marketplacePost.qualityTip4')}</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold mb-2">{t('marketplacePost.staySafe')}</p>
                  <ul className="space-y-1">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>{t('marketplacePost.safetyTip1')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>{t('marketplacePost.safetyTip2')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>{t('marketplacePost.safetyTip3')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">✗</span>
                      <span>{t('marketplacePost.safetyTip4')}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                <Package size={20} />
                {t('marketplacePost.basicInfo')}
              </h2>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('marketplacePost.itemTitle')} *
                  </label>
                  <Input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder={t('marketplacePost.itemTitlePlaceholder')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('marketplacePost.description')} *
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder={t('marketplacePost.descriptionPlaceholder')}
                    rows={6}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Photos */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">{t('marketplacePost.photos')} *</h2>
              <p className="text-sm text-gray-500 mb-2">{t('marketplacePost.photosHelp')}</p>
              
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileUpload}
                />
                <Button 
                  type="button" 
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || formData.images.length >= 10}
                  className="flex items-center gap-2"
                >
                  {uploading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Upload size={16} />
                  )}
                  {uploading ? t('common.loading') : t('marketplacePost.addImage')}
                </Button>
              </div>

              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                  {formData.images.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                      {index === 0 && (
                        <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                          {t('marketplacePost.cover')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Category & Product Details */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">{t('marketplacePost.categoryDetails')}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('marketplacePost.category')} *
                  </label>
                  <Select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    required
                  >
                    <option value="">{t('marketplace.categories.select')}</option>
                    {MARKETPLACE_CATEGORIES.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {language === 'zh' ? category.name_zh : category.name_en}
                      </option>
                    ))}
                  </Select>
                </div>

                {availableSubcategories.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('marketplacePost.subcategory')} <span className="text-gray-500 text-xs">{t('marketplacePost.optional')}</span>
                    </label>
                    <Select
                      value={formData.subcategory}
                      onChange={(e) => handleChange('subcategory', e.target.value)}
                    >
                      <option value="">{t('marketplace.categories.subcategorySelect')}</option>
                      {availableSubcategories.map(subcat => (
                        <option key={subcat.id} value={subcat.id}>
                          {language === 'zh' ? subcat.name_zh : subcat.name_en}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('marketplacePost.condition')} *
                  </label>
                  <Select
                    value={formData.condition}
                    onChange={(e) => handleChange('condition', e.target.value)}
                    required
                  >
                    {CONDITION_OPTIONS.map(cond => (
                      <option key={cond.value} value={cond.value}>
                        {language === 'zh' ? cond.label_zh : cond.label_en}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('marketplacePost.brand')} <span className="text-gray-500 text-xs">{t('marketplacePost.optional')}</span>
                  </label>
                  {getBrands(formData.category).length > 0 ? (
                    <div className="space-y-2">
                      <Select
                        value={isCustomBrand ? 'other' : formData.brand}
                        onChange={(e) => {
                          if (e.target.value === 'other') {
                            setIsCustomBrand(true);
                            handleChange('brand', '');
                          } else {
                            setIsCustomBrand(false);
                            handleChange('brand', e.target.value);
                          }
                        }}
                      >
                        <option value="">{t('marketplacePost.selectBrand')}</option>
                        {getBrands(formData.category).map(brand => (
                          <option key={brand} value={brand}>{brand}</option>
                        ))}
                        <option value="other">{t('marketplacePost.otherBrand')}</option>
                      </Select>
                      {isCustomBrand && (
                        <Input
                          type="text"
                          value={formData.brand}
                          onChange={(e) => handleChange('brand', e.target.value)}
                          placeholder={t('marketplacePost.enterBrand')}
                          autoFocus
                        />
                      )}
                    </div>
                  ) : (
                    <Input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => handleChange('brand', e.target.value)}
                      placeholder={t('marketplacePost.brandPlaceholder')}
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('marketplacePost.model')} <span className="text-gray-500 text-xs">{t('marketplacePost.optional')}</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.model}
                    onChange={(e) => handleChange('model', e.target.value)}
                    placeholder={t('marketplacePost.modelPlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('marketplacePost.color')} <span className="text-gray-500 text-xs">{t('marketplacePost.optional')}</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.color}
                    onChange={(e) => handleChange('color', e.target.value)}
                    placeholder={t('marketplacePost.colorPlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('marketplacePost.size')} <span className="text-gray-500 text-xs">{t('marketplacePost.optional')}</span>
                  </label>
                  {formData.category === 'clothing' ? (
                    <Select
                      value={formData.size}
                      onChange={(e) => handleChange('size', e.target.value)}
                    >
                      <option value="">{t('marketplacePost.selectSize')}</option>
                      {SIZE_OPTIONS.clothing.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </Select>
                  ) : formData.category === 'electronics' ? (
                    <Select
                      value={formData.size}
                      onChange={(e) => handleChange('size', e.target.value)}
                    >
                      <option value="">{t('marketplacePost.selectSize')}</option>
                      {SIZE_OPTIONS.electronics.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </Select>
                  ) : (
                    <Input
                      type="text"
                      value={formData.size}
                      onChange={(e) => handleChange('size', e.target.value)}
                      placeholder={t('marketplacePost.sizePlaceholder')}
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Ruler size={14} className="inline mr-1" />
                    {t('marketplacePost.dimensions')} <span className="text-gray-500 text-xs">{t('marketplacePost.optional')}</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.dimensions}
                    onChange={(e) => handleChange('dimensions', e.target.value)}
                    placeholder={t('marketplacePost.dimensionsPlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('marketplacePost.weight')} <span className="text-gray-500 text-xs">{t('marketplacePost.optional')}</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.weight}
                    onChange={(e) => handleChange('weight', e.target.value)}
                    placeholder={t('marketplacePost.weightPlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('marketplacePost.material')} <span className="text-gray-500 text-xs">{t('marketplacePost.optional')}</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.material}
                    onChange={(e) => handleChange('material', e.target.value)}
                    placeholder={t('marketplacePost.materialPlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('marketplacePost.quantity')}
                  </label>
                  <Input
                    type="number"
                    value={formData.quantity_available}
                    onChange={(e) => handleChange('quantity_available', e.target.value)}
                    min="1"
                    placeholder="1"
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                <DollarSign size={20} />
                {t('marketplacePost.pricing')}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('marketplacePost.price')} *
                  </label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleChange('price', e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('marketplacePost.currency')}
                  </label>
                  <Select
                    value={formData.currency}
                    onChange={(e) => handleChange('currency', e.target.value)}
                  >
                    {CURRENCY_OPTIONS.map(curr => (
                      <option key={curr.value} value={curr.value}>
                        {curr.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="negotiable"
                  checked={formData.negotiable}
                  onChange={(e) => handleChange('negotiable', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="negotiable" className="ml-2 text-sm text-gray-700">
                  {t('marketplacePost.negotiable')}
                </label>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                <MapPin size={20} />
                {t('marketplacePost.location')}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('marketplacePost.province')} *
                  </label>
                  <Select
                    value={selectedProvince}
                    onChange={(e) => setSelectedProvince(e.target.value)}
                    required
                  >
                    <option value="">{t('marketplacePost.selectProvince')}</option>
                    {getAllProvinces().map(province => (
                      <option key={province.name_en} value={province.name_en}>
                        {language === 'zh' ? province.name_zh : province.name_en}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('marketplacePost.city')} *
                  </label>
                  <Select
                    value={formData.location_city}
                    onChange={(e) => handleChange('location_city', e.target.value)}
                    required
                    disabled={!selectedProvince}
                  >
                    <option value="">{t('marketplacePost.selectCity')}</option>
                    {availableCities.map(city => (
                      <option key={city.name_en} value={city.name_en}>
                        {language === 'zh' ? city.name_zh : city.name_en}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('marketplacePost.district')} <span className="text-gray-500 text-xs">{t('marketplacePost.optional')}</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.location_area}
                    onChange={(e) => handleChange('location_area', e.target.value)}
                    placeholder={t('marketplacePost.districtPlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('marketplacePost.meetupLocation')} <span className="text-gray-500 text-xs">{t('marketplacePost.optional')}</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.meetup_location}
                    onChange={(e) => handleChange('meetup_location', e.target.value)}
                    placeholder={t('marketplacePost.meetupPlaceholder')}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                <MessageCircle size={20} />
                {t('marketplacePost.contactInfo')}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <MultiSelectField
                    label={t('marketplacePost.preferredContact')}
                    options={contactMethods}
                    value={formData.contact_options}
                    onChange={(val) => handleChange('contact_options', val)}
                  />
                </div>

                {(formData.contact_options.includes('wechat')) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                       {t('marketplacePost.wechatId')} <span className="text-gray-500 text-xs">{t('marketplacePost.optional')}</span>
                    </label>
                    <Input
                      type="text"
                      value={formData.contact_wechat}
                      onChange={(e) => handleChange('contact_wechat', e.target.value)}
                      placeholder={t('marketplacePost.wechatPlaceholder')}
                    />
                  </div>
                )}

                {(formData.contact_options.includes('email')) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                       {t('marketplacePost.email')} *
                    </label>
                    <Input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => handleChange('contact_email', e.target.value)}
                      placeholder={t('marketplacePost.emailPlaceholder')}
                      required
                    />
                  </div>
                )}

                {(formData.contact_options.includes('phone')) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                       {t('marketplacePost.phone')} *
                    </label>
                    <Input
                      type="tel"
                      value={formData.contact_phone}
                      onChange={(e) => handleChange('contact_phone', e.target.value)}
                      placeholder={t('marketplacePost.phonePlaceholder')}
                      required
                    />
                  </div>
                )}
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
                <p className="font-medium text-gray-900 mb-1">{t('marketplacePost.privacyNotice')}</p>
                <p>
                  {t('marketplacePost.privacyText')}
                </p>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/marketplace')}
                className="flex-1"
                disabled={loading}
              >
                {t('marketplacePost.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={loading || formData.images.length === 0}
                className="flex-1"
              >
                {loading ? t('marketplacePost.posting') : t('marketplacePost.postItem')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

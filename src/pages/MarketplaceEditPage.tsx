import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { marketplaceService } from '../services/marketplaceService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { ArrowLeft, Upload, DollarSign, MapPin, MessageCircle, Package, Ruler } from 'lucide-react';
import { MARKETPLACE_CATEGORIES, CONDITION_OPTIONS, CURRENCY_OPTIONS, getSubcategories, Subcategory } from '../constants/marketplaceCategories';
import { getCitiesForProvince, getAllProvinces } from '../constants/chinaLocations';
import { Loading } from '../components/ui/Loading';

export function MarketplaceEditPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { language, t } = useI18n();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true); // Start loading true
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [availableCities, setAvailableCities] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [availableSubcategories, setAvailableSubcategories] = useState<Subcategory[]>([]);
  
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
    contact_method: 'in_app',
    contact_wechat: '',
  });

  const CONTACT_METHODS = [
    { value: 'in_app', label: t('marketplacePost.contact_methods.in_app') || 'In-app Messaging (Recommended)' },
    { value: 'phone', label: t('marketplacePost.contact_methods.phone') || 'Phone' },
    { value: 'wechat', label: t('marketplacePost.contact_methods.wechat') || 'WeChat' },
  ];

  // Load existing item data
  useEffect(() => {
    async function loadItem() {
      if (!id) return;
      try {
        const item = await marketplaceService.getItemById(id);
        if (!item) {
          alert(t('marketplace.itemNotFound'));
          navigate('/marketplace');
          return;
        }

        // Check ownership
        if (user && item.user_id !== user.id) {
          alert(t('marketplace.noPermission'));
          navigate('/marketplace');
          return;
        }

        // Populate form data
        setFormData({
          title: item.title,
          title_zh: item.title_zh || '',
          description: item.description,
          description_zh: item.description_zh || '',
          price: item.price.toString(),
          currency: item.currency || 'CNY',
          negotiable: item.negotiable || false,
          category: item.category,
          subcategory: item.subcategory || '',
          brand: item.brand || '',
          model: item.model || '',
          color: item.color || '',
          size: item.size || '',
          dimensions: item.dimensions || '',
          weight: item.weight || '',
          material: item.material || '',
          quantity_available: (item.quantity_available || 1).toString(),
          location_province: item.location_province || '',
          location_city: item.location_city,
          location_area: item.location_area || '',
          meetup_location: item.meetup_location || '',
          condition: item.condition,
          images: item.images || [],
          contact_method: item.contact_method || 'in_app',
          contact_wechat: item.contact_wechat || '',
        });

        // Trigger updates for category/province dependant states
        setSelectedCategory(item.category);
        setSelectedProvince(item.location_province || '');

      } catch (error) {
        console.error('Error loading item:', error);
        alert(t('marketplace.loadFailed'));
      } finally {
        setLoading(false);
      }
    }
    
    if (user) {
      loadItem();
    }
  }, [id, user, navigate]);

  // Update cities when province changes
  useEffect(() => {
    if (selectedProvince) {
      const cities = getCitiesForProvince(selectedProvince);
      setAvailableCities(cities);
      // Only reset city if it's not valid for the new province (avoid resetting on initial load)
      // Actually simpler to just let user re-select if needed, but for initial load we want to keep it.
       if (formData.location_city && !cities.some(c => c.name_en === formData.location_city)) {
          // This check is imperfect because cities list might be loaded after form data.
          // But since we set selectedProvince from item data, logic flow is tricky.
          // We'll trust the form data initially.
       } else if (!formData.location_city && cities.length > 0) {
          // Do nothing
       }
       
       // Update formData only if changed by user selection interaction?
       // To separate initial load from user change, we might need a flag or check if location_province changed from formData.
       if (selectedProvince !== formData.location_province) {
         setFormData(prev => ({ ...prev, location_province: selectedProvince, location_city: '' }));
       }
    } else {
      setAvailableCities([]);
    }
  }, [selectedProvince]);

  // Update subcategories when category changes
  useEffect(() => {
    if (selectedCategory) {
      const subcats = getSubcategories(selectedCategory);
      setAvailableSubcategories(subcats);
      if (selectedCategory !== formData.category) {
        setFormData(prev => ({ ...prev, category: selectedCategory, subcategory: '' }));
      }
    } else {
      setAvailableSubcategories([]);
    }
  }, [selectedCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;

    // Validation
    if (!formData.title || !formData.description || !formData.price || !formData.category || 
        !formData.location_province || !formData.location_city || !formData.condition) {
      alert(t('marketplace.fillRequired'));
      return;
    }

    if (formData.images.length === 0) {
      alert(t('marketplace.uploadRequired'));
      return;
    }

    try {
      setSaving(true);
      
      await marketplaceService.updateItem(id, {
        title: formData.title,
        title_zh: formData.title_zh || '',
        description: formData.description,
        description_zh: formData.description_zh || '',
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
        
        location_province: formData.location_province,
        location_city: formData.location_city,
        location_area: formData.location_area || undefined,
        meetup_location: formData.meetup_location || undefined,

        images: formData.images,
        contact_method: formData.contact_method,
        contact_wechat: formData.contact_wechat || undefined,
      });
      
      navigate(`/marketplace/${id}`);
    } catch (error) {
      console.error('Error updating item:', error);
      alert(t('marketplace.updateFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (formData.images.length >= 10) {
      alert(t('marketplace.maxImages'));
      return;
    }

    try {
      setUploadingImages(true);
      const uploadPromises = Array.from(files).slice(0, 10 - formData.images.length).map(file =>
        marketplaceService.uploadImage(file)
      );
      const urls = await Promise.all(uploadPromises);
      setFormData(prev => ({ ...prev, images: [...prev.images, ...urls] }));
    } catch (error) {
      console.error('Error uploading images:', error);
      alert(t('marketplace.uploadFailed'));
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!user) {
    navigate(`/signin?returnTo=${encodeURIComponent(window.location.pathname)}`);
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(id ? `/marketplace/${id}` : '/marketplace')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Listing
        </button>

        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Package className="text-blue-600" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('marketplaceDetail.editListing')}</h1>
              <p className="text-gray-600">{t('marketplaceDetail.description')}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Same form fields as PostPage, but pre-filled */}
            {/* Basic Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                <Package size={20} />
                {t('education.create.basicInformation')}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('community.createPost.title')} (English) *
                  </label>
                  <Input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="e.g., iPhone 13 Pro - Like New"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('community.createPost.title')} (中文) <span className="text-gray-500 text-xs">{t('auth.optional')}</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.title_zh}
                    onChange={(e) => handleChange('title_zh', e.target.value)}
                    placeholder="例如：iPhone 13 Pro - 九成新"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('marketplaceDetail.description')} (English) *
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Describe your item: condition, features, reason for selling, etc."
                    rows={6}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('marketplaceDetail.description')} (中文) <span className="text-gray-500 text-xs">{t('auth.optional')}</span>
                  </label>
                  <Textarea
                    value={formData.description_zh}
                    onChange={(e) => handleChange('description_zh', e.target.value)}
                    placeholder="描述您的物品：状况、特点、出售原因等"
                    rows={6}
                  />
                </div>
              </div>
            </div>

            {/* Photos */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">{t('events.create.eventPhotos')} *</h2>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files)}
                  className="hidden"
                  id="image-upload"
                  disabled={uploadingImages || formData.images.length >= 10}
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="text-gray-400 mb-2" size={48} />
                  <p className="text-sm text-gray-600 mb-1">
                    {uploadingImages ? 'Uploading...' : 'Click to upload images'}
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG up to 10MB each ({formData.images.length}/10)
                  </p>
                </label>
              </div>

              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                          Cover
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Category & Product Details */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">{t('marketplaceDetail.specifications')}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('marketplace.categories.category')} *
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
                      {t('marketplace.categories.subcategory')} <span className="text-gray-500 text-xs">{t('auth.optional')}</span>
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
                    {t('marketplaceDetail.specs.condition')} *
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
                    {t('marketplaceDetail.specs.brand')} <span className="text-gray-500 text-xs">{t('auth.optional')}</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => handleChange('brand', e.target.value)}
                    placeholder="e.g., Apple, IKEA, Nike"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('marketplaceDetail.specs.model')} <span className="text-gray-500 text-xs">{t('auth.optional')}</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.model}
                    onChange={(e) => handleChange('model', e.target.value)}
                    placeholder="e.g., iPhone 13 Pro"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('marketplaceDetail.specs.color')} <span className="text-gray-500 text-xs">{t('auth.optional')}</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.color}
                    onChange={(e) => handleChange('color', e.target.value)}
                    placeholder="e.g., Sierra Blue, Black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('marketplaceDetail.specs.size')} <span className="text-gray-500 text-xs">{t('auth.optional')}</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.size}
                    onChange={(e) => handleChange('size', e.target.value)}
                    placeholder="e.g., M, 42, 128GB"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Ruler size={14} className="inline mr-1" />
                    {t('marketplaceDetail.specs.dimensions')} <span className="text-gray-500 text-xs">{t('auth.optional')}</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.dimensions}
                    onChange={(e) => handleChange('dimensions', e.target.value)}
                    placeholder="e.g., 50cm x 30cm x 20cm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('marketplaceDetail.specs.weight')} <span className="text-gray-500 text-xs">{t('auth.optional')}</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.weight}
                    onChange={(e) => handleChange('weight', e.target.value)}
                    placeholder="e.g., 2.5kg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('marketplaceDetail.specs.material')} <span className="text-gray-500 text-xs">{t('auth.optional')}</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.material}
                    onChange={(e) => handleChange('material', e.target.value)}
                    placeholder="e.g., Cotton, Wood, Metal"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('marketplaceDetail.specs.available')}
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
                {t('marketplaceDetail.price')}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('marketplaceDetail.price')} *
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
                    {t('jobs.salary.currency.CNY')}
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
                  {t('marketplaceDetail.negotiable')}
                </label>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                <MapPin size={20} />
                {t('common.location')}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('jobPost.province')} *
                  </label>
                  <Select
                    value={selectedProvince}
                    onChange={(e) => setSelectedProvince(e.target.value)}
                    required
                  >
                    <option value="">{t('marketplace.post.location.selectProvince')}</option>
                    {getAllProvinces().map(province => (
                      <option key={province.name_en} value={province.name_en}>
                        {language === 'zh' ? province.name_zh : province.name_en}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('common.city')} *
                  </label>
                  <Select
                    value={formData.location_city}
                    onChange={(e) => handleChange('location_city', e.target.value)}
                    required
                    disabled={!selectedProvince}
                  >
                    <option value="">{t('marketplace.post.location.selectCity')}</option>
                    {availableCities.map(city => (
                      <option key={city.name_en} value={city.name_en}>
                        {language === 'zh' ? city.name_zh : city.name_en}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    District/Area (区) <span className="text-gray-500 text-xs">{t('auth.optional')}</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.location_area}
                    onChange={(e) => handleChange('location_area', e.target.value)}
                    placeholder="e.g., Chaoyang District"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('marketplaceDetail.preferredMeetup')} <span className="text-gray-500 text-xs">{t('auth.optional')}</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.meetup_location}
                    onChange={(e) => handleChange('meetup_location', e.target.value)}
                    placeholder="e.g., Sanlitun Mall, Subway Station"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                <MessageCircle size={20} />
                {t('admin.common.contact')}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('marketplaceDetail.contactMethod')} *
                  </label>
                  <Select
                    value={formData.contact_method}
                    onChange={(e) => handleChange('contact_method', e.target.value)}
                    required
                  >
                    {CONTACT_METHODS.map(method => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </Select>
                </div>

                {(formData.contact_method === 'wechat' || formData.contact_method === 'in_app') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('onboarding.wechatId')} <span className="text-gray-500 text-xs">{t('auth.optional')}</span>
                    </label>
                    <Input
                      type="text"
                      value={formData.contact_wechat}
                      onChange={(e) => handleChange('contact_wechat', e.target.value)}
                      placeholder="Your WeChat ID"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(id ? `/marketplace/${id}` : '/marketplace')}
                className="flex-1"
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving || uploadingImages || formData.images.length === 0}
                className="flex-1"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

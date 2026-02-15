import React, { useState, useEffect, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { ChevronRight, Shield, Truck, Phone, Mail, MapPin, Menu, X, Star, Users, Award, Clock, AlertCircle } from 'lucide-react';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Validate environment variables
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  console.error('Firebase configuration is incomplete. Please check your environment variables.');
  throw new Error('Firebase configuration is incomplete');
}

// Navigation structure
const navigationItems = [
  {
    name: "Refrigerators",
    key: "refrigerators",
    subcategories: [
      { name: "French Door", key: "french-door" },
      { name: "Side by Side", key: "side-by-side" },
      { name: "Top Freezer", key: "top-freezer" },
      { name: "Bottom Freezer", key: "bottom-freezer" }
    ]
  },
  {
    name: "Freezers",
    key: "freezers",
    subcategories: [
      { name: "Upright", key: "upright" },
      { name: "Chest", key: "chest" }
    ]
  },
  {
    name: "Washer/Dryer Sets",
    key: "washer-dryer-sets",
    subcategories: [
      { name: "Front Load", key: "front-load" },
      { name: "Top Load", key: "top-load" }
    ]
  },
  {
    name: "Washers",
    key: "washers",
    subcategories: [
      { name: "Front Load", key: "front-load" },
      { name: "Top Load", key: "top-load" }
    ]
  },
  {
    name: "Dryers",
    key: "dryers"
  },
  {
    name: "Dishwashers",
    key: "dishwashers"
  },
  {
    name: "Laundry Centers",
    key: "laundry-centers"
  },
  {
    name: "Stoves",
    key: "stoves",
    subcategories: [
      { name: "Electric Ranges", key: "electric-ranges" },
      { name: "Gas Ranges", key: "gas-ranges" },
      { name: "Wall Ovens", key: "wall-ovens" },
      { name: "Range Hoods", key: "range-hoods" }
    ]
  }
];

// Brand logos for scrolling section
const brands = [
  { name: "GE", logo: 'images/logos/gelogo.png' },
  { name: "Samsung", logo: 'images/logos/samsunglogo.png' },
  { name: "Whirlpool", logo: 'images/logos/whirlpoollogo.png' },
  { name: "LG", logo: 'images/logos/lglogo.jpg' },
  { name: "KitchenAid", logo: 'images/logos/kitchenaidlogo.png' },
  { name: "Frigidaire", logo: 'images/logos/frigidairelogo.png' },
  { name: "Maytag", logo: 'images/logos/maytaglogo.png' },
  { name: "Hotpoint", logo: 'images/logos/hotpointlogo.png' },
  { name: "Amana", logo: 'images/logos/amanalogo.svg' },
  { name: "Midea", logo: 'images/logos/midealogo.jpg' },
  { name: "Cafe", logo: 'images/logos/cafelogo1.jpg' },
  { name: "Bosch", logo: 'images/logos/boschlogo1.png' }
];

// Appliance categories for square tabs
const applianceCategories = [
  { name: "French Door Refrigerators", icon: "/images/category-icons/frenchdoorrefrigerators.webp", key: "french-door-refrigerators", filterType: "french-door" },
  { name: "Side by Side Refrigerators", icon: "/images/category-icons/sidebysiderefrigerators.webp", key: "side-by-side-refrigerators", filterType: "side-by-side" },
  { name: "Top Freezer Refrigerators", icon: "/images/category-icons/topfreezerrefrigerators.webp", key: "top-freezer-refrigerators", filterType: "top-freezer" },
  { name: "Freezers", icon: "/images/category-icons/freezers.jpeg", key: "freezers" },
  { name: "Washers", icon: "/images/category-icons/washers.webp", key: "washers" },
  { name: "Dryers", icon: "/images/category-icons/dryers.webp", key: "dryers" },
  { name: "Washer & Dryer Sets", icon: "/images/category-icons/washer&dryersets.avif", key: "washer-dryer-sets" },
  { name: "Dishwashers", icon: "/images/category-icons/dishwashers.webp", key: "dishwashers" },
  { name: "Laundry Centers", icon: "/images/category-icons/laundrycenters.avif", key: "laundry-centers" }
];

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full text-center">
            <div className="bg-red-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-6">
              We apologize for the inconvenience. Please refresh the page or contact support if the problem continues.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading Spinner Component
const LoadingSpinner = ({ size = "medium", text = "Loading..." }) => {
  const sizeClasses = {
    small: "h-4 w-4",
    medium: "h-8 w-8",
    large: "h-12 w-12"
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}></div>
      <p className="mt-2 text-gray-600 text-sm">{text}</p>
    </div>
  );
};

const ConfirmationDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", isDestructive = false }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
    >
      <div 
        className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl"
        style={{ zIndex: 10000 }}
      >
        <div className="flex items-center mb-4">
          <div className={`rounded-full p-2 mr-3 ${isDestructive ? 'bg-red-100' : 'bg-blue-100'}`}>
            <AlertCircle className={`h-6 w-6 ${isDestructive ? 'text-red-600' : 'text-blue-600'}`} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <p className="text-gray-600 mb-6 whitespace-pre-line">{message}</p>
        <div className="flex space-x-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-md text-white transition-colors ${
              isDestructive 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Form validation utilities
const validateForm = (formData, requiredFields = []) => {
  const errors = {};
  
  requiredFields.forEach(field => {
    if (!formData[field] || (typeof formData[field] === 'string' && formData[field].trim() === '')) {
      errors[field] = `${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`;
    }
  });

  // Email validation
  if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Price validation
  if (formData.msrp && (isNaN(formData.msrp) || parseFloat(formData.msrp) < 0)) {
    errors.msrp = 'MSRP must be a valid positive number';
  }

  if (formData.actualPrice && (isNaN(formData.actualPrice) || parseFloat(formData.actualPrice) < 0)) {
    errors.actualPrice = 'Actual price must be a valid positive number';
  }

  if (formData.msrp && formData.actualPrice && parseFloat(formData.actualPrice) > parseFloat(formData.msrp)) {
    errors.actualPrice = 'Actual price cannot be higher than MSRP';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Form Input Component with validation
const FormInput = ({ 
  label, 
  name, 
  type = "text", 
  value, 
  onChange, 
  error, 
  required = false, 
  placeholder = "", 
  className = "",
  ...props 
}) => {
  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value || ''}
        onChange={(e) => onChange(name, e.target.value)}
        className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
          error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500'
        }`}
        placeholder={placeholder}
        {...props}
      />
      {error && (
        <div className="mt-1 flex items-center text-sm text-red-600">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </div>
      )}
    </div>
  );
};

// Form Select Component with validation
const FormSelect = ({ 
  label, 
  name, 
  value, 
  onChange, 
  error, 
  required = false, 
  options = [], 
  placeholder = "Select an option",
  className = "",
  ...props 
}) => {
  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        id={name}
        name={name}
        value={value || ''}
        onChange={(e) => onChange(name, e.target.value)}
        className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
          error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500'
        }`}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <div className="mt-1 flex items-center text-sm text-red-600">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </div>
      )}
    </div>
  );
};

const ItemFormModal = React.memo(({ 
  showModal, 
  setShowModal, 
  editingItem, 
  setEditingItem, 
  handleSubmitItem,
  getSubcategoryOptions,
  uploadImageToFirebase,
  uploadVideoToFirebase
}) => {

    const [uploadingMedia, setUploadingMedia] = useState(false);

  // Local state for the form - isolated from parent
  const [itemForm, setItemForm] = useState({
    modelNumber: '',
    brand: '',
    description: '',
    msrp: '',
    actualPrice: '',
    category: '',
    subcategory: '',
    status: 'floor-display',
    images: [],
    videos: [],
    primaryImageIndex: 0
  });
  
  const [formErrors, setFormErrors] = useState({});

  // Reset form function
  const resetForm = useCallback(() => {
    setItemForm({
      modelNumber: '',
      brand: '',
      description: '',
      msrp: '',
      actualPrice: '',
      category: '',
      subcategory: '',
      status: 'floor-display',
      images: [],
      videos: [],
      primaryImageIndex: 0
    });
    setFormErrors({});
  }, []);

  // Reset form when modal opens/closes or editing item changes
  useEffect(() => {
    if (editingItem) {
      setItemForm({
        modelNumber: editingItem.modelNumber || '',
        brand: editingItem.brand || '',
        description: (editingItem.description || '').replace(/<br>/g, '\n'),
        msrp: editingItem.msrp?.toString() || '',
        actualPrice: editingItem.actualPrice?.toString() || '',
        category: editingItem.category || '',
        subcategory: editingItem.subcategory || '',
        status: editingItem.status || 'floor-display',
        images: editingItem.images || [],
        videos: editingItem.videos || [],
        primaryImageIndex: editingItem.primaryImageIndex || 0
      });
    } else if (showModal) {
      resetForm();
    }
    setFormErrors({});
  }, [editingItem, showModal, resetForm]);

  // Form change handlers - these won't trigger parent re-renders
  const handleFormChange = useCallback((field, value) => {
    setItemForm(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  }, [formErrors]);

  const handleCategoryChange = useCallback((field, value) => {
    setItemForm(prev => ({
      ...prev,
      [field]: value,
      subcategory: field === 'category' ? '' : prev.subcategory
    }));
    
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  }, [formErrors]);

  const handleImageUpload = useCallback(async (files) => {
  if (!files || files.length === 0) return;
  
  setUploadingMedia(`Uploading ${files.length} image(s)...`);
  
  try {
    const uploadPromises = Array.from(files).map(async (file, index) => {
      try {
        setUploadingMedia(`Uploading image ${index + 1} of ${files.length}...`);
        const url = await uploadImageToFirebase(file);
        console.log('Image uploaded successfully:', url); // Debug log
        return url;
      } catch (error) {
        console.error(`Failed to upload image ${index + 1}:`, error);
        alert(`Failed to upload image ${index + 1}: ${error.message}`);
        return null;
      }
    });
    
    const uploadedUrls = await Promise.all(uploadPromises);
    const successfulUploads = uploadedUrls.filter(url => url !== null);
    
    console.log('Successful uploads:', successfulUploads); // Debug log
    
    if (successfulUploads.length > 0) {
      setItemForm(prev => {
        const newForm = {
          ...prev,
          images: [...prev.images, ...successfulUploads]
        };
        console.log('Updated form with images:', newForm.images); // Debug log
        return newForm;
      });
    }
    
  } catch (error) {
    console.error('Error uploading images:', error);
    alert('Error uploading images. Please try again.');
  } finally {
    setUploadingMedia(false);
  }
}, [uploadImageToFirebase, setUploadingMedia]);

  const handleVideoUpload = useCallback(async (files) => {
  if (!files || files.length === 0) return;
  
  setUploadingMedia(`Uploading ${files.length} video(s)...`);
  
  try {
    const uploadPromises = Array.from(files).map(async (file, index) => {
      try {
        setUploadingMedia(`Uploading video ${index + 1} of ${files.length}...`);
        const url = await uploadVideoToFirebase(file);
        console.log('Video uploaded successfully:', url); // Debug log
        return url;
      } catch (error) {
        console.error(`Failed to upload video ${index + 1}:`, error);
        alert(`Failed to upload video ${index + 1}: ${error.message}`);
        return null;
      }
    });
    
    const uploadedUrls = await Promise.all(uploadPromises);
    const successfulUploads = uploadedUrls.filter(url => url !== null);
    
    console.log('Successful video uploads:', successfulUploads); // Debug log
    
    if (successfulUploads.length > 0) {
      setItemForm(prev => {
        const newForm = {
          ...prev,
          videos: [...prev.videos, ...successfulUploads]
        };
        console.log('Updated form with videos:', newForm.videos); // Debug log
        return newForm;
      });
    }
    
  } catch (error) {
    console.error('Error uploading videos:', error);
    alert('Error uploading videos. Please try again.');
  } finally {
    setUploadingMedia(false);
  }
}, [uploadVideoToFirebase, setUploadingMedia]);

  const setPrimaryImage = useCallback((index) => {
    setItemForm(prev => ({
      ...prev,
      primaryImageIndex: index
    }));
  }, []);

  const removeImage = useCallback((index) => {
    setItemForm(prev => {
      const newImages = prev.images.filter((_, i) => i !== index);
      const newPrimaryIndex = prev.primaryImageIndex >= newImages.length 
        ? Math.max(0, newImages.length - 1) 
        : prev.primaryImageIndex;
      
      return {
        ...prev,
        images: newImages,
        primaryImageIndex: newPrimaryIndex
      };
    });
  }, []);

  const removeVideo = useCallback((index) => {
    setItemForm(prev => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index)
    }));
  }, []);

  const handleLocalSubmit = useCallback(async (e) => {
  e.preventDefault();
  
  // Validate form locally first
  const requiredFields = ['modelNumber', 'brand', 'description', 'msrp', 'actualPrice', 'category', 'status'];
  const validation = validateForm(itemForm, requiredFields);
  
  if (!validation.isValid) {
    setFormErrors(validation.errors);
    return;
  }

  setUploadingMedia(true);
  
  try {
    await handleSubmitItem(e, itemForm, setFormErrors);
    // Form will be reset by the parent's success handling
  } catch (error) {
    console.error('Error in form submission:', error);
  } finally {
    setUploadingMedia(false);
  }
}, [handleSubmitItem, itemForm]);

  if (!showModal) return null;

  const brandOptions = [
    { value: "Samsung", label: "Samsung" },
    { value: "GE", label: "GE" },
    { value: "Whirlpool", label: "Whirlpool" },
    { value: "LG", label: "LG" },
    { value: "KitchenAid", label: "KitchenAid" },
    { value: "Frigidaire", label: "Frigidaire" },
    { value: "Maytag", label: "Maytag" },
    { value: "Hotpoint", label: "Hotpoint" },
    { value: "Amana", label: "Amana" },
    { value: "Midea", label: "Midea" },
    { value: "Cafe", label: "Cafe" },
    { value: "Bosch", label: "Bosch" }
  ];

  const categoryOptions = [
    { value: "refrigerators", label: "Refrigerators" },
    { value: "washers", label: "Washers" },
    { value: "dryers", label: "Dryers" },
    { value: "dishwashers", label: "Dishwashers" },
    { value: "freezers", label: "Freezers" },
    { value: "washer-dryer-sets", label: "Washer & Dryer Sets" },
    { value: "laundry-centers", label: "Laundry Centers" },
    { value: "stoves", label: "Stoves" }
  ];

  const subcategoryOptions = getSubcategoryOptions(itemForm.category).map(sub => ({
    value: sub,
    label: sub.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }));

  const statusOptions = [
    { value: "floor-display", label: "Floor/Display" },
    { value: "storage-archive", label: "Storage/Archive" },
    { value: "sold", label: "Sold" }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingItem ? 'Edit Item' : 'Add New Item'}
            </h2>
            <button
              onClick={() => {
                setShowModal(false);
                resetForm();
                setEditingItem(null);
                setFormErrors({});
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleLocalSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              label="Model Number"
              name="modelNumber"
              value={itemForm.modelNumber}
              onChange={handleFormChange}
              error={formErrors.modelNumber}
              required
              placeholder="e.g., RF28T5001SR"
            />

            <FormSelect
              label="Brand"
              name="brand"
              value={itemForm.brand}
              onChange={handleFormChange}
              error={formErrors.brand}
              required
              options={brandOptions}
              placeholder="Select Brand"
            />

            <FormSelect
              label="Category"
              name="category"
              value={itemForm.category}
              onChange={handleCategoryChange}
              error={formErrors.category}
              required
              options={categoryOptions}
              placeholder="Select Category"
            />

            <FormSelect
              label="Subcategory"
              name="subcategory"
              value={itemForm.subcategory}
              onChange={handleFormChange}
              error={formErrors.subcategory}
              options={subcategoryOptions}
              placeholder="Select Subcategory"
              disabled={!itemForm.category}
            />

            <FormInput
              label="MSRP"
              name="msrp"
              type="number"
              value={itemForm.msrp}
              onChange={handleFormChange}
              error={formErrors.msrp}
              required
              min="0"
              step="0.01"
              placeholder="e.g., 1899.99"
            />

            <FormInput
              label="Actual Price"
              name="actualPrice"
              type="number"
              value={itemForm.actualPrice}
              onChange={handleFormChange}
              error={formErrors.actualPrice}
              required
              min="0"
              step="0.01"
              placeholder="e.g., 1299.99"
            />

            <div className="md:col-span-2">
              <FormSelect
                label="Status"
                name="status"
                value={itemForm.status}
                onChange={handleFormChange}
                error={formErrors.status}
                required
                options={statusOptions}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={3}
              value={itemForm.description || ''}
              onChange={(e) => handleFormChange('description', e.target.value)}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                formErrors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500'
              }`}
              placeholder="Detailed description of the appliance..."
            />
            {formErrors.description && (
              <div className="mt-1 flex items-center text-sm text-red-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                {formErrors.description}
              </div>
            )}
          </div>

          {/* Media Upload Section */}
<div>
  <h3 className="text-lg font-medium text-gray-900 mb-4">Product Media</h3>
  
  {/* iPhone Help Section - ADD THIS HERE */}
  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
    <h4 className="text-sm font-semibold text-blue-900 mb-2">📱 iPhone Users - Avoid Upload Issues:</h4>
    <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
      <li>Open iPhone <strong>Settings</strong> → <strong>Camera</strong> → <strong>Formats</strong></li>
      <li>Select <strong>"Most Compatible"</strong> instead of "High Efficiency"</li>
      <li>New photos will save as JPG files that upload properly</li>
      <li>For existing HEIC photos, use the iPhone Photos app to share/export as JPG</li>
    </ol>
  </div>
  
  {/* Image Upload */}
  <div className="mb-6">
    <label htmlFor="image-upload" className="block text-sm font-medium text-gray-700 mb-2">
      Upload Images (Max 8 images, JPG/PNG only)
    </label>
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6">
                <input
                  type="file"
                  id="image-upload"
                  name="images"
                  multiple
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    if (e.target.files.length > 0) {
                      if (itemForm.images.length + e.target.files.length > 8) {
                        alert('Maximum 8 images allowed');
                        return;
                      }
                      handleImageUpload(e.target.files);
                    }
                  }}
                  className="hidden"
                  disabled={uploadingMedia}
                />
                <label 
                  htmlFor="image-upload" 
                  className={`cursor-pointer flex flex-col items-center ${uploadingMedia ? 'opacity-50' : ''}`}
                >
                  <div className="text-gray-500 mb-2">
                    {uploadingMedia ? (typeof uploadingMedia === 'string' ? uploadingMedia : 'Uploading...') : 'Click to upload images or take photos'}
                  </div>
                  <div className="text-sm text-gray-400">
                    JPG, PNG up to 10MB each
                  </div>
                </label>
              </div>
            </div>

            {/* Image Preview Grid */}
{itemForm.images && itemForm.images.length > 0 && (
  <div className="mb-6">
    <h4 className="text-sm font-medium text-gray-700 mb-3">Uploaded Images ({itemForm.images.length}/8)</h4>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {itemForm.images.map((image, index) => (
        <div key={index} className="relative group">
          <img
            src={image}
            alt={`Product ${index + 1}`}
            className="w-full h-32 object-cover rounded-lg border"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 flex space-x-2">
              <button
                type="button"
                onClick={() => setPrimaryImage(index)}
                className={`px-2 py-1 text-xs rounded ${
                  itemForm.primaryImageIndex === index
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {itemForm.primaryImageIndex === index ? 'Primary' : 'Set Primary'}
              </button>
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          </div>
          {itemForm.primaryImageIndex === index && (
            <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 text-xs rounded">
              Primary
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
)}

            {/* Video Upload */}
            <div className="mb-6">
              <label htmlFor="video-upload" className="block text-sm font-medium text-gray-700 mb-2">
                Upload Videos (Max 3 videos, MP4/MOV only)
              </label>
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6">
                <input
                  type="file"
                  id="video-upload"
                  name="videos"
                  multiple
                  accept="video/*"
                  capture="environment"
                  onChange={(e) => {
                    if (e.target.files.length > 0) {
                      if (itemForm.videos.length + e.target.files.length > 1) {
  alert('Maximum 1 video allowed');
  return;
}
                      handleVideoUpload(e.target.files);
                    }
                  }}
                  className="hidden"
                  disabled={uploadingMedia}
                />
                <label 
                  htmlFor="video-upload" 
                  className={`cursor-pointer flex flex-col items-center ${uploadingMedia ? 'opacity-50' : ''}`}
                >
                  <div className="text-gray-500 mb-2">
                    {uploadingMedia ? (typeof uploadingMedia === 'string' ? uploadingMedia : 'Uploading...') : 'Click to upload videos or record new ones'}
                  </div>
                  <div className="text-sm text-gray-400">
  MP4, MOV up to 75MB each (30-60 seconds in HD)
  <br />
  📱 <span className="text-orange-600 font-medium">Tip: Record horizontally (landscape) for best results</span>
</div>
                </label>
              </div>
            </div>

            {/* Video Preview Grid */}
{itemForm.videos && itemForm.videos.length > 0 && (
  <div className="mb-6">
    <h4 className="text-sm font-medium text-gray-700 mb-3">Uploaded Videos ({itemForm.videos.length}/1)</h4>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {itemForm.videos.map((videoUrl, index) => (
        <div key={`video-${index}-${videoUrl.slice(-10)}`} className="relative group">
          <video
            src={videoUrl}
            className="w-full h-32 object-cover rounded-lg border"
            preload="metadata"
            muted
            onError={(e) => {
              console.error('Video failed to load:', videoUrl);
              e.target.style.display = 'none';
            }}
            onLoadedMetadata={() => {
              console.log('Video loaded successfully:', videoUrl);
            }}
          />
          
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                const video = e.target.closest('.relative').querySelector('video');
                if (video.paused) {
                  video.controls = true;
                  video.style.height = 'auto';
                  video.style.minHeight = '200px';
                  video.play();
                } else {
                  video.pause();
                  video.controls = false;
                  video.style.height = '8rem';
                  video.style.minHeight = 'auto';
                }
              }}
              className="bg-black bg-opacity-50 rounded-full p-3 hover:bg-opacity-70 transition-all"
            >
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeVideo(index);
            }}
            className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded hover:bg-red-700 shadow-lg z-20"
            title="Remove video"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  </div>
)}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                resetForm();
                setEditingItem(null);
                setFormErrors({});
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={uploadingMedia}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploadingMedia}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {uploadingMedia ? (
                <>
                  <LoadingSpinner size="small" />
                  <span className="ml-2">Saving...</span>
                </>
              ) : (
                editingItem ? 'Update Item' : 'Add Item'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

// Inventory Filters Component (memoized to prevent re-renders)
const InventoryFilters = memo(({ filters, onFilterChange }) => {
  const searchInputRef = React.useRef(null);

  // Sync the input value without causing re-render
  React.useEffect(() => {
    if (searchInputRef.current && searchInputRef.current.value !== filters.search) {
      searchInputRef.current.value = filters.search;
    }
  }, [filters.search]);

  const handleSearchChange = (e) => {
    onFilterChange('search', e.target.value);
  };

  return (
    <div className="p-6 border-b border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Search */}
        <div className="lg:col-span-2">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search items..."
            defaultValue={filters.search}
            onChange={handleSearchChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Brand Filter */}
        <div>
          <select
            value={filters.brand}
            onChange={(e) => onFilterChange('brand', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Brands</option>
            <option value="Samsung">Samsung</option>
            <option value="GE">GE</option>
            <option value="Whirlpool">Whirlpool</option>
            <option value="LG">LG</option>
            <option value="KitchenAid">KitchenAid</option>
            <option value="Frigidaire">Frigidaire</option>
            <option value="Maytag">Maytag</option>
            <option value="Hotpoint">Hotpoint</option>
            <option value="Amana">Amana</option>
            <option value="Midea">Midea</option>
            <option value="Cafe">Cafe</option>
            <option value="Bosch">Bosch</option>
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={filters.category}
            onChange={(e) => onFilterChange('category', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Categories</option>
            <option value="refrigerators">Refrigerators</option>
            <option value="washers">Washers</option>
            <option value="dryers">Dryers</option>
            <option value="dishwashers">Dishwashers</option>
            <option value="freezers">Freezers</option>
            <option value="stoves">Stoves</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Status</option>
            <option value="floor-display">Floor/Display</option>
            <option value="storage-archive">Storage/Archive</option>
            <option value="sold">Sold</option>
          </select>
        </div>

        {/* Sort */}
        <div>
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange('sortBy', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="dateAdded-desc">Newest First</option>
            <option value="dateAdded-asc">Oldest First</option>
            <option value="brand-asc">Brand A-Z</option>
            <option value="brand-desc">Brand Z-A</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>
    </div>
  );
});

  // Admin Dashboard
  const AdminDashboard = memo(({
    user,
    signOut,
    isLoading,
    inventoryItems,
    filteredItems,
    inventoryFilters,
    handleInventoryFilterChange,
    handleAddItem,
    handleEditItem,
    handleDeleteItem,
    showAddItemModal,
    setShowAddItemModal,
    editingItem,
    setEditingItem,
    handleSubmitItem,
    getSubcategoryOptions,
    uploadImageToFirebase,
    uploadVideoToFirebase,
    confirmDialog,
    setCurrentPage,
    updatePageSEO,
    setSelectedCategory,
    setSelectedProduct
  }) => (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
              </div>
              <div className="flex items-center justify-center flex-1">
                <button
                  onClick={() => {
                    setCurrentPage('home');
                    updatePageSEO('home');
                    setSelectedCategory(null);
                    setSelectedProduct(null);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Back to Site
                </button>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Welcome, {user?.displayName}</span>
                {user?.photoURL && (
                  <img 
                    src={user.photoURL} 
                    alt="Profile" 
                    className="h-8 w-8 rounded-full"
                  />
                )}
                <button
                  onClick={signOut}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isLoading ? (
            <div className="flex justify-center items-center min-h-64">
              <LoadingSpinner size="large" text="Loading dashboard..." />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Stats Cards */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="bg-blue-500 rounded-lg p-3">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Items</p>
                      <p className="text-2xl font-semibold text-gray-900">{inventoryItems.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="bg-green-500 rounded-lg p-3">
                      <Award className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Floor Display</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {inventoryItems.filter(item => item.status === 'floor-display').length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="bg-yellow-500 rounded-lg p-3">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">In Storage</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {inventoryItems.filter(item => item.status === 'storage-archive').length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="bg-red-500 rounded-lg p-3">
                      <Star className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Sold</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {inventoryItems.filter(item => item.status === 'sold').length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Inventory Management Section */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                  <h2 className="text-lg font-semibold text-gray-900">Inventory Management</h2>
                  <button
                    onClick={handleAddItem}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Add New Item
                  </button>
                </div>

                {/* Search and Filters */}
                <InventoryFilters filters={inventoryFilters} onFilterChange={handleInventoryFilterChange} />

                {/* Items Table */}
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="w-full min-w-full"  style={{minWidth: '800px'}}>
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{item.modelNumber}</div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">{item.description}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
  <div className="flex-shrink-0 h-16 w-16">
    {item.images && Array.isArray(item.images) && item.images.length > 0 ? (
      <img
        src={item.images[item.primaryImageIndex || 0]}
        alt={`${item.brand} ${item.modelNumber}`}
        className="h-16 w-16 rounded-lg object-cover"
        onError={(e) => {
          console.error('Admin table image failed to load:', item.images[item.primaryImageIndex || 0]);
          e.target.src = '/images/placeholder-appliance.jpg';
        }}
        onLoad={() => {
          console.log('Admin table image loaded:', item.images[item.primaryImageIndex || 0]);
        }}
      />
    ) : (
      <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center">
        <span className="text-gray-400 text-xs">No Image</span>
      </div>
    )}
  </div>
</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.brand}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                            {item.category.replace('-', ' ')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">${item.actualPrice}</div>
                            <div className="text-sm text-gray-500 line-through">${item.msrp}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              item.status === 'floor-display' ? 'bg-green-100 text-green-800' :
                              item.status === 'storage-archive' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {item.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleEditItem(item)}
                              className="text-blue-600 hover:text-blue-900 mr-3 px-3 py-2 touch-manipulation min-h-[44px] inline-flex items-center"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item)}
                              className="text-red-600 hover:text-red-900 px-3 py-2 touch-manipulation min-h-[44px] inline-flex items-center"
                              data-delete-item={item.id}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {filteredItems.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No items found matching your criteria.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <ItemFormModal
  showModal={showAddItemModal}
  setShowModal={setShowAddItemModal}
  editingItem={editingItem}
  setEditingItem={setEditingItem}
  handleSubmitItem={handleSubmitItem}
  getSubcategoryOptions={getSubcategoryOptions}
  uploadImageToFirebase={uploadImageToFirebase}
  uploadVideoToFirebase={uploadVideoToFirebase}
/>
      </div>
    {confirmDialog.isOpen && createPortal(
      <ConfirmationDialog {...confirmDialog} />,
      document.body
    )}
    </ErrorBoundary>
  ));

function App() {

  // SEO Helper Function
const updatePageSEO = useCallback((page, category = null) => {
  const baseTitle = "Appliance House | Discount Appliances Nicholasville & Lexington KY";
  const baseDescription = "Premium scratch & dent appliances at unbeatable prices in Nicholasville, KY. Save up to 60% on refrigerators, washers, dryers, dishwashers. Serving Lexington area with full warranties.";
  
  let title = baseTitle;
  let description = baseDescription;

  switch (page) {
    case 'category':
      if (category) {
        const categoryName = category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
        title = `${categoryName} - Discount ${categoryName} Nicholasville KY | Appliance House`;
        description = `Shop discount ${categoryName.toLowerCase()} in Nicholasville, KY. Save up to 60% on premium ${categoryName.toLowerCase()} with full warranties. Serving Lexington area.`;
      }
      break;
    case 'financing':
      title = "Appliance Financing Options - Snap, Acima & Koalafi | Appliance House Nicholasville KY";
      description = "Flexible appliance financing with Snap Finance, Acima, and Koalafi. No credit needed options available. Koalafi accepts Chime! Get the appliances you need today in Nicholasville, KY.";
      break;
    case 'contact':
      title = "Contact Appliance House - Visit Our Nicholasville KY Showroom";
      description = "Visit our appliance showroom in Nicholasville, KY. Call (859) 402-6888 or email for discount appliance deals. Serving Lexington and surrounding areas.";
      break;
    default:
      title = baseTitle + " | Save up to 60%";
  }

  document.title = title;
  
  // Update meta description
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', description);
  }
}, []);

  // Detect admin route from URL
  const [currentPage, setCurrentPage] = useState(() => {
    return window.location.pathname === '/admin' ? 'admin' : 'home';
  });
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    brands: [],
    priceRange: '',
    type: '',
    minPrice: 0,
    maxPrice: 5000
  });

  // Admin authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Inventory management state
  const [inventoryItems, setInventoryItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [inventoryFilters, setInventoryFilters] = useState({
    search: '',
    brand: '',
    category: '',
    status: '',
    priceRange: '',
    sortBy: 'dateAdded-desc'
  });
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    isDestructive: false
  });

  const showConfirmDialog = (config) => {
    setConfirmDialog({
      isOpen: true,
      ...config,
      onCancel: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        if (config.onCancel) config.onCancel();
      }
    });
  };

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      try {
        const userDoc = await getDoc(doc(db, 'authorizedUsers', user.email));
        
        if (!userDoc.exists() || !userDoc.data()?.isApproved) {
          await firebaseSignOut(auth);
          alert(`Access denied. Email "${user.email}" is not authorized to access the admin panel.`);
          setIsLoading(false);
          return;
        }
        
        setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: userDoc.data()?.role || 'admin'
        });
        setIsAuthenticated(true);
        
      } catch (authCheckError) {
        console.log('Authorization check failed:', authCheckError);
        await firebaseSignOut(auth);
        alert(`Access denied. Email "${user.email}" is not authorized to access the admin panel.`);
      }
      
    } catch (error) {
      console.error('Sign-in error:', error);
      alert('Sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setIsAuthenticated(false);
      window.history.pushState({}, '', '/');
      setCurrentPage('home');
      updatePageSEO('home');
    } catch (error) {
      console.error('Sign-out error:', error);
    }
  };

  // Initialize inventory data from Firebase
  useEffect(() => {
    // Mock inventory data (replace with Firebase data)
    const mockInventoryItems = [
      {
        id: '1',
        modelNumber: 'RF28T5001SR',
        brand: 'Samsung',
        description: '28 cu. ft. Large Capacity 3-Door French Door Refrigerator',
        msrp: 1899,
        actualPrice: 1299,
        category: 'refrigerators',
        subcategory: 'french-door',
        status: 'floor-display',
        images: [],
        videos: [],
        primaryImageIndex: 0,
        dateAdded: new Date('2024-01-15')
      },
      {
        id: '2',
        modelNumber: 'WF45T6000AW',
        brand: 'Samsung',
        description: '4.5 cu. ft. Front Load Washer with Steam',
        msrp: 899,
        actualPrice: 649,
        category: 'washers',
        subcategory: 'front-load',
        status: 'storage-archive',
        images: [],
        videos: [],
        primaryImageIndex: 0,
        dateAdded: new Date('2024-02-01')
      },
      {
        id: '3',
        modelNumber: 'FFSS2615TS',
        brand: 'Frigidaire',
        description: '25.5 Cu. Ft. Side-by-Side Refrigerator',
        msrp: 1299,
        actualPrice: 899,
        category: 'refrigerators',
        subcategory: 'side-by-side',
        status: 'sold',
        images: [],
        videos: [],
        primaryImageIndex: 0,
        dateAdded: new Date('2024-01-20')
      }
    ];

    const fetchInventoryFromFirebase = async () => {
      try {
        setIsLoading(true);
        const querySnapshot = await getDocs(collection(db, 'products'));
        const items = [];
        querySnapshot.forEach((doc) => {
          items.push({
            id: doc.id,
            ...doc.data(),
            dateAdded: doc.data().dateAdded?.toDate() || new Date(),
            lastModified: doc.data().lastModified?.toDate() || new Date()
          });
        });
        setInventoryItems(items);
        setFilteredItems(items);
      } catch (error) {
        console.error('Error fetching inventory:', error);
        setInventoryItems(mockInventoryItems);
        setFilteredItems(mockInventoryItems);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInventoryFromFirebase();
  }, []);

  // Filter and sort inventory items
  useEffect(() => {
    let filtered = [...inventoryItems];

    if (inventoryFilters.search) {
      const searchTerm = inventoryFilters.search.toLowerCase();
      filtered = filtered.filter(item => 
        item.modelNumber.toLowerCase().includes(searchTerm) ||
        item.brand.toLowerCase().includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm)
      );
    }

    if (inventoryFilters.brand) {
      filtered = filtered.filter(item => item.brand === inventoryFilters.brand);
    }

    if (inventoryFilters.category) {
      filtered = filtered.filter(item => item.category === inventoryFilters.category);
    }

    if (inventoryFilters.status) {
      filtered = filtered.filter(item => item.status === inventoryFilters.status);
    }

    if (inventoryFilters.priceRange) {
      const [min, max] = inventoryFilters.priceRange.split('-').map(Number);
      filtered = filtered.filter(item => {
        if (max) {
          return item.actualPrice >= min && item.actualPrice <= max;
        } else {
          return item.actualPrice >= min;
        }
      });
    }

    const [sortField, sortDirection] = inventoryFilters.sortBy.split('-');
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === 'dateAdded') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    setFilteredItems(filtered);
  }, [inventoryItems, inventoryFilters]);

  // Handle inventory filter changes
  const handleInventoryFilterChange = useCallback((key, value) => {
    setInventoryFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const compressAndFixOrientation = (file, maxWidth = 1200, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width = (width * maxWidth) / height;
            height = maxWidth;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
  (blob) => {
    const compressedFile = new File([blob], file.name, {
      type: 'image/jpeg',
      lastModified: Date.now()
    });
    resolve(compressedFile);
  },
  'image/jpeg',
  quality
);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const uploadImageToFirebase = async (file) => {
  try {
    if (!file.type.startsWith('image/')) {
  throw new Error('File must be an image');
}

    console.log(`Original file size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    
    let processedFile = file;
    if (file.size > 1024 * 1024 || file.size > 500 * 1024) {
      console.log('Compressing image...');
      processedFile = await compressAndFixOrientation(file, 1200, 0.8);
      console.log(`Compressed file size: ${(processedFile.size / 1024 / 1024).toFixed(2)}MB`);
    }
    
    if (processedFile.size > 5 * 1024 * 1024) {
      throw new Error('Image is still too large after compression. Please try a different image.');
    }
    
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileName = `${timestamp}_${randomString}.jpg`;
    
    // Store images in products/images/ folder
    const imageRef = ref(storage, `products/images/${fileName}`);
    
    console.log('Starting upload for file:', fileName);
    
    const metadata = {
      contentType: 'image/jpeg',
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString()
      }
    };
    
    const snapshot = await uploadBytes(imageRef, processedFile, metadata);
    console.log('Upload completed:', snapshot);
    
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('Download URL obtained:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('Detailed upload error:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }
};

  const uploadVideoToFirebase = async (file) => {
    try {
      if (!file.type.startsWith('video/')) {
        throw new Error('File must be a video');
      }
      
      console.log(`Original video size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      
      if (file.size > 75 * 1024 * 1024) {
        throw new Error('Video file is too large. Please use a video under 75MB.');
      }
      
      let processedFile = file;
      
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop() || 'mp4';
      const fileName = `${timestamp}_${randomString}.${fileExtension}`;
      
      const videoRef = ref(storage, `products/videos/${fileName}`);
      
      console.log('Starting video upload for file:', fileName);
      
      const metadata = {
        contentType: file.type,
        customMetadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
          fileSize: file.size.toString()
        }
      };
      
      const snapshot = await uploadBytes(videoRef, processedFile, metadata);
      console.log('Video upload completed:', snapshot);
      
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('Video download URL obtained:', downloadURL);
      
      return downloadURL;
    } catch (error) {
      console.error('Detailed video upload error:', error);
      throw new Error(`Video upload failed: ${error.message}`);
    }
  };

  const deleteMediaFromStorage = async (mediaUrls) => {
  if (!mediaUrls || mediaUrls.length === 0) {
    console.log('No media URLs provided for deletion');
    return { deleted: 0, failed: 0, errors: [] };
  }

  console.log('🗑️ Starting media deletion process...');
  console.log('Media URLs to delete:', mediaUrls);

  let deleted = 0;
  let failed = 0;
  const errors = [];

  for (let i = 0; i < mediaUrls.length; i++) {
    const url = mediaUrls[i];
    console.log(`\n--- Processing file ${i + 1}/${mediaUrls.length} ---`);
    console.log(`URL: ${url}`);
    
    try {
      // Validate URL
      if (!url || typeof url !== 'string' || url.trim() === '') {
        console.warn('❌ Empty or invalid URL, skipping');
        continue;
      }

      if (!url.includes('firebasestorage.googleapis.com')) {
        console.warn('❌ Not a Firebase Storage URL, skipping');
        continue;
      }

      // Method 1: Try using Firebase Storage's refFromURL
      try {
        console.log('🔄 Attempting deletion using refFromURL...');
        const fileRef = ref(storage, url);
        await deleteObject(fileRef);
        console.log('✅ Successfully deleted using refFromURL');
        deleted++;
        continue;
      } catch (refFromUrlError) {
        console.log('❌ refFromURL failed, trying manual parsing...', refFromUrlError.message);
      }

      // Method 2: Manual URL parsing
      try {
        console.log('🔄 Attempting manual URL parsing...');
        
        const urlObj = new URL(url);
        console.log('Parsed URL object:', {
          origin: urlObj.origin,
          pathname: urlObj.pathname,
          search: urlObj.search
        });
        
        // Extract path from Firebase Storage URL
        // Format: https://firebasestorage.googleapis.com/v0/b/project.appspot.com/o/path%2Fto%2Ffile.jpg?alt=media&token=...
        const pathMatch = urlObj.pathname.match(/\/v0\/b\/[^/]+\/o\/(.+)/);
        
        if (!pathMatch || !pathMatch[1]) {
          throw new Error('Could not extract file path from URL pathname');
        }
        
        let filePath = pathMatch[1];
        
        // Remove any query parameters that might be in the path
        if (filePath.includes('?')) {
          filePath = filePath.split('?')[0];
        }
        
        // Decode the URL-encoded path
        filePath = decodeURIComponent(filePath);
        console.log(`Extracted and decoded file path: ${filePath}`);
        
        // Create file reference and delete
        const fileRef = ref(storage, filePath);
        await deleteObject(fileRef);
        
        console.log('✅ Successfully deleted using manual parsing');
        deleted++;
        
      } catch (manualError) {
        console.error('❌ Manual parsing also failed:', manualError);
        throw manualError;
      }
      
    } catch (error) {
      console.error(`❌ Failed to delete ${url}:`, error);
      
      // Check if file doesn't exist (which is actually success)
      if (error.code === 'storage/object-not-found') {
        console.log('✅ File already deleted or never existed');
        deleted++;
      } else {
        failed++;
        errors.push(`${url}: ${error.message}`);
      }
    }
  }

  const summary = {
    deleted,
    failed,
    errors,
    total: mediaUrls.length
  };
  
  console.log('\n🏁 Media deletion summary:', summary);
  return summary;
};

  const handleDeleteItem = async (item) => {
  showConfirmDialog({
    title: 'Delete Item',
    message: `Are you sure you want to delete this item?\n\nModel: ${item.modelNumber}\nBrand: ${item.brand}\n\nThis will permanently delete the item and all its images/videos.`,
    confirmText: 'Delete',
    isDestructive: true,
    onConfirm: async () => {
      try {
        setIsLoading(true);
        
        console.log(`🗑️ Starting deletion process for item: ${item.id}`);
        
        // Log current user for debugging
const currentUser = auth.currentUser;
console.log('🔐 Current authenticated user:', {
  email: currentUser?.email,
  emailVerified: currentUser?.emailVerified,
  uid: currentUser?.uid
});
        
        // Collect all media URLs
        const allMediaUrls = [
          ...(Array.isArray(item.images) ? item.images : []),
          ...(Array.isArray(item.videos) ? item.videos : [])
        ].filter(url => url && typeof url === 'string' && url.trim() !== '');
        
        console.log(`Found ${allMediaUrls.length} media files to delete:`, allMediaUrls);
        
        // Delete media files first
        if (allMediaUrls.length > 0) {
          console.log('🔄 Deleting media files...');
          const mediaResult = await deleteMediaFromStorage(allMediaUrls);
          console.log('📊 Media deletion result:', mediaResult);
          
          if (mediaResult.failed > 0) {
            console.warn(`⚠️ Some media files could not be deleted:`, mediaResult.errors);
          }
        } else {
          console.log('📝 No media files to delete');
        }

        // Delete the document from Firestore
        console.log('🔄 Deleting item document from Firestore...');
        await deleteDoc(doc(db, 'products', item.id));
        
        // Update local state
        setInventoryItems(prev => prev.filter(i => i.id !== item.id));
        
        console.log(`✅ Successfully deleted item: ${item.id}`);
        
        // Close dialog and show success
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        
        setTimeout(() => {
          alert(`Item deleted successfully!\n\nProcessed ${allMediaUrls.length} media files.\n\nCheck the browser console for detailed deletion logs.`);
        }, 100);
        
      } catch (error) {
        console.error('💥 Error deleting item:', error);
        
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        
        setTimeout(() => {
          alert(`Error deleting item: ${error.message}\n\nCheck the browser console for more details.`);
        }, 100);
        
      } finally {
        setIsLoading(false);
      }
    }
  });
};

  const handleSubmitItem = async (e, formData, setErrors) => {
  try {
    const itemData = {
      modelNumber: formData.modelNumber,
      brand: formData.brand,
      description: formData.description.replace(/\n/g, '<br>'),
      msrp: parseFloat(formData.msrp),
      actualPrice: parseFloat(formData.actualPrice),
      category: formData.category,
      subcategory: formData.subcategory,
      status: formData.status,
      images: formData.images,
      videos: formData.videos,
      primaryImageIndex: formData.primaryImageIndex,
      lastModified: new Date()
    };

    if (editingItem) {
      await updateDoc(doc(db, 'products', editingItem.id), itemData);
      
      const updatedItems = inventoryItems.map(item => 
        item.id === editingItem.id 
          ? { ...itemData, id: editingItem.id, dateAdded: item.dateAdded }
          : item
      );
      setInventoryItems(updatedItems);
      alert('Item updated successfully!');
    } else {
      const docRef = await addDoc(collection(db, 'products'), {
        ...itemData,
        dateAdded: new Date()
      });
      
      const newItem = {
        ...itemData,
        id: docRef.id,
        dateAdded: new Date()
      };
      setInventoryItems(prev => [...prev, newItem]);
      alert('Item added successfully!');
    }

    setShowAddItemModal(false);
    setEditingItem(null);
  } catch (error) {
    console.error('Error saving item:', error);
    alert('Error saving item. Please try again.');
    throw error; // Re-throw so the modal can handle it
  }
};

  const getSubcategoryOptions = (category) => {
    const subcategories = {
      'refrigerators': ['french-door', 'side-by-side', 'top-freezer', 'bottom-freezer'],
      'washers': ['front-load', 'top-load'],
      'dryers': ['front-load', 'top-load'],
      'freezers': ['upright', 'chest'],
      'dishwashers': [],
      'washer-dryer-sets': ['front-load', 'top-load'],
      'laundry-centers': [],
      'stoves': ['electric-ranges', 'gas-ranges', 'wall-ovens', 'range-hoods']
    };
    return subcategories[category] || [];
  };

  const getDisplayProducts = () => {
    return inventoryItems.filter(item => 
      item.status === 'floor-display'
    );
  };

  const handleAddItem = () => {
    setEditingItem(null);
    setShowAddItemModal(true);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setShowAddItemModal(true);
  };

  // Navigation Component with improved responsive design
const Navigation = () => (
  <nav className="fixed top-0 w-full bg-white z-50 shadow-sm">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-20">
        {/* Logo Section */}
        <div className="flex items-center flex-shrink-0">
          <button 
            onClick={() => {setCurrentPage('home'); setSelectedCategory(null); setSelectedProduct(null);}}
            className="flex items-center space-x-2"
          >
            <img 
              src="images/logos/company-logo.jpg" 
              alt="Appliance House Logo" 
              className="h-10 sm:h-12 w-auto"
            />
            <span className="text-lg xl:text-xl font-bold text-blue-400 whitespace-nowrap">
              Appliance House
            </span>
          </button>
        </div>
        
        {/* Desktop Navigation - Shows at 1160px+ */}
<div className="hidden nav:flex items-center w-full px-4 xl:px-8 2xl:px-16">
  {/* Left section - Empty spacer */}
  <div className="flex-1"></div>

  {/* Center - Home button and Category navigation */}
  <div className="flex items-center space-x-1 flex-shrink-0">
    {/* Home button and categories stay the same */}
    <button
      onClick={() => {setCurrentPage('home'); setSelectedCategory(null); setSelectedProduct(null); window.scrollTo(0, 0);}}
      className={`px-2 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
        currentPage === 'home'
          ? 'text-blue-600 border-b-2 border-blue-600'
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      Home
    </button>
    
    {navigationItems.map((item) => (
      <div key={item.name} className="relative group">
        <button
          className="px-1 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors whitespace-nowrap"
          onClick={() => {
            setSelectedCategory(item.key);
            setCurrentPage('category');
            updatePageSEO('category', item.key);
            setSelectedFilters({ brands: [], priceRange: '', type: '', minPrice: 0, maxPrice: 5000 });
            window.scrollTo(0, 0);
          }}
        >
          {item.name}
        </button>
        {item.subcategories && (
          <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <div className="py-1">
              {item.subcategories.map((sub) => (
                <button
                  key={sub.key}
                  onClick={() => {
                    setSelectedCategory(item.key);
                    setCurrentPage('category');
                    updatePageSEO('category', item.key);
                    setSelectedFilters({ brands: [], priceRange: '', type: sub.key, minPrice: 0, maxPrice: 5000 });
                    window.scrollTo(0, 0);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {sub.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    ))}
  </div>

  {/* Right section - Financing and Contact buttons with responsive margin */}
  <div className="flex-1 flex items-center justify-end space-x-2 ml-8 xl:ml-12 2xl:ml-20">
    <button 
      onClick={() => setCurrentPage('financing')}
      className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap"
    >
      Financing
    </button>
    <button 
      onClick={() => {
        const contactSection = document.querySelector('footer');
        if (contactSection) {
          contactSection.scrollIntoView({ behavior: 'smooth' });
        }
      }}
      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-3 py-2 rounded-md text-xs font-medium transition-all duration-300 whitespace-nowrap transform hover:scale-105"
    >
      Contact Us
    </button>
  </div>
</div>

        {/* Mobile menu button - Shows below 1160px */}
        <div className="nav:hidden ml-auto">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-gray-500 hover:text-gray-700 focus:outline-none p-2"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="nav:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1 max-h-96 overflow-y-auto">
            <button 
              onClick={() => {
                setCurrentPage('home');
                updatePageSEO('home');
                setSelectedCategory(null); 
                setSelectedProduct(null);
                setMobileMenuOpen(false);
              }}
              className={`block w-full text-left px-3 py-2 text-base font-medium transition-colors rounded-md ${
                currentPage === 'home' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Home
            </button>
            {navigationItems.map((item) => (
              <div key={item.name}>
                <button
                  className="block w-full text-left px-3 py-2 text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors rounded-md"
                  onClick={() => {
                    setSelectedCategory(item.key);
                    setCurrentPage('category');
                    updatePageSEO('category', item.key);
                    setMobileMenuOpen(false);
                    setSelectedFilters({ brands: [], priceRange: '', type: '', minPrice: 0, maxPrice: 5000 });
                    window.scrollTo(0, 0);
                  }}
                >
                  {item.name}
                </button>
                {item.subcategories && (
                  <div className="pl-4">
                    {item.subcategories.map((sub) => (
                      <button
                        key={sub.key}
                        onClick={() => {
                          setSelectedCategory(item.key);
                          setCurrentPage('category');
                          updatePageSEO('category', item.key);
                          setMobileMenuOpen(false);
                          setSelectedFilters({ brands: [], priceRange: '', type: sub.key, minPrice: 0, maxPrice: 5000 });
                          window.scrollTo(0, 0);
                        }}
                        className="block w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md"
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <button 
              onClick={() => {
                setCurrentPage('financing');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left px-3 py-2 text-base font-medium bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors mx-3 my-2"
            >
              Financing
            </button>
            <button 
              onClick={() => {
                setMobileMenuOpen(false);
                setTimeout(() => {
                  const contactSection = document.querySelector('footer');
                  if (contactSection) {
                    contactSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }, 100);
              }}
              className="block w-full text-left px-3 py-2 text-base font-medium bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-md transition-all duration-300 mx-3 my-2"
            >
              Contact Us
            </button>
          </div>
        </div>
      )}
    </div>
  </nav>
);

  // Product Detail Page Component
  const ProductDetailPage = ({ product }) => {
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

    if (!product) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
            <button 
              onClick={() => setCurrentPage('home')}
              className="text-blue-600 hover:text-blue-800"
            >
              Return to Home
            </button>
          </div>
        </div>
      );
    }

    const images = product.images && product.images.length > 0 
      ? product.images 
      : ['/images/placeholder-appliance.jpg'];
    
    const videos = product.videos || [];
    
    const allMedia = [
      ...images.map(url => ({ url, type: 'image' })),
      ...videos.map(url => ({ url, type: 'video' }))
    ];

    const currentMedia = allMedia[currentMediaIndex] || { url: '/images/placeholder-appliance.jpg', type: 'image' };

    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="pt-20 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <button
  onClick={() => {
    setCurrentPage('category');
    setSelectedProduct(null);
    setSelectedCategory(product.category);
  }}
  className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md"
>
  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
  Back to {product.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
</button>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Media Gallery */}
              <div>
                <div className="mb-4">
                  {currentMedia.type === 'video' ? (
                    <video
                      src={currentMedia.url}
                      controls
                      className="w-full h-64 sm:h-80 lg:h-96 object-contain bg-gray-100 rounded-lg shadow-lg cursor-pointer"
                      onClick={() => setIsMediaModalOpen(true)}
                      preload="metadata"
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <img
                      src={currentMedia.url}
                      alt={`${product.brand} ${product.modelNumber}`}
                      className="w-full h-64 sm:h-80 lg:h-96 object-contain bg-gray-100 rounded-lg shadow-lg cursor-pointer"
                      onClick={() => setIsMediaModalOpen(true)}
                    />
                  )}
                </div>

                {/* Thumbnail Media Grid */}
                {allMedia.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {allMedia.map((media, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentMediaIndex(index)}
                        className={`relative h-16 sm:h-20 w-full rounded-md overflow-hidden border-2 transition-all ${
                          currentMediaIndex === index 
                            ? 'border-blue-500 shadow-md' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {media.type === 'video' ? (
                          <>
                            <video
                              src={media.url}
                              className="w-full h-full object-cover"
                              preload="metadata"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                              <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </>
                        ) : (
                          <img
                            src={media.url}
                            alt={`View ${index + 1}`}
                            className="w-full h-full object-contain bg-gray-50"
                          />
                        )}
                        
                        <div className="absolute top-1 right-1">
                          {media.type === 'video' ? (
                            <div className="bg-red-600 text-white text-xs px-1 rounded">
                              VIDEO
                            </div>
                          ) : (
                            <div className="bg-blue-600 text-white text-xs px-1 rounded">
                              IMAGE
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Information */}
              <div>
                <div className="mb-6">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    {product.brand} {product.modelNumber}
                  </h1>
                  <p className="text-base sm:text-lg text-gray-600 mb-4" dangerouslySetInnerHTML={{ __html: product.description }}></p>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mb-6 space-y-2 sm:space-y-0">
                    <span className="text-2xl sm:text-3xl font-bold text-green-600">
                      ${product.actualPrice.toLocaleString()}
                    </span>
                    <span className="text-lg sm:text-xl text-gray-500 line-through">
                      ${product.msrp.toLocaleString()}
                    </span>
                    <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold self-start">
                      Save ${(product.msrp - product.actualPrice).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-1">Brand</h4>
                      <p className="text-gray-600">{product.brand}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-1">Model</h4>
                      <p className="text-gray-600">{product.modelNumber}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-1">Category</h4>
                      <p className="text-gray-600 capitalize">
                        {product.category.replace('-', ' ')}
                        {product.subcategory && ` - ${product.subcategory.replace('-', ' ')}`}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-1">Availability</h4>
                      <p className="text-gray-600 capitalize">
                        {product.status === 'floor-display' ? 'Available on Floor' : 'Call for Availability'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Buttons */}
                <div className="space-y-4">
                  <a 
  href="tel:+18594026888"
  className="block w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-base sm:text-lg font-semibold transition-colors text-center"
>
  Call for More Info: (859) 402-6888
</a>
                  <button 
                    onClick={() => window.open(`mailto:appliancehouseky@gmail.com?subject=Inquiry about ${product.brand} ${product.modelNumber}&body=Hi, I'm interested in learning more about the ${product.brand} ${product.modelNumber} listed for ${product.actualPrice}.`, '_blank')}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg text-base sm:text-lg font-semibold transition-colors"
                  >
                    Email for Details
                  </button>
                  <div className="text-center text-gray-600">
                    <p className="mb-2">Visit our showroom to see this item in person!</p>
                    <p className="text-sm">5000 Park Central Ave, Suite F, Nicholasville, KY</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Media Modal */}
        {isMediaModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-4xl max-h-full">
              <button
                onClick={() => setIsMediaModalOpen(false)}
                className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 z-10"
              >
                <X className="h-6 w-6" />
              </button>
              
              {currentMedia.type === 'video' ? (
                <video
                  src={currentMedia.url}
                  controls
                  autoPlay
                  className="max-w-full max-h-[90vh] object-contain rounded-lg"
                  preload="metadata"
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img
                  src={currentMedia.url}
                  alt={`${product.brand} ${product.modelNumber}`}
                  className="max-w-full max-h-[90vh] object-contain rounded-lg"
                />
              )}
              
              {allMedia.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentMediaIndex(prev => 
                      prev === 0 ? allMedia.length - 1 : prev - 1
                    )}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => setCurrentMediaIndex(prev => 
                      prev === allMedia.length - 1 ? 0 : prev + 1
                    )}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
                  >
                    →
                  </button>
                </>
              )}
              
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-3 py-1 rounded-full text-sm">
                {currentMediaIndex + 1} of {allMedia.length}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (currentPage === 'product-detail') {
    return (
      <ErrorBoundary>
        <ProductDetailPage product={selectedProduct} />
      </ErrorBoundary>
    );
  }

  const testimonials = [
    {
      id: 1,
      name: "Christina",
      rating: 5,
      comment: "Appliance House was so great! I came in alone not knowing what I am looking for but Bilal helped me and did not try to sell me on anything I didn't need. I appreciate the professionalism!! So wonderful",
    },
    {
      id: 2,
      name: "Andrea",
      rating: 5,
      comment: "Bilal is very knowledgeable and cares for his customers, making sure they get the right fit appliances for their needs. Great customer service with attention to detail.",
    },
    {
      id: 3,
      name: "Reagan",
      rating: 5,
      comment: "Super easy to work with, great deals & efficient. We will always recommend them!",
    },
    {
      id: 4,
      name: "Michael",
      rating: 5,
      comment: "Fridge went out on one of my rental properties. Needed one quick, found this place and was able to find something nice and the same day. Definetly recommend using if you have properties and are looking to update without breaking the bank",
    }
  ];

  const getFilterOptions = (category) => {
    const baseFilters = {
      brands: ['GE', 'Samsung', 'Whirlpool', 'LG', 'KitchenAid', 'Frigidaire', 'Maytag', 'Cafe', 'Bosch'],
      priceRanges: ['Under $500', '$500 - $1000', '$1000 - $2000', '$2000 - $3000', 'Over $3000']
    };

    const typeFilters = {
      'refrigerators': ['French Door', 'Side by Side', 'Top Freezer', 'Bottom Freezer'],
      'washer-dryer-sets': ['Front Load', 'Top Load'],
      'washers': ['Front Load', 'Top Load'],
      'freezers': ['Upright', 'Chest'],
      'stoves': ['Electric Ranges', 'Gas Ranges', 'Wall Ovens', 'Range Hoods'],
    };

    return {
      ...baseFilters,
      types: typeFilters[category] || []
    };
  };

  // Admin Login Page
  const AdminLoginPage = () => (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Admin Login</h2>
            <p className="text-gray-600">Sign in to manage inventory</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-8">
            <button
              onClick={signInWithGoogle}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <LoadingSpinner size="small" text="" />
              ) : (
                <>
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );


  // Handle admin page routing
  if (currentPage === 'admin') {
    if (!isAuthenticated) {
      return <AdminLoginPage />;
    }
    return <AdminDashboard
      user={user}
      signOut={signOut}
      isLoading={isLoading}
      inventoryItems={inventoryItems}
      filteredItems={filteredItems}
      inventoryFilters={inventoryFilters}
      handleInventoryFilterChange={handleInventoryFilterChange}
      handleAddItem={handleAddItem}
      handleEditItem={handleEditItem}
      handleDeleteItem={handleDeleteItem}
      showAddItemModal={showAddItemModal}
      setShowAddItemModal={setShowAddItemModal}
      editingItem={editingItem}
      setEditingItem={setEditingItem}
      handleSubmitItem={handleSubmitItem}
      getSubcategoryOptions={getSubcategoryOptions}
      uploadImageToFirebase={uploadImageToFirebase}
      uploadVideoToFirebase={uploadVideoToFirebase}
      confirmDialog={confirmDialog}
      setCurrentPage={setCurrentPage}
      updatePageSEO={updatePageSEO}
      setSelectedCategory={setSelectedCategory}
      setSelectedProduct={setSelectedProduct}
    />;
  }

  // Handle filter changes
  const handleFilterChange = (filterType, value, checked) => {
    setSelectedFilters(prev => {
      if (filterType === 'brands') {
        const updatedBrands = checked 
          ? [...prev.brands, value]
          : prev.brands.filter(brand => brand !== value);
        return { ...prev, brands: updatedBrands };
      } else if (filterType === 'priceRange') {
        return { ...prev, priceRange: value };
      } else if (filterType === 'type') {
        return { ...prev, type: value };
      }
      return prev;
    });
  };

  // Scrolling Brands Component
  const ScrollingBrands = memo(() => (
    <section className="py-8 bg-white overflow-hidden">
      <div className="relative">
        <div className="flex animate-scroll space-x-12">
          {brands.map((brand, index) => (
            <div key={`first-${index}`} className="flex items-center justify-center min-w-max px-6">
              <img 
                src={brand.logo} 
                alt={`${brand.name} logo`} 
                className="h-16 w-auto object-contain mx-auto" 
              />
            </div>
          ))}
          {brands.map((brand, index) => (
            <div key={`second-${index}`} className="flex items-center justify-center min-w-max px-6">
              <img 
                src={brand.logo} 
                alt={`${brand.name} logo`} 
                className="h-16 w-auto object-contain mx-auto" 
              />
            </div>
          ))}
        </div>
      </div>
      <style>{`
  @keyframes scroll {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-50%);
    }
  }
  .animate-scroll {
    animation: scroll 20s linear infinite;
  }
`}</style>
    </section>
  )
  );

  // Appliance Categories Grid with improved responsive design
  const ApplianceCategories = () => (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Shop by Category</h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Find the perfect appliance for your home from our extensive selection
          </p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6">
          {applianceCategories.map((category) => (
            <button
              key={category.key}
              onClick={() => {
  // Determine the actual category from the key
  let categoryKey;
  if (category.key.includes('refrigerators')) {
    categoryKey = 'refrigerators';
  } else {
    categoryKey = category.key;
  }
  
  setSelectedCategory(categoryKey);
  setCurrentPage('category');
  if (category.filterType) {
    setSelectedFilters({ brands: [], priceRange: '', type: category.filterType, minPrice: 0, maxPrice: 5000 });
  } else {
    setSelectedFilters({ brands: [], priceRange: '', type: '', minPrice: 0, maxPrice: 5000 });
  }
  window.scrollTo(0, 0);
}}
              className="group bg-white border-2 border-gray-200 rounded-xl p-4 sm:p-6 text-center hover:border-blue-500 hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              <div className="mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                <img 
                  src={category.icon} 
                  alt={`${category.name} icon`} 
                  className="h-12 w-12 sm:h-16 sm:w-16 mx-auto object-contain"
                />
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {category.name}
              </h3>
            </button>
          ))}
        </div>
      </div>
    </section>
  );

  if (currentPage === 'home') {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-white">
          <Navigation />
          
          {/* Hero Section with Commercial Appliance Image Background */}
          <section className="relative h-screen flex items-center justify-center overflow-hidden">
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('images/lastimage.webp')`
              }}
            />
            
            <div className="relative z-10 text-center text-white px-4 sm:px-6 lg:px-8">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                Premium Appliances,
                <br />
                <span className="text-blue-400 bg-clip-text">
                  Scratch & Dent Prices
                </span>
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed">
                Save up to 60% on premium appliances.
                Same warranties, same quality, incredible savings.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => {
                    setCurrentPage('category');
                    setSelectedCategory('refrigerators');
                    setSelectedFilters({ brands: [], priceRange: '', type: '', minPrice: 0, maxPrice: 5000 });
                  }}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-300 shadow-lg"
                >
                  Shop Now
                </button>
                <button 
                  onClick={() => setCurrentPage('financing')}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold hover:from-green-700 hover:to-emerald-700 transform hover:scale-105 transition-all duration-300 shadow-lg"
                >
                  Financing Options
                </button>
              </div>
            </div>
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white animate-bounce">
              <ChevronRight className="h-6 w-6 rotate-90" />
            </div>
          </section>

          <ScrollingBrands />
          <ApplianceCategories />

          {/* Features Section */}
          <section className="py-16 sm:py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12 sm:mb-16">
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Why Choose Appliance House?</h2>
                <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
                  Get premium appliances at unbeatable prices with our scratch & dent deals
                </p>
              </div>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12">
                <div className="text-center group">
                  <div className="bg-gradient-to-r from-green-500 to-blue-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl font-bold text-white">%</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Unbeatable Savings</h3>
                  <p className="text-gray-600">
                    Save up to 60% off retail prices on premium appliances
                  </p>
                </div>
                
                <div className="text-center group">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Full Warranty</h3>
                  <p className="text-gray-600">
                    Same manufacturer warranties as brand new appliances
                  </p>
                </div>
                
                <div className="text-center group sm:col-span-2 lg:col-span-1">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Truck className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Professional Service</h3>
                  <p className="text-gray-600">
                    Delivery and installation service available
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Testimonials Section */}
          <section className="py-16 sm:py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12 sm:mb-16">
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
                <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
                  Don't just take our word for it - hear from thousands of satisfied customers
                </p>
              </div>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-6 sm:gap-8">
                {testimonials.map((testimonial) => (
                  <div key={testimonial.id} className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center mb-4">
                      <div className="flex text-yellow-500 mr-3">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-5 w-5 fill-current" />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">{testimonial.date}</span>
                    </div>
                    <p className="text-gray-700 mb-6 text-sm sm:text-base leading-relaxed">"{testimonial.comment}"</p>
                    <div className="border-t pt-4">
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">{testimonial.product}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section className="py-16 sm:py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12 sm:mb-16">
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Visit Our Showroom</h2>
                <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
                  Come see our amazing selection in person or get in touch with any questions
                </p>
              </div>
              
              <div className="grid lg:grid-cols-2 gap-8 sm:gap-12">
                <div className="space-y-8">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-2xl">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-500 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                        <Phone className="h-6 w-6 text-white" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Call Us</h4>
                      <p className="text-gray-600">(859) 402-6888</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-2xl">
                      <div className="bg-gradient-to-r from-green-500 to-blue-500 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                        <Mail className="h-6 w-6 text-white" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Email Us</h4>
                      <p className="text-gray-600">appliancehouseky@gmail.com</p>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Visit Our Showroom</h4>
                    <p className="text-gray-600 mb-4">
                      5000 Park Central Ave, Suite F<br />
                      Nicholasville, KY 40356<br />
                      Follow GPS to the back <br />
                    
                      Look for the baby blue sign!

                    </p>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-1">Store Hours</h4>
                      <div className="text-gray-600 text-sm">
                        <p>Monday - Friday: 10:00 AM - 5:00 PM</p>
                        <p>Saturday: 12:00 PM - 5:00 PM</p>
                        <p>Sunday: 12:00 PM - 5:00 PM</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-100 rounded-2xl overflow-hidden">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3151.8354345093743!2d-84.57322!3d37.88063!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8842f0f0f0f0f0f0%3A0x0!2s5000%20Park%20Central%20Ave%2C%20Nicholasville%2C%20KY%2040356!5e0!3m2!1sen!2sus!4v1234567890123"
                    width="100%"
                    height="400"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Appliance House Location"
                    className="w-full h-96"
                  ></iframe>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="bg-gray-900 text-white py-12 sm:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8">
                <div className="sm:col-span-2 lg:col-span-2">
                  <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
                    Appliance House
                  </h3>
                  <p className="text-gray-400 text-sm sm:text-base">
                    Premium scratch & dent appliances at unbeatable prices. Quality, savings, and style in every product.
                  </p>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold mb-4">Contact</h4>
                  <div className="space-y-2 text-gray-400 text-sm">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      <span>(859) 402-6888</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      <span>appliancehouseky@gmail.com</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>5000 Park Central Ave, Suite F</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold mb-4">Hours</h4>
                  <div className="space-y-2 text-gray-400 text-sm">
                    <div>Mon-Fri: 10:00 AM - 5:00 PM</div>
                    <div>Saturday: 12:00 PM - 5:00 PM</div>
                    <div>Sunday: 12:00 PM - 5:00 PM</div>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-800 mt-8 sm:mt-12 pt-6 sm:pt-8 text-center text-gray-400 text-sm">
                <p>&copy; 2024 Appliance House. All rights reserved.</p>
              </div>
            </div>
          </footer>
        </div>
        
        <ConfirmationDialog {...confirmDialog} />
      </ErrorBoundary>
    );
  }

  // Category Page with real products and improved responsive design
  if (currentPage === 'category') {
    const filterOptions = getFilterOptions(selectedCategory);
    const displayProducts = getDisplayProducts()
      .filter(item => item.category === selectedCategory)
      .filter(item => {
        if (selectedFilters.brands.length > 0 && !selectedFilters.brands.includes(item.brand)) {
          return false;
        }
        if (selectedFilters.type && item.subcategory !== selectedFilters.type) {
          return false;
        }
        
        if (selectedFilters.priceRange) {
          const price = item.actualPrice;
          switch (selectedFilters.priceRange) {
            case 'Under $500':
              return price < 500;
            case '$500 - $1000':
              return price >= 500 && price <= 1000;
            case '$1000 - $2000':
              return price >= 1000 && price <= 2000;
            case '$2000 - $3000':
              return price >= 2000 && price <= 3000;
            case 'Over $3000':
              return price > 3000;
            default:
              return true;
          }
        }
        
        if (selectedFilters.minPrice > 0 || selectedFilters.maxPrice < 5000) {
          return item.actualPrice >= selectedFilters.minPrice && item.actualPrice <= selectedFilters.maxPrice;
        }
        
        return true;
      });
    
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-white">
          <Navigation />
          <div className="pt-16 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center py-8">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                  {selectedCategory ? selectedCategory.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Category'}
                </h1>
                <p className="text-lg text-gray-600">
                  Browse our selection of premium appliances in this category
                </p>
              </div>
              
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Filters Sidebar */}
                <div className="lg:w-64 flex-shrink-0">
                  <div className="bg-gray-50 rounded-lg p-6 sticky top-20">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
                    
                    {/* Brand Filter */}
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Brand</h4>
                      <div className="space-y-2">
                        {filterOptions.brands.map((brand) => (
                          <label key={brand} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedFilters.brands.includes(brand)}
                              onChange={(e) => handleFilterChange('brands', brand, e.target.checked)}
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-600">{brand}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    {/* Type Filter */}
                    {filterOptions.types.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Type</h4>
                        <div className="space-y-2">
                          {filterOptions.types.map((type) => (
                            <label key={type} className="flex items-center">
                              <input
                                type="radio"
                                name="type"
                                value={type.toLowerCase().replace(/\s+/g, '-')}
                                checked={selectedFilters.type === type.toLowerCase().replace(/\s+/g, '-')}
                                onChange={(e) => handleFilterChange('type', e.target.value, true)}
                                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm text-gray-600">{type}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Price Filter */}
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Price Range</h4>
                      <div className="space-y-2 mb-4">
                        {filterOptions.priceRanges.map((range) => (
                          <label key={range} className="flex items-center">
                            <input
                              type="radio"
                              name="priceRange"
                              value={range}
                              checked={selectedFilters.priceRange === range}
                              onChange={(e) => handleFilterChange('priceRange', e.target.value, true)}
                              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-600">{range}</span>
                          </label>
                        ))}
                      </div>
                      
                      {/* Custom Price Range Slider */}
                      <div className="border-t pt-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-3">Custom Range</h5>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs text-gray-600">Min Price: ${selectedFilters.minPrice}</label>
                            <input
                              type="range"
                              min="0"
                              max="5000"
                              step="50"
                              value={selectedFilters.minPrice}
                              onChange={(e) => {
                                const value = parseInt(e.target.value);
                                setSelectedFilters(prev => ({
                                  ...prev,
                                  minPrice: value,
                                  priceRange: ''
                                }));
                              }}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Max Price: ${selectedFilters.maxPrice}</label>
                            <input
                              type="range"
                              min="0"
                              max="5000"
                              step="50"
                              value={selectedFilters.maxPrice}
                              onChange={(e) => {
                                const value = parseInt(e.target.value);
                                setSelectedFilters(prev => ({
                                  ...prev,
                                  maxPrice: value,
                                  priceRange: ''
                                }));
                              }}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                          <div className="text-xs text-gray-500 text-center">
                            ${selectedFilters.minPrice} - ${selectedFilters.maxPrice}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Clear Filters */}
                    <button
                      onClick={() => setSelectedFilters({ brands: [], priceRange: '', type: '', minPrice: 0, maxPrice: 5000 })}
                      className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm transition-colors"
                    >
                      Clear All Filters
                    </button>
                  </div>
                </div>
                
                {/* Products Grid */}
                <div className="flex-1">
                  {isLoading ? (
                    <div className="flex justify-center items-center min-h-64">
                      <LoadingSpinner size="large" text="Loading products..." />
                    </div>
                  ) : displayProducts.length > 0 ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                      {displayProducts.map((item) => (
                        <div key={item.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                          <div className="bg-gray-100 h-64 rounded-t-lg overflow-hidden flex items-center justify-center">
  <img
    src={
      (item.images && Array.isArray(item.images) && item.images.length > 0)
        ? item.images[item.primaryImageIndex || 0]
        : '/images/placeholder-appliance.jpg'
    }
    alt={`${item.brand} ${item.modelNumber}`}
    className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
    loading="lazy"
    onError={(e) => {
      console.error('Category grid image failed to load:', e.target.src);
      e.target.src = '/images/placeholder-appliance.jpg';
    }}
    onLoad={() => {
      console.log('Category grid image loaded successfully');
    }}
  />
</div>
                          <div className="p-4">
                            <h3 className="font-semibold text-gray-900 mb-1">{item.brand} {item.modelNumber}</h3>
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2" dangerouslySetInnerHTML={{ __html: item.description }}></p>
                            <div className="flex justify-between items-center mb-3">
                              <div>
                                <div className="text-sm text-gray-500 line-through">MSRP: ${item.msrp.toLocaleString()}</div>
                                <span className="text-lg font-bold text-green-700">Our Price: ${item.actualPrice.toLocaleString()}</span>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-semibold text-green-500">
                                  Save ${(item.msrp - item.actualPrice).toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <button 
                              onClick={() => {
                                setSelectedProduct(item);
                                setCurrentPage('product-detail');
                              }}
                              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-600 text-lg">No products found matching your criteria.</p>
                      <button
                        onClick={() => setSelectedFilters({ brands: [], priceRange: '', type: '', minPrice: 0, maxPrice: 5000 })}
                        className="mt-4 text-blue-600 hover:text-blue-800"
                      >
                        Clear filters to see all products
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <footer className="bg-gray-900 text-white py-12 sm:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8">
                <div className="sm:col-span-2 lg:col-span-2">
                  <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
                    Appliance House
                  </h3>
                  <p className="text-gray-400 text-sm sm:text-base">
                    Premium scratch & dent appliances at unbeatable prices. Quality, savings, and style in every product.
                  </p>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold mb-4">Contact</h4>
                  <div className="space-y-2 text-gray-400 text-sm">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      <span>(859) 402-6888</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      <span>appliancehouseky@gmail.com</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>5000 Park Central Ave, Suite F</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold mb-4">Hours</h4>
                  <div className="space-y-2 text-gray-400 text-sm">
                    <div>Mon-Fri: 10:00 AM - 5:00 PM</div>
                    <div>Saturday: 12:00 PM - 5:00 PM</div>
                    <div>Sunday: 12:00 PM - 5:00 PM</div>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-800 mt-8 sm:mt-12 pt-6 sm:pt-8 text-center text-gray-400 text-sm">
                <p>&copy; 2024 Appliance House. All rights reserved.</p>
              </div>
            </div>
          </footer>
        </div>
        
        <ConfirmationDialog {...confirmDialog} />
      </ErrorBoundary>
    );
  }

  // Contact Page
  if (currentPage === 'contact') {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-white">
          <Navigation />
          <div className="pt-16 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center py-12">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
                <p className="text-lg text-gray-600">
                  Get in touch with our team for any questions or to schedule a visit
                </p>
              </div>
              
              <div className="grid lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-2xl">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-500 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                        <Phone className="h-6 w-6 text-white" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Call Us</h4>
                      <p className="text-gray-600">(859) 402-6888</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-2xl">
                      <div className="bg-gradient-to-r from-green-500 to-blue-500 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                        <Mail className="h-6 w-6 text-white" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Email Us</h4>
                      <p className="text-gray-600">appliancehouseky@gmail.com</p>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Visit Our Showroom</h4>
                    <p className="text-gray-600 mb-4">
                      5000 Park Central Ave, Suite F<br />
                      Nicholasville, KY 40356
                    </p>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-1">Store Hours</h4>
                      <div className="text-gray-600 text-sm">
                        <p>Monday - Friday: 10:00 AM - 5:00 PM</p>
                        <p>Saturday: 12:00 PM - 5:00 PM</p>
                        <p>Sunday: 12:00 PM - 5:00 PM</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Google Map Embed */}
                <div className="bg-gray-100 rounded-2xl overflow-hidden">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3151.8354345093743!2d-84.57322!3d37.88063!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8842f0f0f0f0f0f0%3A0x0!2s5000%20Park%20Central%20Ave%2C%20Nicholasville%2C%20KY%2040356!5e0!3m2!1sen!2sus!4v1234567890123"
                    width="100%"
                    height="400"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Appliance House Location"
                    className="w-full h-96"
                  ></iframe>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <footer className="bg-gray-900 text-white py-12 sm:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8">
                <div className="sm:col-span-2 lg:col-span-2">
                  <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
                    Appliance House
                  </h3>
                  <p className="text-gray-400 text-sm sm:text-base">
                    Premium scratch & dent appliances at unbeatable prices. Quality, savings, and style in every product.
                  </p>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold mb-4">Contact</h4>
                  <div className="space-y-2 text-gray-400 text-sm">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      <span>(859) 402-6888</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      <span>appliancehouseky@gmail.com</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>5000 Park Central Ave, Suite F</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold mb-4">Hours</h4>
                  <div className="space-y-2 text-gray-400 text-sm">
                    <div>Mon-Fri: 10:00 AM - 5:00 PM</div>
                    <div>Saturday: 12:00 PM - 5:00 PM</div>
                    <div>Sunday: 12:00 PM - 5:00 PM</div>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-800 mt-8 sm:mt-12 pt-6 sm:pt-8 text-center text-gray-400 text-sm">
                <p>&copy; 2025 Appliance House. All rights reserved.</p>
              </div>
            </div>
          </footer>
        </div>
        
        <ConfirmationDialog {...confirmDialog} />
      </ErrorBoundary>
    );
  }

  // Financing Page
  if (currentPage === 'financing') {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-white">
          <Navigation />
          <div className="pt-16 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center py-12">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Financing Options</h1>
                <p className="text-lg text-gray-600">
                  Get the appliances you need today with flexible financing options
                </p>
              </div>
              
              <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {/* Snap Financing */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 text-center">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-white font-bold text-xl">S</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Snap Financing</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Quick and easy financing with flexible payment options. Get approved in seconds with no impact to your credit score for checking rates.
                  </p>
                  <ul className="text-left text-gray-600 mb-8 space-y-2">
                    <li>• No credit check!</li>
                    <li>• Fixed monthly payments</li>
                    <li>• Quick approval process</li>
                    <li>• Multiple payment terms available</li>
                  </ul>
                  <button
                    onClick={() => window.open('https://snapfinance.com/find-stores?zipCode=40507&state=KY&city=Richmond&industry=APPLIANCES&merchantId=490315615&dbaName=Appliance-House---Nicholasville', '_blank')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors w-full"
                  >
                    Apply with Snap
                  </button>
                </div>

                {/* Acima Financing */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 text-center">
                  <div className="bg-gradient-to-r from-green-600 to-emerald-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-white font-bold text-xl">A</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Acima Financing</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Lease-to-own financing that helps you get the appliances you need today. No credit needed - just a checking account and income.
                  </p>
                  <ul className="text-left text-gray-600 mb-8 space-y-2">
                    <li>• No credit check!</li>
                    <li>• Flexible payment schedules</li>
                    <li>• Own it in 12 months or less</li>
                    <li>• Early purchase options available</li>
                  </ul>
                  <button
                    onClick={() => window.open('https://locations.acima.com/kentucky/nicholasville/5000-park-central-ave/', '_blank')}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors w-full"
                  >
                    Apply with Acima
                  </button>
                </div>

                {/* Koalafi Financing */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 text-center">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-white font-bold text-xl">K</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Koalafi Financing</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Flexible financing with Chime acceptance. Get the appliances you need with payment options that work for you.
                  </p>
                  <ul className="text-left text-gray-600 mb-8 space-y-2">
                    <li>• Accepts Chime!</li>
                    <li>• Flexible financing options</li>
                    <li>• Quick and easy application</li>
                    <li>• Multiple payment plans available</li>
                  </ul>
                  <button
                    onClick={() => window.open('https://epply.koalafi.com/?dealerId=e1186084-ab6d-4ef0-889d-03237043e276&cm=Store&dealerPublicId=e1186084-ab6d-4ef0-889d-03237043e276&orderId=fdcdf214-82f2-4ce1-86e4-50197d298149', '_blank')}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors w-full"
                  >
                    Apply with Koalafi
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <footer className="bg-gray-900 text-white py-12 sm:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8">
                <div className="sm:col-span-2 lg:col-span-2">
                  <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
                    Appliance House
                  </h3>
                  <p className="text-gray-400 text-sm sm:text-base">
                    Premium scratch & dent appliances at unbeatable prices. Quality, savings, and style in every product.
                  </p>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold mb-4">Contact</h4>
                  <div className="space-y-2 text-gray-400 text-sm">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      <span>(859) 402-6888</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      <span>appliancehouseky@gmail.com</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>5000 Park Central Ave, Suite F</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold mb-4">Hours</h4>
                  <div className="space-y-2 text-gray-400 text-sm">
                    <div>Mon-Fri: 10:00 AM - 5:00 PM</div>
                    <div>Saturday: 12:00 PM - 5:00 PM</div>
                    <div>Sunday: 12:00 PM - 5:00 PM</div>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-800 mt-8 sm:mt-12 pt-6 sm:pt-8 text-center text-gray-400 text-sm">
                <p>&copy; 2024 Appliance House. All rights reserved.</p>
              </div>
            </div>
          </footer>
        </div>
        
        <ConfirmationDialog {...confirmDialog} />
      </ErrorBoundary>
    );
  }

// If no page matches, return null (fallback)
  return (
    <ErrorBoundary>
    </ErrorBoundary>
  );
}

// Export App wrapped in ErrorBoundary
export default function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { useStore } from '../context/StoreContext';
import { WooProduct, WooVariation } from '../types';
import { formatPrice, toPersianDigits } from '../utils/helpers';
import { Search, Package, Edit3, X, Layers, Filter, Check, Plus, Sparkles, ImagePlus } from 'lucide-react-native';

const STOCK_FILTERS = [
  { id: 'all', title: 'همه موجودی‌ها' },
  { id: 'instock', title: 'موجود در انبار' },
  { id: 'outofstock', title: 'ناموجودها' },
  { id: 'onbackorder', title: 'پیش‌خرید' },
];

const TYPE_FILTERS = [
  { id: 'all', title: 'همه انواع' },
  { id: 'simple', title: 'ساده' },
  { id: 'variable', title: 'متغیر' },
];

const SORT_OPTIONS = [
  { id: 'date_desc', title: 'جدیدترین‌ها', orderby: 'date', order: 'desc' },
  { id: 'date_asc', title: 'قدیمی‌ترین‌ها', orderby: 'date', order: 'asc' },
  { id: 'price_desc', title: 'گران‌ترین‌ها', orderby: 'price', order: 'desc' },
  { id: 'price_asc', title: 'ارزان‌ترین‌ها', orderby: 'price', order: 'asc' },
  { id: 'title_asc', title: 'الفبایی', orderby: 'title', order: 'asc' },
];

export const ProductsScreen = () => {
  const { activeStore, api } = useStore();
  const [products, setProducts] = useState<WooProduct[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Filter States
  const [selectedStock, setSelectedStock] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedSort, setSelectedSort] = useState('date_desc');
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Quick Edit Modal (Simple Product)
  const [editingProduct, setEditingProduct] = useState<WooProduct | null>(null);
  const [regularPrice, setRegularPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Variations Modal (Variable Product)
  const [variableProduct, setVariableProduct] = useState<WooProduct | null>(null);
  const [variations, setVariations] = useState<WooVariation[]>([]);
  const [isLoadingVariations, setIsLoadingVariations] = useState(false);
  const [editingVariation, setEditingVariation] = useState<WooVariation | null>(null);
  const [varRegularPrice, setVarRegularPrice] = useState('');
  const [varSalePrice, setVarSalePrice] = useState('');
  const [varStockQuantity, setVarStockQuantity] = useState('');
  const [isSavingVar, setIsSavingVar] = useState(false);

  // New Product Modal
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newRegularPrice, setNewRegularPrice] = useState('');
  const [newSalePrice, setNewSalePrice] = useState('');
  const [newStock, setNewStock] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newCategory, setNewCategory] = useState<number | null>(null);
  const [newDescription, setNewDescription] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // بارگذاری دسته‌بندی‌ها
  const loadCategories = useCallback(async () => {
    if (!api) return;
    try {
      const cats = await api.getCategories();
      setCategories(cats);
    } catch (e) {
      console.log('Categories load error:', e);
    }
  }, [api]);

  const fetchProducts = useCallback(
    async (resetPage: boolean = false) => {
      if (!api) {
        setIsLoading(false);
        return;
      }

      const currentPage = resetPage ? 1 : page;
      if (resetPage) setIsLoading(true);

      const currentSort = SORT_OPTIONS.find((s) => s.id === selectedSort) || SORT_OPTIONS[0];

      try {
        const data = await api.getProducts({
          search: searchQuery || undefined,
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          stock_status: selectedStock === 'all' ? undefined : selectedStock,
          type: selectedType === 'all' ? undefined : selectedType,
          orderby: currentSort.orderby,
          order: currentSort.order as any,
          page: currentPage,
          per_page: 20,
        });

        if (resetPage) {
          setProducts(data);
          setPage(2);
        } else {
          setProducts((prev) => [...prev, ...data]);
          setPage((p) => p + 1);
        }
        setHasMore(data.length === 20);
      } catch (e) {
        console.error('Error fetching products:', e);
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [api, searchQuery, selectedCategory, selectedStock, selectedType, selectedSort, page]
  );

  useEffect(() => {
    loadCategories();
  }, [loadCategories, activeStore]);

  useEffect(() => {
    fetchProducts(true);
  }, [selectedStock, selectedCategory, selectedType, selectedSort, activeStore]);

  const handleSearch = () => {
    fetchProducts(true);
  };

  const handleOpenEdit = async (product: WooProduct) => {
    if (product.type === 'variable') {
      setVariableProduct(product);
      setIsLoadingVariations(true);
      try {
        if (api) {
          const vars = await api.getProductVariations(product.id);
          setVariations(vars);
        }
      } catch (e) {
        Alert.alert('خطا', 'عدم دریافت متغیرهای محصول.');
      } finally {
        setIsLoadingVariations(false);
      }
    } else {
      setEditingProduct(product);
      setRegularPrice(product.regular_price || product.price || '');
      setSalePrice(product.sale_price || '');
      setStockQuantity(product.stock_quantity !== null ? product.stock_quantity.toString() : '');
    }
  };

  const saveProductChanges = async () => {
    if (!api || !editingProduct) return;
    try {
      setIsSaving(true);
      const parsedStock = stockQuantity === '' ? null : parseInt(stockQuantity, 10);
      const updated = await api.updateProductPriceAndStock(editingProduct.id, {
        regular_price: regularPrice,
        sale_price: salePrice,
        stock_quantity: parsedStock,
        stock_status: parsedStock === 0 ? 'outofstock' : 'instock',
      });

      setProducts((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
      setEditingProduct(null);
      Alert.alert('موفقیت', 'قیمت و موجودی کالا بروزرسانی شد.');
    } catch (e) {
      Alert.alert('خطا', 'خطا در ثبت تغییرات کالا.');
    } finally {
      setIsSaving(false);
    }
  };

  const openEditSingleVariation = (v: WooVariation) => {
    setEditingVariation(v);
    setVarRegularPrice(v.regular_price || v.price || '');
    setVarSalePrice(v.sale_price || '');
    setVarStockQuantity(v.stock_quantity !== null ? v.stock_quantity.toString() : '');
  };

  const saveVariationChanges = async () => {
    if (!api || !variableProduct || !editingVariation) return;
    try {
      setIsSavingVar(true);
      const parsedStock = varStockQuantity === '' ? null : parseInt(varStockQuantity, 10);
      const updatedVar = await api.updateProductVariation(variableProduct.id, editingVariation.id, {
        regular_price: varRegularPrice,
        sale_price: varSalePrice,
        stock_quantity: parsedStock,
        stock_status: parsedStock === 0 ? 'outofstock' : 'instock',
      });

      setVariations((prev) => prev.map((v) => (v.id === updatedVar.id ? { ...v, ...updatedVar } : v)));
      setEditingVariation(null);
      Alert.alert('موفقیت', 'قیمت و موجودی متغیر بروزرسانی شد.');
    } catch (e) {
      Alert.alert('خطا', 'خطا در ثبت تغییرات متغیر.');
    } finally {
      setIsSavingVar(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!api) return;
    if (!newTitle.trim() || !newRegularPrice.trim()) {
      Alert.alert('خطا', 'نام محصول و قیمت عادی الزامی هستند.');
      return;
    }

    try {
      setIsCreating(true);
      const payload: any = {
        name: newTitle.trim(),
        type: 'simple',
        regular_price: newRegularPrice.trim(),
        sale_price: newSalePrice.trim() || undefined,
        sku: newSku.trim() || undefined,
        description: newDescription.trim() || undefined,
        manage_stock: !!newStock.trim(),
        stock_quantity: newStock.trim() ? parseInt(newStock.trim(), 10) : undefined,
        stock_status: newStock.trim() && parseInt(newStock.trim(), 10) <= 0 ? 'outofstock' : 'instock',
      };

      if (newCategory) {
        payload.categories = [{ id: newCategory }];
      }

      if (newImageUrl.trim()) {
        payload.images = [{ src: newImageUrl.trim() }];
      }

      const created = await api.createProduct(payload);
      setProducts((prev) => [created, ...prev]);

      // پاک کردن فرم
      setNewTitle('');
      setNewRegularPrice('');
      setNewSalePrice('');
      setNewStock('');
      setNewSku('');
      setNewCategory(null);
      setNewDescription('');
      setNewImageUrl('');
      setCreateModalVisible(false);

      Alert.alert('موفقیت', 'محصول جدید با موفقیت به سایت ووکامرس اضافه شد.');
    } catch (e: any) {
      console.error('Create product error:', e);
      Alert.alert('خطا', 'عدم امکان ایجاد محصول. لطفاً دسترسی‌ها و اینترنت را بررسی کنید.');
    } finally {
      setIsCreating(false);
    }
  };

  const hasActiveFilters = selectedStock !== 'all' || selectedCategory !== 'all' || selectedType !== 'all' || selectedSort !== 'date_desc';

  const resetAllFilters = () => {
    setSelectedStock('all');
    setSelectedCategory('all');
    setSelectedType('all');
    setSelectedSort('date_desc');
    setFilterModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Search Header, Filter Button & Add Product Button */}
      <View style={styles.topHeaderRow}>
        <TouchableOpacity
          style={styles.addProductBtn}
          onPress={() => setCreateModalVisible(true)}
        >
          <Plus size={20} color="#ffffff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterBtn, hasActiveFilters && styles.filterBtnActive]}
          onPress={() => setFilterModalVisible(true)}
        >
          <Filter size={18} color={hasActiveFilters ? '#ffffff' : '#2563eb'} />
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <TouchableOpacity style={styles.searchIconBtn} onPress={handleSearch}>
            <Search size={18} color="#64748b" />
          </TouchableOpacity>
          <TextInput
            style={styles.searchInput}
            placeholder="جستجوی نام کالا یا کد SKU..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            textAlign="right"
            returnKeyType="search"
          />
        </View>
      </View>

      {/* Quick Category / Stock Horizontal Filter */}
      <View style={styles.quickFilterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickFilterList}>
          {STOCK_FILTERS.map((f) => {
            const isSelected = selectedStock === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[styles.quickChip, isSelected && styles.quickChipActive]}
                onPress={() => setSelectedStock(f.id)}
              >
                <Text style={[styles.quickChipText, isSelected && styles.quickChipTextActive]}>{f.title}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Product List */}
      {isLoading && page === 1 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>در حال فراخوانی کامل محصولات...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchProducts(true)} colors={['#2563eb']} />}
          onEndReached={() => {
            if (!isLoading && hasMore) fetchProducts(false);
          }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Package size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>محصولی با این فیلترها یافت نشد</Text>
              {hasActiveFilters && (
                <TouchableOpacity style={styles.resetBtn} onPress={resetAllFilters}>
                  <Text style={styles.resetBtnText}>حذف همه فیلترها</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item }) => {
            const isOutOfStock = item.stock_status === 'outofstock' || (item.stock_quantity !== null && item.stock_quantity <= 0);
            const imageUri = item.images?.[0]?.src;
            const isVariable = item.type === 'variable';
            const categoriesText = item.categories?.map((c) => c.name).join('، ');

            return (
              <View style={styles.productCard}>
                <View style={styles.cardMain}>
                  <View style={styles.infoContainer}>
                    <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
                      <Text style={styles.productName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      {isVariable && (
                        <View style={styles.variableBadge}>
                          <Text style={styles.variableBadgeText}>متغیر</Text>
                        </View>
                      )}
                    </View>

                    {categoriesText ? (
                      <Text style={styles.categoryName} numberOfLines={1}>
                        {categoriesText}
                      </Text>
                    ) : null}

                    <View style={styles.priceRow}>
                      <Text style={styles.priceValue}>
                        {formatPrice(item.price || item.regular_price, activeStore?.currencySymbol)}
                      </Text>
                      {item.sale_price ? (
                        <Text style={styles.oldPrice}>
                          {formatPrice(item.regular_price, activeStore?.currencySymbol)}
                        </Text>
                      ) : null}
                    </View>

                    <View style={styles.stockBadgeRow}>
                      <View style={[styles.stockBadge, isOutOfStock ? styles.outOfStockBg : styles.inStockBg]}>
                        <Text style={[styles.stockBadgeText, isOutOfStock ? styles.outOfStockText : styles.inStockText]}>
                          {isOutOfStock
                            ? 'ناموجود'
                            : item.stock_quantity !== null
                            ? 'موجودی: ' + toPersianDigits(item.stock_quantity) + ' عدد'
                            : 'موجود در انبار'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.productImage} />
                  ) : (
                    <View style={styles.noImage}>
                      <Package size={24} color="#94a3b8" />
                    </View>
                  )}
                </View>

                {/* Edit Action */}
                <TouchableOpacity style={styles.quickEditBtn} onPress={() => handleOpenEdit(item)}>
                  {isVariable ? (
                    <>
                      <Layers size={15} color="#2563eb" style={{ marginLeft: 6 }} />
                      <Text style={styles.quickEditText}>مدیریت قیمت و موجودی متغیرها</Text>
                    </>
                  ) : (
                    <>
                      <Edit3 size={15} color="#2563eb" style={{ marginLeft: 6 }} />
                      <Text style={styles.quickEditText}>ویرایش سریع قیمت و موجودی</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      {/* Add New Product Modal */}
      <Modal visible={createModalVisible} transparent animationType="slide" onRequestClose={() => setCreateModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>افزودن محصول جدید به ووکامرس</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalLabel}>نام محصول *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="مثلاً: گوشی موبایل سامسونگ S24"
                placeholderTextColor="#94a3b8"
                value={newTitle}
                onChangeText={setNewTitle}
                textAlign="right"
              />

              <View style={{ flexDirection: 'row-reverse', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalLabel}>قیمت عادی (تومان) *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="مثلاً: ۲۵۰۰۰۰۰۰"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={newRegularPrice}
                    onChangeText={setNewRegularPrice}
                    textAlign="right"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalLabel}>قیمت حراج / تخفیف</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="اختیاری"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={newSalePrice}
                    onChangeText={setNewSalePrice}
                    textAlign="right"
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row-reverse', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalLabel}>موجودی انبار (تعداد)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="مثلاً: ۱۰"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={newStock}
                    onChangeText={setNewStock}
                    textAlign="right"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalLabel}>کد محصول (SKU)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="مثلاً: SAM-S24-128"
                    placeholderTextColor="#94a3b8"
                    value={newSku}
                    onChangeText={setNewSku}
                    textAlign="right"
                  />
                </View>
              </View>

              <Text style={styles.modalLabel}>لینک عکس محصول (URL)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="https://myshop.com/image.jpg"
                placeholderTextColor="#94a3b8"
                value={newImageUrl}
                onChangeText={setNewImageUrl}
                autoCapitalize="none"
              />

              {categories.length > 0 && (
                <>
                  <Text style={styles.modalLabel}>انتخاب دسته‌بندی</Text>
                  <View style={styles.filterOptionsGrid}>
                    {categories.map((c) => {
                      const isSelected = newCategory === c.id;
                      return (
                        <TouchableOpacity
                          key={c.id}
                          style={[styles.filterOptionChip, isSelected && styles.filterOptionChipActive]}
                          onPress={() => setNewCategory(isSelected ? null : c.id)}
                        >
                          <Text style={[styles.filterOptionText, isSelected && styles.filterOptionTextActive]}>
                            {c.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              <Text style={styles.modalLabel}>توضیحات کوتاه محصول</Text>
              <TextInput
                style={[styles.modalInput, { height: 70 }]}
                placeholder="توضیحات معرفی محصول..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
                value={newDescription}
                onChangeText={setNewDescription}
                textAlign="right"
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={handleCreateProduct}
                disabled={isCreating}
              >
                {isCreating ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>ایجاد و انتشار در سایت</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelModalBtn]}
                onPress={() => setCreateModalVisible(false)}
              >
                <Text style={styles.cancelModalText}>انصراف</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Advanced Filter Modal */}
      <Modal visible={filterModalVisible} transparent animationType="slide" onRequestClose={() => setFilterModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>فیلترهای پیشرفته و مرتب‌سازی</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Sort By */}
              <Text style={styles.filterSectionTitle}>مرتب‌سازی بر اساس</Text>
              <View style={styles.filterOptionsGrid}>
                {SORT_OPTIONS.map((s) => {
                  const isSelected = selectedSort === s.id;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.filterOptionChip, isSelected && styles.filterOptionChipActive]}
                      onPress={() => setSelectedSort(s.id)}
                    >
                      <Text style={[styles.filterOptionText, isSelected && styles.filterOptionTextActive]}>{s.title}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Product Type Filter */}
              <Text style={styles.filterSectionTitle}>نوع محصول</Text>
              <View style={styles.filterOptionsGrid}>
                {TYPE_FILTERS.map((t) => {
                  const isSelected = selectedType === t.id;
                  return (
                    <TouchableOpacity
                      key={t.id}
                      style={[styles.filterOptionChip, isSelected && styles.filterOptionChipActive]}
                      onPress={() => setSelectedType(t.id)}
                    >
                      <Text style={[styles.filterOptionText, isSelected && styles.filterOptionTextActive]}>{t.title}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Category Filter */}
              {categories.length > 0 && (
                <>
                  <Text style={styles.filterSectionTitle}>دسته‌بندی‌های فروشگاه</Text>
                  <View style={styles.filterOptionsGrid}>
                    <TouchableOpacity
                      style={[styles.filterOptionChip, selectedCategory === 'all' && styles.filterOptionChipActive]}
                      onPress={() => setSelectedCategory('all')}
                    >
                      <Text style={[styles.filterOptionText, selectedCategory === 'all' && styles.filterOptionTextActive]}>
                        همه دسته‌ها
                      </Text>
                    </TouchableOpacity>
                    {categories.map((c) => {
                      const isSelected = selectedCategory === c.id;
                      return (
                        <TouchableOpacity
                          key={c.id}
                          style={[styles.filterOptionChip, isSelected && styles.filterOptionChipActive]}
                          onPress={() => setSelectedCategory(c.id)}
                        >
                          <Text style={[styles.filterOptionText, isSelected && styles.filterOptionTextActive]}>
                            {c.name} ({toPersianDigits(c.count)})
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={() => setFilterModalVisible(false)}
              >
                <Text style={styles.saveBtnText}>اعمال فیلترها</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelModalBtn]}
                onPress={resetAllFilters}
              >
                <Text style={styles.cancelModalText}>پاک کردن فیلترها</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Simple Product Edit Modal */}
      <Modal visible={!!editingProduct} transparent animationType="fade" onRequestClose={() => setEditingProduct(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setEditingProduct(null)}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>ویرایش سریع کالا</Text>
            </View>

            <Text style={styles.modalProductName} numberOfLines={2}>
              {editingProduct?.name}
            </Text>

            <Text style={styles.modalLabel}>قیمت عادی ({activeStore?.currencySymbol || 'تومان'})</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={regularPrice}
              onChangeText={setRegularPrice}
              textAlign="right"
              placeholder="مثلاً ۱۰۰۰۰۰"
            />

            <Text style={styles.modalLabel}>قیمت فروش ویژه / حراج</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={salePrice}
              onChangeText={setSalePrice}
              textAlign="right"
              placeholder="اختیاری"
            />

            <Text style={styles.modalLabel}>تعداد موجودی در انبار</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={stockQuantity}
              onChangeText={setStockQuantity}
              textAlign="right"
              placeholder="تعداد عدد"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={saveProductChanges}
                disabled={isSaving}
              >
                {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>ذخیره تغییرات</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelModalBtn]}
                onPress={() => setEditingProduct(null)}
              >
                <Text style={styles.cancelModalText}>انصراف</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Variable Product Modal (List of variations) */}
      <Modal visible={!!variableProduct} transparent animationType="slide" onRequestClose={() => setVariableProduct(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setVariableProduct(null)}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>متغیرهای محصول</Text>
            </View>

            <Text style={styles.modalProductName} numberOfLines={2}>
              {variableProduct?.name}
            </Text>

            {isLoadingVariations ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={{ marginTop: 10, color: '#64748b', fontSize: 13 }}>در حال بارگذاری متغیرها...</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {variations.length === 0 ? (
                  <Text style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>متغیری یافت نشد.</Text>
                ) : (
                  variations.map((v) => {
                    const attrText = v.attributes.map((a) => a.name + ': ' + a.option).join(' | ') || ('متغیر #' + v.id);
                    return (
                      <View key={v.id} style={styles.variationRow}>
                        <View style={{ flex: 1, alignItems: 'flex-end', marginRight: 10 }}>
                          <Text style={styles.variationTitle}>{attrText}</Text>
                          <Text style={styles.variationPrice}>
                            {formatPrice(v.price || v.regular_price, activeStore?.currencySymbol)}
                          </Text>
                          <Text style={styles.variationStock}>
                            {v.stock_quantity !== null ? ('موجودی: ' + toPersianDigits(v.stock_quantity)) : 'نامحدود'}
                          </Text>
                        </View>
                        <TouchableOpacity style={styles.varEditBtn} onPress={() => openEditSingleVariation(v)}>
                          <Edit3 size={14} color="#2563eb" />
                          <Text style={styles.varEditText}>ویرایش</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Edit Single Variation Modal */}
      <Modal visible={!!editingVariation} transparent animationType="fade" onRequestClose={() => setEditingVariation(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setEditingVariation(null)}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>ویرایش متغیر کالا</Text>
            </View>

            <Text style={styles.modalProductName}>
              {editingVariation?.attributes.map((a) => a.name + ': ' + a.option).join(' | ')}
            </Text>

            <Text style={styles.modalLabel}>قیمت عادی ({activeStore?.currencySymbol || 'تومان'})</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={varRegularPrice}
              onChangeText={setVarRegularPrice}
              textAlign="right"
              placeholder="قیمت عادی"
            />

            <Text style={styles.modalLabel}>قیمت حراج / فروش ویژه</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={varSalePrice}
              onChangeText={setVarSalePrice}
              textAlign="right"
              placeholder="اختیاری"
            />

            <Text style={styles.modalLabel}>موجودی انبار</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={varStockQuantity}
              onChangeText={setVarStockQuantity}
              textAlign="right"
              placeholder="تعداد عدد"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={saveVariationChanges}
                disabled={isSavingVar}
              >
                {isSavingVar ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>ذخیره تغییرات متغیر</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelModalBtn]}
                onPress={() => setEditingVariation(null)}
              >
                <Text style={styles.cancelModalText}>انصراف</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  addProductBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  filterBtnActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    height: 44,
  },
  searchIconBtn: {
    padding: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
  },
  quickFilterWrapper: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  quickFilterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quickChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  quickChipText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  quickChipTextActive: {
    color: '#ffffff',
  },
  categoryName: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'right',
    marginBottom: 4,
  },
  filterSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'right',
    marginTop: 12,
    marginBottom: 8,
  },
  filterOptionsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  filterOptionChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterOptionChipActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  filterOptionText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  filterOptionTextActive: {
    color: '#2563eb',
    fontWeight: '700',
  },
  resetBtn: {
    marginTop: 12,
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  resetBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
  },
  cardMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoContainer: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'right',
    marginBottom: 6,
    flex: 1,
  },
  variableBadge: {
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  variableBadgeText: {
    fontSize: 10,
    color: '#9333ea',
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginVertical: 4,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#16a34a',
  },
  oldPrice: {
    fontSize: 12,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  stockBadgeRow: {
    marginTop: 4,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  inStockBg: {
    backgroundColor: '#dcfce7',
  },
  outOfStockBg: {
    backgroundColor: '#fee2e2',
  },
  stockBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  inStockText: {
    color: '#16a34a',
  },
  outOfStockText: {
    color: '#dc2626',
  },
  productImage: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  noImage: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickEditBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    marginTop: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  quickEditText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748b',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalProductName: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'right',
    marginBottom: 14,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    textAlign: 'right',
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row-reverse',
    gap: 10,
    marginTop: 10,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtn: {
    backgroundColor: '#16a34a',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  cancelModalBtn: {
    backgroundColor: '#f1f5f9',
  },
  cancelModalText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  variationRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  variationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  variationPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16a34a',
    marginTop: 2,
  },
  variationStock: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  varEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  varEditText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '700',
    marginLeft: 4,
  },
});
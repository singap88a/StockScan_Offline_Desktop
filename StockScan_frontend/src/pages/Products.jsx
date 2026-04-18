import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Input } from '../components/ui/Base';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import Barcode from 'react-barcode';
import {
  Plus, Search, Edit2, Trash2, Filter,
  Package, Printer, ChevronLeft, ChevronRight,
  Barcode as BarcodeIcon, Loader2, AlertCircle
} from 'lucide-react';
import { productsAPI } from '../lib/api';
import { useAuth } from '../App';

export default function Products() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [selectedBarcodeProduct, setSelectedBarcodeProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [apiError, setApiError] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const [res, catRes] = await Promise.all([
        productsAPI.getAll({ search: searchTerm, page, limit: 10 }),
        productsAPI.getCategories()
      ]);
      setProducts(res.data.data);
      setTotalPages(res.data.pages);
      setTotalCount(res.data.total);
      setCategories(catRes.data.data);
    } catch (err) {
      setApiError('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, page]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.target);
    const productData = {
      name: formData.get('name'),
      sellPrice: Number(formData.get('sellPrice')),
      costPrice: Number(formData.get('costPrice')),
      quantity: Number(formData.get('quantity')),
      color: formData.get('color') || '',
      size: formData.get('size') || '',
      discount: Number(formData.get('discount')) || 0,
      barcode: formData.get('barcode') || Date.now().toString(),
      category: formData.get('category') || 'عام',
    };
    try {
      if (editingProduct) {
        await productsAPI.update(editingProduct._id, productData);
      } else {
        await productsAPI.create(productData);
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'حدث خطأ، حاول مرة أخرى');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await productsAPI.delete(productToDelete._id);
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'فشل الحذف');
    }
  };

  const printBarcode = (product) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>طباعة باركود - ${product.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
            body { font-family: 'Cairo', sans-serif; text-align: center; padding: 20px; margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
            .label { border: 2px dashed #000; padding: 30px; border-radius: 20px; display: inline-block; width: 350px; background: white; }
            h2 { margin: 0 0 10px 0; font-weight: 900; font-size: 24px; color: #111; }
            .barcode-svg { margin: 20px 0; }
            .price { margin: 15px 0 0 0; font-size: 28px; font-weight: 900; color: #000; }
          </style>
        </head>
        <body>
          <div class="label">
            <h2>${product.name}</h2>
            <svg id="barcode-canvas"></svg>
            <p class="price">${product.sellPrice.toFixed(2)} ج.م</p>
          </div>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
          <script>
            JsBarcode("#barcode-canvas", "${product.barcode}", {
              format: "CODE128",
              lineColor: "#000",
              width: 2,
              height: 100,
              displayValue: true,
              fontSize: 16,
              font: "Cairo"
            });
            setTimeout(function() { window.print(); }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">إدارة المنتجات</h1>
          <p className="text-gray-500 font-medium mt-1">عرض وتعديل وإضافة منتجات جديدة للمخزن</p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setEditingProduct(null); setIsModalOpen(true); }} className="sm:w-fit gap-3 h-14 shadow-xl shadow-primary-200/50 rounded-2xl font-black px-8">
            <Plus className="w-6 h-6" />
            <span>إضافة منتج جديد</span>
          </Button>
        )}
      </div>

      <Card className="overflow-hidden p-0 rounded-[2.5rem] border-gray-100/50 shadow-2xl shadow-gray-200/20 bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 pb-4">
          <div className="relative w-full md:w-[28rem]">
            <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            <input
              type="text"
              placeholder="ابحث باسم المنتج أو الباركود..."
              className="w-full pr-14 pl-6 py-4 bg-gray-50/50 border border-gray-100/50 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all font-bold text-sm"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
          </div>
        ) : (
          <Table headers={['المنتج', 'سعر البيع', 'التكلفة', 'الكمية', 'اللون / المقاس', 'الخصم', 'الإجراءات']}>
            {products.map((product) => (
              <tr key={product._id} className="hover:bg-gray-50/30 transition-all group">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[1rem] bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors shrink-0 border border-gray-100/50">
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-black text-gray-900 text-sm">{product.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono tracking-widest mt-0.5">{product.barcode || '---'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5"><span className="font-black text-gray-900 text-sm tabular-nums">{product.sellPrice.toFixed(2)} ج.م</span></td>
                <td className="px-8 py-5 text-sm text-gray-500 font-bold tabular-nums">{product.costPrice.toFixed(2)} ج.م</td>
                <td className="px-8 py-5">
                  <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                    product.quantity <= 5 ? 'bg-red-50 text-red-600 border border-red-100/50' : 'bg-green-50 text-green-600 border border-green-100/50'
                  }`}>{product.quantity} قطعة</span>
                </td>
                <td className="px-8 py-5 text-xs text-gray-500 font-bold">{product.color} {product.size ? `/ ${product.size}` : ''}</td>
                <td className="px-8 py-5">
                  {product.discount > 0
                    ? <span className="text-red-500 font-bold text-xs bg-red-50 px-2 py-1 rounded-lg">-{product.discount} ج.م</span>
                    : <span className="text-gray-300">-</span>}
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => { setSelectedBarcodeProduct(product); setIsBarcodeModalOpen(true); }} className="p-2.5 bg-gray-50 hover:bg-gray-900 text-gray-600 hover:text-white rounded-xl transition-colors border border-gray-100/50" title="عرض الباركود">
                      <BarcodeIcon className="w-4 h-4" />
                    </button>
                    {isAdmin && (
                      <>
                        <button onClick={() => { setEditingProduct(product); setIsModalOpen(true); }} className="p-2.5 bg-blue-50/50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-xl transition-colors border border-blue-100/30" title="تعديل">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setProductToDelete(product); setIsDeleteModalOpen(true); }} className="p-2.5 bg-red-50/50 hover:bg-red-600 text-red-600 hover:text-white rounded-xl transition-colors border border-red-100/30" title="حذف">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}

        <div className="flex items-center justify-between p-6 bg-gray-50/30 border-t border-gray-100/50 text-xs">
          <p className="text-gray-500 font-medium">
            يتم عرض <span className="font-black text-gray-900">{products.length}</span> منتج من أصل <span className="font-black text-gray-900">{totalCount}</span>
          </p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" className="gap-2 h-10 px-4 rounded-xl font-bold bg-white disabled:opacity-50" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              <ChevronRight className="w-4 h-4" /> السابق
            </Button>
            <span className="px-3 py-1 text-xs font-black text-gray-500">{page} / {totalPages}</span>
            <Button variant="secondary" className="gap-2 h-10 px-4 rounded-xl font-bold bg-white disabled:opacity-50" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
              التالي <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingProduct(null); }} title={editingProduct ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'} maxWidth="max-w-6xl">
        <form onSubmit={handleSave} className="mt-2 space-y-6">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Form Fields - Compact Grid */}
            <div className="flex-1 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="md:col-span-2">
                  <Input label="اسم المنتج" name="name" defaultValue={editingProduct?.name} placeholder="مثال: قميص قطني" required className="h-12 bg-gray-50/50 border-gray-100 text-base font-bold rounded-xl" />
                </div>
                <div className="md:col-span-1">
                  <Input label="باركود المنتج" name="barcode" defaultValue={editingProduct?.barcode} placeholder="000000000" className="h-12 bg-gray-50/50 border-gray-100 font-mono tracking-widest text-center text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Input label="سعر البيع (ج.م)" name="sellPrice" type="number" step="0.01" defaultValue={editingProduct?.sellPrice} required className="h-12 bg-gray-50/50 border-gray-100 font-black text-center text-primary-600 text-base" />
                <Input label="سعر التكلفة (ج.م)" name="costPrice" type="number" step="0.01" defaultValue={editingProduct?.costPrice} required className="h-12 bg-gray-50/50 border-gray-100 font-bold text-center text-gray-600 text-sm" />
                <Input label="الكمية المتوفرة" name="quantity" type="number" defaultValue={editingProduct?.quantity ?? 0} required className="h-12 bg-gray-50/50 border-gray-100 font-bold text-center text-primary-600 text-base" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Input label="اللون" name="color" defaultValue={editingProduct?.color} placeholder="أحمر، أزرق..." className="h-12 bg-gray-50/50 border-gray-100 text-sm" />
                <Input label="المقاس" name="size" defaultValue={editingProduct?.size} placeholder="XL, 42..." className="h-12 bg-gray-50/50 border-gray-100 font-mono text-center text-sm" />
                <div>
                  <Input label="الفئة" name="category" list="category-list" defaultValue={editingProduct?.category ?? 'عام'} placeholder="ملابس، أحذية..." className="h-12 bg-gray-50/50 border-gray-100 text-sm" />
                  <datalist id="category-list">
                    {categories.map(cat => <option key={cat} value={cat} />)}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
                <div className="md:col-span-2 p-3 bg-red-50/30 rounded-xl border border-red-50">
                  <Input label="خصم مباشر (ج.م)" name="discount" type="number" step="0.01" defaultValue={editingProduct?.discount ?? 0} className="h-10 bg-white border-red-100 font-black text-red-500 text-center text-base" />
                </div>
                <div className="md:col-span-2 flex items-center gap-2">
                  <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1 h-12 rounded-xl bg-gray-50 border-none font-bold text-sm">إلغاء</Button>
                  <Button type="submit" disabled={saving} className="flex-[2] h-12 rounded-xl shadow-lg shadow-primary-200/50 font-black text-sm">
                    {saving ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />حفظ...</span> : editingProduct ? 'حفظ التعديلات' : 'إضافة المنتج'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Sidebar Preview - Compact */}
            <div className="w-full lg:w-60 flex flex-col items-center p-6 bg-gray-50/50 rounded-2xl border border-gray-100/50 h-fit">
              <span className="text-[10px] font-black text-gray-400 mb-4 uppercase tracking-widest text-center">الباركود</span>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 w-full flex items-center justify-center overflow-hidden h-24">
                {editingProduct ? (
                  <Barcode value={editingProduct.barcode} width={1.2} height={40} fontSize={10} font="Cairo" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-300 gap-1">
                    <BarcodeIcon className="w-6 h-6 opacity-20" />
                    <span className="text-[8px] font-bold uppercase tracking-tight opacity-50">توليد تلقائي</span>
                  </div>
                )}
              </div>
              <div className="mt-4 text-center w-full space-y-3">
                <p className="text-[10px] text-gray-500 font-mono font-bold bg-white py-1.5 px-3 rounded-lg border border-gray-100 shadow-sm block w-full truncate">
                  {editingProduct?.barcode || '00-00-00-00'}
                </p>
                <Button variant="secondary" className="w-full h-10 gap-2 border-gray-200 rounded-lg font-bold text-[10px] bg-white hover:bg-gray-900 hover:text-white transition-all group" onClick={() => editingProduct && printBarcode(editingProduct)} disabled={!editingProduct}>
                  <Printer className="w-3 h-3 group-hover:scale-110" />
                  طباعة ملصق
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Barcode Modal */}
      <Modal isOpen={isBarcodeModalOpen} onClose={() => { setIsBarcodeModalOpen(false); setSelectedBarcodeProduct(null); }} title="طباعة ملصق الباركود" maxWidth="max-w-md">
        <div className="flex flex-col items-center p-4">
          <div className="bg-white p-8 rounded-[2rem] shadow-2xl shadow-gray-200/50 border border-gray-100 mb-6 flex items-center justify-center w-full overflow-hidden">
            {selectedBarcodeProduct && (
              <Barcode value={selectedBarcodeProduct.barcode} width={2} height={100} font="Cairo" />
            )}
          </div>
          <h3 className="font-black text-gray-900 text-center mb-1">{selectedBarcodeProduct?.name}</h3>
          <p className="text-[10px] text-gray-400 font-mono tracking-[0.2em] mb-8">{selectedBarcodeProduct?.barcode}</p>
          <div className="grid grid-cols-2 gap-3 w-full">
            <Button variant="secondary" className="h-12 rounded-xl text-xs font-bold border-gray-100" onClick={() => setIsBarcodeModalOpen(false)}>إغلاق</Button>
            <Button className="h-12 rounded-xl text-xs font-black shadow-lg shadow-primary-200 gap-2" onClick={() => { printBarcode(selectedBarcodeProduct); setIsBarcodeModalOpen(false); }}>
              <Printer className="w-4 h-4" /> طباعة فورية
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setProductToDelete(null); }}
        onConfirm={confirmDelete}
        title="حذف المنتج بشكل نهائي"
        message={`عملية حذف "${productToDelete?.name}" إجراء لا يمكن التراجع عنه. سيؤدي هذا إلى إزالة المنتج كلياً من السجلات.`}
      />
    </div>
  );
}


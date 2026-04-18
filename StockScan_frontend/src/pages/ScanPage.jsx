import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Button, Input } from '../components/ui/Base';
import {
  Barcode as BarcodeIcon, Camera, Keyboard, X, CheckCircle2,
  Package, AlertCircle, Plus, Minus, Loader2, RefreshCcw,
  PlayCircle
} from 'lucide-react';
import { productsAPI } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { Html5Qrcode } from 'html5-qrcode';

export default function ScanPage() {
  const [mode, setMode] = useState('camera');
  const [scannedProduct, setScannedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const scannerRef = useRef(null);
  const containerId = "reader";

  const handleScanSuccess = useCallback((code) => {
    if (code && !isScanning) {
      handleScan(code);
    }
  }, [isScanning]);

  const startScanner = async () => {
    setIsInitializing(true);
    setScanError('');
    try {
      // Ensure previous instance is stopped
      if (scannerRef.current) {
        try { await scannerRef.current.stop(); } catch(e) {}
      }

      const html5QrCode = new Html5Qrcode(containerId);
      scannerRef.current = html5QrCode;

      const config = { 
        fps: 15, 
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.0
      };

      await html5QrCode.start(
        { facingMode: "environment" }, 
        config, 
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {} // Suppress noise
      );
      setCameraActive(true);
    } catch (err) {
      console.error(err);
      setScanError('تعذر الوصول للكاميرا. يرجى التحقق من الأذونات.');
      setCameraActive(false);
    } finally {
      setIsInitializing(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        // Don't nullify scannerRef.current here if we need it for immediate restart
        setCameraActive(false);
      } catch (err) {
        console.error("Failed to stop scanner", err);
      }
    }
  };

  // Cleanup on unmount or mode change
  useEffect(() => {
    if (mode !== 'camera' || scannedProduct) {
      stopScanner();
    }
    return () => {
      stopScanner();
    };
  }, [mode, scannedProduct]);

  const handleScan = useCallback(async (code) => {
    if (!code || isScanning) return;
    setIsScanning(true);
    setScanError('');
    try {
      const res = await productsAPI.getByBarcode(code);
      setScannedProduct(res.data.data);
      setQuantity(1);
      showToast('success', `تم العثور على المنتج: ${res.data.data.name}`);
      // Stop scanner upon success
      stopScanner();
    } catch (err) {
      const msg = err.response?.data?.message || 'كود غير صحيح: لم يتم العثور على هذا المنتج';
      setScanError(msg);
      showToast('error', msg);
      setScannedProduct(null);
      // Keep scanner running so user can try another barcode
    } finally {
      setIsScanning(false);
    }
  }, [isScanning]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) handleScan(manualCode.trim());
  };

  const resetScanner = () => {
    setScannedProduct(null);
    setManualCode('');
    setQuantity(1);
    setScanError('');
    // Scanner will need to be restarted manually or we can auto-start here
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="text-center">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">مسح الباركود</h1>
        <p className="text-gray-500 mt-2 font-medium">استخدم الكاميرا أو أدخل الباركود يدوياً لإتمام عملية البيع</p>
      </div>

      <div className="flex justify-center">
        <div className="inline-flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
          <button
            onClick={() => setMode('camera')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all duration-300 font-bold ${
              mode === 'camera' ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Camera className="w-5 h-5" />
            <span>الكاميرا</span>
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all duration-300 font-bold ${
              mode === 'manual' ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Keyboard className="w-5 h-5" />
            <span>إدخال يدوي</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Scanner Side */}
        <div className="space-y-6">
          {mode === 'camera' ? (
            <Card className="p-0 overflow-hidden aspect-square relative bg-black group rounded-[2.5rem] shadow-2xl border-none">
              {/* Camera Container */}
              <div id={containerId} className="absolute inset-0 w-full h-full object-cover"></div>
              
              {/* Initial State: Start Button */}
              {!cameraActive && !isInitializing && !scannedProduct && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-gray-900/90 z-10 gap-6 p-8 text-center">
                  <div className="w-24 h-24 bg-primary-500/10 rounded-full flex items-center justify-center animate-pulse">
                    <Camera className="w-12 h-12 text-primary-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black mb-2">جاهز للمسح الضوئي</h3>
                    <p className="text-gray-400 text-sm mb-6">اضغط على الزر أدناه لتفعيل الكاميرا والبدء</p>
                  </div>
                  <Button onClick={startScanner} className="h-14 px-10 gap-3 rounded-2xl text-lg font-black shadow-xl shadow-primary-500/20">
                    <PlayCircle className="w-6 h-6" />
                    تشغيل الكاميرا
                  </Button>
                </div>
              )}

              {/* Initializing State */}
              {isInitializing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-gray-900 z-10 gap-4">
                  <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
                  <p className="font-bold tracking-widest uppercase text-xs">جاري تهيئة الكاميرا...</p>
                </div>
              )}

              {/* Error State */}
              {scanError && !isScanning && (
                <div className="absolute top-4 left-4 right-4 z-50 animate-in slide-in-from-top-4 duration-300">
                  <div className="bg-red-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center justify-between border border-red-400">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <p className="font-bold text-sm">{scanError}</p>
                    </div>
                    <button onClick={() => setScanError('')} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Visual Overlays (only visible while active) */}
              {cameraActive && (
                <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
                  <div className="w-64 h-40 border-2 border-primary-400 rounded-3xl flex items-center justify-center relative shadow-[0_0_100px_rgba(37,99,235,0.2)]">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-primary-500 shadow-[0_0_15px_#3b82f6] animate-[scan_2s_ease-in-out_infinite]"></div>
                    <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary-500 rounded-tr-xl"></div>
                    <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary-500 rounded-tl-xl"></div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary-500 rounded-br-xl"></div>
                    <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary-500 rounded-bl-xl"></div>
                  </div>
                  
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                    <div className="px-4 py-2 bg-black/50 backdrop-blur-md rounded-full text-white text-[10px] font-black uppercase tracking-widest border border-white/20">
                      ضع الباركود داخل الإطار
                    </div>
                  </div>
                </div>
              )}

              {/* Success State Overlay */}
              {scannedProduct && (
                <div className="absolute inset-0 z-40 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-500">
                  <div className="w-24 h-24 bg-green-50 text-green-600 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner ring-8 ring-green-50/50">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">تم المسح بنجاح!</h3>
                  <p className="text-gray-500 font-medium mb-8">تم العثور على منتج: {scannedProduct.name}</p>
                  <Button onClick={resetScanner} variant="secondary" className="h-12 px-8 gap-2 rounded-xl font-bold bg-gray-100 border-none hover:bg-gray-200">
                    <RefreshCcw className="w-4 h-4" /> مسح رمز آخر
                  </Button>
                </div>
              )}

              {/* Scanning Loader Overlay */}
              {isScanning && (
                <div className="absolute inset-0 z-50 bg-primary-600/10 backdrop-blur-[2px] flex flex-col items-center justify-center text-primary-600 animate-in fade-in duration-200">
                  <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-3 border border-primary-100">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p className="font-black text-sm uppercase tracking-widest">تحقق من الكود...</p>
                  </div>
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-8 rounded-[2.5rem] border-gray-100 shadow-xl shadow-gray-200/20">
              <form onSubmit={handleManualSubmit} className="space-y-6">
                <div className="p-5 bg-primary-50 rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary-600">
                    <BarcodeIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-primary-900">إدخال يدوي للباركود</h3>
                    <p className="text-xs text-primary-700 font-medium">أدخل رقم الباركود كما هو موضح على المنتج</p>
                  </div>
                </div>
                <Input
                  label="رقم الباركود"
                  placeholder="مثال: 123456789"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="text-xl tracking-widest font-mono text-center rounded-2xl h-14"
                  autoFocus
                />
                {scanError && (
                  <div className="flex items-center gap-3 bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 animate-in shake duration-300">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-bold">{scanError}</p>
                  </div>
                )}
                <Button type="submit" className="w-full h-14 text-lg rounded-2xl shadow-lg shadow-primary-200/50" disabled={isScanning}>
                  {isScanning ? (
                    <span className="flex items-center gap-2 justify-center"><Loader2 className="w-5 h-5 animate-spin" />جاري البحث...</span>
                  ) : 'بحث عن منتج'}
                </Button>
              </form>
            </Card>
          )}

          <div className="p-6 bg-orange-50 rounded-[2rem] border border-orange-100 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-orange-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-extrabold text-orange-900 text-sm">نصيحة الاستخدام</h4>
              <p className="text-orange-800 text-xs leading-relaxed font-medium">
                تأكد من إضاءة الغرفة بشكل جيد ووضع الباركود بداخل المربع لضمان سرعة التعرف على المنتج.
              </p>
            </div>
          </div>
        </div>

        {/* Product Result */}
        <div className="space-y-6">
          {scannedProduct ? (
            <div className="space-y-6 animate-in zoom-in-95 duration-500">
              <Card className="relative overflow-hidden border-none shadow-2xl shadow-primary-100 rounded-[2.5rem] p-8 bg-white">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                <div className="flex flex-col gap-6 relative z-10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-5">
                      <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
                        <Package className="w-10 h-10" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">{scannedProduct.name}</h2>
                        <p className="text-gray-400 font-mono text-xs mt-1 tracking-widest uppercase">الباركود: {scannedProduct.barcode}</p>
                      </div>
                    </div>
                    <button onClick={resetScanner} className="p-2.5 bg-gray-50 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1">المواصفات</p>
                      <p className="font-bold text-gray-800 text-sm">{scannedProduct.color} {scannedProduct.size ? `- ${scannedProduct.size}` : ''}</p>
                    </div>
                    <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1">المخزون</p>
                      <p className={`font-black text-sm ${scannedProduct.quantity < 10 ? 'text-red-500' : 'text-green-600'}`}>
                        {scannedProduct.quantity} قطعة
                      </p>
                    </div>
                  </div>

                  {/* Quantity Selector */}
                  <div className="flex items-center justify-between p-5 bg-primary-50/30 rounded-3xl border border-primary-50">
                    <p className="font-black text-gray-900">الكمية المطلوبة</p>
                    <div className="flex items-center gap-6">
                      <button
                        onClick={() => quantity > 1 && setQuantity(q => q - 1)}
                        className="w-10 h-10 bg-white border border-primary-100 rounded-xl flex items-center justify-center text-primary-600 transition-all active:scale-90 hover:shadow-md disabled:opacity-30"
                        disabled={quantity === 1}
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <span className="text-2xl font-black text-primary-600 tabular-nums min-w-[30px] text-center">{quantity}</span>
                      <button
                        onClick={() => quantity < scannedProduct.quantity && setQuantity(q => q + 1)}
                        className="w-10 h-10 bg-white border border-primary-100 rounded-xl flex items-center justify-center text-primary-600 transition-all active:scale-90 hover:shadow-md disabled:opacity-30"
                        disabled={quantity >= scannedProduct.quantity}
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">إجمالي السعر</p>
                      <h4 className="text-4xl font-black text-primary-600 tabular-nums tracking-tighter">
                        {((scannedProduct.sellPrice - (scannedProduct.discount || 0)) * quantity).toFixed(2)}
                        <span className="text-sm ms-2 font-bold opacity-40">ج.م</span>
                      </h4>
                    </div>
                    {scannedProduct.discount > 0 && (
                      <div className="text-end">
                        <p className="text-xs text-red-500 font-bold mb-1">توفير {(scannedProduct.discount * quantity).toFixed(2)} ج.م</p>
                        <p className="text-sm text-gray-400 line-through font-bold">{(scannedProduct.sellPrice * quantity).toFixed(2)} ج.م</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Button variant="secondary" className="h-14 text-lg border-2 rounded-2xl font-black opacity-60 hover:opacity-100" onClick={resetScanner}>
                  إلغاء العملية
                </Button>
                <Button
                  className="h-14 text-lg shadow-xl shadow-primary-200/50 gap-3 rounded-2xl font-black"
                  onClick={() => navigate('/billing', { state: { product: scannedProduct, quantity, isCheckout: true } })}
                >
                  <CheckCircle2 className="w-6 h-6" />
                  إتمام البيع
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-[430px] flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-gray-200 rounded-[2.5rem] bg-gray-50/50 group">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center text-gray-300 mb-6 group-hover:scale-110 group-hover:bg-primary-50 group-hover:text-primary-400 transition-all duration-500">
                <BarcodeIcon className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-gray-400 tracking-tight">في انتظار عملية المسح</h3>
              <p className="text-gray-400 mt-2 max-w-[250px] mx-auto text-sm font-medium leading-relaxed">
                بمجرد تعرّف النظام على المنتج، ستظهر بياناته هنا لتتمكن من إتمام عملية البيع
              </p>
              {scanError && (
                <p className="mt-4 text-sm text-red-500 font-bold bg-red-50 py-3 px-6 rounded-2xl border border-red-100">
                  {scanError}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

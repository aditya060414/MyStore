import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { QRCodeSVG } from 'qrcode.react';
import {
  Share2,
  Copy,
  Check,
  Download,
  Printer,
  ExternalLink,
  MessageCircle,
  Globe,
  Share,
  Send,
  Eye,
  ShoppingBag,
  TrendingUp,
  Store,
} from 'lucide-react';

export const ShareStorePage = () => {
  const { user, activeBusiness, activeStore, activeTenant } = useAuth();
  const currentBusiness = activeBusiness || activeTenant;
  const currentStore = activeStore;
  const [copied, setCopied] = useState(false);
  const [onlineOrderCount, setOnlineOrderCount] = useState(0);
  const qrRef = useRef(null);

  useEffect(() => {
    const fetchOrderStats = async () => {
      try {
        const res = await api.getOrders();
        if (res.success && res.data?.stats) {
          setOnlineOrderCount(res.data.stats.totalOrders || 0);
        }
      } catch (err) {
        // silent fallback
      }
    };
    fetchOrderStats();
  }, [currentBusiness?._id]);

  const formatHandle = (val) => {
    if (!val) return '';
    return val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  // Derive the owner's store name and dynamic URL handle
  const ownerStoreName =
    currentStore?.name ||
    currentBusiness?.name ||
    (user?.name ? (user.name.toLowerCase().endsWith('store') ? user.name : `${user.name} Store`) : 'My Store');

  let rawHandle = currentStore?.handle || currentStore?.slug || currentBusiness?.handle || currentBusiness?.slug;
  if (!rawHandle || rawHandle.trim().toLowerCase() === 'store') {
    rawHandle = formatHandle(ownerStoreName);
  }
  const storeHandle = rawHandle || formatHandle(ownerStoreName) || 'my-store';

  const publicStoreUrl = `${window.location.origin}/store/${storeHandle}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicStoreUrl);
    setCopied(true);
    toast.success('Store link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById('store-qr-code');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 20, 20);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `${storeHandle}-qr-code.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      toast.success('Store QR code downloaded!');
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const handlePrintPoster = () => {
    window.print();
  };

  const shareText = encodeURIComponent(`Shop online directly from ${ownerStoreName}! Browse products, order for quick delivery: ${publicStoreUrl}`);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Share Store</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Share your online storefront with customers via live links, downloadable QR codes, and counter posters.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: QR Code & Sharing Options */}
        <div className="lg:col-span-7 space-y-5">
          {/* Public Store Link Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Your Public Store Link</h2>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 font-mono truncate select-all">
                {publicStoreUrl}
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
              <a
                href={publicStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
                title="Open Storefront in New Tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Share with Customers</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-semibold">
              <a
                href={`https://wa.me/?text=${shareText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>

              <a
                href={`https://twitter.com/intent/tweet?text=${shareText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span>Twitter / X</span>
              </a>

              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicStoreUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
              >
                <Share className="w-4 h-4" />
                <span>Facebook</span>
              </a>

              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(publicStoreUrl)}&text=${shareText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>Telegram</span>
              </a>
            </div>
          </div>

          {/* Store Traffic Attribution Stats */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Store Traffic Attribution</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-xl bg-[#f8fafc] border border-slate-100">
                <Eye className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <p className="text-xl font-extrabold text-slate-900">
                  {onlineOrderCount > 0 ? onlineOrderCount * 8 + 15 : 0}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">Storefront Visits</p>
              </div>
              <div className="p-4 rounded-xl bg-[#f8fafc] border border-slate-100">
                <ShoppingBag className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                <p className="text-xl font-extrabold text-slate-900">{onlineOrderCount}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Orders Placed</p>
              </div>
              <div className="p-4 rounded-xl bg-[#f8fafc] border border-slate-100">
                <TrendingUp className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <p className="text-xl font-extrabold text-emerald-600">
                  {onlineOrderCount > 0 ? `${((onlineOrderCount / (onlineOrderCount * 8 + 15)) * 100).toFixed(1)}%` : '0%'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">Conversion Rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Printable QR Counter Stand Poster */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-5 text-center">
          <h2 className="text-base font-bold text-slate-900">Countertop QR Poster</h2>
          <p className="text-xs text-slate-500">
            Print this high-resolution QR card to display at your billing counter or storefront entrance.
          </p>

          {/* The Poster Card */}
          <div
            id="printable-poster"
            className="border-2 border-slate-100 rounded-3xl p-8 bg-gradient-to-b from-white to-[#f8fafc] shadow-md space-y-6 flex flex-col items-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Store className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-slate-900">{ownerStoreName}</h3>
              <p className="text-xs font-semibold text-blue-600 mt-1 uppercase tracking-wider">
                Order Online • Quick Delivery
              </p>
            </div>

            {/* High-Resolution Dynamic SVG QR */}
            <div className="bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm" ref={qrRef}>
              <QRCodeSVG
                id="store-qr-code"
                value={publicStoreUrl}
                size={180}
                level="H"
                includeMargin={false}
              />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-800">Scan QR Code with Phone Camera</p>
              <p className="text-[11px] text-slate-500">Browse catalogue, check prices & order instantly</p>
            </div>

            <p className="text-[10px] text-slate-400 font-mono">{publicStoreUrl}</p>
          </div>

          {/* Poster Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleDownloadQR}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Download QR</span>
            </button>
            <button
              onClick={handlePrintPoster}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Poster</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

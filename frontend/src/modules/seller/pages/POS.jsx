import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { HiOutlineShoppingBag, HiOutlineCalculator } from 'react-icons/hi';
import { sellerApi } from '../services/sellerApi';
import { posApi } from '../services/posApi';

import PosStatsBar from '../components/pos/PosStatsBar';
import PosProductGrid from '../components/pos/PosProductGrid';
import PosCart from '../components/pos/PosCart';
import PosCustomerLookup from '../components/pos/PosCustomerLookup';
import PosPaymentPanel from '../components/pos/PosPaymentPanel';
import PosReceipt from '../components/pos/PosReceipt';
import PosKeyboardShortcuts from '../components/pos/PosKeyboardShortcuts';
import PosHeldOrders from '../components/pos/PosHeldOrders';
import '../styles/pos.css';

const POS = () => {
    // Add class to body to hide sidebar when POS mounts
    useEffect(() => {
        document.body.classList.add('hide-sidebar');
        return () => {
            document.body.classList.remove('hide-sidebar');
        };
    }, []);

    const [shopName, setShopName] = useState('');
    const [cart, setCart] = useState([]);
    const [customer, setCustomer] = useState(null); // { name, phone, customerId? }
    const [paymentMode, setPaymentMode] = useState('CASH');
    const [cashReceived, setCashReceived] = useState(0);
    const [onlineAmountPaid, setOnlineAmountPaid] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    
    const [completedOrder, setCompletedOrder] = useState(null);
    const [showReceipt, setShowReceipt] = useState(false);
    const [heldCarts, setHeldCarts] = useState([]);
    
    // Focus ref for search
    const searchInputRef = useRef(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await sellerApi.getProfile();
                if (res.data?.success) {
                    setShopName(res.data.result?.shopName);
                }
            } catch (error) {
                console.error('Failed to load seller profile');
            }
        };
        fetchProfile();
        
        // Load held carts from local storage
        const savedHolds = localStorage.getItem('posHeldCarts');
        if (savedHolds) {
            try {
                setHeldCarts(JSON.parse(savedHolds));
            } catch(e) {}
        }
    }, []);

    // Save held carts to local storage on change
    useEffect(() => {
        localStorage.setItem('posHeldCarts', JSON.stringify(heldCarts));
    }, [heldCarts]);

    // Cart operations
    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item.productId === product._id);
            if (existing) {
                if (existing.quantity >= product.stock) {
                    toast.error(`Only ${product.stock} items available in stock`);
                    return prev;
                }
                return prev.map(item => 
                    item.productId === product._id 
                        ? { ...item, quantity: item.quantity + 1 } 
                        : item
                );
            }
            return [...prev, {
                productId: product._id,
                name: product.name,
                price: product.salePrice || product.price,
                quantity: 1,
                stock: product.stock
            }];
        });
    };

    const updateQuantity = (productId, newQuantity) => {
        if (newQuantity <= 0) {
            removeItem(productId);
            return;
        }
        
        setCart(prev => prev.map(item => {
            if (item.productId === productId) {
                if (newQuantity > item.stock) {
                    toast.error(`Only ${item.stock} items available in stock`);
                    return item;
                }
                return { ...item, quantity: newQuantity };
            }
            return item;
        }));
    };

    const removeItem = (productId) => {
        setCart(prev => prev.filter(item => item.productId !== productId));
    };

    const clearCart = () => {
        setCart([]);
        setCustomer(null);
        setPaymentMode('CASH');
        setCashReceived(0);
        setOnlineAmountPaid(0);
    };

    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal; // Assuming no additional fees for POS currently

    // Update cash received default if it was 0 when total changes
    useEffect(() => {
        if (cashReceived === 0 && total > 0 && paymentMode === 'CASH') {
            setCashReceived(total);
        }
    }, [total, paymentMode]);

    // Checkout
    const handleCheckout = async () => {
        if (cart.length === 0) {
            toast.error('Cart is empty');
            return;
        }
        if (!customer || !customer.phone) {
            toast.error('Please select or add a customer');
            return;
        }
        
        if (paymentMode === 'CASH' && cashReceived < total) {
            toast.error('Cash received is less than total amount');
            return;
        }
        
        if (paymentMode === 'MIXED') {
            const totalPaid = (cashReceived || 0) + (onlineAmountPaid || 0);
            if (totalPaid < total) {
                toast.error('Total payment received is less than bill amount');
                return;
            }
        }

        setIsProcessing(true);
        try {
            const payload = {
                items: cart,
                customer: {
                    phone: customer.phone,
                    name: customer.name,
                    customerId: customer.customerId
                },
                paymentMode,
                cashReceived: paymentMode === 'ONLINE' ? 0 : cashReceived,
                onlineAmountPaid: paymentMode === 'CASH' ? 0 : (paymentMode === 'MIXED' ? onlineAmountPaid : total)
            };

            const res = await posApi.createOrder(payload);
            
            if (res.data?.success) {
                toast.success('Bill generated successfully!');
                setCompletedOrder(res.data.result);
                setShowReceipt(true);
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to generate bill');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleNewBill = () => {
        setShowReceipt(false);
        setCompletedOrder(null);
        clearCart();
        // Focus search input on new bill
        setTimeout(() => {
            const searchInput = document.querySelector('.pos-product-grid input[type="text"]');
            if (searchInput) searchInput.focus();
        }, 100);
    };

    // Held Cart operations
    const holdCart = () => {
        if (cart.length === 0) {
            toast.error('Cart is empty');
            return;
        }
        
        const newHold = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            cart: [...cart],
            customer: customer ? { ...customer } : null,
            paymentMode
        };
        
        setHeldCarts(prev => [newHold, ...prev]);
        toast.success('Cart put on hold');
        clearCart();
    };
    
    const restoreCart = (heldCart) => {
        if (cart.length > 0) {
            toast.error('Current cart is not empty. Hold it first.');
            return;
        }
        
        setCart(heldCart.cart);
        setCustomer(heldCart.customer);
        setPaymentMode(heldCart.paymentMode || 'CASH');
        
        // Remove from held carts
        setHeldCarts(prev => prev.filter(hc => hc.id !== heldCart.id));
        toast.info('Cart restored');
    };
    
    const removeHeldCart = (id) => {
        setHeldCarts(prev => prev.filter(hc => hc.id !== id));
        toast.info('Held cart discarded');
    };

    const focusSearch = () => {
        const searchInput = document.querySelector('.pos-product-grid input[type="text"]');
        if (searchInput) searchInput.focus();
    };

    return (
        <div className="pos-layout">
            <PosStatsBar shopName={shopName} />
            
            <div className="pos-main-content">
                {/* Left Panel - Products */}
                <div className="pos-left-panel relative">
                    <PosProductGrid onAddToCart={addToCart} />
                </div>
                
                {/* Right Panel - Cart & Billing */}
                <div className="pos-right-panel border-l border-gray-200 flex flex-col shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-10 bg-gray-50">
                    {/* Customer Section */}
                    <div className="p-4 bg-white border-b border-gray-200 shrink-0">
                        <PosCustomerLookup customer={customer} setCustomer={setCustomer} />
                        
                        <PosHeldOrders 
                            heldCarts={heldCarts} 
                            onRestoreCart={restoreCart} 
                            onRemoveHeldCart={removeHeldCart} 
                        />
                    </div>
                    
                    {/* Cart Items */}
                    <PosCart 
                        cart={cart} 
                        updateQuantity={updateQuantity} 
                        removeItem={removeItem} 
                    />
                    
                    {/* Billing Summary & Payment */}
                    <div className="bg-white border-t border-gray-200 p-4 shrink-0 flex flex-col mt-auto shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] relative z-20 max-h-[50%] md:max-h-[60vh] overflow-y-auto">
                        {/* Totals */}
                        <div className="space-y-2 mb-2">
                            <div className="flex justify-between text-gray-500 text-sm">
                                <span>Subtotal</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold text-gray-900 border-t border-dashed border-gray-300 pt-2">
                                <span>TOTAL</span>
                                <span>₹{total.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Payment Details Panel (conditionally shown if items in cart) */}
                        {cart.length > 0 && (
                            <PosPaymentPanel 
                                total={total}
                                paymentMode={paymentMode}
                                setPaymentMode={setPaymentMode}
                                cashReceived={cashReceived}
                                setCashReceived={setCashReceived}
                                onlineAmountPaid={onlineAmountPaid}
                                setOnlineAmountPaid={setOnlineAmountPaid}
                            />
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 mt-4">
                            <button 
                                onClick={clearCart}
                                disabled={cart.length === 0 || isProcessing}
                                className="px-4 py-3 text-red-600 bg-red-50 hover:bg-red-100 font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Clear
                            </button>
                            <button 
                                onClick={handleCheckout}
                                disabled={cart.length === 0 || isProcessing || (!customer && cart.length > 0)}
                                className="flex-1 bg-blue-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-sm"
                            >
                                {isProcessing ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <HiOutlineCalculator size={24} />
                                )}
                                Generate Bill (F10)
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Global Keyboard Shortcuts footer */}
            <PosKeyboardShortcuts 
                onNewBill={handleNewBill}
                onFocusSearch={focusSearch}
                onHoldCart={holdCart}
                onCheckout={handleCheckout}
            />

            {/* Receipt Modal */}
            {showReceipt && (
                <PosReceipt 
                    order={completedOrder} 
                    onClose={() => setShowReceipt(false)} 
                    onNewBill={handleNewBill} 
                />
            )}
        </div>
    );
};

export default POS;

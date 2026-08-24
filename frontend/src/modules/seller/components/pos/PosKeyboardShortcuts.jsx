import React, { useEffect } from 'react';
import { toast } from 'sonner';

const PosKeyboardShortcuts = ({ 
    onNewBill, 
    onFocusSearch, 
    onHoldCart,
    onCheckout
}) => {
    
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Prevent default behavior for F-keys if we use them
            if (['F1', 'F2', 'F5', 'F10'].includes(e.key)) {
                e.preventDefault();
            }

            switch(e.key) {
                case 'F1':
                    onNewBill && onNewBill();
                    toast.info('Started new bill');
                    break;
                case 'F2':
                    onFocusSearch && onFocusSearch();
                    break;
                case 'F5':
                    onHoldCart && onHoldCart();
                    break;
                case 'F10':
                    onCheckout && onCheckout();
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onNewBill, onFocusSearch, onHoldCart, onCheckout]);

    return (
        <div className="bg-gray-800 text-gray-300 text-xs py-2 px-4 hidden md:flex gap-6 justify-center border-t border-gray-700 w-full shrink-0">
            <div className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors" onClick={onNewBill}>
                <span className="bg-gray-700 px-1.5 py-0.5 rounded text-white font-mono">F1</span>
                <span>New Bill</span>
            </div>
            <div className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors" onClick={onFocusSearch}>
                <span className="bg-gray-700 px-1.5 py-0.5 rounded text-white font-mono">F2</span>
                <span>Search/Barcode</span>
            </div>
            <div className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors" onClick={onHoldCart}>
                <span className="bg-gray-700 px-1.5 py-0.5 rounded text-white font-mono">F5</span>
                <span>Hold Cart</span>
            </div>
            <div className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors" onClick={onCheckout}>
                <span className="bg-gray-700 px-1.5 py-0.5 rounded text-white font-mono">F10</span>
                <span>Checkout</span>
            </div>
        </div>
    );
};

export default PosKeyboardShortcuts;

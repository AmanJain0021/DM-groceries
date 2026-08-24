import React from 'react';
import { HiOutlinePrinter, HiOutlineX } from 'react-icons/hi';
import { generatePosReceiptPdf } from './PosReceiptPdf';

const PosReceipt = ({ order, onClose, onNewBill }) => {
    if (!order) return null;

    const handlePrint = () => {
        generatePosReceiptPdf(order);
    };

    const handleDone = () => {
        if (onNewBill) onNewBill();
        if (onClose) onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-gray-100 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="bg-white p-4 flex items-center justify-between border-b border-gray-200 shrink-0">
                    <h3 className="font-bold text-gray-900 text-lg">Order Complete</h3>
                    <button 
                        onClick={handleDone}
                        className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors"
                    >
                        <HiOutlineX size={20} />
                    </button>
                </div>

                {/* Receipt Preview */}
                <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center">
                    <div id="print-area" className="bg-white p-6 shadow-sm w-full font-mono text-sm border-t-4 border-gray-800 relative print-receipt-section">
                        {/* Receipt content */}
                        <div className="text-center mb-6">
                            <h2 className="font-bold text-xl mb-1">{order.address?.address || 'DM Groceries'}</h2>
                            <p className="text-gray-500 text-xs">POS Receipt</p>
                        </div>
                        
                        <div className="mb-4 text-gray-600 text-xs flex justify-between">
                            <div>
                                <p>Receipt #: {order.posMetadata?.receiptNumber}</p>
                                <p>Date: {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>

                        {order.posMetadata?.walkInCustomerName && (
                            <div className="mb-4 text-gray-600 text-xs border-y border-dashed border-gray-300 py-2">
                                <p>Customer: {order.posMetadata.walkInCustomerName}</p>
                                {order.posMetadata.walkInCustomerPhone && <p>Phone: {order.posMetadata.walkInCustomerPhone}</p>}
                            </div>
                        )}

                        <div className="mb-4">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-dashed border-gray-300">
                                        <th className="text-left py-1 font-semibold text-gray-700">Item</th>
                                        <th className="text-center py-1 font-semibold text-gray-700">Qty</th>
                                        <th className="text-right py-1 font-semibold text-gray-700">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(order.items || []).map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="py-2 pr-2">
                                                <div className="truncate max-w-[120px]">{item.name}</div>
                                                <div className="text-[10px] text-gray-400">₹{item.price}</div>
                                            </td>
                                            <td className="text-center py-2">{item.quantity}</td>
                                            <td className="text-right py-2 font-medium">₹{(item.price * item.quantity).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="border-t border-dashed border-gray-300 pt-3 text-sm">
                            <div className="flex justify-between mb-1 text-gray-600">
                                <span>Subtotal</span>
                                <span>₹{order.paymentBreakdown?.productSubtotal?.toFixed(2)}</span>
                            </div>
                            {order.paymentBreakdown?.discountTotal > 0 && (
                                <div className="flex justify-between mb-1 text-gray-600">
                                    <span>Discount</span>
                                    <span>-₹{order.paymentBreakdown.discountTotal.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-gray-900 mt-2 text-base">
                                <span>TOTAL</span>
                                <span>₹{order.paymentBreakdown?.grandTotal?.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="border-t border-dashed border-gray-300 mt-4 pt-3 text-xs text-gray-600 space-y-1">
                            <div className="flex justify-between">
                                <span>Paid via {order.paymentMode}</span>
                                <span>₹{order.paymentBreakdown?.grandTotal?.toFixed(2)}</span>
                            </div>
                            {(order.paymentMode === 'CASH' || order.paymentMode === 'MIXED') && (
                                <>
                                    <div className="flex justify-between">
                                        <span>Cash Received</span>
                                        <span>₹{order.posMetadata?.cashReceived?.toFixed(2) || '0.00'}</span>
                                    </div>
                                    <div className="flex justify-between font-medium">
                                        <span>Change Returned</span>
                                        <span>₹{order.posMetadata?.changeReturned?.toFixed(2) || '0.00'}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="text-center mt-8 text-gray-500 text-xs italic">
                            Thank you for shopping with us!
                        </div>
                        
                        {/* Zigzag bottom edge effect */}
                        <div className="absolute left-0 right-0 bottom-0 h-2 bg-repeat-x" style={{
                            backgroundImage: 'linear-gradient(-45deg, transparent 16px, white 0), linear-gradient(45deg, transparent 16px, white 0)',
                            backgroundSize: '8px 8px',
                            backgroundPosition: 'left-bottom',
                            marginBottom: '-8px'
                        }}></div>
                    </div>
                </div>

                {/* Actions */}
                <div className="bg-white p-4 flex gap-3 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] relative z-10 flex-wrap">
                    <button 
                        onClick={() => window.print()}
                        className="flex-1 min-w-[100px] bg-green-50 text-green-600 font-medium py-3 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center gap-2 border border-green-200"
                    >
                        <HiOutlinePrinter size={20} />
                        Print
                    </button>
                    <button 
                        onClick={handlePrint}
                        className="flex-1 min-w-[120px] bg-blue-50 text-blue-600 font-medium py-3 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 border border-blue-200"
                    >
                        Download PDF
                    </button>
                    <button 
                        onClick={handleDone}
                        className="flex-1 min-w-[120px] bg-gray-900 text-white font-medium py-3 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        New Bill (F1)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PosReceipt;

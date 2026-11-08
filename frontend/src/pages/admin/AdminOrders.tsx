
import { useState, useEffect } from 'react';
import { db } from '../../data/firebase';
import {
  collection,
  onSnapshot,
  doc,
  writeBatch,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { useToast } from '../../context/ToastContext';

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const { showToast } = useToast();

  // Format order date
  const formatDate = (order: any) => {
    const rawDate =
      order.createdAt ||
      order.orderDate ||
      order.created_at ||
      order.timestamp;

    if (!rawDate) return 'Date unavailable';

    let date: Date;

    if (rawDate?.toDate) {
      date = rawDate.toDate();
    } else if (typeof rawDate === 'number') {
      date = new Date(
        rawDate < 1000000000000 ? rawDate * 1000 : rawDate
      );
    } else {
      date = new Date(rawDate);
    }

    if (isNaN(date.getTime())) return 'Date unavailable';

    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fetch all orders
  useEffect(() => {
    const q = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched: any[] = [];

        snapshot.forEach((document) => {
          fetched.push({
            id: document.id,
            ...document.data()
          });
        });

        setOrders(fetched);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching orders:', error);
        showToast('Failed to load orders', 'error');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

 const handleStatusChange = async (
  orderId: string,
  newStatus: string
) => {
  try {
    const order = orders.find((item) => item.id === orderId);

    if (!order) {
      showToast('Order not found', 'error');
      return;
    }

    const previousStatus = order.status || 'Pending';

    // Avoid duplicate notifications (case-insensitive)
    if (
      previousStatus.toLowerCase() === newStatus.toLowerCase()
    ) {
      return;
    }

    // Get actual customer Firebase UID
    const userId =
      order.userId ||
      order.uid ||
      order.customerId ||
      order.user?.uid ||
      order.user?.id;

    if (!userId) {
      console.error('Customer Firebase UID missing:', order);
      showToast('Customer Firebase UID not found', 'error');
      return;
    }

    const batch = writeBatch(db);

    // 1. Update order status
    const orderRef = doc(db, 'orders', orderId);

    batch.update(orderRef, {
      status: newStatus,
      updatedAt: serverTimestamp()
    });

    // 2. Notification messages
    const notificationMessages: Record<string, string> = {
      Pending: 'Your order is pending confirmation.',
      Processing: 'Your order is being processed.',
      Shipped: 'Great news! Your order has been shipped.',
      Delivered: 'Your order has been delivered successfully.',
      Cancelled: 'Your order has been cancelled.'
    };

    // 3. Create notification
    const notificationRef = doc(
      collection(db, 'notifications')
    );

    batch.set(notificationRef, {
      userId: userId,
      orderId: orderId,
      title: `Order ${newStatus}`,
      message:
        notificationMessages[newStatus] ||
        `Your order status has changed to ${newStatus}.`,
      type: 'order_status',
      status: newStatus,
      previousStatus: previousStatus,
      isRead: false,
      createdAt: serverTimestamp()
    });

    // 4. Save both changes
    await batch.commit();

    console.log('Order status updated:', newStatus);
    console.log('Notification created successfully');
    console.log('Customer UID:', userId);
    console.log('Order ID:', orderId);

    showToast(
      `Order updated and customer notified: ${newStatus}`,
      'success'
    );

    // Update selected modal
    setSelectedOrder((prev: any) =>
      prev?.id === orderId
        ? { ...prev, status: newStatus }
        : prev
    );

  } catch (error) {
    console.error('Error updating order status:', error);
    showToast('Failed to update order status', 'error');
  }
};


  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Delivered':
        return {
          backgroundColor: '#dcfce7',
          color: '#166534'
        };

      case 'Cancelled':
        return {
          backgroundColor: '#fee2e2',
          color: '#991b1b'
        };

      case 'Shipped':
        return {
          backgroundColor: '#dbeafe',
          color: '#1e40af'
        };

      default:
        return {
          backgroundColor: '#fef9c3',
          color: '#854d0e'
        };
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        Loading all orders...
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 30,
        maxWidth: 1200,
        margin: '0 auto',
        fontFamily: 'sans-serif'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 25
        }}
      >
        <h1 style={{ fontSize: 28, margin: 0 }}>
          Manage Orders
        </h1>

        <span
          style={{
            backgroundColor: '#e5e7eb',
            padding: '8px 14px',
            borderRadius: 20,
            fontWeight: 'bold'
          }}
        >
          Total Orders: {orders.length}
        </span>
      </div>

      {/* Orders Table */}
      {orders.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 50,
            backgroundColor: '#f9fafb',
            borderRadius: 8
          }}
        >
          No orders have been placed yet.
        </div>
      ) : (
        <div
          style={{
            overflowX: 'auto',
            backgroundColor: 'white',
            borderRadius: 8,
            border: '1px solid #e5e7eb'
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left'
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: '#f9fafb',
                  borderBottom: '1px solid #e5e7eb'
                }}
              >
                <th style={{ padding: 16 }}>Order Details</th>
                <th style={{ padding: 16 }}>Customer</th>
                <th style={{ padding: 16 }}>Items</th>
                <th style={{ padding: 16 }}>Total</th>
                <th style={{ padding: 16 }}>Status</th>
                <th style={{ padding: 16 }}>Action</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  style={{ borderBottom: '1px solid #e5e7eb' }}
                >
                  <td style={{ padding: 16 }}>
                    <strong>
                      #{order.id.slice(-6).toUpperCase()}
                    </strong>

                    <p style={{ color: '#6b7280', fontSize: 12 }}>
                      {formatDate(order)}
                    </p>
                  </td>

                  <td style={{ padding: 16 }}>
                    <strong>
                      {order.customerEmail || order.userEmail || 'N/A'}
                    </strong>

                    <p style={{ color: '#6b7280', fontSize: 12 }}>
                      {order.phoneNumber || order.phone || 'No phone'}
                    </p>
                  </td>

                  <td style={{ padding: 16 }}>
                    {order.items?.length || 0} items
                  </td>

                  <td style={{ padding: 16, fontWeight: 'bold' }}>
                    ₹{Number(
                      order.totalAmount ?? order.total ?? 0
                    ).toFixed(2)}
                  </td>

                  <td style={{ padding: 16 }}>
                    <span
                      style={{
                        ...getStatusStyle(order.status || 'Pending'),
                        padding: '6px 12px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 'bold'
                      }}
                    >
                      {order.status || 'Pending'}
                    </span>
                  </td>

                  <td style={{ padding: 16 }}>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8
                      }}
                    >
                      <button
                        onClick={() => setSelectedOrder(order)}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#2563eb',
                          color: 'white',
                          border: 'none',
                          borderRadius: 6,
                          cursor: 'pointer'
                        }}
                      >
                        View Details
                      </button>

                      <select
                        value={order.status || 'Pending'}
                        onChange={(e) =>
                          handleStatusChange(
                            order.id,
                            e.target.value
                          )
                        }
                        style={{
                          padding: 8,
                          borderRadius: 6,
                          border: '1px solid #d1d5db'
                        }}
                      >
                        <option value="Pending">Pending</option>
                         <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div
          onClick={() => setSelectedOrder(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 15,
            zIndex: 9999
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              width: '100%',
              maxWidth: 750,
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: 12,
              padding: 25
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20
              }}
            >
              <h2 style={{ margin: 0 }}>
                Order Details
              </h2>

              <button
                onClick={() => setSelectedOrder(null)}
                style={{
                  border: 'none',
                  background: '#f3f4f6',
                  padding: '8px 12px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 18
                }}
              >
                ✕
              </button>
            </div>

            {/* Order Information */}
            <div
              style={{
                backgroundColor: '#f9fafb',
                padding: 15,
                borderRadius: 8,
                marginBottom: 20
              }}
            >
              <p>
                <strong>Order ID:</strong>{' '}
                #{selectedOrder.id.slice(-6).toUpperCase()}
              </p>

              <p>
                <strong>Order Date:</strong>{' '}
                {formatDate(selectedOrder)}
              </p>

              <p>
                <strong>Status:</strong>{' '}
                {selectedOrder.status || 'Pending'}
              </p>
            </div>

            {/* Customer Information */}
            <h3>Customer Information</h3>

            <p>
              <strong>Email:</strong>{' '}
              {selectedOrder.customerEmail ||
                selectedOrder.userEmail || 'N/A'}
            </p>

            <p>
              <strong>Phone:</strong>{' '}
              {selectedOrder.phoneNumber ||
                selectedOrder.phone || 'N/A'}
            </p>

            <p>
              <strong>Shipping Address:</strong>
            </p>

            <div
              style={{
                padding: 12,
                backgroundColor: '#f9fafb',
                borderRadius: 6,
                marginBottom: 20
              }}
            >
              {selectedOrder.shippingAddress || 'Address unavailable'}
            </div>

            {/* Products */}
            <h3>Ordered Products</h3>

            {selectedOrder.items?.length > 0 ? (
              selectedOrder.items.map((item: any, index: number) => (
                <div
                  key={item.id || index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 15,
                    padding: 12,
                    borderBottom: '1px solid #e5e7eb'
                  }}
                >
                  <img
                    src={item.image}
                    alt={item.name || 'Product'}
                    style={{
                      width: 65,
                      height: 65,
                      objectFit: 'contain',
                      borderRadius: 6
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />

                  <div style={{ flex: 1 }}>
                    <strong>{item.name || 'Product'}</strong>

                    <p style={{ margin: '5px 0', color: '#6b7280' }}>
                      Quantity: {item.quantity || 1}
                    </p>
                  </div>

                  <strong>
                    ₹{(
                      Number(item.price || 0) *
                      Number(item.quantity || 1)
                    ).toFixed(2)}
                  </strong>
                </div>
              ))
            ) : (
              <p>No product information available.</p>
            )}

            {/* Payment Summary */}
            <h3 style={{ marginTop: 25 }}>Payment Summary</h3>

            <div
              style={{
                backgroundColor: '#f9fafb',
                padding: 15,
                borderRadius: 8
              }}
            >
              <p>
                Subtotal: ₹
                {Number(selectedOrder.subtotal || 0).toFixed(2)}
              </p>

              <p>
                Shipping: ₹
                {Number(selectedOrder.shipping || 0).toFixed(2)}
              </p>

              <p>
                Discount: ₹
                {Number(selectedOrder.discountApplied || 0).toFixed(2)}
              </p>

              <p>
                Coupon: {selectedOrder.couponUsed || 'Not applied'}
              </p>

              <hr />

              <h3 style={{ color: '#16a34a' }}>
                Grand Total: ₹
                {Number(
                  selectedOrder.totalAmount ??
                  selectedOrder.total ?? 0
                ).toFixed(2)}
              </h3>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setSelectedOrder(null)}
              style={{
                width: '100%',
                padding: 12,
                marginTop: 20,
                backgroundColor: '#111827',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

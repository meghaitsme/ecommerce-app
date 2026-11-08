
import { useEffect, useState } from 'react';
import { db } from '../../data/firebase';
import { useAuth } from '../../context/AuthContext';

import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc
} from 'firebase/firestore';

export default function Notifications() {
  const { user, loading: authLoading } = useAuth();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch notifications for the logged-in customer
  useEffect(() => {
    if (authLoading) return;

    if (!user?.uid) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data()
        }));

        setNotifications(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching notifications:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, authLoading]);

  // Format timestamp
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Date unavailable';

    const date = timestamp.toDate
      ? timestamp.toDate()
      : new Date(timestamp);

    if (isNaN(date.getTime())) return 'Date unavailable';

    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(
        doc(db, 'notifications', notificationId),
        { isRead: true }
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (authLoading || loading) {
    return <div style={{ padding: 30 }}>Loading notifications...</div>;
  }

  if (!user) {
    return <div style={{ padding: 30 }}>Please login to view notifications.</div>;
  }

  const unreadCount = notifications.filter(
    (notification) => notification.isRead === false
  ).length;

  return (
    <div style={{
      maxWidth: 850,
      margin: '30px auto',
      padding: 20
    }}>

      <h1>My Notifications</h1>

      <p style={{ color: '#6b7280' }}>
        You have {unreadCount} unread notifications.
      </p>

      {notifications.length === 0 ? (
        <div style={{
          padding: 30,
          textAlign: 'center',
          background: '#f9fafb',
          borderRadius: 10
        }}>
          <h3>No notifications yet</h3>
          <p>Order updates will appear here.</p>
        </div>
      ) : (

        notifications.map((notification) => (
          <div
            key={notification.id}
            style={{
              padding: 18,
              marginBottom: 15,
              borderRadius: 10,
              border: '1px solid #e5e7eb',
              background: notification.isRead
                ? '#ffffff'
                : '#eff6ff'
            }}
          >

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 10
            }}>

              <h3 style={{ margin: '0 0 10px' }}>
                {notification.title}
              </h3>

              {!notification.isRead && (
                <span style={{
                  color: '#2563eb',
                  fontSize: 12,
                  fontWeight: 'bold'
                }}>
                  NEW
                </span>
              )}

            </div>

            <p>{notification.message}</p>

            <p style={{
              fontSize: 13,
              color: '#6b7280'
            }}>
              Order ID: {notification.orderId}
            </p>

            <p style={{
              fontSize: 13,
              color: '#6b7280'
            }}>
              Status: {notification.status}
            </p>

            <p style={{
              fontSize: 12,
              color: '#9ca3af'
            }}>
              {formatDate(notification.createdAt)}
            </p>

            {!notification.isRead && (
              <button
                onClick={() => markAsRead(notification.id)}
                style={{
                  padding: '8px 14px',
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >
                Mark as Read
              </button>
            )}

          </div>
        ))

      )}

    </div>
  );
}

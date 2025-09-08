import React from 'react'
import { NotificationEntity, Message, FileEntity } from '@/services/localStorage'

interface DashboardCardsProps {
  userRole: string
  recentNotifications?: NotificationEntity[]
  recentMessages?: Message[]
  recentFiles?: FileEntity[]
  myRecentMessages?: Message[]
  myRecentFiles?: FileEntity[]
}

export const DashboardCards: React.FC<DashboardCardsProps> = ({
  userRole,
  recentNotifications = [],
  recentMessages = [],
  recentFiles = [],
  myRecentMessages = [],
  myRecentFiles = []
}) => {

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 60) {
      return `לפני ${diffMins} דקות`
    } else if (diffHours < 24) {
      return `לפני ${diffHours} שעות`
    } else {
      return `לפני ${diffDays} ימים`
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FFA500'
      case 'approved': return '#4CAF50'
      case 'rejected': return '#F44336'
      default: return '#9E9E9E'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'ממתין'
      case 'approved': return 'אושר'
      case 'rejected': return 'נדחה'
      default: return status
    }
  }

  const getMessageStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#2196F3'
      case 'in_progress': return '#FF9800'
      case 'closed': return '#4CAF50'
      default: return '#9E9E9E'
    }
  }

  const getMessageStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'פתוח'
      case 'in_progress': return 'בטיפול'
      case 'closed': return 'סגור'
      default: return status
    }
  }

  const cardStyle = {
    backgroundColor: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '16px',
    margin: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    height: '320px',
    overflowY: 'auto' as const
  }

  const headerStyle = {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '12px',
    color: '#333',
    borderBottom: '2px solid #f0f0f0',
    paddingBottom: '8px'
  }

  const itemStyle = {
    padding: '8px',
    marginBottom: '8px',
    borderRadius: '4px',
    backgroundColor: '#f9f9f9',
    borderLeft: '3px solid #ddd'
  }

  // Recent notifications card
  const RecentNotificationsCard = () => (
    <div style={cardStyle}>
      <h3 style={headerStyle}>🔔 התראות אחרונות</h3>
      {recentNotifications.length === 0 ? (
        <p style={{ color: '#666', textAlign: 'center', marginTop: '20px' }}>
          אין התראות חדשות
        </p>
      ) : (
        recentNotifications.map((notification) => (
          <div key={notification.id} style={{
            ...itemStyle,
            borderLeftColor: notification.type === 'error' ? '#F44336' : 
                           notification.type === 'warning' ? '#FF9800' :
                           notification.type === 'success' ? '#4CAF50' : '#2196F3'
          }}>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
              {notification.title}
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              {notification.message}
            </div>
            <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
              {formatDate(notification.created_at)}
            </div>
          </div>
        ))
      )}
    </div>
  )

  // Recent messages card (for admins and lecturers)
  const RecentMessagesCard = () => (
    <div style={cardStyle}>
      <h3 style={headerStyle}>
        💬 {userRole === 'student' ? 'הפניות שלי' : 'פניות אחרונות'}
      </h3>
      {(userRole === 'student' ? myRecentMessages : recentMessages).length === 0 ? (
        <p style={{ color: '#666', textAlign: 'center', marginTop: '20px' }}>
          {userRole === 'student' ? 'לא הגשת פניות' : 'אין פניות חדשות'}
        </p>
      ) : (
        (userRole === 'student' ? myRecentMessages : recentMessages).map((message) => (
          <div key={message.id} style={{
            ...itemStyle,
            borderLeftColor: getMessageStatusColor(message.status)
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '4px'
            }}>
              <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
                {message.subject}
              </span>
              <span style={{ 
                fontSize: '11px', 
                color: getMessageStatusColor(message.status),
                fontWeight: 'bold'
              }}>
                {getMessageStatusText(message.status)}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              {message.content.substring(0, 60)}...
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              fontSize: '11px', 
              color: '#999'
            }}>
              <span>קטגוריה: {message.category}</span>
              <span>{formatDate(message.created_at)}</span>
            </div>
          </div>
        ))
      )}
    </div>
  )

  // Recent files card
  const RecentFilesCard = () => {
    const filesToShow = userRole === 'student' ? myRecentFiles : recentFiles
    const title = userRole === 'student' ? 'הקבצים שלי' : 
                 userRole === 'lecturer' ? 'קבצים לאישור' : 'קבצים אחרונים'

    return (
      <div style={cardStyle}>
        <h3 style={headerStyle}>📁 {title}</h3>
        {filesToShow.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', marginTop: '20px' }}>
            {userRole === 'student' ? 'לא העלית קבצים' : 'אין קבצים חדשים'}
          </p>
        ) : (
          filesToShow.map((file) => (
            <div key={file.id} style={{
              ...itemStyle,
              borderLeftColor: getStatusColor(file.status)
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '4px'
              }}>
                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
                  {file.original_name}
                </span>
                <span style={{ 
                  fontSize: '11px', 
                  color: getStatusColor(file.status),
                  fontWeight: 'bold'
                }}>
                  {getStatusText(file.status)}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                גודל: {(file.file_size / 1024 / 1024).toFixed(2)} MB
              </div>
              {file.rejection_reason && file.status === 'rejected' && (
                <div style={{ fontSize: '11px', color: '#F44336', marginBottom: '4px' }}>
                  סיבת דחייה: {file.rejection_reason}
                </div>
              )}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                fontSize: '11px', 
                color: '#999'
              }}>
                <span>מעלה: {file.uploader_type}</span>
                <span>{formatDate(file.created_at)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    )
  }

  // Quick stats card (for admins)
  const QuickStatsCard = () => (
    <div style={cardStyle}>
      <h3 style={headerStyle}>📊 סטטיסטיקות מהירות</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#e3f2fd', 
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1976d2' }}>
            {recentFiles.filter(f => f.status === 'pending').length}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>ממתינים לאישור</div>
        </div>
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#e8f5e8', 
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#388e3c' }}>
            {recentMessages.filter(m => m.status === 'open').length}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>פניות פתוחות</div>
        </div>
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#fff3e0', 
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f57c00' }}>
            {recentNotifications.filter(n => !n.read).length}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>התראות חדשות</div>
        </div>
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#fce4ec', 
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#c2185b' }}>
            {recentFiles.filter(f => f.status === 'rejected').length}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>קבצים נדחו</div>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: userRole === 'admin' ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
      gap: '16px',
      margin: '16px 0'
    }}>
      <RecentNotificationsCard />
      <RecentMessagesCard />
      <RecentFilesCard />
      {userRole === 'admin' && <QuickStatsCard />}
    </div>
  )
}

export default DashboardCards 
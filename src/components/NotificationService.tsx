import { useEffect } from 'react'
import { Notification as NotificationEntity, User } from '@/api/entities'
// @ts-ignore
import { Howl } from 'howler'

const sound = new Howl({
  src: ['/notification.mp3']
})

type NotificationServiceProps = {
  onNewNotification: (notification: any) => void
}

const NotificationService = ({ onNewNotification }: NotificationServiceProps) => {
  useEffect(() => {
    let intervalId: NodeJS.Timeout

    const checkNotifications = async () => {
      try {
        const currentUser = await User.me()
        const notifications = await NotificationEntity.filter({ user_id: currentUser.id, is_read: false })

        if (notifications.length > 0) {
          const lastNotification = notifications[0]
          const lastNotificationTimestamp = new Date(lastNotification.created_date).getTime()
          
          const lastSeenTimestamp = localStorage.getItem('lastNotificationTimestamp')

          if (!lastSeenTimestamp || lastNotificationTimestamp > parseInt(lastSeenTimestamp)) {
            onNewNotification(lastNotification)
            sound.play()
            localStorage.setItem('lastNotificationTimestamp', lastNotificationTimestamp.toString())
          }
        }
      } catch (error) {
        console.error('Notification service error:', error)
      }
    }

    const startPolling = () => {
      checkNotifications()
      intervalId = setInterval(checkNotifications, 30000)
    }

    User.me().then((user: any) => {
      if (user) {
        startPolling()
      }
    }).catch(() => {})

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [onNewNotification])

  return null
}

export default NotificationService